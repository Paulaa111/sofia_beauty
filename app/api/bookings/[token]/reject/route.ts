import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f2ec; color: #1c1c1a; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #d4a843 0%, #c49a3a 100%); padding: 28px 24px; text-align: center; }
  .header h1 { color: #1c1c1a; margin: 0; font-size: 24px; font-weight: 700; }
  .content { padding: 28px; }
  .detail { margin-bottom: 16px; border-bottom: 1px solid #ebebeb; padding-bottom: 16px; }
  .detail:last-of-type { border-bottom: none; }
  .detail-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .detail-value { font-size: 16px; font-weight: 500; color: #1c1c1a; }
  .badge-rejected { display: inline-block; background: #f5ede0; color: #7a5c3a; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; }
  .footer { padding: 16px 28px; background: #fafaf8; border-top: 1px solid #ebebeb; text-align: center; font-size: 12px; color: #999; }
`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("token", token)
    .single()

  if (error || !booking) {
    return NextResponse.redirect(`${APP_URL}?error=not-found`)
  }

  if (booking.status !== "pending") {
    return NextResponse.redirect(`${APP_URL}?error=already-processed`)
  }

  await supabase
    .from("bookings")
    .update({ status: "rejected" })
    .eq("token", token)

  await supabase
    .from("slots")
    .update({ status: "available" })
    .eq("id", booking.slot_id)

  if (process.env.RESEND_API_KEY && booking.client_email) {
    const rejectedHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailStyles}</style></head>
      <body>
        <div class="container">
          <div class="header"><h1>😔 Termin niedostępny</h1></div>
          <div class="content">
            <p style="margin-top:0; color:#444;">Cześć <strong>${booking.client_name}</strong>! Niestety wybrany termin nie jest już dostępny. Zapraszamy do ponownej rezerwacji.</p>
            <div class="detail">
              <div class="detail-label">Zabieg</div>
              <div class="detail-value">${booking.procedure_name}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Termin</div>
              <div class="detail-value">${booking.slot_display}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Status</div>
              <div class="detail-value"><span class="badge-rejected">Niedostępny</span></div>
            </div>
            <p style="margin-bottom:0;">
              <a href="${APP_URL}" style="display:inline-block; background:#d4a843; color:#1c1c1a; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">Zarezerwuj inny termin →</a>
            </p>
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
        html: rejectedHtml,
      })
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError)
    }
  }

  return NextResponse.redirect(`${APP_URL}?rejected=true`)
}
