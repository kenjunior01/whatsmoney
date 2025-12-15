"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CheckCircle2, XCircle, Loader2, Database, Shield, Zap } from "lucide-react"

export default function TestPage() {
  const [tests, setTests] = useState<
    Array<{
      name: string
      status: "pending" | "running" | "success" | "error"
      message: string
    }>
  >([
    { name: "Conexão Supabase", status: "pending", message: "" },
    { name: "Autenticação", status: "pending", message: "" },
    { name: "Banco de Dados", status: "pending", message: "" },
    { name: "API Routes", status: "pending", message: "" },
  ])

  const updateTest = (index: number, status: "running" | "success" | "error", message: string) => {
    setTests((prev) => prev.map((test, i) => (i === index ? { ...test, status, message } : test)))
  }

  const runTests = async () => {
    // Test 1: Supabase Connection
    updateTest(0, "running", "Verificando conexão...")
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase.from("users").select("count").limit(1)

        if (error) throw error
        updateTest(0, "success", `Conectado: ${supabaseUrl}`)
      } else {
        updateTest(0, "error", "Variáveis de ambiente não configuradas")
      }
    } catch (error: any) {
      updateTest(0, "error", error.message)
    }

    // Test 2: Authentication
    updateTest(1, "running", "Testando autenticação...")
    try {
      const supabase = createClientComponentClient()
      const { data: session } = await supabase.auth.getSession()

      if (session.session) {
        updateTest(1, "success", `Usuário logado: ${session.session.user.email}`)
      } else {
        updateTest(1, "success", "Nenhum usuário logado (esperado)")
      }
    } catch (error: any) {
      updateTest(1, "error", error.message)
    }

    // Test 3: Database Tables
    updateTest(2, "running", "Verificando tabelas...")
    try {
      const supabase = createClientComponentClient()
      const tables = ["users", "host_profiles", "company_profiles", "campaigns", "screenshots", "messages"]

      const results = await Promise.all(tables.map((table) => supabase.from(table).select("count").limit(1)))

      const allSuccess = results.every((r) => !r.error)
      if (allSuccess) {
        updateTest(2, "success", `${tables.length} tabelas verificadas`)
      } else {
        updateTest(2, "error", "Algumas tabelas não encontradas")
      }
    } catch (error: any) {
      updateTest(2, "error", error.message)
    }

    // Test 4: API Routes
    updateTest(3, "running", "Testando rotas de API...")
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "testpassword123",
          role: "user",
        }),
      })

      if (response.ok || response.status === 400) {
        updateTest(3, "success", "API routes funcionando")
      } else {
        updateTest(3, "error", `Status ${response.status}`)
      }
    } catch (error: any) {
      updateTest(3, "error", error.message)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      case "running":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Executando</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>
    }
  }

  const allSuccess = tests.every((t) => t.status === "success")
  const hasErrors = tests.some((t) => t.status === "error")

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">WhatsMoney - Testes do Sistema</h1>
          <p className="text-gray-600">Verificação automática de conectividade e funcionalidades</p>
        </div>

        {allSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Todos os testes passaram com sucesso! O sistema está funcionando corretamente.
            </AlertDescription>
          </Alert>
        )}

        {hasErrors && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              Alguns testes falharam. Configure as variáveis de ambiente do Supabase para funcionalidade completa.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                  </div>
                  {getStatusBadge(test.status)}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{test.message || "Aguardando execução..."}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>Configurações e status da aplicação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Supabase URL</p>
                  <p className="text-sm text-gray-600">{process.env.NEXT_PUBLIC_SUPABASE_URL || "Não configurado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Supabase Key</p>
                  <p className="text-sm text-gray-600">
                    {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Configurado ✓" : "Não configurado"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Modo de Operação</p>
                  <p className="text-sm text-gray-600">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Online (Supabase)" : "Offline (Mock Data)"}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={runTests} className="w-full">
              Executar Testes Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
