"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Upload, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface HostProfile {
  id: string
  price_per_post: number
  niche: string
  bio: string
  average_views: number
  followers_count: number
}

export default function EditProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    price_per_post: "",
    niche: "",
    bio: "",
    average_views: "",
    followers_count: "",
  })

  const [profile, setProfile] = useState<HostProfile | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Load current profile data
    loadProfile()
  }, [session, status])

  const loadProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data.hostProfile)
        setFormData({
          name: data.user.name || "",
          phone: data.user.phone || "",
          price_per_post: data.hostProfile?.price_per_post?.toString() || "",
          niche: data.hostProfile?.niche || "",
          bio: data.hostProfile?.bio || "",
          average_views: data.hostProfile?.average_views?.toString() || "",
          followers_count: data.hostProfile?.followers_count?.toString() || "",
        })
        setAvatarPreview(data.user.avatar_url || "")
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError("Imagem deve ter no máximo 5MB")
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      let avatarUrl = avatarPreview

      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData()
        formData.append("file", avatarFile)
        formData.append("type", "avatar")

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          avatarUrl = uploadData.url
        } else {
          throw new Error("Erro ao fazer upload da imagem")
        }
      }

      // Update profile
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          avatar_url: avatarUrl,
        }),
      })

      if (response.ok) {
        setSuccess("Perfil atualizado com sucesso!")
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao atualizar perfil")
      }
    } catch (error) {
      setError("Erro ao atualizar perfil")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Editar Perfil</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informações do Perfil</span>
            </CardTitle>
            <CardDescription>Mantenha suas informações atualizadas para atrair mais empresas</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || "/placeholder.svg"} />
                  <AvatarFallback>{session?.user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700">
                      <Upload className="h-4 w-4" />
                      <span>Alterar foto</span>
                    </div>
                  </Label>
                  <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG ou GIF. Máximo 5MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price_per_post">Preço por Post (R$)</Label>
                    <Input
                      id="price_per_post"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                      value={formData.price_per_post}
                      onChange={(e) => setFormData({ ...formData, price_per_post: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="niche">Nicho</Label>
                    <Select
                      value={formData.niche}
                      onValueChange={(value) => setFormData({ ...formData, niche: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu nicho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="fashion">Moda</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="food">Comida</SelectItem>
                        <SelectItem value="travel">Viagem</SelectItem>
                        <SelectItem value="tech">Tecnologia</SelectItem>
                        <SelectItem value="business">Negócios</SelectItem>
                        <SelectItem value="entertainment">Entretenimento</SelectItem>
                        <SelectItem value="education">Educação</SelectItem>
                        <SelectItem value="health">Saúde</SelectItem>
                        <SelectItem value="beauty">Beleza</SelectItem>
                        <SelectItem value="sports">Esportes</SelectItem>
                        <SelectItem value="music">Música</SelectItem>
                        <SelectItem value="art">Arte</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="followers_count">Número de Seguidores</Label>
                    <Input
                      id="followers_count"
                      type="number"
                      min="0"
                      placeholder="1000"
                      value={formData.followers_count}
                      onChange={(e) => setFormData({ ...formData, followers_count: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="average_views">Visualizações Médias por Status</Label>
                    <Input
                      id="average_views"
                      type="number"
                      min="0"
                      placeholder="500"
                      value={formData.average_views}
                      onChange={(e) => setFormData({ ...formData, average_views: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      placeholder="Conte um pouco sobre você e seu conteúdo..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
