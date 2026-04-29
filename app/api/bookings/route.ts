import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@example.com"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function GET() {
  const supabase = await createClient()

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }

  return NextResponse.json({ bookings: bookings || [] })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { clientName, clientEmail, clientPhone, procedureName, slotId, slotDisplay } = body

  if (!clientName || !clientEmail || !procedureName || !slotId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: slot, error: slotError } = await supabase
    .from("slots")
    .select("*")
    .eq("id", slotId)
    .eq("status", "available")
    .single()

  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot is no longer available" }, { status: 400 })
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      procedure_name: procedureName,
      slot_id: slotId,
      slot_display: slotDisplay,
      status: "pending",
      summary: `${procedureName} - ${slotDisplay}`
    })
    .select()
    .single()

  if (bookingError) {
    console.error("Error creating booking:", bookingError)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }

  await supabase
    .from("slots")
    .update({ status: "booked" })
    .eq("id", slotId)

  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      await fetch(process.env.GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          created_at: new Date().toLocaleString("pl-PL"),
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone || "—",
          procedure_name: procedureName,
          slot_display: slotDisplay,
          status: "Oczekuje"
        })
      })
    } catch (err) {
      console.error("Google Sheets sync error:", err)
    }
  }

  if (process.env.RESEND_API_KEY) {
    const ownerHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f5f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f2;padding:32px 16px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

              <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #f0f0f0;">
                <div style="width:32px;height:2px;background:#c9a84c;margin-bottom:16px;"></div>
                <p style="margin:0;font-size:20px;font-weight:400;color:#1a1a1a;">Nowa rezerwacja</p>
                <p style="margin:6px 0 0;font-size:14px;color:#999;">${clientName} — ${procedureName}</p>
              </td></tr>

              <tr><td style="padding:24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr>
                    <td width="50%" style="padding-right:8px;">
                      <div style="background:#fafafa;border-radius:8px;padding:14px;border-left:2px solid #c9a84c;">
                        <div style="font-size:11px;color:#999;letter-spacing:0.08em;margin-bottom:4px;">ZABIEG</div>
                        <div style="font-size:15px;color:#1a1a1a;">${procedureName}</div>
                      </div>
                    </td>
                    <td width="50%" style="padding-left:8px;">
                      <div style="background:#fafafa;border-radius:8px;padding:14px;border-left:2px solid #c9a84c;">
                        <div style="font-size:11px;color:#999;letter-spacing:0.08em;margin-bottom:4px;">TERMIN</div>
                        <div style="font-size:15px;color:#1a1a1a;">${slotDisplay}</div>
                      </div>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-top:1px solid #f5f5f5;padding-top:20px;">
                  <tr>
                    <td style="font-size:11px;color:#999;letter-spacing:0.08em;padding-bottom:12px;">DANE KLIENTKI</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#444;padding:4px 0;">${clientName}</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#444;padding:4px 0;">${clientEmail}</td>
                  </tr>
                  <tr>
                    <td style="font-size:14px;color:#444;padding:4px 0;">${clientPhone || "Telefon nie podany"}</td>
                  </tr>
                </table>

                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:12px;">
                      <a href="${APP_URL}/api/bookings/${booking.token}/accept"
                         style="display:inline-block;padding:12px 28px;border-radius:24px;text-decoration:none !important;font-weight:500;font-size:14px;background:#c9a84c;color:#3d2800 !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                        Potwierdź wizytę
                      </a>
                    </td>
                    <td>
                      <a href="${APP_URL}/api/bookings/${booking.token}/reject"
                         style="display:inline-block;padding:12px 28px;border-radius:24px;text-decoration:none !important;font-weight:500;font-size:14px;background:#ede8e0;color:#5c5040 !important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                        Odrzuć
                      </a>
                    </td>
                  </tr>
                </table>
              </td></tr>

              <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0;font-size:12px;color:#bbb;text-align:center;">
                Sofia Beauty Studio · <a href="${APP_URL}/admin" style="color:#c9a84c;text-decoration:none;">Panel admina</a>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `

    const clientPendingHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f5f5f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f2;padding:32px 16px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">

              <tr><td style="padding:32px 32px 24px;border-bottom:1px solid #f0f0f0;">
                <div style="width:32px;height:2px;background:#c9a84c;margin-bottom:16px;"></div>
                <p style="margin:0;font-size:20px;font-weight:400;color:#1a1a1a;">Rezerwacja przyjęta</p>
                <p style="margin:6px 0 0;font-size:14px;color:#999;">Cześć ${clientName}, czekamy na potwierdzenie</p>
              </td></tr>

              <tr><td style="padding:24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr>
                    <td width="50%" style="padding-right:8px;">
                      <div style="background:#fafafa;border-radius:8px;padding:14px;border-left:2px solid #c9a84c;">
                        <div style="font-size:11px;color:#999;letter-spacing:0.08em;margin-bottom:4px;">ZABIEG</div>
                        <div style="font-size:15px;color:#1a1a1a;">${procedureName}</div>
                      </div>
                    </td>
                    <td width="50%" style="padding-left:8px;">
                      <div style="background:#fafafa;border-radius:8px;padding:14px;border-left:2px solid #c9a84c;">
                        <div style="font-size:11px;color:#999;letter-spacing:0.08em;margin-bottom:4px;">TERMIN</div>
                        <div style="font-size:15px;color:#1a1a1a;">${slotDisplay}</div>
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="border-left:2px solid #c9a84c;padding-left:16px;margin-bottom:24px;">
                  <div style="font-size:12px;color:#c9a84c;letter-spacing:0.08em;margin-bottom:6px;">STATUS</div>
                  <div style="font-size:14px;color:#555;">Twoja rezerwacja dotarła do salonu. Poinformujemy Cię mailowo gdy zostanie potwierdzona.</div>
                </div>

                <p style="font-size:13px;color:#999;margin:0;">Masz pytania? Odpowiedz na tego maila lub zadzwoń do salonu.</p>
              </td></tr>

              <tr><td style="padding:16px 32px;border-top:1px solid #f0f0f0;font-size:12px;color:#bbb;text-align:center;">
                Sofia Beauty Studio · Dziękujemy za zaufanie
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `

    try {
      await Promise.all([
        resend.emails.send({
          from: "BeautyFlow <onboarding@resend.dev>",
          to: OWNER_EMAIL,
          subject: `Nowa rezerwacja: ${procedureName} — ${clientName}`,
          html: ownerHtml,
        }),
        resend.emails.send({
          from: "BeautyFlow <onboarding@resend.dev>",
          to: clientEmail,
          subject: `Rezerwacja przyjęta — ${procedureName}`,
          html: clientPendingHtml,
        }),
      ])
    } catch (emailError) {
      console.error("Error sending emails:", emailError)
    }
  }

  return NextResponse.json({ booking, success: true })
}
