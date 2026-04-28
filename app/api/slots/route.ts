import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // `procedure` is kept for backwards-compatibility with the UI,
  // but the new schema does not store procedure per slot.
  // We return available slots regardless of procedure.
  const procedure = searchParams.get("procedure") || ""
  
  const supabase = await createClient()
  
  // Get available slots in the next 30 days
  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  const { data: slots, error } = await supabase
    .from("slots")
    .select("*")
    .eq("is_booked", false)
    .eq("status", "available")
    .gte("start_time", now.toISOString())
    .lte("start_time", thirtyDaysLater.toISOString())
    .order("start_time", { ascending: true })
  
  if (error) {
    console.error("Error fetching slots:", error)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
  
  const mapped = (slots || []).map((s: any) => {
    const dt = s.start_time.replace('+00', '+02')
    const display = (() => {
      try {
        // Wyciągamy datę i czas bezpośrednio z ISO stringa, bez konwersji stref
        const [datePart, timePart] = dt.split("T")
        const [year, month, day] = datePart.split("-")
        const time = timePart.slice(0, 5) // "HH:MM"
        return `${day}.${month}.${year} ${time}`
      } catch {
        return String(dt)
      }
    })()

    return {
      ...s,
      // backwards-compatible fields expected by the old UI
      slot_datetime: dt,
      slot_display: display,
      procedure_name: procedure,
    }
  })

  return NextResponse.json({ slots: mapped })
}
