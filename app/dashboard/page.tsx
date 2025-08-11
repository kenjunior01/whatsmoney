import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { User, Camera, DollarSign, Eye, Star, TrendingUp, MessageCircle, Settings, Upload, Award } from "lucide-react"
import Link from "next/link"

export default async function UserDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role === "company") {
    redirect("/dashboard/company")
  }

  if (session.user.role === "admin") {
    redirect("/admin")
  }

  // Get user profile data
  const hostProfiles = await sql`
    SELECT hp.*, u.name, u.email, u.avatar_url
    FROM host_profiles hp
    JOIN users u ON hp.user_id = u.id
    WHERE hp.user_id = ${session.user.id}
  `

  const hostProfile = hostProfiles[0]

  // Get user points
  const userPoints = await sql`
    SELECT * FROM user_points WHERE user_id = ${session.user.id}
  `

  const points = userPoints[0] || { points: 0, level: 1, total_earned: 0 }

  // Get recent screenshots
  const screenshots = await sql`
    SELECT * FROM host_screenshots 
    WHERE host_profile_id = ${hostProfile?.id}
    ORDER BY upload_date DESC
    LIMIT 6
  `

  // Get recent campaign proposals
  const proposals = await sql`
    SELECT cp.*, c.title, c.budget, comp.company_name
    FROM campaign_proposals cp
    JOIN campaigns c ON cp.campaign_id = c.id
    JOIN company_profiles comp ON c.company_id = comp.user_id
    WHERE cp.host_id = ${session.user.id}
    ORDER BY cp.created_at DESC
    LIMIT 5
  `

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Badge variant="secondary">Anfitrião</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">{points.points} pontos</span>
                <Badge variant="outline">Nível {points.level}</Badge>
              </div>
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Meu Perfil</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={session.user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>{session.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{session.user.name}</h3>
                    <p className="text-gray-600">{session.user.email}</p>
                    {hostProfile ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Preço por post:</span> R$ {hostProfile.price_per_post}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Nicho:</span> {hostProfile.niche || "Não definido"}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{hostProfile.rating || 0}/5</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">{hostProfile.average_views || 0} visualizações</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">Complete seu perfil para começar</p>
                    )}
                  </div>
                  <Link href="/dashboard/profile/edit">
                    <Button variant="outline" size="sm">
                      Editar Perfil
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Screenshots Gallery */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Meus Screenshots</span>
                </CardTitle>
                <Link href="/dashboard/screenshots">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {screenshots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {screenshots.map((screenshot) => (
                      <div key={screenshot.id} className="relative group">
                        <img
                          src={screenshot.image_url || "/placeholder.svg"}
                          alt={screenshot.caption || "Screenshot"}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 text-white text-center">
                            <Eye className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-sm">{screenshot.views_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhum screenshot adicionado ainda</p>
                    <Link href="/dashboard/screenshots">
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Adicionar Screenshots
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Proposals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Propostas Recentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proposals.length > 0 ? (
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{proposal.title}</h4>
                          <p className="text-sm text-gray-600">{proposal.company_name}</p>
                          <p className="text-sm text-green-600 font-medium">R$ {proposal.proposed_price}</p>
                        </div>
                        <Badge
                          variant={
                            proposal.status === "accepted"
                              ? "default"
                              : proposal.status === "pending"
                                ? "secondary"
                                : proposal.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {proposal.status === "pending"
                            ? "Pendente"
                            : proposal.status === "accepted"
                              ? "Aceita"
                              : proposal.status === "rejected"
                                ? "Rejeitada"
                                : "Concluída"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma proposta ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Estatísticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Propostas Aceitas</span>
                  <span className="font-medium">{proposals.filter((p) => p.status === "accepted").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Taxa de Aprovação</span>
                  <span className="font-medium">
                    {proposals.length > 0
                      ? Math.round((proposals.filter((p) => p.status === "accepted").length / proposals.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Screenshots</span>
                  <span className="font-medium">{screenshots.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avaliação</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{hostProfile?.rating || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gamification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Gamificação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Nível {points.level}</span>
                    <span className="text-sm text-gray-600">{points.points}/1000</span>
                  </div>
                  <Progress value={(points.points % 1000) / 10} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pontos Atuais</span>
                    <span className="font-medium">{points.points}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Ganho</span>
                    <span className="font-medium">{points.total_earned}</span>
                  </div>
                </div>
                <Link href="/dashboard/rewards">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Ver Recompensas
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/screenshots" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Upload className="h-4 w-4 mr-2" />
                    Adicionar Screenshots
                  </Button>
                </Link>
                <Link href="/dashboard/profile/edit" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                </Link>
                <Link href="/search" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Buscar Campanhas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
