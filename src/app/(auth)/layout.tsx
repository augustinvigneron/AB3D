import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
        <Link href="/" className="text-sm text-fg-muted hover:text-fg">
          ← Retour au site
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md animate-rise">{children}</div>
      </main>
    </div>
  );
}
