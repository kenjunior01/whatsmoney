import { createClient } from "@/lib/supabase/server"

export async function getSession() {
  const supabase = createClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("[v0] Error getting session:", error)
    return null
  }
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user) return null

  const supabase = createClient()

  try {
    const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

    return profile
  } catch (error) {
    console.error("[v0] Error getting user:", error)
    return null
  }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { success: true, user: data.user }
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Sign in failed" }
  }
}

export async function signUp(email: string, password: string, name: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) throw error
    return { success: true, user: data.user }
  } catch (error) {
    console.error("[v0] Sign up error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Sign up failed" }
  }
}

export async function signOut() {
  const supabase = createClient()

  try {
    await supabase.auth.signOut()
    return { success: true }
  } catch (error) {
    console.error("[v0] Sign out error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Sign out failed" }
  }
}

export const auth = getSession
export const authOptions = {
  // Placeholder for compatibility - Supabase handles auth differently
  providers: [],
  callbacks: {},
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
