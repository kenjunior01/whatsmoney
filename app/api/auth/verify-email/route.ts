import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token de verificação necessário" }, { status: 400 })
    }

    // In a real app, you'd verify the token against a stored verification token
    // For now, we'll simulate email verification
    const users = await sql`
      UPDATE users 
      SET email_verified = true 
      WHERE id = ${token}
      RETURNING id, email, name
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 })
    }

    return NextResponse.json({
      message: "Email verificado com sucesso",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
