import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const emailStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f0; color: #1c1c1a; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #d4a843 0%, #c49a3a 100%); padding: 28px 24px; text-align: center; }
  .header h1 { color: #1c1c1a; margin: 0; font-size: 24px; font-weight: 700; }
  .content { padding: 28px; }
  .detail { margin-bottom: 16px; border-bottom: 1px solid #ebebeb; padding-bottom: 16px; }
  .detail:last-of-type { border-bottom: none; }
  .detail-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .detail-value { font-size: 16px; font-weight: 500; color: #1c1c1a; }
  .badge-confirmed { display: inline-block; background: #dcfce7; color: #166534; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; }
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

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("token", token)

  if (updateError) {
    return NextResponse.redirect(`${APP_URL}?error=update-failed`)
  }

  if (process.env.RESEND_API_KEY && booking.client_email) {
    const confirmedHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailStyles}</style></head>
      <body>
        <div class="container">
          <div class="header"><h1>🎉 Wizyta potwierdzona!</h1></div>
          <div class="content">
            <p style="margin-top:0; color:#444;">Cześć <strong>${booking.client_name}</strong>! Twoja wizyta została potwierdzona. Do zobaczenia! 💛</p>
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
              <div class="detail-value"><span class="badge-confirmed">✅ Potwierdzona</span></div>
            </div>
            <p style="color:#888; font-size:14px; margin-bottom:0;">Masz pytania? Zadzwoń do salonu lub odpowiedz na tego maila.</p>
          </div>
          <div class="footer">BeautyFlow · Do zobaczenia! 💛</div>
        </div>
      </body></html>
    `

    try {
      await resend.emails.send({
        from: "BeautyFlow <onboarding@resend.dev>",
        to: booking.client_email,
        subject: `✅ Wizyta potwierdzona – ${booking.procedure_name} – ${booking.slot_display}`,
        html: confirmedHtml,
      })
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
    }
  }

  return NextResponse.redirect(`${APP_URL}?confirmed=true`)
}
