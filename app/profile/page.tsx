import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Building, Camera, Star, TrendingUp } from "lucide-react"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const userId = Number.parseInt(session.user.id)
  const userRole = session.user.role

  // Get user profile data
  let profileData = null

  if (userRole === "user") {
    const hostData = await sql`
      SELECT 
        u.*,
        hp.*,
        a.referral_code
      FROM users u
      JOIN host_profiles hp ON hp.user_id = u.id
      LEFT JOIN affiliates a ON a.user_id = u.id
      WHERE u.id = ${userId}
    `
    profileData = hostData[0]
  } else if (userRole === "company") {
    const companyData = await sql`
      SELECT 
        u.*,
        cp.*
      FROM users u
      JOIN company_profiles cp ON cp.user_id = u.id
      WHERE u.id = ${userId}
    `
    profileData = companyData[0]
  }

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

  const industries = [
    "Tecnologia",
    "Varejo",
    "Serviços",
    "Saúde",
    "Educação",
    "Alimentação",
    "Moda",
    "Beleza",
    "Automóveis",
    "Imobiliário",
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
            <Button variant="outline" asChild>
              <a href="/dashboard">Voltar ao Dashboard</a>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={profileData?.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {profileData?.name?.charAt(0) || session.user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{profileData?.name || session.user.name}</CardTitle>
                <CardDescription>
                  <Badge variant={userRole === "company" ? "default" : "secondary"}>
                    {userRole === "company" ? "Empresa" : "Anfitrião"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRole === "user" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avaliação</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm font-medium">{profileData?.rating?.toFixed(1) || "0.0"}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Preço por post</span>
                      <span className="text-sm font-medium">
                        R$ {profileData?.price_per_post?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pontos</span>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="ml-1 text-sm font-medium">{profileData?.points || 0}</span>
                      </div>
                    </div>
                    {profileData?.referral_code && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-gray-500">Código de Afiliado</Label>
                        <div className="mt-1 p-2 bg-gray-100 rounded text-sm font-mono">
                          {profileData.referral_code}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <form className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input id="name" defaultValue={profileData?.name || ""} placeholder="Seu nome completo" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={profileData?.email || ""}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input id="phone" defaultValue={profileData?.phone || ""} placeholder="(11) 99999-9999" />
                  </div>
                </CardContent>
              </Card>

              {userRole === "user" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Perfil do Anfitrião</CardTitle>
                    <CardDescription>Configure suas informações para atrair mais empresas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="niche">Nicho</Label>
                        <Select defaultValue={profileData?.niche || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu nicho" />
                          </SelectTrigger>
                          <SelectContent>
                            {niches.map((niche) => (
                              <SelectItem key={niche} value={niche}>
                                {niche}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="price">Preço por Postagem (R$)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          min="1"
                          defaultValue={profileData?.price_per_post || ""}
                          placeholder="25.00"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="avg_views">Média de Visualizações</Label>
                      <Input
                        id="avg_views"
                        type="number"
                        defaultValue={profileData?.avg_views || ""}
                        placeholder="1500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Biografia</Label>
                      <Textarea
                        id="bio"
                        defaultValue={profileData?.bio || ""}
                        placeholder="Conte um pouco sobre você e sua audiência..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label>Screenshots do WhatsApp</Label>
                      <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Clique para adicionar screenshots dos seus status</p>
                        <p className="text-xs text-gray-500 mt-1">Máximo 5 imagens, até 5MB cada</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Perfil da Empresa
                    </CardTitle>
                    <CardDescription>Configure as informações da sua empresa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="company_name">Nome da Empresa</Label>
                      <Input
                        id="company_name"
                        defaultValue={profileData?.company_name || ""}
                        placeholder="Nome da sua empresa"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">Setor</Label>
                        <Select defaultValue={profileData?.industry || ""}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          defaultValue={profileData?.website || ""}
                          placeholder="https://suaempresa.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição da Empresa</Label>
                      <Textarea
                        id="description"
                        defaultValue={profileData?.description || ""}
                        placeholder="Descreva sua empresa e seus produtos/serviços..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
