import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ClientForm } from "@/components/app/client-form";
import { createClientAction } from "../actions";

export const metadata: Metadata = { title: "Nouveau client" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader icon={UserPlus} title="Nouveau client" description="Seul le nom est obligatoire. Vous pourrez compléter la fiche plus tard." />
      <Card className="max-w-3xl p-6">
        <ClientForm action={createClientAction} cancelHref="/clients" />
      </Card>
    </>
  );
}
