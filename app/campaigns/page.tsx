import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, DollarSign, Eye, Users, Plus, Search } from "lucide-react"
import Link from "next/link"

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const userId = Number.parseInt(session.user.id)

  // Get campaigns based on user role
  let campaigns = []

  if (session.user.role === "company") {
    // Company sees their own campaigns
    campaigns = await sql`
      SELECT 
        a.*,
        COUNT(aa.id) as applications_count,
        COUNT(CASE WHEN aa.status = 'accepted' THEN 1 END) as accepted_count
      FROM ads a
      LEFT JOIN ad_applications aa ON aa.ad_id = a.id
      WHERE a.company_id = ${userId}
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `
  } else {
    // Hosts see available campaigns they can apply to
    campaigns = await sql`
      SELECT 
        a.*,
        u.name as company_name,
        cp.company_name as company_display_name,
        cp.logo_url,
        COUNT(aa.id) as applications_count,
        EXISTS(
          SELECT 1 FROM ad_applications aa2 
          WHERE aa2.ad_id = a.id AND aa2.host_id = ${userId}
        ) as user_applied
      FROM ads a
      JOIN users u ON u.id = a.company_id
      JOIN company_profiles cp ON cp.user_id = u.id
      LEFT JOIN ad_applications aa ON aa.ad_id = a.id
      WHERE a.status = 'active' 
        AND a.expires_at > NOW()
      GROUP BY a.id, u.name, cp.company_name, cp.logo_url
      ORDER BY a.created_at DESC
    `
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {session.user.role === "company" ? "Minhas Campanhas" : "Campanhas Disponíveis"}
              </h1>
              <Badge variant="secondary">{campaigns.length} campanhas</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {session.user.role === "company" && (
                <Button asChild>
                  <Link href="/campaigns/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Campanha
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {session.user.role === "company" ? "Nenhuma campanha criada ainda" : "Nenhuma campanha disponível"}
              </h3>
              <p className="text-gray-600 mb-4">
                {session.user.role === "company"
                  ? "Crie sua primeira campanha para começar a encontrar anfitriões"
                  : "Novas campanhas aparecerão aqui quando estiverem disponíveis"}
              </p>
              {session.user.role === "company" && (
                <Button asChild>
                  <Link href="/campaigns/create">Criar Primeira Campanha</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
                      {session.user.role === "user" && (
                        <CardDescription className="flex items-center mt-2">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={campaign.logo_url || "/placeholder.svg"} />
                            <AvatarFallback>{campaign.company_display_name?.charAt(0) || "C"}</AvatarFallback>
                          </Avatar>
                          {campaign.company_display_name || campaign.company_name}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={
                        campaign.status === "active"
                          ? "default"
                          : campaign.status === "completed"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {campaign.status === "active" && "Ativa"}
                      {campaign.status === "paused" && "Pausada"}
                      {campaign.status === "completed" && "Concluída"}
                      {campaign.status === "cancelled" && "Cancelada"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{campaign.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span>R$ {campaign.budget?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-blue-600 mr-1" />
                      <span>{campaign.applications_count} candidatos</span>
                    </div>
                  </div>

                  {campaign.target_niche && <Badge variant="outline">{campaign.target_niche}</Badge>}

                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    Criada em {new Date(campaign.created_at).toLocaleDateString("pt-BR")}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    {session.user.role === "company" ? (
                      <div className="flex items-center text-green-600">
                        <Eye className="h-4 w-4 mr-1" />
                        <span className="text-sm">{campaign.accepted_count} aceitos</span>
                      </div>
                    ) : (
                      <div>
                        {campaign.user_applied ? (
                          <Badge variant="secondary">Candidatura enviada</Badge>
                        ) : (
                          <span className="text-sm text-gray-500">Disponível</span>
                        )}
                      </div>
                    )}
                    <Button size="sm" asChild>
                      <Link href={`/campaigns/${campaign.id}`}>
                        {session.user.role === "company" ? "Gerenciar" : "Ver Detalhes"}
                      </Link>
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
