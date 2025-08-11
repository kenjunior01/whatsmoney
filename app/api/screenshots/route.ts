import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { z } from "zod"

const createScreenshotsSchema = z.object({
  screenshots: z.array(
    z.object({
      image_url: z.string().url(),
      caption: z.string().optional(),
      views_count: z.number().min(0).default(0),
    }),
  ),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get host profile
    const hostProfiles = await sql`
      SELECT id FROM host_profiles WHERE user_id = ${session.user.id}
    `

    const hostProfile = hostProfiles[0]
    if (!hostProfile) {
      return NextResponse.json({ screenshots: [] })
    }

    // Get screenshots
    const screenshots = await sql`
      SELECT * FROM host_screenshots 
      WHERE host_profile_id = ${hostProfile.id}
      ORDER BY is_primary DESC, upload_date DESC
    `

    return NextResponse.json({ screenshots })
  } catch (error) {
    console.error("Screenshots fetch error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createScreenshotsSchema.parse(body)

    // Get host profile
    const hostProfiles = await sql`
      SELECT id FROM host_profiles WHERE user_id = ${session.user.id}
    `

    const hostProfile = hostProfiles[0]
    if (!hostProfile) {
      return NextResponse.json({ error: "Perfil de anfitrião não encontrado" }, { status: 404 })
    }

    // Check current screenshot count
    const currentScreenshots = await sql`
      SELECT COUNT(*) as count FROM host_screenshots 
      WHERE host_profile_id = ${hostProfile.id}
    `

    const currentCount = Number.parseInt(currentScreenshots[0].count)
    if (currentCount + validatedData.screenshots.length > 10) {
      return NextResponse.json({ error: "Você pode ter no máximo 10 screenshots" }, { status: 400 })
    }

    // Insert screenshots
    for (const screenshot of validatedData.screenshots) {
      await sql`
        INSERT INTO host_screenshots (
          host_profile_id, image_url, caption, views_count
        )
        VALUES (
          ${hostProfile.id}, 
          ${screenshot.image_url}, 
          ${screenshot.caption || null}, 
          ${screenshot.views_count}
        )
      `
    }

    return NextResponse.json({
      message: "Screenshots adicionados com sucesso",
    })
  } catch (error) {
    console.error("Screenshots creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
