"""
Normaliza la base de datos del Global Report on Food Crises (GRFC 2026,
actualización de mitad de año, publicada por la Red Global contra las Crisis
Alimentarias / FSIN) a un JSON por país.

Fuente: HDX — "Global Report on Food Crises 2026 Mid-Year Update",
dataset 018f4de3-0a27-43e1-b294-582027411c95.
Indicador: población en Fase 3 o superior de la CIF/IPC (inseguridad
alimentaria aguda), NO es lo mismo que subalimentación crónica (FAO).

Ejecutar: python scripts/build-grfc.py
"""
import json
import math
import os
from datetime import datetime, timezone

import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "raw", "grfc.xlsx")
OUT = os.path.join(ROOT, "public", "data", "grfc.json")

REGION_ES = {
    "WEST AFRICA": "África Occidental",
    "CS AFRICA": "África Central y del Sur",
    "MENA": "Oriente Medio y Norte de África",
    "LAC": "América Latina y el Caribe",
    "EAST AFRICA": "África Oriental",
    "ASIA": "Asia",
    "EUROPE": "Europa",
    "OCEANIA": "Oceanía",
}

DRIVER_ES = {
    "Conflict/Insecurity": "Conflicto e inseguridad",
    "Weather extremes": "Fenómenos climáticos extremos",
    "Economic shocks": "Crisis económicas",
    "Crop pests/animal diseases": "Plagas de cultivos y enfermedades animales",
    "N/A": None,
}


def num(v):
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    if math.isnan(f):
        return None
    return f


def clean_driver(v):
    if not isinstance(v, str):
        return None
    return DRIVER_ES.get(v.strip(), v.strip() or None)


def txt(v):
    """Texto limpio: convierte NaN/None/vacío en None y evita el literal 'nan'."""
    if v is None:
        return None
    if isinstance(v, float) and math.isnan(v):
        return None
    s = str(v).strip()
    if not s or s.lower() in {"nan", "none", "n/a"}:
        return None
    return s


def main():
    afi = pd.read_excel(SRC, sheet_name="GRFC 2026_AFI Master")
    afi.columns = [str(c).strip() for c in afi.columns]

    afi = afi[afi["ISO Code 3"].notna()]
    afi = afi[afi["Data availability"].astype(str).str.upper() == "Y"]
    afi["edition"] = pd.to_numeric(afi["GRFC edition"], errors="coerce")
    afi["year"] = pd.to_numeric(afi["Year of reference"], errors="coerce")
    afi = afi.dropna(subset=["year", "edition"])

    # Preferir la edición más reciente para cada año y, entre duplicados,
    # la fila con conductores documentados y cifras completas.
    afi["driver_score"] = (
        afi["Primary driver"].apply(lambda v: clean_driver(v) is not None).astype(int) * 4
        + afi["Secondary driver"].apply(lambda v: clean_driver(v) is not None).astype(int) * 2
        + afi["Tertiary driver"].apply(lambda v: clean_driver(v) is not None).astype(int)
    )
    afi["phase3"] = pd.to_numeric(afi["Population in Phase 3 or above #"], errors="coerce")
    afi["phase3_pct"] = pd.to_numeric(afi["Population in Phase 3 or above %"], errors="coerce")
    afi = afi.sort_values(["ISO Code 3", "year", "edition", "driver_score", "phase3"])
    afi = afi.drop_duplicates(subset=["ISO Code 3", "year"], keep="last")

    # Una misma evaluación puede aparecer repetida con distinto "año de
    # referencia" (por ejemplo, el informe principal y la actualización de
    # mitad de año). Si el periodo y las cifras son idénticos, se conserva la
    # fila más reciente para no dibujar dos observaciones donde hay una.
    comparable = afi["Analysis period"].notna() & afi["phase3"].notna()
    afi["_pct_key"] = afi["phase3_pct"].round(4)
    afi["_p3_key"] = afi["phase3"].round(0)
    repeated = afi.loc[comparable].duplicated(
        subset=["ISO Code 3", "Analysis period", "_p3_key", "_pct_key"],
        keep="last",
    )
    afi = afi.drop(index=afi.loc[comparable].index[repeated])

    countries = {}
    for iso3, group in afi.groupby("ISO Code 3"):
        group = group.sort_values("year")
        history = []
        for _, r in group.iterrows():
            p3 = num(r.get("phase3"))
            pct = num(r.get("phase3_pct"))
            history.append(
                {
                    "year": int(r["year"]),
                    "edition": int(r["edition"]),
                    "phase3plus": int(round(p3)) if p3 is not None else None,
                    "phase3plusPct": round(pct * 100, 1) if pct is not None else None,
                    "phase4": int(round(num(r.get("Population  in Phase 4 #")))) if num(r.get("Population  in Phase 4 #")) is not None else None,
                    "phase5": int(round(num(r.get("Population Phase 5 #")))) if num(r.get("Population Phase 5 #")) is not None else None,
                    "analysedPop": int(round(num(r.get("Population analysed")))) if num(r.get("Population analysed")) is not None else None,
                    "totalPop": int(round(num(r.get("Total country population")))) if num(r.get("Total country population")) is not None else None,
                    "period": txt(r.get("Analysis period")),
                    "source": txt(r.get("Source")),
                    "methodology": txt(r.get("Methodology")),
                    "area": txt(r.get("Population group/\nGeographical area analysed")),
                }
            )
        last = group.iloc[-1]
        latest = history[-1]
        # Los conductores no se actualizan en todas las filas (p. ej., en la
        # actualización de mitad de año). Se toma el registro más reciente que
        # sí los documenta y se conserva su año para no atribuirlos a otro año.
        driver_row = None
        for _, cand in group.sort_values("year", ascending=False).iterrows():
            if clean_driver(cand.get("Primary driver")):
                driver_row = cand
                break
        countries[iso3] = {
            "name": str(last["Countries/territories"]).strip(),
            "region": str(last["Region"]).strip(),
            "regionEs": REGION_ES.get(str(last["Region"]).strip(), str(last["Region"]).strip()),
            "history": history,
            "latest": {**latest, "latestYear": latest["year"]},
            "drivers": {
                "primary": clean_driver(driver_row.get("Primary driver")) if driver_row is not None else None,
                "secondary": clean_driver(driver_row.get("Secondary driver")) if driver_row is not None else None,
                "tertiary": clean_driver(driver_row.get("Tertiary driver")) if driver_row is not None else None,
                "year": int(driver_row["year"]) if driver_row is not None else None,
            },
            "protracted": str(last.get("Protracted food crises (2016-2026)") or "").strip() == "Y",
        }

    # Desplazamiento forzado (UNHCR / IOM) — contexto de conflicto.
    disp = pd.read_excel(SRC, sheet_name="Displacement")
    disp.columns = [str(c).strip() for c in disp.columns]
    disp = disp.dropna(subset=["ISO Code 3"])
    for iso3, g in disp.groupby("ISO Code 3"):
        g = g.sort_values("Year of reference")
        r = g.iloc[-1]
        if iso3 in countries:
            countries[iso3]["displacement"] = {
                "year": int(r["Year of reference"]),
                "total": int(num(r["Total forcibly displaced"]) or 0),
                "idps": int(num(r["IDPs"]) or 0),
                "refugeesAsylum": int(num(r["REF + ASY + OIP + PSE CIRCLE"]) or 0),
                "source": "UNHCR / IOM (vía GRFC)",
            }

    # Desnutrición aguda (IPC AMN) — contexto nutricional.
    amn = pd.read_excel(SRC, sheet_name="AMN")
    amn.columns = [str(c).strip() for c in amn.columns]
    amn = amn.dropna(subset=["ISO Code 3"])
    for iso3, g in amn.groupby("ISO Code 3"):
        g = g.sort_values("Year of reference")
        r = g.iloc[-1]
        if iso3 in countries:
            countries[iso3]["nutrition"] = {
                "year": int(r["Year of reference"]),
                "gamBurden": int(num(r.get("GAM Burden")) or 0) or None,
                "samBurden": int(num(r.get("SAM Burden")) or 0) or None,
                "period": txt(r.get("Period")),
                "classification": txt(r.get("Final Nutrition crisis/concern classification (starting 2025)")),
                "source": "IPC/GRFC (AMN)",
            }

    payload = {
        "meta": {
            "title": "Global Report on Food Crises 2026 — Mid-year update (base de datos)",
            "publisher": "Red Global contra las Crisis Alimentarias (GNAFC) / FSIN, con datos de IPC, CH, GIEWS y socios",
            "indicator": "Población en Fase 3 o superior de la CIF/IPC (inseguridad alimentaria aguda)",
            "indicatorNote": "El porcentaje se calcula sobre la población ANALIZADA, no sobre la población total del país. No equivale a la prevalencia de subalimentación de la FAO.",
            "url": "https://www.fsinplatform.org/global-report-food-crises",
            "hdx": "https://data.humdata.org/dataset/global-report-on-food-crises-2026-mid-year-update",
            "downloadedAt": datetime.now(timezone.utc).isoformat(),
            "coverage": f"{len(countries)} países y territorios con datos de crisis alimentaria",
        },
        "countries": countries,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"[OK] GRFC: {len(countries)} paises -> {OUT}")


if __name__ == "__main__":
    main()
