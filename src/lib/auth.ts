import type { Session } from "@supabase/supabase-js";
import { supabase, mode } from "./supabase";
import { roleFromClaims, type Role } from "./admin";
export const authAvailable = () => mode === "live" && !!supabase;
export const sessionRole = (s: Session | null): Role | null => roleFromClaims(s?.user?.app_metadata as { role?: unknown } | undefined);
export async function getSession(): Promise<Session | null> { return supabase ? (await supabase.auth.getSession()).data.session : null; }
export async function signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!supabase) return { ok: false, message: "Authentication is not configured." };
  const r = await supabase.auth.signInWithPassword({ email, password }); return r.error ? { ok: false, message: r.error.message } : { ok: true };
}
export const signOut = async () => { await supabase?.auth.signOut(); };
