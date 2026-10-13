import type { Metadata } from "next";
import { FilePlus2, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkButton } from "@/components/ui/button";
import { QuoteForm } from "@/components/app/quote-form";
import { createQuoteAction } from "../actions";

export const metadata: Metadata = { title: "Nouveau devis" };

export default async function NewQuotePage({ searchParams }: PageProps<"/devis/nouveau">) {
  const session = await requireUser();
  const params = await searchParams;
  const defaultClientId = typeof params.client === "string" ? params.client : undefined;
  const { data: clients } = await session.supabase.from("clients").select("id, name, company").eq("user_id", session.user.id).order("name");

  return (
    <>
      <PageHeader icon={FilePlus2} title="Nouveau devis" description="Enregistrez un devis pour suivre sa réponse et planifier une relance." />
      {(clients ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="Ajoutez d'abord un client"
          description="Un devis doit être rattaché à un client."
          action={<LinkButton href="/clients/nouveau">Ajouter un client</LinkButton>}
        />
      ) : (
        <Card className="max-w-3xl p-6">
          <QuoteForm action={createQuoteAction} clients={clients ?? []} defaultClientId={defaultClientId} cancelHref="/devis" />
        </Card>
      )}
    </>
  );
}
