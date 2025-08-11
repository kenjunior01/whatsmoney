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

    const userId = session.user.id

    // Get all conversations for the current user
    const conversations = await sql`
      WITH conversation_users AS (
        SELECT DISTINCT
          CASE 
            WHEN sender_id = ${userId} THEN recipient_id
            ELSE sender_id
          END as user_id
        FROM messages
        WHERE sender_id = ${userId} OR recipient_id = ${userId}
      ),
      last_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN sender_id = ${userId} THEN recipient_id
            ELSE sender_id
          END
        )
          CASE 
            WHEN sender_id = ${userId} THEN recipient_id
            ELSE sender_id
          END as user_id,
          content as last_message,
          created_at as last_message_time
        FROM messages
        WHERE sender_id = ${userId} OR recipient_id = ${userId}
        ORDER BY 
          CASE 
            WHEN sender_id = ${userId} THEN recipient_id
            ELSE sender_id
          END,
          created_at DESC
      ),
      unread_counts AS (
        SELECT 
          sender_id as user_id,
          COUNT(*) as unread_count
        FROM messages
        WHERE recipient_id = ${userId} AND is_read = false
        GROUP BY sender_id
      )
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.avatar_url as user_avatar,
        u.role as user_role,
        lm.last_message,
        lm.last_message_time,
        COALESCE(uc.unread_count, 0) as unread_count
      FROM conversation_users cu
      JOIN users u ON u.id = cu.user_id
      LEFT JOIN last_messages lm ON lm.user_id = cu.user_id
      LEFT JOIN unread_counts uc ON uc.user_id = cu.user_id
      ORDER BY lm.last_message_time DESC NULLS LAST
    `

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
