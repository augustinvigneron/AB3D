"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/validation/schemas";

type DeleteButtonProps = {
  action: () => Promise<ActionState>;
  title: string;
  description: string;
  redirectTo?: string;
  label?: string;
  size?: "sm" | "md";
  iconOnly?: boolean;
};

/** Bouton de suppression générique avec boîte de dialogue de confirmation. */
export function DeleteButton({ action, title, description, redirectTo, label = "Supprimer", size = "md", iconOnly }: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const confirm = () => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast(result.message ?? "Supprimé.", "success");
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else {
        toast(result.message ?? "Suppression impossible.", "error");
      }
    });
  };

  return (
    <>
      <Button variant={iconOnly ? "ghost" : "outline"} size={size} onClick={() => setOpen(true)} aria-label={iconOnly ? label : undefined}>
        <Trash2 className="size-4 text-danger" />
        {!iconOnly && label}
      </Button>
      <ConfirmDialog open={open} onClose={() => setOpen(false)} onConfirm={confirm} title={title} description={description} loading={pending} />
    </>
  );
}
