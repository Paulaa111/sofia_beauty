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
  
  // Validation
  if (!clientName || !clientEmail || !procedureName || !slotId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  // Check if slot is still available
  const { data: slot, error: slotError } = await supabase
    .from("slots")
    .select("*")
    .eq("id", slotId)
    .eq("status", "available")
    .single()
  
  if (slotError || !slot) {
    return NextResponse.json({ error: "Slot is no longer available" }, { status: 400 })
  }
  
  // Create booking
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
  
  // Mark slot as booked
  await supabase
    .from("slots")
    .update({ status: "booked" })
    .eq("id", slotId)
  
  // Send email to owner with accept/reject buttons
  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "BeautyFlow <onboarding@resend.dev>",
        to: OWNER_EMAIL,
        subject: `Nowa rezerwacja: ${procedureName} - ${clientName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1c1c1a; color: #f5f5f4; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: #262624; border-radius: 12px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #d4a843 0%, #c49a3a 100%); padding: 24px; text-align: center; }
              .header h1 { color: #1c1c1a; margin: 0; font-size: 24px; }
              .content { padding: 24px; }
              .detail { margin-bottom: 16px; }
              .detail-label { color: #a8a8a6; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
              .detail-value { font-size: 16px; font-weight: 500; }
              .buttons { display: flex; gap: 12px; margin-top: 24px; }
              .btn { display: inline-block; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; flex: 1; }
              .btn-accept { background: #22c55e; color: white; }
              .btn-reject { background: #ef4444; color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nowa Rezerwacja</h1>
              </div>
              <div class="content">
                <div class="detail">
                  <div class="detail-label">Klient</div>
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
                  <a href="${APP_URL}/api/bookings/${booking.token}/accept" class="btn btn-accept">Akceptuj</a>
                  <a href="${APP_URL}/api/bookings/${booking.token}/reject" class="btn btn-reject">Odrzuć</a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      })
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      // Don't fail the booking if email fails
    }
  }
  
  return NextResponse.json({ booking, success: true })
}
