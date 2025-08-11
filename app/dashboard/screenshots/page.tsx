"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Camera, Upload, ArrowLeft, Eye, Trash2, Plus, X } from "lucide-react"
import Link from "next/link"

interface Screenshot {
  id: string
  image_url: string
  caption: string
  views_count: number
  upload_date: string
  is_primary: boolean
}

export default function ScreenshotsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    files: [] as File[],
    caption: "",
    views_count: "",
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }

    loadScreenshots()
  }, [session, status])

  const loadScreenshots = async () => {
    try {
      const response = await fetch("/api/screenshots")
      if (response.ok) {
        const data = await response.json()
        setScreenshots(data.screenshots)
      }
    } catch (error) {
      console.error("Error loading screenshots:", error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate files
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError("Cada imagem deve ter no máximo 5MB")
        return false
      }
      if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
        setError("Apenas imagens JPG, PNG, GIF ou WebP são aceitas")
        return false
      }
      return true
    })

    if (validFiles.length + screenshots.length > 10) {
      setError("Você pode ter no máximo 10 screenshots")
      return
    }

    setUploadForm({ ...uploadForm, files: validFiles })
    setError("")
  }

  const removeFile = (index: number) => {
    const newFiles = uploadForm.files.filter((_, i) => i !== index)
    setUploadForm({ ...uploadForm, files: newFiles })
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadForm.files.length === 0) {
      setError("Selecione pelo menos uma imagem")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Upload each file
      const uploadPromises = uploadForm.files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "screenshot")

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Erro ao fazer upload")
        }

        return uploadResponse.json()
      })

      const uploadResults = await Promise.all(uploadPromises)

      // Save screenshots to database
      const response = await fetch("/api/screenshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          screenshots: uploadResults.map((result) => ({
            image_url: result.url,
            caption: uploadForm.caption,
            views_count: Number.parseInt(uploadForm.views_count) || 0,
          })),
        }),
      })

      if (response.ok) {
        setSuccess("Screenshots adicionados com sucesso!")
        setUploadForm({ files: [], caption: "", views_count: "" })
        setUploadDialogOpen(false)
        loadScreenshots()
      } else {
        const data = await response.json()
        setError(data.error || "Erro ao salvar screenshots")
      }
    } catch (error) {
      setError("Erro ao fazer upload dos screenshots")
    } finally {
      setLoading(false)
    }
  }

  const deleteScreenshot = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este screenshot?")) return

    try {
      const response = await fetch(`/api/screenshots/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Screenshot excluído com sucesso!")
        loadScreenshots()
      } else {
        setError("Erro ao excluir screenshot")
      }
    } catch (error) {
      setError("Erro ao excluir screenshot")
    }
  }

  const setPrimary = async (id: string) => {
    try {
      const response = await fetch(`/api/screenshots/${id}/primary`, {
        method: "PUT",
      })

      if (response.ok) {
        setSuccess("Screenshot principal definido!")
        loadScreenshots()
      } else {
        setError("Erro ao definir screenshot principal")
      }
    } catch (error) {
      setError("Erro ao definir screenshot principal")
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Meus Screenshots</h1>
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Screenshots
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Screenshots</DialogTitle>
                  <DialogDescription>
                    Adicione screenshots do seu status do WhatsApp para mostrar seu alcance
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="files">Imagens (máx. 5MB cada)</Label>
                    <Input
                      id="files"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Selecione até {10 - screenshots.length} imagens</p>
                  </div>

                  {uploadForm.files.length > 0 && (
                    <div className="space-y-2">
                      <Label>Arquivos selecionados:</Label>
                      {uploadForm.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="caption">Legenda (opcional)</Label>
                    <Textarea
                      id="caption"
                      placeholder="Descreva o conteúdo dos screenshots..."
                      value={uploadForm.caption}
                      onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="views_count">Número de Visualizações</Label>
                    <Input
                      id="views_count"
                      type="number"
                      min="0"
                      placeholder="Ex: 1500"
                      value={uploadForm.views_count}
                      onChange={(e) => setUploadForm({ ...uploadForm, views_count: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Enviando..." : "Adicionar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {screenshots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screenshots.map((screenshot) => (
              <Card key={screenshot.id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={screenshot.image_url || "/placeholder.svg"}
                    alt={screenshot.caption || "Screenshot"}
                    className="w-full h-48 object-cover"
                  />
                  {screenshot.is_primary && <Badge className="absolute top-2 left-2">Principal</Badge>}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button size="sm" variant="secondary" onClick={() => deleteScreenshot(screenshot.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {screenshot.views_count.toLocaleString()} visualizações
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(screenshot.upload_date).toLocaleDateString()}
                    </span>
                  </div>
                  {screenshot.caption && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{screenshot.caption}</p>
                  )}
                  {!screenshot.is_primary && (
                    <Button size="sm" variant="outline" onClick={() => setPrimary(screenshot.id)} className="w-full">
                      Definir como Principal
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum screenshot adicionado</h3>
              <p className="text-gray-600 mb-6">
                Adicione screenshots do seu status do WhatsApp para mostrar seu alcance para as empresas
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Adicionar Primeiro Screenshot
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
