import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  
  if (!session?.value) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  
  // Simple validation - check if session looks valid
  try {
    const decoded = Buffer.from(session.value, "base64").toString()
    if (decoded.startsWith("admin:")) {
      return NextResponse.json({ authenticated: true })
    }
  } catch {
    // Invalid session
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 })
}
