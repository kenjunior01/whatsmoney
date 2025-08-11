import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, Star, Eye, DollarSign, Users, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { search?: string; niche?: string; minPrice?: string; maxPrice?: string; sort?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const { search, niche, minPrice, maxPrice, sort } = searchParams

  // Build dynamic query based on filters
  const whereConditions = ["u.role = 'user'", "u.status = 'active'"]
  const queryParams: any[] = []
  let paramIndex = 1

  if (search) {
    whereConditions.push(`(u.name ILIKE $${paramIndex} OR hp.bio ILIKE $${paramIndex})`)
    queryParams.push(`%${search}%`)
    paramIndex++
  }

  if (niche) {
    whereConditions.push(`hp.niche = $${paramIndex}`)
    queryParams.push(niche)
    paramIndex++
  }

  if (minPrice) {
    whereConditions.push(`hp.price_per_post >= $${paramIndex}`)
    queryParams.push(Number.parseFloat(minPrice))
    paramIndex++
  }

  if (maxPrice) {
    whereConditions.push(`hp.price_per_post <= $${paramIndex}`)
    queryParams.push(Number.parseFloat(maxPrice))
    paramIndex++
  }

  let orderBy = "hp.rating DESC, hp.total_reviews DESC"
  if (sort === "price_low") orderBy = "hp.price_per_post ASC"
  if (sort === "price_high") orderBy = "hp.price_per_post DESC"
  if (sort === "views") orderBy = "hp.avg_views DESC"
  if (sort === "newest") orderBy = "u.created_at DESC"

  const whereClause = whereConditions.join(" AND ")

  const hosts = await sql.unsafe(
    `
    SELECT 
      u.id,
      u.name,
      u.avatar_url,
      u.created_at,
      hp.*
    FROM users u
    JOIN host_profiles hp ON hp.user_id = u.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT 50
  `,
    queryParams,
  )

  const niches = [
    "Tecnologia",
    "Moda",
    "Beleza",
    "Fitness",
    "Culinária",
    "Viagem",
    "Educação",
    "Entretenimento",
    "Esportes",
    "Negócios",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
              <Badge variant="secondary">{hosts.length} anfitriões encontrados</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {session.user.role === "company" && (
                <Button asChild>
                  <Link href="/campaigns/create">Criar Campanha</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Buscar Anfitriões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form method="GET" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Input
                    name="search"
                    placeholder="Buscar por nome ou bio..."
                    defaultValue={search}
                    className="w-full"
                  />
                </div>
                <div>
                  <Select name="niche" defaultValue={niche || "Todos os nichos"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nicho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todos os nichos">Todos os nichos</SelectItem>
                      {niches.map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input name="minPrice" type="number" step="0.01" placeholder="Preço mín." defaultValue={minPrice} />
                </div>
                <div>
                  <Input name="maxPrice" type="number" step="0.01" placeholder="Preço máx." defaultValue={maxPrice} />
                </div>
                <div>
                  <Select name="sort" defaultValue={sort || "Melhor avaliados"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Melhor avaliados">Melhor avaliados</SelectItem>
                      <SelectItem value="price_low">Menor preço</SelectItem>
                      <SelectItem value="price_high">Maior preço</SelectItem>
                      <SelectItem value="views">Mais visualizações</SelectItem>
                      <SelectItem value="newest">Mais recentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Host Grid */}
        {hosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum anfitrião encontrado</h3>
              <p className="text-gray-600">Tente ajustar os filtros de busca</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hosts.map((host) => (
              <Card key={host.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={host.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{host.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{host.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          {host.niche && <Badge variant="outline">{host.niche}</Badge>}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm font-medium">{host.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-gray-500">{host.total_reviews} avaliações</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {host.bio && <p className="text-sm text-gray-600 line-clamp-2">{host.bio}</p>}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span className="font-medium">R$ {host.price_per_post.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-blue-600 mr-1" />
                      <span>{host.avg_views.toLocaleString()} views</span>
                    </div>
                  </div>

                  {host.subscription_plan === "premium" && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{host.points} pontos</span>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/hosts/${host.id}`}>Ver Perfil</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
