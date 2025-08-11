import paypal from "@paypal/checkout-server-sdk"

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!

  if (process.env.NODE_ENV === "production") {
    return new paypal.core.LiveEnvironment(clientId, clientSecret)
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret)
  }
}

// PayPal client
export function paypalClient() {
  return new paypal.core.PayPalHttpClient(environment())
}

// Currency conversion rates (mock - replace with real API)
export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount

  // Mock conversion rates - replace with real API call using EXCHANGE_API_KEY
  const rates: Record<string, Record<string, number>> = {
    BRL: { USD: 0.2, EUR: 0.18 },
    USD: { BRL: 5.0, EUR: 0.9 },
    EUR: { BRL: 5.5, USD: 1.11 },
  }

  const rate = rates[from]?.[to] || 1
  return Math.round(amount * rate * 100) / 100
}

// Calculate commission
export function calculateCommission(amount: number, rate = 5.0): number {
  return Math.round(amount * (rate / 100) * 100) / 100
}

// PayPal order creation
export async function createPayPalOrder(amount: number, currency = "USD") {
  const request = new paypal.orders.OrdersCreateRequest()

  request.prefer("return=representation")
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      },
    ],
    application_context: {
      return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`,
      brand_name: "WhatsMoney",
      locale: "pt-BR",
      landing_page: "BILLING",
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
    },
  })

  const client = paypalClient()
  const response = await client.execute(request)
  return response
}

// PayPal order capture
export async function capturePayPalOrder(orderId: string) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId)
  request.requestBody({})

  const client = paypalClient()
  const response = await client.execute(request)
  return response
}
