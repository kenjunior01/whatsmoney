import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      verified: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    verified: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    verified: boolean
  }
}

export interface UserProfile {
  id: number
  email: string
  name: string
  role: "user" | "company" | "admin"
  avatar_url?: string
  phone?: string
  verified: boolean
  two_factor_enabled: boolean
  created_at: string
}

export interface HostProfile {
  id: number
  user_id: number
  price_per_post: number
  niche?: string
  avg_views: number
  bio?: string
  whatsapp_screenshots: string[]
  rating: number
  total_reviews: number
  subscription_plan: "free" | "premium"
  points: number
}

export interface CompanyProfile {
  id: number
  user_id: number
  company_name: string
  industry?: string
  website?: string
  description?: string
  logo_url?: string
}
