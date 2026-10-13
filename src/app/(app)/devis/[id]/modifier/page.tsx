import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { QuoteForm } from "@/components/app/quote-form";
import { DeleteButton } from "@/components/app/delete-button";
import { deleteQuoteAction, updateQuoteAction } from "../../actions";

export const metadata: Metadata = { title: "Modifier le devis" };

export default async function EditQuotePage({ params }: PageProps<"/devis/[id]/modifier">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const session = await requireUser();

  const [{ data: quote }, { data: clients }] = await Promise.all([
    session.supabase.from("quotes").select("*").eq("id", id).eq("user_id", session.user.id).maybeSingle(),
    session.supabase.from("clients").select("id, name, company").eq("user_id", session.user.id).order("name"),
  ]);
  if (!quote) notFound();

  return (
    <>
      <PageHeader
        icon={Pencil}
        title="Modifier le devis"
        actions={
          <DeleteButton
            action={deleteQuoteAction.bind(null, quote.id)}
            title="Supprimer ce devis ?"
            description={`Le devis « ${quote.title} » sera définitivement supprimé.`}
            redirectTo="/devis"
          />
        }
      />
      <Card className="max-w-3xl p-6">
        <QuoteForm action={updateQuoteAction.bind(null, quote.id)} quote={quote} clients={clients ?? []} cancelHref="/devis" />
      </Card>
    </>
  );
}
