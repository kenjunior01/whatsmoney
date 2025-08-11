import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // PayPal webhook verification would go here
    // For now, we'll process the webhook data directly

    const { event_type, resource } = body

    if (event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const orderId = resource.supplementary_data?.related_ids?.order_id

      if (orderId) {
        // Find transaction by PayPal order ID
        const transaction = await sql`
          SELECT * FROM transactions 
          WHERE paypal_order_id = ${orderId} AND status = 'pending'
        `

        if (transaction.length > 0) {
          // Update transaction status
          await sql`
            UPDATE transactions 
            SET status = 'completed', updated_at = NOW()
            WHERE id = ${transaction[0].id}
          `

          // Update campaign proposal status
          await sql`
            UPDATE campaign_proposals 
            SET status = 'completed', updated_at = NOW()
            WHERE id = ${transaction[0].campaign_proposal_id}
          `

          console.log(`Payment completed for transaction ${transaction[0].id}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
