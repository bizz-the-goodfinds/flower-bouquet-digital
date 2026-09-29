import { SiteHeader } from "@/components/marketing/site-header";

/** App-style pages (the builder): header only, no footer, full-height on phones. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
    </>
  );
}
