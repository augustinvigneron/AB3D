"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/validation/schemas";

type ActionButtonProps = {
  action: () => Promise<ActionState>;
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
};

/** Bouton qui exécute une Server Action simple et affiche le résultat en notification. */
export function ActionButton({ action, children, variant = "secondary", size = "sm", className }: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await action();
          toast(res.message ?? "", res.ok ? "success" : "error");
          if (res.ok) router.refresh();
        })
      }
    >
      {children}
    </Button>
  );
}
