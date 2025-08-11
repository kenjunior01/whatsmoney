"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface PaymentData {
  transaction_id: string
  paypal_order_id?: string
  amount: number
  currency: string
  payment_method: string
  approval_url?: string
  instructions?: string
}

export default function PaymentPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const proposalId = searchParams.get("proposal")
  const paymentMethod = searchParams.get("method") || "paypal"
  const currency = searchParams.get("currency") || "USD"

  useEffect(() => {
    if (proposalId && session?.user) {
      createPaymentOrder()
    }
  }, [proposalId, session])

  const createPaymentOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_proposal_id: proposalId,
          payment_method: paymentMethod,
          currency: currency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentData(data)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar pedido de pagamento")
        router.back()
      }
    } catch (error) {
      console.error("Error creating payment order:", error)
      toast.error("Erro ao processar pagamento")
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handlePayPalPayment = () => {
    if (paymentData?.approval_url) {
      window.location.href = paymentData.approval_url
    }
  }

  const handleOfflinePayment = async () => {
    setProcessing(true)
    try {
      // For offline payments, we just mark as pending and show instructions
      toast.success("Pedido de pagamento criado! Aguarde instruções por email.")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Erro ao processar pagamento offline")
    } finally {
      setProcessing(false)
    }
  }

  if (!session) {
    return <div>Carregando...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Preparando pagamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Pagamento</h1>
            <Button variant="outline" onClick={() => router.back()}>
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {paymentData ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Finalizar Pagamento</span>
              </CardTitle>
              <CardDescription>Complete o pagamento para confirmar a campanha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Valor da campanha</span>
                  <span className="font-medium">
                    {paymentData.currency} {paymentData.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Taxa da plataforma (5%)</span>
                  <span className="font-medium">
                    {paymentData.currency} {(paymentData.amount * 0.05).toFixed(2)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-lg font-bold text-green-600">
                    {paymentData.currency} {paymentData.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-medium mb-3">Método de Pagamento</h3>
                <div className="space-y-3">
                  {paymentData.payment_method === "paypal" ? (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">PayPal</span>
                          </div>
                          <div>
                            <p className="font-medium">PayPal</p>
                            <p className="text-sm text-gray-600">Pagamento seguro via PayPal</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Recomendado</Badge>
                      </div>
                      <Button
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={handlePayPalPayment}
                        disabled={!paymentData.approval_url}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pagar com PayPal
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Pagamento Offline</p>
                          <p className="text-sm text-gray-600">Transferência bancária ou PIX</p>
                        </div>
                      </div>
                      {paymentData.instructions && (
                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 mb-3">
                          {paymentData.instructions}
                        </div>
                      )}
                      <Button className="w-full" onClick={handleOfflinePayment} disabled={processing}>
                        {processing ? (
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirmar Pedido
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">Pagamento Seguro</p>
                    <p className="text-green-700">
                      Seus dados estão protegidos e o pagamento só será processado após confirmação.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro no Pagamento</h2>
            <p className="text-gray-600 mb-4">Não foi possível processar o pagamento.</p>
            <Button onClick={() => router.back()}>Voltar</Button>
          </div>
        )}
      </div>
    </div>
  )
}
