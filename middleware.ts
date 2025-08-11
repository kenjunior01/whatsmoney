import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const token = req.auth
  const isAuth = !!token
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")
  const isPublicPage = ["/", "/about", "/contact", "/terms", "/privacy"].includes(req.nextUrl.pathname)

  // Allow API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Allow public pages
  if (isPublicPage) {
    return NextResponse.next()
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

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
