export type RekeningRow = {
  profile_id: string;
  display_name: string | null;
  raket_total: number;
  fris_total: number;
  streep_total: number;
};

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  email?: string | null;
};

export type ActionRow = {
  entry_id: string;
  table_name: "raket_logs" | "strepen_logs" | "frisdrank_logs";
  kind: string;
  amount: number;
  ts: string;
};