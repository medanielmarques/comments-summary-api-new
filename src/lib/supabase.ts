import { env } from "@/env"
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

export function parseToken(token: string) {
  return JSON.parse(decodeURIComponent(token))[0]
}
