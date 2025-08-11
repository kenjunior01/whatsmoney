import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get("with")

    if (!withUserId) {
      return NextResponse.json({ error: "Missing 'with' parameter" }, { status: 400 })
    }

    const userId = session.user.id

    // Get messages between current user and specified user
    const messages = await sql`
      SELECT 
        m.*,
        u.name as sender_name,
        u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE 
        (m.sender_id = ${userId} AND m.recipient_id = ${withUserId})
        OR (m.sender_id = ${withUserId} AND m.recipient_id = ${userId})
      ORDER BY m.created_at ASC
    `

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
