import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
function role(k: string): string { try { return JSON.parse(atob(k.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role ?? ""; } catch { return ""; } }
export const configured = !!url && !!key && !url.includes("YOUR-PROJECT") && !key.includes("YOUR-PUBLIC");
if (configured && role(key!) === "service_role") throw new Error("A service-role key was supplied to the frontend. Use the anon key only.");
export const supabase: SupabaseClient | null = configured ? createClient(url!, key!, { auth: { persistSession: false } }) : null;
