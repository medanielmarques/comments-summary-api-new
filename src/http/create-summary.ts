import { db } from "@/db"
import { commentsSummary, summaryCommentIds } from "@/db/schema"
import { env } from "@/env"
import { parseToken, supabase } from "@/lib/supabase"
import { FastifyReply, FastifyRequest } from "fastify"
import { google } from "googleapis"
import OpenAI from "openai"

type Comment = {
  commentId: string
  comment: string
}

function enumerateComments(comments: string[]): string {
  return comments.map((comment, index) => `${index + 1}. ${comment}`).join(" ")
}

async function fetchComments(videoId: string): Promise<Comment[]> {
  const youtube = google.youtube({
    version: "v3",
    auth: env.YOUTUBE_DATA_API_KEY,
  })

  try {
    const commentsResponse = await youtube.commentThreads.list({
      part: ["snippet"],
      videoId,
      maxResults: 50,
      order: "relevance",
    })

    return (
      commentsResponse.data.items?.map((item) => ({
        commentId: item.snippet?.topLevelComment?.id ?? "",
        comment: item.snippet?.topLevelComment?.snippet?.textOriginal ?? "",
      })) ?? []
    )
  } catch (error) {
    console.error("Error fetching comments:", error)
    return []
  }
}

export async function createSummary(req: FastifyRequest, res: FastifyReply) {
  // const rawToken = req.cookies["sb-alykkrmvqnduxbjaptra-auth-token"]
  // if (!rawToken) return res.status(401).send({ message: "Unauthorized" })

  // const token = parseToken(rawToken)

  // const { data, error } = await supabase.auth.getUser(token)
  // if (error) return res.status(401).send("Invalid token")

  const videoId = req.query.videoId as string

  const comments = await fetchComments(videoId)
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  const enumeratedComments = enumerateComments(comments.map((c) => c.comment))

  const completion = await openai.chat.completions
    .create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "user",
          content: `
          Summarize the 4 main topics on this comments, keep in mind that content creators will be the ones reading this, so adapt the text accordingly and make it as useful as possible for them. ${enumeratedComments}`,
        },
      ],
    })
    .catch((error) => {
      console.error("Error with OpenAI API:", error)
      res.status(400).send({ message: "Failed to create summary" })
    })

  try {
    const commentsIds = comments.map((c) => c.commentId).join()

    const [commentSummary] = await db
      .insert(commentsSummary)
      .values({
        summary: completion.choices[0]?.message?.content || "",
        videoId,
        // userId: data.user.id,
        userId: "data.user.id",
      })
      .returning({ id: commentsSummary.id })

    await db.insert(summaryCommentIds).values({
      commentsIds,
      totalCommentsUsed: comments.length,
      commentsSummaryId: commentSummary?.id,
    })
  } catch (error) {
    console.error("Error inserting data on the DB:", error)
    res.status(400).send({ message: "Failed to create summary" })
  }

  res.status(200).send({ message: "Summary created successfully!" })
}
