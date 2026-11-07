import MobileHeader from "@/components/mobile/MobileHeader";
import MobileTabBar from "@/components/mobile/MobileTabBar";

export default function MovilLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#e9e1d2]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper shadow-[0_0_60px_rgba(23,19,14,0.12)]">
        <MobileHeader />
        <main className="flex-1 pb-24">{children}</main>
        <MobileTabBar />
      </div>
    </div>
  );
}
