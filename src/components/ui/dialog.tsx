"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** « lg » pour un contenu large (ex. : les trois offres côte à côte). */
  size?: "md" | "lg";
};

/**
 * Boîte de dialogue basée sur l'élément natif <dialog> : focus piégé,
 * fermeture avec Échap et clic sur le fond, accessible au clavier.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Ferme seulement sur un clic réellement hors de la boîte (pas sur sa barre de défilement).
        const el = ref.current;
        if (!el || e.target !== el) return;
        const r = el.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={`m-auto w-[calc(100%-2rem)] ${size === "lg" ? "max-w-5xl" : "max-w-md"} max-h-[calc(100dvh-2rem)] flex-col rounded-2xl border border-border bg-surface p-0 text-fg shadow-card backdrop:bg-transparent open:flex open:animate-rise`}
    >
      <div className="flex min-h-0 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-fg-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>
        {children && <div className="mt-4 min-h-0 flex-1 overflow-y-auto">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
};

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Supprimer", loading }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
