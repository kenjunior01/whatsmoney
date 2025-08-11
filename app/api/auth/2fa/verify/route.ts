import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import speakeasy from "speakeasy"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { token } = await request.json()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (!token) {
      return NextResponse.json({ error: "Token necessário" }, { status: 400 })
    }

    // Get user's secret
    const users = await sql`
      SELECT two_factor_secret FROM users WHERE id = ${session.user.id}
    `

    const user = users[0]
    if (!user?.two_factor_secret) {
      return NextResponse.json({ error: "2FA não configurado" }, { status: 400 })
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: token,
      window: 2,
    })

    if (!verified) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 })
    }

    // Enable 2FA
    await sql`
      UPDATE users 
      SET two_factor_enabled = true
      WHERE id = ${session.user.id}
    `

    return NextResponse.json({
      message: "2FA ativado com sucesso",
    })
  } catch (error) {
    console.error("2FA verification error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
