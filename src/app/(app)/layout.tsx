// Pages privées : toujours rendues à la demande (session utilisateur, jamais pré-rendues au build).
export const dynamic = "force-dynamic";

import { AppShell } from "@/components/app/sidebar";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { getPlan } from "@/lib/plans";
import { signOut } from "@/app/(auth)/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await requireUser();
  const profile = await getProfile(session);

  return (
    <AppShell
      userName={profile.full_name ?? ""}
      userEmail={session.user.email ?? ""}
      plan={getPlan(profile.plan)}
      signOutAction={signOut}
    >
      {children}
    </AppShell>
  );
}
