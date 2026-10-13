/**
 * Types de la base Supabase, écrits à la main pour correspondre à
 * supabase/migrations/0001_init.sql. Si vous modifiez le schéma, vous pouvez
 * régénérer ce fichier avec : npx supabase gen types typescript --project-id <id>
 */
export type ClientStatus = "prospect" | "actif" | "inactif" | "perdu";
export type QuoteStatus = "brouillon" | "envoye" | "en_attente" | "accepte" | "refuse";
export type ReminderStatus = "a_faire" | "terminee";
export type ReminderChannel = "email" | "telephone" | "sms" | "visite" | "autre";
export type PlanId = "free" | "pro" | "business";

export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  plan: PlanId;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: ClientStatus;
  last_contact_at: string | null; // date YYYY-MM-DD
  next_followup_at: string | null; // date YYYY-MM-DD
  created_at: string;
  updated_at: string;
};

export type Quote = {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  amount: number;
  sent_at: string | null; // date
  status: QuoteStatus;
  next_followup_at: string | null; // date
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Reminder = {
  id: string;
  user_id: string;
  client_id: string | null;
  quote_id: string | null;
  title: string;
  due_at: string; // date YYYY-MM-DD
  channel: ReminderChannel;
  status: ReminderStatus;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReminderEvent = {
  id: string;
  user_id: string;
  reminder_id: string | null;
  action: "creee" | "modifiee" | "terminee" | "reouverte" | "supprimee";
  details: string | null;
  created_at: string;
};

export type AiGeneration = {
  id: string;
  user_id: string;
  created_at: string;
  simulated: boolean;
};

type Insert<T, Omitted extends keyof T> = Omit<T, Omitted> & Partial<Pick<T, Omitted>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Insert<Profile, "created_at" | "updated_at" | "plan" | "preferences" | "full_name" | "company_name" | "stripe_customer_id" | "stripe_subscription_id">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Insert<Client, "id" | "created_at" | "updated_at" | "company" | "email" | "phone" | "notes" | "status" | "last_contact_at" | "next_followup_at">;
        Update: Partial<Client>;
        Relationships: [];
      };
      quotes: {
        Row: Quote;
        Insert: Insert<Quote, "id" | "created_at" | "updated_at" | "sent_at" | "status" | "next_followup_at" | "notes">;
        Update: Partial<Quote>;
        Relationships: [];
      };
      reminders: {
        Row: Reminder;
        Insert: Insert<Reminder, "id" | "created_at" | "updated_at" | "client_id" | "quote_id" | "channel" | "status" | "notes" | "completed_at">;
        Update: Partial<Reminder>;
        Relationships: [];
      };
      reminder_events: {
        Row: ReminderEvent;
        Insert: Insert<ReminderEvent, "id" | "created_at" | "reminder_id" | "details">;
        Update: Partial<ReminderEvent>;
        Relationships: [];
      };
      ai_generations: {
        Row: AiGeneration;
        Insert: Insert<AiGeneration, "id" | "created_at" | "simulated">;
        Update: Partial<AiGeneration>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_ai_generation: {
        Args: { p_simulated: boolean };
        Returns: { allowed: boolean; used: number; limit_value: number; plan: PlanId };
      };
      ai_usage_this_month: {
        Args: Record<string, never>;
        Returns: number;
      };
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      client_status: ClientStatus;
      quote_status: QuoteStatus;
      reminder_status: ReminderStatus;
      reminder_channel: ReminderChannel;
      plan_id: PlanId;
    };
    CompositeTypes: Record<string, never>;
  };
};
