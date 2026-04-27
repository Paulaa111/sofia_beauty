import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Simple auth check helper
async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (!session?.value) return false
  try {
    const decoded = Buffer.from(session.value, "base64").toString()
    return decoded.startsWith("admin:")
  } catch {
    return false
  }
}

// GET all slots for admin (including booked ones)
export async function GET(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") // Format: YYYY-MM
  
  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 })
  }
  
  let query = supabase.from("slots").select("*").order("start_time", { ascending: true })
  
  if (month) {
    const startDate = `${month}-01`
    const endDate = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0)
    const endDateStr = `${month}-${endDate.getDate().toString().padStart(2, "0")}`
    query = query.gte("start_time", `${startDate}T00:00:00`).lte("start_time", `${endDateStr}T23:59:59`)
  }
  
  const { data: slots, error } = await query
  
  if (error) {
    console.error("Error fetching slots:", error)
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 })
  }
  
  return NextResponse.json({ slots: slots || [] })
}

// POST - Create new slots
export async function POST(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const date = (body as { date?: unknown })?.date
  const times = (body as { times?: unknown })?.times
  
  // Validation
  if (typeof date !== "string" || !Array.isArray(times) || times.length === 0) {
    return NextResponse.json({ error: "Date and times are required" }, { status: 400 })
  }

  const normalizedTimes = Array.from(
    new Set(times.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean))
  )
  if (normalizedTimes.length === 0 || normalizedTimes.some((t) => !/^\d{2}:\d{2}$/.test(t))) {
    return NextResponse.json({ error: "Invalid times format (expected HH:MM)" }, { status: 400 })
  }
  
  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 })
  }
  
  const slotsToInsert = []
  
  for (const time of normalizedTimes) {
    const startTime = `${date}T${time}:00`
    slotsToInsert.push({
      start_time: startTime,
      is_booked: false,
    })
  }
  
  const { data: slots, error } = await supabase
    .from("slots")
    .upsert(slotsToInsert, { onConflict: "start_time" })
    .select()
  
  if (error) {
    const err = error as unknown as { message?: string; details?: string; hint?: string; code?: string }
    console.error("Error creating slots:", err?.message ?? error, err)
    if (err?.code === "42P10") {
      return NextResponse.json(
        {
          error: "Missing UNIQUE constraint for upsert",
          details: "Add a unique constraint/index on slots.start_time (required for upsert onConflict: start_time).",
          code: err.code,
        },
        { status: 500 }
      )
    }
    return NextResponse.json(
      {
        error: "Failed to create slots",
        details: err?.details ?? err?.message ?? null,
        hint: err?.hint ?? null,
        code: err?.code ?? null,
      },
      { status: 500 }
    )
  }
  
  return NextResponse.json({ success: true, slots: slots || [], created: slotsToInsert.length })
}

// DELETE - Remove slots by date or ID
export async function DELETE(request: NextRequest) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const slotId = searchParams.get("id")
  const date = searchParams.get("date")
  const time = searchParams.get("time")
  
  let supabase
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 })
  }
  
  if (slotId) {
    // Delete single slot by ID
    const { error } = await supabase
      .from("slots")
      .delete()
      .eq("id", slotId)
      .eq("is_booked", false) // Only delete free slots
    
    if (error) {
      return NextResponse.json({ error: "Failed to delete slot" }, { status: 500 })
    }
  } else if (date && time) {
    // Delete all slots for a specific date and time
    const startTime = `${date}T${time}:00`
    const { error } = await supabase
      .from("slots")
      .delete()
      .eq("start_time", startTime)
      .eq("is_booked", false)
    
    if (error) {
      return NextResponse.json({ error: "Failed to delete slots" }, { status: 500 })
    }
  } else if (date) {
    // Delete all available slots for a date
    const { error } = await supabase
      .from("slots")
      .delete()
      .gte("start_time", `${date}T00:00:00`)
      .lte("start_time", `${date}T23:59:59`)
      .eq("is_booked", false)
    
    if (error) {
      return NextResponse.json({ error: "Failed to delete slots" }, { status: 500 })
    }
  } else {
    return NextResponse.json({ error: "Slot ID or date required" }, { status: 400 })
  }
  
  return NextResponse.json({ success: true })
}
