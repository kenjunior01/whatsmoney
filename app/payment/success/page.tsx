"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [transactionId, setTransactionId] = useState<string | null>(null)

  const paypalOrderId = searchParams.get("token")
  const transactionIdParam = searchParams.get("transaction_id")

  useEffect(() => {
    if (paypalOrderId && transactionIdParam) {
      capturePayment()
    }
  }, [paypalOrderId, transactionIdParam])

  const capturePayment = async () => {
    try {
      const response = await fetch("/api/payment/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypal_order_id: paypalOrderId,
          transaction_id: transactionIdParam,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setStatus("success")
        setTransactionId(data.transaction_id)
        toast.success("Pagamento processado com sucesso!")
      } else {
        setStatus("error")
        toast.error("Erro ao processar pagamento")
      }
    } catch (error) {
      console.error("Error capturing payment:", error)
      setStatus("error")
      toast.error("Erro ao processar pagamento")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            {status === "processing" && (
              <>
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <CardTitle>Processando Pagamento</CardTitle>
                <CardDescription>Aguarde enquanto confirmamos seu pagamento...</CardDescription>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-green-800">Pagamento Confirmado!</CardTitle>
                <CardDescription>Seu pagamento foi processado com sucesso.</CardDescription>
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle className="text-red-800">Erro no Pagamento</CardTitle>
                <CardDescription>Houve um problema ao processar seu pagamento.</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "success" && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  A campanha foi confirmada e o anfitrião foi notificado. Você pode acompanhar o progresso no seu
                  dashboard.
                </p>
                {transactionId && <p className="text-xs text-green-600 mt-2">ID da transação: {transactionId}</p>}
              </div>
            )}

            <div className="flex flex-col space-y-2">
              <Button onClick={() => router.push("/dashboard")}>Ir para Dashboard</Button>
              {status === "error" && (
                <Button variant="outline" onClick={() => router.back()}>
                  Tentar Novamente
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
