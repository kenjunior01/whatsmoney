import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sql } from "@/lib/db"
import { capturePayPalOrder } from "@/lib/paypal"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paypal_order_id, transaction_id } = await request.json()

    if (!paypal_order_id || !transaction_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get transaction details
    const transaction = await sql`
      SELECT * FROM transactions 
      WHERE id = ${transaction_id} AND paypal_order_id = ${paypal_order_id} AND status = 'pending'
    `

    if (transaction.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Capture PayPal payment
    const captureResult = await capturePayPalOrder(paypal_order_id)

    if (captureResult.result.status === "COMPLETED") {
      // Update transaction status
      await sql`
        UPDATE transactions 
        SET status = 'completed', updated_at = NOW()
        WHERE id = ${transaction_id}
      `

      // Update campaign proposal status
      await sql`
        UPDATE campaign_proposals 
        SET status = 'completed', updated_at = NOW()
        WHERE id = ${transaction[0].campaign_proposal_id}
      `

      // Add points to host (gamification)
      const pointsToAdd = Math.floor(Number(transaction[0].amount) / 10) // 1 point per R$10
      await sql`
        INSERT INTO point_transactions (user_id, points, transaction_type, description)
        VALUES (${transaction[0].recipient_id}, ${pointsToAdd}, 'payment_received', 'Pontos por pagamento recebido')
      `

      await sql`
        UPDATE user_points 
        SET points = points + ${pointsToAdd}, total_earned = total_earned + ${pointsToAdd}
        WHERE user_id = ${transaction[0].recipient_id}
      `

      return NextResponse.json({
        success: true,
        transaction_id: transaction_id,
        status: "completed",
        capture_id: captureResult.result.purchase_units[0].payments.captures[0].id,
      })
    } else {
      // Payment failed
      await sql`
        UPDATE transactions 
        SET status = 'failed', updated_at = NOW()
        WHERE id = ${transaction_id}
      `

      return NextResponse.json({ error: "Payment capture failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error capturing payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
