import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/app/client-form";
import { updateClientAction } from "../../actions";

export const metadata: Metadata = { title: "Modifier le client" };

export default async function EditClientPage({ params }: PageProps<"/clients/[id]/modifier">) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const session = await requireUser();
  const { data: client } = await session.supabase.from("clients").select("*").eq("id", id).eq("user_id", session.user.id).maybeSingle();
  if (!client) notFound();

  const action = updateClientAction.bind(null, client.id);

  return (
    <>
      <PageHeader icon={Pencil} title={`Modifier ${client.name}`} />
      <Card className="max-w-3xl p-6">
        <ClientForm action={action} client={client} cancelHref={`/clients/${client.id}`} />
      </Card>
    </>
  );
}
