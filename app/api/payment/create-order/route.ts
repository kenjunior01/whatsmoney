import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { createPayPalOrder, convertCurrency, calculateCommission } from "@/lib/paypal"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { campaign_proposal_id, payment_method = "paypal", currency = "USD" } = await request.json()

    if (!campaign_proposal_id) {
      return NextResponse.json({ error: "Missing campaign_proposal_id" }, { status: 400 })
    }

    // Get campaign proposal details
    const proposal = await sql`
      SELECT 
        cp.*,
        c.company_id,
        c.title as campaign_title,
        u_host.name as host_name,
        u_company.name as company_name
      FROM campaign_proposals cp
      JOIN campaigns c ON c.id = cp.campaign_id
      JOIN users u_host ON u_host.id = cp.host_id
      JOIN users u_company ON u_company.id = c.company_id
      WHERE cp.id = ${campaign_proposal_id} AND cp.status = 'accepted'
    `

    if (proposal.length === 0) {
      return NextResponse.json({ error: "Campaign proposal not found or not accepted" }, { status: 404 })
    }

    const proposalData = proposal[0]

    // Verify user is the company owner
    if (session.user.id !== proposalData.company_id) {
      return NextResponse.json({ error: "Unauthorized - not campaign owner" }, { status: 403 })
    }

    const amount = Number(proposalData.proposed_price)
    const commissionRate = 5.0 // 5% commission
    const commissionAmount = calculateCommission(amount, commissionRate)

    // Convert currency if needed
    const convertedAmount = await convertCurrency(amount, "BRL", currency)

    // Create transaction record
    const transaction = await sql`
      INSERT INTO transactions (
        campaign_proposal_id,
        payer_id,
        recipient_id,
        amount,
        currency,
        payment_method,
        commission_rate,
        commission_amount,
        status
      ) VALUES (
        ${campaign_proposal_id},
        ${proposalData.company_id},
        ${proposalData.host_id},
        ${amount},
        ${currency},
        ${payment_method},
        ${commissionRate},
        ${commissionAmount},
        'pending'
      )
      RETURNING *
    `

    if (payment_method === "paypal") {
      // Create PayPal order
      const paypalOrder = await createPayPalOrder(convertedAmount, currency)

      // Update transaction with PayPal order ID
      await sql`
        UPDATE transactions 
        SET paypal_order_id = ${paypalOrder.result.id}
        WHERE id = ${transaction[0].id}
      `

      return NextResponse.json({
        transaction_id: transaction[0].id,
        paypal_order_id: paypalOrder.result.id,
        amount: convertedAmount,
        currency,
        approval_url: paypalOrder.result.links.find((link: any) => link.rel === "approve")?.href,
      })
    } else {
      // For offline payments (bank transfer, etc.)
      return NextResponse.json({
        transaction_id: transaction[0].id,
        amount,
        currency: "BRL",
        payment_method: "offline",
        instructions: "Aguarde instruções de pagamento por email",
      })
    }
  } catch (error) {
    console.error("Error creating payment order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
