import RootBackground from "./RootBackground";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-foreground">
      <RootBackground />
      <PublicNavbar />
      <main className="relative z-10 flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}