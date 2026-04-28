import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const OWNER_EMAIL = process.env.OWNER_EMAIL || "owner@example.com"
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
  .buttons { display: flex; gap: 12px; margin-top: 28px; }
  .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; flex: 1; font-size: 15px; }
  .btn-accept { background: #d4a843; color: #1c1c1a; }
  .btn-reject { background: #7a5c3a; color: #ffffff; }
  .badge { display: inline-block; background: #fef3c7; color: #7a5c3a; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; }
  .footer { padding: 16px 28px; background: #fafaf8; border-top: 1px solid #ebebeb; text-align: center; font-size: 12px; color: #999; }
`

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

  if (process.env.RESEND_API_KEY) {
    const ownerHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailStyles}</style></head>
      <body>
        <div class="container">
          <div class="header"><h1>🗓 Nowa Rezerwacja</h1></div>
          <div class="content">
            <div class="detail">
              <div class="detail-label">Klientka</div>
              <div class="detail-value">${clientName}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Email</div>
              <div class="detail-value">${clientEmail}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Telefon</div>
              <div class="detail-value">${clientPhone || "Nie podano"}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Zabieg</div>
              <div class="detail-value">${procedureName}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Termin</div>
              <div class="detail-value">${slotDisplay}</div>
            </div>
            <div class="buttons">
              <a href="${APP_URL}/api/bookings/${booking.token}/accept" class="btn btn-accept">Potwierdź wizytę</a>
              <a href="${APP_URL}/api/bookings/${booking.token}/reject" class="btn btn-reject">Odrzuć</a>
            </div>
          </div>
          <div class="footer">BeautyFlow · Panel admina: <a href="${APP_URL}/admin" style="color:#d4a843">${APP_URL}/admin</a></div>
        </div>
      </body></html>
    `

    const clientPendingHtml = `
      <!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailStyles}</style></head>
      <body>
        <div class="container">
          <div class="header"><h1>✨ Rezerwacja przyjęta!</h1></div>
          <div class="content">
            <p style="margin-top:0; color:#444;">Cześć <strong>${clientName}</strong>! Twoja prośba o rezerwację dotarła do salonu. Poinformujemy Cię mailowo, gdy zostanie potwierdzona.</p>
            <div class="detail">
              <div class="detail-label">Zabieg</div>
              <div class="detail-value">${procedureName}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Termin</div>
              <div class="detail-value">${slotDisplay}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Status</div>
              <div class="detail-value"><span class="badge">⏳ Oczekuje na potwierdzenie</span></div>
            </div>
            <p style="color:#888; font-size:14px; margin-bottom:0;">Masz pytania? Odpowiedz na tego maila lub zadzwoń do salonu.</p>
          </div>
          <div class="footer">BeautyFlow · Dziękujemy za zaufanie 💛</div>
        </div>
      </body></html>
    `

    try {
      await Promise.all([
        resend.emails.send({
          from: "BeautyFlow <onboarding@resend.dev>",
          to: OWNER_EMAIL,
          subject: `🗓 Nowa rezerwacja: ${procedureName} – ${clientName}`,
          html: ownerHtml,
        }),
        resend.emails.send({
          from: "BeautyFlow <onboarding@resend.dev>",
          to: clientEmail,
          subject: `Twoja rezerwacja została przyjęta – ${procedureName}`,
          html: clientPendingHtml,
        }),
      ])
    } catch (emailError) {
      console.error("Error sending emails:", emailError)
    }
  }

  return NextResponse.json({ booking, success: true })
}
