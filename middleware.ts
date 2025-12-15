import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let supabaseConfigured = false

  if (supabaseUrl && supabaseAnonKey) {
    try {
      new URL(supabaseUrl)
      // Verificar se não são valores placeholder
      if (!supabaseUrl.includes("your-project") && supabaseAnonKey.length > 20) {
        supabaseConfigured = true
      }
    } catch {
      console.warn("[v0] Invalid Supabase URL format")
    }
  }

  if (!supabaseConfigured) {
    console.warn("[v0] Supabase not configured, allowing all access in offline mode")
    return NextResponse.next()
  }

  // Update session with Supabase
  const response = await updateSession(request)
  const req = request // Assign request to req for compatibility with existing code

  const token = req.auth
  const isAuth = !!token
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")
  const isPublicPage = ["/", "/about", "/contact", "/terms", "/privacy"].includes(req.nextUrl.pathname)

  // Allow API auth routes
  if (isApiAuthRoute) {
    return response
  }

  // Allow public pages
  if (isPublicPage) {
    return response
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuth) {
    if (token?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url))
    } else if (token?.role === "company") {
      return NextResponse.redirect(new URL("/dashboard/company", req.url))
    } else {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  // Redirect unauthenticated users to sign in
  if (!isAuthPage && !isAuth) {
    let from = req.nextUrl.pathname
    if (req.nextUrl.search) {
      from += req.nextUrl.search
    }

    return NextResponse.redirect(new URL(`/auth/signin?from=${encodeURIComponent(from)}`, req.url))
  }

  // Role-based access control
  if (isAuth && token) {
    const pathname = req.nextUrl.pathname

    // Admin routes
    if (pathname.startsWith("/admin") && token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Company dashboard routes
    if (pathname.startsWith("/dashboard/company") && token.role !== "company") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // User dashboard routes (default for users)
    if (pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard/company") && token.role === "company") {
      return NextResponse.redirect(new URL("/dashboard/company", req.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
