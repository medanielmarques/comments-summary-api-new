import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "production"]).default("dev"),
  PORT: z.coerce.number().default(3333),

  DATABASE_URL: z.string(),
  DATABASE_TOKEN: z.string().optional(),

  YOUTUBE_DATA_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),

  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),

  UPSTASH_REDIS_REST_URL: z.string(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  // HIGHLIGHT_PROJECT_ID: z.string(),
})

const _env = envSchema.safeParse(process.env)

if (_env.success === false) {
  console.error("❌ Invalid environment variables", _env.error.format())

  throw new Error("Invalid environment variables.")
}

export const env = _env.data
