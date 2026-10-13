import type { Session } from "@/lib/auth";
import type { Client, Quote, Reminder } from "@/lib/database.types";
import { todayISO } from "@/lib/utils";

export type DashboardStats = {
  totalClients: number;
  prospects: number;
  remindersToday: number;
  remindersOverdue: number;
  pendingQuotes: number;
  pendingQuotesAmount: number;
};

export type UpcomingAction = Reminder & { client: Pick<Client, "id" | "name" | "company"> | null };

export function computeStats(clients: Pick<Client, "status">[], quotes: Pick<Quote, "status" | "amount">[], reminders: Pick<Reminder, "status" | "due_at">[], today = todayISO()): DashboardStats {
  const openReminders = reminders.filter((r) => r.status === "a_faire");
  const pending = quotes.filter((q) => q.status === "envoye" || q.status === "en_attente");
  return {
    totalClients: clients.length,
    prospects: clients.filter((c) => c.status === "prospect").length,
    remindersToday: openReminders.filter((r) => r.due_at === today).length,
    remindersOverdue: openReminders.filter((r) => r.due_at < today).length,
    pendingQuotes: pending.length,
    pendingQuotesAmount: pending.reduce((sum, q) => sum + Number(q.amount), 0),
  };
}

export async function getDashboardData({ supabase, user }: Session) {
  const [clientsRes, quotesRes, remindersRes, upcomingRes] = await Promise.all([
    supabase.from("clients").select("status").eq("user_id", user.id),
    supabase.from("quotes").select("status, amount").eq("user_id", user.id),
    supabase.from("reminders").select("status, due_at").eq("user_id", user.id),
    supabase
      .from("reminders")
      .select("*, client:clients(id, name, company)")
      .eq("user_id", user.id)
      .eq("status", "a_faire")
      .order("due_at", { ascending: true })
      .limit(8),
  ]);

  const stats = computeStats(clientsRes.data ?? [], quotesRes.data ?? [], remindersRes.data ?? []);
  const upcoming = (upcomingRes.data ?? []) as unknown as UpcomingAction[];
  return { stats, upcoming };
}
