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

    const { userId: otherUserId } = await request.json()

    if (!otherUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const currentUserId = session.user.id

    // Mark all messages from the other user as read
    await sql`
      UPDATE messages 
      SET is_read = true 
      WHERE sender_id = ${otherUserId} AND recipient_id = ${currentUserId} AND is_read = false
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking all messages as read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
