import { env } from "@/env"
import { createSummary } from "@/http/create-summary"
import fastifyCookie from "@fastify/cookie"
import fastify from "fastify"
import { ZodError } from "zod"

export const app = fastify()

app.register(fastifyCookie)

app.get("/create-summary", createSummary)

app.setErrorHandler((error, req, res) => {
  if (error instanceof ZodError) {
    return res
      .status(400)
      .send({ message: "Validation error.", issues: error.format() })
  }

  if (env.NODE_ENV !== "production") {
    console.error(error)
  } else {
    // TODO: Here we should log to a external tool like Highlight
  }
  return res.status(500).send({ message: "Internal server error." })
})
