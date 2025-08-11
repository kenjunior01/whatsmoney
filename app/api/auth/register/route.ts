import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["user", "company"], {
    errorMap: () => ({ message: "Tipo de conta inválido" }),
  }),
  phone: z.string().optional(),
  companyName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${validatedData.email}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Usuário já existe com este email" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const newUsers = await sql`
      INSERT INTO users (name, email, password_hash, role, phone, status, email_verified)
      VALUES (${validatedData.name}, ${validatedData.email}, ${hashedPassword}, ${validatedData.role}, ${validatedData.phone || null}, 'active', false)
      RETURNING id, email, name, role
    `

    const newUser = newUsers[0]

    // Create role-specific profile
    if (validatedData.role === "user") {
      await sql`
        INSERT INTO host_profiles (user_id, price_per_post, bio)
        VALUES (${newUser.id}, 0, '')
      `
    } else if (validatedData.role === "company") {
      await sql`
        INSERT INTO company_profiles (user_id, company_name, description)
        VALUES (${newUser.id}, ${validatedData.companyName || validatedData.name}, '')
      `
    }

    // Initialize gamification points for users
    if (validatedData.role === "user") {
      await sql`
        INSERT INTO user_points (user_id, points, level)
        VALUES (${newUser.id}, 100, 1)
      `

      await sql`
        INSERT INTO point_transactions (user_id, points, transaction_type, description)
        VALUES (${newUser.id}, 100, 'signup_bonus', 'Bônus de cadastro')
      `
    }

    return NextResponse.json({
      message: "Conta criada com sucesso",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
