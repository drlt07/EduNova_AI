import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LoginGate } from "@/components/layout/login-gate";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <LoginGate>{children}</LoginGate>
      </main>
      <SiteFooter />
    </>
  );
}
