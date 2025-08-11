import { sql } from "@vercel/postgres"

export async function getUserById(id: string) {
  const result = await sql`
    SELECT * FROM whatsmoney.users WHERE id = ${id}
  `
  return result.rows[0] || null
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM whatsmoney.users WHERE email = ${email}
  `
  return result.rows[0] || null
}

export async function createUser(userData: {
  id: string
  email: string
  name?: string
  role?: string
}) {
  const result = await sql`
    INSERT INTO whatsmoney.users (id, email, name, role, affiliate_code)
    VALUES (${userData.id}, ${userData.email}, ${userData.name || ""}, ${userData.role || "user"}, ${generateAffiliateCode()})
    RETURNING *
  `
  return result.rows[0]
}

function generateAffiliateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export { sql }
