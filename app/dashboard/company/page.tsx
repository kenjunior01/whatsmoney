import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building, Plus, Users, TrendingUp, MessageCircle, Settings, BarChart3, Target } from "lucide-react"
import Link from "next/link"

export default async function CompanyDashboard() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  if (session.user.role !== "company") {
    redirect("/dashboard")
  }

  // Get company profile data
  const companyProfiles = await sql`
    SELECT cp.*, u.name, u.email, u.avatar_url
    FROM company_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.user_id = ${session.user.id}
  `

  const companyProfile = companyProfiles[0]

  // Get campaigns
  const campaigns = await sql`
    SELECT * FROM campaigns 
    WHERE company_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 5
  `

  // Get campaign proposals
  const proposals = await sql`
    SELECT cp.*, c.title, hp.price_per_post, u.name as host_name
    FROM campaign_proposals cp
    JOIN campaigns c ON cp.campaign_id = c.id
    JOIN host_profiles hp ON cp.host_id = hp.user_id
    JOIN users u ON cp.host_id = u.id
    WHERE c.company_id = ${session.user.id}
    ORDER BY cp.created_at DESC
    LIMIT 10
  `

  // Calculate stats
  const totalBudget = campaigns.reduce((sum, campaign) => sum + (campaign.budget || 0), 0)
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length
  const pendingProposals = proposals.filter((p) => p.status === "pending").length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <Badge variant="secondary">Empresa</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/company/campaigns/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Campanha
                </Button>
              </Link>
              <Link href="/dashboard/company/settings">
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
            {/* Company Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Perfil da Empresa</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={companyProfile?.logo_url || "/placeholder.svg"} />
                    <AvatarFallback>{companyProfile?.company_name?.charAt(0).toUpperCase() || "E"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{companyProfile?.company_name || session.user.name}</h3>
                    <p className="text-gray-600">{session.user.email}</p>
                    {companyProfile ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Setor:</span> {companyProfile.industry || "Não definido"}
                        </p>
                        {companyProfile.website_url && (
                          <p className="text-sm">
                            <span className="font-medium">Website:</span>{" "}
                            <a
                              href={companyProfile.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {companyProfile.website_url}
                            </a>
                          </p>
                        )}
                        {companyProfile.is_verified && (
                          <Badge variant="default" className="mt-2">
                            Empresa Verificada
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">Complete seu perfil para começar</p>
                    )}
                  </div>
                  <Link href="/dashboard/company/profile/edit">
                    <Button variant="outline" size="sm">
                      Editar Perfil
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Active Campaigns */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Campanhas Ativas</span>
                </CardTitle>
                <Link href="/dashboard/company/campaigns">
                  <Button variant="outline" size="sm">
                    Ver Todas
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{campaign.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
                          <p className="text-sm text-green-600 font-medium mt-1">Orçamento: R$ {campaign.budget}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              campaign.status === "active"
                                ? "default"
                                : campaign.status === "draft"
                                  ? "secondary"
                                  : campaign.status === "paused"
                                    ? "outline"
                                    : "destructive"
                            }
                          >
                            {campaign.status === "active"
                              ? "Ativa"
                              : campaign.status === "draft"
                                ? "Rascunho"
                                : campaign.status === "paused"
                                  ? "Pausada"
                                  : campaign.status === "completed"
                                    ? "Concluída"
                                    : "Cancelada"}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {proposals.filter((p) => p.campaign_id === campaign.id).length} propostas
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Nenhuma campanha criada ainda</p>
                    <Link href="/dashboard/company/campaigns/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeira Campanha
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
                    {proposals.slice(0, 5).map((proposal) => (
                      <div key={proposal.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{proposal.title}</h4>
                          <p className="text-sm text-gray-600">Por: {proposal.host_name}</p>
                          <p className="text-sm text-green-600 font-medium">R$ {proposal.proposed_price}</p>
                        </div>
                        <div className="text-right">
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
                          {proposal.status === "pending" && (
                            <div className="mt-2 space-x-2">
                              <Button size="sm" variant="outline">
                                Aceitar
                              </Button>
                              <Button size="sm" variant="ghost">
                                Rejeitar
                              </Button>
                            </div>
                          )}
                        </div>
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
                  <BarChart3 className="h-5 w-5" />
                  <span>Estatísticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Campanhas Ativas</span>
                  <span className="font-medium">{activeCampaigns}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de Campanhas</span>
                  <span className="font-medium">{campaigns.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Propostas Pendentes</span>
                  <span className="font-medium">{pendingProposals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Orçamento Total</span>
                  <span className="font-medium">R$ {totalBudget.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/dashboard/company/campaigns/new" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Campanha
                  </Button>
                </Link>
                <Link href="/search" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Buscar Anfitriões
                  </Button>
                </Link>
                <Link href="/dashboard/company/analytics" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Relatórios
                  </Button>
                </Link>
                <Link href="/dashboard/company/profile/edit" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Building className="h-4 w-4 mr-2" />
                    Editar Perfil
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
