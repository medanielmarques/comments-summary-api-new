import { google } from "googleapis"
import OpenAI from "openai"

import { db } from "../src/db/index"
import { commentsSummary, summaryCommentIds } from "../src/db/schema"
import { env } from "../src/env.js"

interface Comment {
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

export default async function handler(req, res) {
  const videoId = "LSo7xH7YgaY"

  const comments = await fetchComments(videoId)
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "user",
          content: `
          Summarize the 4 main topics on this comments, keep in mind that content creators will be the ones reading this, so adapt the text accordingly and make it as useful as possible for them. ${enumerateComments(
            comments.map((c) => c.comment),
          )}`,
        },
      ],
    })

    const [commentSummary] = await db
      .insert(commentsSummary)
      .values({
        summary: completion.choices[0]?.message?.content || "",
        videoId,
        userId: "ctx.user!.id",
        // userId: ctx.user!.id,
      })
      .returning({ id: commentsSummary.id })

    await Promise.all(
      comments.map(async (comment) => {
        await db.insert(summaryCommentIds).values({
          comment_id: comment.commentId,
          comment_summary_id: commentSummary?.id,
        })
      }),
    )

    res.status(200).json({ message: "Hello world!" })
  } catch (error) {
    console.error("Error with OpenAI API:", error)
    res.status(400).json({ message: "Failed to create summary" })
  }
}
