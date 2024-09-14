import { db } from "@/db"
import { commentsSummary } from "@/db/schema"
import { eq } from "drizzle-orm"
import { FastifyReply, FastifyRequest } from "fastify"

export async function fetchSummary(req: FastifyRequest, res: FastifyReply) {
  if (!req.cookies.supabase_jwt) {
    return res.status(401).send({ message: "Unauthorized" })
  }

  if (req.cookies.supabase_jwt !== "supabase_auth_cookie") {
    return res.status(401).send({ message: "Unauthorized" })
  }

  const videoId = req.query.videoId as string

  const summary = await db
    .select()
    .from(commentsSummary)
    .where(eq(commentsSummary.videoId, videoId))

  if (summary.length === 0) {
    await fetch(`create-summary?videoId=${videoId}`)
    return res.status(404).send({ message: "Summary not found" })
  }

  return res.status(200).send({ summary: summary[0].summary })
}
