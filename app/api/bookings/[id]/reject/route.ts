import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1c1c1a; color: #f5f5f4; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #262624; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
  .content { padding: 28px; }
  .detail { margin-bottom: 16px; border-bottom: 1px solid #333330; padding-bottom: 16px; }
  .detail:last-of-type { border-bottom: none; }
  .detail-label { color: #a8a8a6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .detail-value { font-size: 16px; font-weight: 500; color: #f5f5f4; }
  .badge { display: inline-block; background: #ef4444; color: white; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; }
  .btn { display: inline-block; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; background: #d4a843; color: #1c1c1a; font-size: 15px; }
  .footer { padding: 16px 28px; background: #1c1c1a; text-align: center; font-size: 12px; color: #666; }
`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Pobierz rezerwację
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !booking) {
    return new NextResponse(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#1c1c1a;color:#f5f5f4">
        <h2>❌ Nie znaleziono rezerwacji</h2>
        <p style="color:#a8a8a6">Link może być nieaktualny.</p>
        <a href="${APP_URL}/admin" style="color:#d4a843">Przejdź do panelu</a>
      </body></html>
    `, { status: 404, headers: { "Content-Type": "text/html" } })
  }

  if (booking.status !== "pending") {
    return new NextResponse(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#1c1c1a;color:#f5f5f4">
        <h2>ℹ️ Rezerwacja już obsłużona</h2>
        <p style="color:#a8a8a6">Status: <strong>${booking.status === "confirmed" ? "potwierdzona ✅" : "odrzucona ❌"}</strong></p>
        <a href="${APP_URL}/admin" style="color:#d4a843">Przejdź do panelu</a>
      </body></html>
    `, { status: 200, headers: { "Content-Type": "text/html" } })
  }

  // Zaktualizuj status + zwolnij slot
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("id", id)

  if (updateError) {
    console.error("Error updating booking:", updateError)
    return new NextResponse("Błąd serwera", { status: 500 })
  }

  // Zwolnij slot żeby ktoś inny mógł zarezerwować
  if (booking.slot_id) {
    await supabase
      .from("slots")
      .update({ status: "available" })
      .eq("id", booking.slot_id)
  }

  // Wyślij mail do klientki o odrzuceniu
  if (process.env.RESEND_API_KEY && booking.client_email) {
    const rejectHtml = `
      <!DOCTYPE html><html><head><style>${emailStyles}</style></head>
      <body>
        <div class="container">
          <div class="header"><h1>Informacja o rezerwacji</h1></div>
          <div class="content">
            <p style="margin-top:0; color:#d4c9b0;">
              Cześć <strong>${booking.client_name}</strong>,<br/>
              Niestety wybrany termin nie jest dostępny. Zapraszamy do wybrania innego terminu!
            </p>
            <div class="detail">
              <div class="detail-label">Zabieg</div>
              <div class="detail-value">${booking.procedure_name}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Wybrany termin</div>
              <div class="detail-value">${booking.slot_display}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Status</div>
              <div class="detail-value"><span class="badge">❌ Niedostępny termin</span></div>
            </div>
            <div style="text-align:center; margin-top: 24px;">
              <a href="${APP_URL}" class="btn">Zarezerwuj inny termin</a>
            </div>
          </div>
          <div class="footer">BeautyFlow · Przepraszamy za niedogodności 💛</div>
        </div>
      </body></html>
    `

    try {
      await resend.emails.send({
        from: "BeautyFlow <onboarding@resend.dev>",
        to: booking.client_email,
        subject: `Informacja o rezerwacji – ${booking.procedure_name}`,
        html: rejectHtml,
      })
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError)
    }
  }

  // Przekieruj właścicielkę do panelu
  return NextResponse.redirect(`${APP_URL}/admin?booking_rejected=${id}`)
}
