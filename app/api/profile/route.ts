import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
  price_per_post: z.string().transform((val) => Number.parseFloat(val) || 0),
  niche: z.string().optional(),
  bio: z.string().optional(),
  average_views: z.string().transform((val) => Number.parseInt(val) || 0),
  followers_count: z.string().transform((val) => Number.parseInt(val) || 0),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get user data
    const users = await sql`
      SELECT id, name, email, phone, avatar_url, role
      FROM users 
      WHERE id = ${session.user.id}
    `

    const user = users[0]
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    let profile = null

    // Get role-specific profile
    if (user.role === "user") {
      const hostProfiles = await sql`
        SELECT * FROM host_profiles WHERE user_id = ${session.user.id}
      `
      profile = hostProfiles[0]
    } else if (user.role === "company") {
      const companyProfiles = await sql`
        SELECT * FROM company_profiles WHERE user_id = ${session.user.id}
      `
      profile = companyProfiles[0]
    }

    return NextResponse.json({
      user,
      hostProfile: user.role === "user" ? profile : null,
      companyProfile: user.role === "company" ? profile : null,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user basic info
    await sql`
      UPDATE users 
      SET 
        name = ${validatedData.name},
        phone = ${validatedData.phone || null},
        avatar_url = ${validatedData.avatar_url || null},
        updated_at = NOW()
      WHERE id = ${session.user.id}
    `

    // Update role-specific profile
    if (session.user.role === "user") {
      // Update or create host profile
      const existingProfiles = await sql`
        SELECT id FROM host_profiles WHERE user_id = ${session.user.id}
      `

      if (existingProfiles.length > 0) {
        await sql`
          UPDATE host_profiles 
          SET 
            price_per_post = ${validatedData.price_per_post},
            niche = ${validatedData.niche || null},
            bio = ${validatedData.bio || null},
            average_views = ${validatedData.average_views},
            followers_count = ${validatedData.followers_count},
            updated_at = NOW()
          WHERE user_id = ${session.user.id}
        `
      } else {
        await sql`
          INSERT INTO host_profiles (
            user_id, price_per_post, niche, bio, average_views, followers_count
          )
          VALUES (
            ${session.user.id}, 
            ${validatedData.price_per_post}, 
            ${validatedData.niche || null}, 
            ${validatedData.bio || null}, 
            ${validatedData.average_views}, 
            ${validatedData.followers_count}
          )
        `
      }
    }

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
    })
  } catch (error) {
    console.error("Profile update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
