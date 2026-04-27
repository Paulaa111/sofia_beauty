import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()
  
  // Find and update booking
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
  
  // Send confirmation email to client
  if (process.env.RESEND_API_KEY && booking.client_email) {
    try {
      await resend.emails.send({
        from: "BeautyFlow <onboarding@resend.dev>",
        to: booking.client_email,
        subject: `Rezerwacja potwierdzona: ${booking.procedure_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1c1c1a; color: #f5f5f4; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: #262624; border-radius: 12px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 24px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { padding: 24px; }
              .detail { margin-bottom: 16px; }
              .detail-label { color: #a8a8a6; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
              .detail-value { font-size: 16px; font-weight: 500; }
              .note { background: #1c1c1a; padding: 16px; border-radius: 8px; margin-top: 24px; font-size: 14px; color: #a8a8a6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Rezerwacja Potwierdzona!</h1>
              </div>
              <div class="content">
                <p>Drogi/a ${booking.client_name},</p>
                <p>Twoja rezerwacja została potwierdzona. Do zobaczenia!</p>
                <div class="detail">
                  <div class="detail-label">Zabieg</div>
                  <div class="detail-value">${booking.procedure_name}</div>
                </div>
                <div class="detail">
                  <div class="detail-label">Termin</div>
                  <div class="detail-value">${booking.slot_display}</div>
                </div>
                <div class="note">
                  W razie pytań lub konieczności zmiany terminu, prosimy o kontakt telefoniczny.
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError)
    }
  }
  
  return new NextResponse(renderResultPage(true, "Rezerwacja została zaakceptowana. Klient otrzymał powiadomienie email."), {
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
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          background: #1c1c1a; 
          color: #f5f5f4; 
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 400px;
        }
        .icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: ${color}20;
          color: ${color};
          font-size: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 12px;
        }
        p {
          color: #a8a8a6;
          line-height: 1.6;
        }
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
