import { env } from "@/env"
import { usersRoutes } from "@/http/controllers/users/routes"
import fastify from "fastify"
import { ZodError } from "zod"

export const app = fastify()

app.register(usersRoutes)

app.setErrorHandler((error, _, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: "Validation error.", issues: error.format() })
  }

  if (env.NODE_ENV !== "production") {
    console.error(error)
  } else {
    // TODO: Here we should log to a external tool like Highlight
  }
  return reply.status(500).send({ message: "Internal server error." })
})
