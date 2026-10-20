import Link from "next/link";
import { Users, FileText, BellRing, Sparkles, ShieldCheck, Smartphone, Check, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_LIST } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "@/lib/testimonials";
import { Testimonials } from "@/components/marketing/testimonials";

const FEATURES = [
  { icon: Users, title: "Fichier clients simple", text: "Nom, contact, statut, notes, dernier échange et prochaine relance. Rien de plus, rien de moins." },
  { icon: FileText, title: "Suivi des devis", text: "Qui a reçu quoi, pour quel montant, et depuis combien de temps vous attendez une réponse." },
  { icon: BellRing, title: "Relances au bon moment", text: "Chaque matin : ce qu'il faut faire aujourd'hui, ce qui est en retard, ce qui arrive." },
  { icon: Sparkles, title: "Relances prêtes à envoyer", text: "Choisissez un devis : trois messages — professionnel, amical, court — rédigés avec le bon titre, le bon montant et la bonne date. Vous relisez, vous envoyez." },
  { icon: ShieldCheck, title: "Vos données restent les vôtres", text: "Chaque compte est isolé en base. Export JSON et suppression du compte en un clic." },
  { icon: Smartphone, title: "Sur le chantier comme au bureau", text: "Interface pensée pour le téléphone autant que pour l'ordinateur." },
];

const FAQ = [
  {
    q: "Nexora envoie-t-il les messages à ma place ?",
    a: "Non. L'assistant rédige des propositions ; vous les copiez dans votre messagerie ou votre téléphone après relecture. Avec l'offre Business, un bouton ouvre Gmail avec le message déjà rempli : c'est toujours vous qui cliquez sur « Envoyer ». Aucun envoi automatique n'est programmé.",
  },
  {
    q: "Les messages peuvent-ils contenir un montant ou une date inventés ?",
    a: "Non : ils sont construits uniquement à partir des informations que vous saisissez ou du devis que vous choisissez. Relisez tout de même chaque message avant envoi : c'est vous qui restez responsable de ce que vous envoyez.",
  },
  {
    q: "Puis-je générer des devis ou des factures conformes ?",
    a: "Non. Le module « Devis » sert à suivre vos propositions commerciales (titre, montant, statut, relance). Il ne remplace pas un logiciel de facturation.",
  },
  {
    q: "Mes données sont-elles partagées ?",
    a: "Vos clients, devis et relances ne sont accessibles qu'à votre compte. Vous pouvez les exporter ou supprimer votre compte à tout moment depuis les paramètres.",
  },
  {
    q: "Que se passe-t-il si je dépasse les limites de l'offre gratuite ?",
    a: "L'application vous le signale clairement et vous propose de passer à l'offre Pro. Rien n'est supprimé.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center animate-rise">
            <Badge tone="brand" className="mb-5">
              Pour les artisans et indépendants
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Ne laissez plus un devis <span className="bg-gradient-to-r from-brand to-[#a78bfa] bg-clip-text text-transparent">sans réponse</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-fg-muted">
              Vous envoyez des devis, puis le chantier reprend et vous oubliez de relancer. Nexora garde la liste à jour, vous dit qui relancer aujourd'hui et
              rédige le message avec vous.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/inscription" size="lg">
                Essayer gratuitement <ArrowRight className="size-4" />
              </LinkButton>
              <LinkButton href="/demo" size="lg" variant="secondary">
                Voir la démonstration
              </LinkButton>
            </div>
            <p className="mt-3 text-xs text-fg-subtle">Gratuit jusqu'à 10 clients. Sans carte bancaire.</p>
          </div>

          {/* Aperçu */}
          <div className="relative mx-auto mt-14 max-w-4xl animate-fade-in">
            <div className="absolute -inset-6 rounded-[2rem] bg-brand/10 blur-3xl" aria-hidden />
            <div className="card relative overflow-hidden p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Relances aujourd'hui", value: "3", tone: "text-warning" },
                  { label: "En retard", value: "1", tone: "text-danger" },
                  { label: "Devis en attente", value: "5 950 €", tone: "text-success" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-bg-elevated p-4">
                    <p className="text-xs uppercase tracking-wide text-fg-subtle">{s.label}</p>
                    <p className={cn("mt-2 text-2xl font-bold", s.tone)}>{s.value}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-bg-elevated">
                {[
                  { t: "Relancer pour la vitrine", c: "Boulangerie Rousseau · Téléphone", b: "En retard", tone: "danger" as const },
                  { t: "Demander un avis Google", c: "Thomas Bernard · SMS", b: "Aujourd'hui", tone: "warning" as const },
                  { t: "Suivi devis chaudière", c: "Lucas Petit · Email", b: "Dans 3 jours", tone: "neutral" as const },
                ].map((r) => (
                  <li key={r.t} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.t}</p>
                      <p className="truncate text-xs text-fg-subtle">{r.c}</p>
                    </div>
                    <Badge tone={r.tone}>{r.b}</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-center text-[11px] text-fg-subtle">Aperçu illustratif avec des données fictives.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problème */}
      <section className="border-y border-border/60 bg-bg-elevated/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            { n: "1", t: "Vous envoyez le devis", d: "Le client dit qu'il va réfléchir. Vous notez ça quelque part… ou pas." },
            { n: "2", t: "Les jours passent", d: "Entre les chantiers et les urgences, la relance tombe aux oubliettes." },
            { n: "3", t: "Le client signe ailleurs", d: "Pas parce que vous étiez trop cher : parce que l'autre a rappelé." },
          ].map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">{s.n}</span>
              <div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-fg-muted">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Tout ce qu'il faut, rien de superflu</h2>
          <p className="mt-3 text-fg-muted">Un outil conçu pour être utilisé cinq minutes par jour, pas pour vous occuper.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6 transition-colors hover:border-border-strong">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-fg-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Avis (masqué tant qu'aucun avis réel n'est ajouté dans src/lib/testimonials.ts) */}
      <Testimonials items={TESTIMONIALS} />

      {/* Tarifs */}
      <section id="tarifs" className="scroll-mt-20 border-y border-border/60 bg-bg-elevated/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Des tarifs simples</h2>
            <p className="mt-3 text-fg-muted">Commencez gratuitement. Passez à l'offre supérieure quand votre activité le demande.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PLAN_LIST.map((plan) => (
              <div key={plan.id} className={cn("card flex flex-col p-6", plan.id === "pro" && "border-brand/60 shadow-[0_0_0_1px_rgb(124_92_255/0.3)]")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {plan.id === "pro" && <Badge tone="brand">Recommandé</Badge>}
                </div>
                <p className="mt-3 text-4xl font-bold">
                  {plan.priceMonthly} €<span className="text-base font-normal text-fg-subtle"> / mois</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-fg-muted">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <LinkButton href="/inscription" variant={plan.id === "pro" ? "primary" : "secondary"} className="mt-6 w-full">
                  {plan.id === "free" ? "Commencer gratuitement" : `Choisir ${plan.name}`}
                </LinkButton>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-fg-subtle">Prix TTC indicatifs. Les offres payantes seront disponibles après l'activation des paiements.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight">Questions fréquentes</h2>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="text-fg-subtle transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-fg-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card relative overflow-hidden p-10 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-transparent" aria-hidden />
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-3xl">Votre prochaine relance, c'est demain matin.</h2>
            <p className="mx-auto mt-3 max-w-xl text-fg-muted">Créez votre compte en une minute et ajoutez vos premiers clients.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/inscription" size="lg">
                Essayer gratuitement
              </LinkButton>
              <Link href="/connexion" className="text-sm text-fg-muted hover:text-fg">
                J'ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
