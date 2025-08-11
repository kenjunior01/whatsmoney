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

    const { messageId } = await request.json()

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 })
    }

    const userId = session.user.id

    // Mark message as read (only if current user is the recipient)
    await sql`
      UPDATE messages 
      SET is_read = true 
      WHERE id = ${messageId} AND recipient_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking message as read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
