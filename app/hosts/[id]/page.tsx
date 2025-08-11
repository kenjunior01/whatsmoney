import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Star, Eye, DollarSign, Calendar, MessageCircle, TrendingUp, Award, Phone } from "lucide-react"
import Link from "next/link"

export default async function HostProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const hostId = Number.parseInt(params.id)

  const hostData = await sql`
    SELECT 
      u.*,
      hp.*
    FROM users u
    JOIN host_profiles hp ON hp.user_id = u.id
    WHERE u.id = ${hostId} AND u.role = 'user' AND u.status = 'active'
  `

  if (hostData.length === 0) {
    notFound()
  }

  const host = hostData[0]

  // Get recent reviews
  const reviews = await sql`
    SELECT 
      r.*,
      u.name as reviewer_name,
      u.avatar_url as reviewer_avatar
    FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.reviewee_id = ${hostId}
    ORDER BY r.created_at DESC
    LIMIT 5
  `

  // Get completed campaigns count
  const campaignStats = await sql`
    SELECT 
      COUNT(*) as total_campaigns,
      COUNT(CASE WHEN aa.status = 'completed' THEN 1 END) as completed_campaigns
    FROM ad_applications aa
    WHERE aa.host_id = ${hostId}
  `

  const stats = campaignStats[0] || { total_campaigns: 0, completed_campaigns: 0 }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Perfil do Anfitrião</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/marketplace">Voltar ao Marketplace</Link>
              </Button>
              {session.user.role === "company" && (
                <Button asChild>
                  <Link href={`/chat?with=${hostId}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar Mensagem
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={host.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">{host.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{host.name}</CardTitle>
                <CardDescription className="flex items-center justify-center space-x-2">
                  {host.niche && <Badge variant="outline">{host.niche}</Badge>}
                  {host.subscription_plan === "premium" && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Premium</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avaliação</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-medium">{host.rating.toFixed(1)}</span>
                    <span className="ml-1 text-xs text-gray-500">({host.total_reviews})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Preço por post</span>
                  <div className="flex items-center text-green-600">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">R$ {host.price_per_post.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Média de views</span>
                  <div className="flex items-center text-blue-600">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">{host.avg_views.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pontos</span>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">{host.points}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Campanhas</span>
                  <div className="flex items-center">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium ml-1">{stats.completed_campaigns}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Membro desde</span>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm ml-1">
                      {new Date(host.created_at).toLocaleDateString("pt-BR", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {host.phone && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center text-green-600">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm ml-2">WhatsApp verificado</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {host.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>Sobre</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{host.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Screenshots */}
            {host.whatsapp_screenshots && host.whatsapp_screenshots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Screenshots do WhatsApp</CardTitle>
                  <CardDescription>Exemplos de status e estatísticas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {host.whatsapp_screenshots.map((screenshot: string, index: number) => (
                      <div key={index} className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={screenshot || "/placeholder.svg"}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Avaliações Recentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.reviewer_avatar || "/placeholder.svg"} />
                          <AvatarFallback>{review.reviewer_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{review.reviewer_name}</span>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          {review.comment && <p className="text-sm text-gray-700 mt-1">{review.comment}</p>}
                        </div>
                      </div>
                      {review !== reviews[reviews.length - 1] && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
