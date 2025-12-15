import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const signinSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signinSchema.parse(body)

    console.log("[v0] Login offline:", validatedData.email)

    // Simular autenticação bem-sucedida
    const mockUser = {
      id: `offline-${Date.now()}`,
      email: validatedData.email,
      name: "Usuário Teste",
      role: "user",
    }

    return NextResponse.json({
      message: "Login realizado com sucesso (modo offline)",
      user: mockUser,
    })
  } catch (error) {
    console.error("[v0] Erro no login:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
  }
}
