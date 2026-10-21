// Pages privées : toujours rendues à la demande (session utilisateur, jamais pré-rendues au build).
export const dynamic = "force-dynamic";

import { AppShell } from "@/components/app/sidebar";
import { UpgradeProvider } from "@/components/app/upgrade-dialog";
import { isStripeConfigured } from "@/lib/stripe";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profile";
import { getPlan } from "@/lib/plans";
import { signOut } from "@/app/(auth)/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await requireUser();
  const profile = await getProfile(session);
  const plan = getPlan(profile.plan);

  return (
    <UpgradeProvider
      currentPlan={plan.id}
      stripeReady={isStripeConfigured()}
      hasSubscription={Boolean(profile.stripe_customer_id && profile.stripe_subscription_id) && plan.id !== "free"}
    >
      <AppShell userName={profile.full_name ?? ""} userEmail={session.user.email ?? ""} plan={plan} signOutAction={signOut}>
        {children}
      </AppShell>
    </UpgradeProvider>
  );
}
