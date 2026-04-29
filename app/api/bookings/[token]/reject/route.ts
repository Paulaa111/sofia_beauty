import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

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

  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          created_at: new Date(booking.created_at).toLocaleString("pl-PL"),
          client_name: booking.client_name,
          client_email: booking.client_email,
          client_phone: booking.client_phone || "—",
          procedure_name: booking.procedure_name,
          slot_display: booking.slot_display,
          status: "Odrzucona"
        })
      })
    } catch (err) {
      console.error("Google Sheets sync error:", err)
    }
  }

  if (process.env.RESEND_API_KEY && booking.client_email) {
    try {
      await resend.emails.send({
        from: "BeautyFlow <onboarding@resend.dev>",
        to: booking.client_email,
        subject: `Informacja o rezerwacji — ${booking.procedure_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f5f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f2;padding:32px 16px;">
              <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

                  <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #f0f0f0;">
                    <div style="width:32px;height:2px;background:#c9a84c;margin-bottom:16px;"></div>
                    <p style="margin:0;font-size:20px;font-weight:400;color:#1a1a1a;">Termin niedostępny</p>
                    <p style="margin:6px 0 0;font-size:14px;color:#999;">Cześć ${booking.client_name}, niestety mamy złe wieści</p>
                  </td></tr>

                  <tr><td style="padding:24px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td width="50%" style="padding-right:8px;">
                          <div style="background:#fafafa;border-radius:8px;padding:14px;border-left:2px solid #ddd;">
                            <div style="font-size:11px;color:#999;letter-spacing:0.08em;margin-bottom:4px;">ZABIEG</div>
                            <div style="font-size:15px;color:#1a1a1a;">${booking.procedure_name}</div>
                          </div>
                        </td>
                        <td width="50%" style="padding-left:8px;">
                          <div style="background:#fafafa;border-radius:8px;padding:14px;border-left:2px solid #ddd;">
                            <div style="font-size:11px;color:#999;letter-spacing:0.08em;margin-bottom:4px;">TERMIN</div>
                            <div style="font-size:15px;color:#1a1a1a;">${booking.slot_display}</div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="border-left:2px solid #c9a84c;padding-left:16px;margin-bottom:24px;">
                      <div style="font-size:14px;color:#555;line-height:1.7;">Niestety wybrany termin nie jest już dostępny. Zapraszamy do ponownej rezerwacji — chętnie znajdziemy dla Ciebie inny termin.</div>
                    </div>

                    <a href="${APP_URL}"
                       style="display:inline-block;padding:12px 28px;border-radius:24px;text-decoration:none !important;font-weight:500;font-size:14px;background:#c9a84c;color:#3d2800 !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                      Zarezerwuj inny termin
                    </a>
                  </td></tr>

                  <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0;font-size:12px;color:#bbb;text-align:center;">
                    Sofia Beauty Studio · Przepraszamy za niedogodności
                  </td></tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError)
    }
  }

  return NextResponse.redirect(`${APP_URL}?rejected=true`)
}
