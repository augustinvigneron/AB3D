"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="size-6" />
      </div>
      <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
      <p className="mt-1 max-w-sm text-sm text-fg-muted">Nous n'avons pas pu afficher cette page. Vous pouvez réessayer.</p>
      <Button className="mt-6" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
