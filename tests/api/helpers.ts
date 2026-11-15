import { createHmac } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
export const API_URL = process.env.API_URL ?? "http://127.0.0.1:3100", SECRET = process.env.JWT_SECRET ?? "";
export const ID = { e1: "00000000-0000-0000-0000-0000000000e1", e2: "00000000-0000-0000-0000-0000000000e2", ad: "00000000-0000-0000-0000-0000000000d1", u1: "00000000-0000-0000-0000-0000000000a1" };
const b64 = (o: object | Buffer) => Buffer.from(o instanceof Buffer ? o : JSON.stringify(o)).toString("base64url");
/** Mint an HS256 JWT like Supabase Auth would (claims only; this does NOT exercise GoTrue). */
export function mint(claims: Record<string, unknown>, opts: { exp?: number; secret?: string } = {}): string {
  const body = { iat: Math.floor(Date.now() / 1000), exp: opts.exp ?? Math.floor(Date.now() / 1000) + 3600, ...claims };
  const head = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(body)}`;
  return `${head}.${b64(createHmac("sha256", opts.secret ?? SECRET).update(head).digest())}`;
}
export const tokens = {
  anon: mint({ role: "anon" }),
  editor: mint({ role: "authenticated", sub: ID.e1, app_metadata: { role: "editor" } }),
  editor2: mint({ role: "authenticated", sub: ID.e2, app_metadata: { role: "editor" } }),
  admin: mint({ role: "authenticated", sub: ID.ad, app_metadata: { role: "admin" } }),
  user: mint({ role: "authenticated", sub: ID.u1, app_metadata: {} }),
  forged: mint({ role: "authenticated", sub: ID.u1, user_metadata: { role: "admin" }, app_metadata: {} }),   // role in user_metadata must NOT grant anything
};
/** supabase-js client pointed at the local PostgREST (Supabase serves it under /rest/v1; PostgREST serves at the root). */
export const clientFor = (token: string): SupabaseClient => createClient(API_URL, token, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (u, i) => fetch(String(u).replace("/rest/v1", ""), i) } });
