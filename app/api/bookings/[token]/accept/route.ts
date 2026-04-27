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
    .update({ status: "confirmed" })
    .eq("token", token)
    .eq("status", "pending")
    .select()
    .single()

  if (error || !booking) {
    return new NextResponse(renderResultPage(false, "Nie znaleziono rezerwacji lub została już przetworzona."), {
      headers: { "Content-Type": "text/html" }
    })
  }

  if (process.env.RESEND_API_KEY && booking.client_email) {
    try {
      await resend.emails.send({
        from: "BeautyFlow <onboarding@resend.dev>",
        to: booking.client_email,
        subject: `✅ Wizyta potwierdzona – ${booking.procedure_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:32px 16px;">
              <tr><td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
                  
                  <!-- HEADER -->
                  <tr><td style="background:#22c55e;padding:32px 24px;text-align:center;">
                    <p style="margin:0;font-size:32px;">✅</p>
                    <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">Wizyta potwierdzona!</h1>
                  </td></tr>

                  <!-- BODY -->
                  <tr><td style="padding:32px 32px 8px;">
                    <p style="margin:0 0 24px;font-size:16px;color:#333333;">
                      Cześć <strong>${booking.client_name}</strong>! 🎉<br/>
                      Twoja wizyta została <strong>potwierdzona</strong>. Czekamy na Ciebie!
                    </p>

                    <!-- Zabieg -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-bottom:1px solid #f0f0f0;padding-bottom:16px;">
                      <tr>
                        <td style="font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:6px;">Zabieg</td>
                      </tr>
                      <tr>
                        <td style="font-size:18px;font-weight:600;color:#111111;">${booking.procedure_name}</td>
                      </tr>
                    </table>

                    <!-- Termin -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-bottom:1px solid #f0f0f0;padding-bottom:16px;">
                      <tr>
                        <td style="font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:6px;">Termin</td>
                      </tr>
                      <tr>
                        <td style="font-size:18px;font-weight:600;color:#111111;">${booking.slot_display}</td>
                      </tr>
                    </table>

                    <!-- Status -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="font-size:11px;color:#999999;text-transform:uppercase;letter-spacing:0.08em;padding-bottom:6px;">Status</td>
                      </tr>
                      <tr>
                        <td>
                          <span style="display:inline-block;background:#dcfce7;color:#166534;border-radius:20px;padding:6px 16px;font-size:14px;font-weight:600;">✅ Potwierdzona</span>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size:14px;color:#666666;margin:0 0 32px;">
                      Jeśli musisz odwołać wizytę, skontaktuj się z salonem jak najwcześniej. Dziękujemy! 💛
                    </p>
                  </td></tr>

                  <!-- FOOTER -->
                  <tr><td style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #f0f0f0;">
                    <p style="margin:0;font-size:12px;color:#999999;">BeautyFlow · Dziękujemy za zaufanie 💛</p>
                  </td></tr>

                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
    }
  }

  return new NextResponse(renderResultPage(true, "Rezerwacja została zaakceptowana. Klientka otrzymała powiadomienie email."), {
    headers: { "Content-Type": "text/html" }
  })
}

function renderResultPage(success: boolean, message: string) {
  const color = success ? "#22c55e" : "#ef4444"
  const icon = success ? "✓" : "✗"
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>BeautyFlow - ${success ? "Zaakceptowano" : "Błąd"}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1c1c1a; color: #f5f5f4; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { text-align: center; max-width: 400px; }
        .icon { width: 80px; height: 80px; border-radius: 50%; background: ${color}20; color: ${color}; font-size: 40px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        h1 { font-size: 24px; margin-bottom: 12px; }
        p { color: #a8a8a6; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${icon}</div>
        <h1>${success ? "Sukces!" : "Wystąpił błąd"}</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `
}
