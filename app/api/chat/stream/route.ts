import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const withUser = searchParams.get("withUser")

  if (!userId || !withUser) {
    return new Response("Missing parameters", { status: 400 })
  }

  // Create Server-Sent Events stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`)

      // Poll for new messages every 2 seconds
      const interval = setInterval(async () => {
        try {
          const messages = await sql`
            SELECT 
              m.*,
              u.name as sender_name,
              u.avatar_url as sender_avatar
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE 
              ((m.sender_id = ${withUser} AND m.recipient_id = ${userId})
              OR (m.sender_id = ${userId} AND m.recipient_id = ${withUser}))
              AND m.created_at > NOW() - INTERVAL '5 seconds'
            ORDER BY m.created_at DESC
            LIMIT 1
          `

          if (messages.length > 0) {
            controller.enqueue(`data: ${JSON.stringify(messages[0])}\n\n`)
          }
        } catch (error) {
          console.error("Error polling messages:", error)
        }
      }, 2000)

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
