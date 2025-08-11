"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"

export default function PaymentCancelPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <CardTitle className="text-orange-800">Pagamento Cancelado</CardTitle>
            <CardDescription>Você cancelou o processo de pagamento.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
              </p>
            </div>

            <div className="flex flex-col space-y-2">
              <Button onClick={() => router.push("/dashboard")}>Voltar ao Dashboard</Button>
              <Button variant="outline" onClick={() => router.back()}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
