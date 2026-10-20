import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Icône Nuvarex (fichier public/brand/nuvarex-icone-512.png). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/nuvarex-icone-512.png"
      alt=""
      aria-hidden
      width={32}
      height={32}
      priority
      className={cn("size-8 shrink-0 rounded-lg shadow-[0_6px_18px_-6px_rgb(217_70_239/0.7)]", className)}
    />
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[15px]">Nuvarex</span>
    </Link>
  );
}
