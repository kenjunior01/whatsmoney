import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipient_id, content, message_type = "text", file_url } = await request.json()

    if (!recipient_id || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const senderId = session.user.id

    // Verify recipient exists
    const recipient = await sql`
      SELECT id FROM users WHERE id = ${recipient_id} AND status = 'active'
    `

    if (recipient.length === 0) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Insert message
    const message = await sql`
      INSERT INTO messages (sender_id, recipient_id, content, message_type, file_url)
      VALUES (${senderId}, ${recipient_id}, ${content}, ${message_type}, ${file_url})
      RETURNING *
    `

    // Get sender info for the response
    const messageWithSender = await sql`
      SELECT 
        m.*,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id = ${message[0].id}
    `

    return NextResponse.json(messageWithSender[0])
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
