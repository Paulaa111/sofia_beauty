"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as DateCalendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ArrowLeft,
  Sparkles,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import type { Booking } from "@/lib/types"

const statusConfig = {
  pending: { label: "Oczekuje", variant: "secondary" as const, color: "bg-yellow-500/20 text-yellow-400" },
  confirmed: { label: "Potwierdzona", variant: "default" as const, color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Odrzucona", variant: "destructive" as const, color: "bg-red-500/20 text-red-400" },
  completed: { label: "Zrealizowana", variant: "outline" as const, color: "bg-blue-500/20 text-blue-400" },
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  type AdminSlot = {
    id: string
    start_time: string
    is_booked: boolean
    created_at?: string
  }

  const [slots, setSlots] = useState<AdminSlot[]>([])
  const [slotsMonth, setSlotsMonth] = useState(() => new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [createDate, setCreateDate] = useState<Date | undefined>(() => new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedTimes, setSelectedTimes] = useState<string[]>(["09:00", "10:00", "11:00"])
  const [createSlotsLoading, setCreateSlotsLoading] = useState(false)
  const [createSlotsError, setCreateSlotsError] = useState<string | null>(null)
  const [deleteSlotLoading, setDeleteSlotLoading] = useState<string | null>(null)
  
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings")
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchSlots = useCallback(async () => {
    setSlotsLoading(true)
    setSlotsError(null)
    try {
      const res = await fetch(`/api/admin/slots?month=${encodeURIComponent(slotsMonth)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSlotsError(data.error || "Nie udało się pobrać terminów")
        return
      }
      setSlots(data.slots || [])
    } catch (error) {
      console.error("Error fetching admin slots:", error)
      setSlotsError("Błąd połączenia z serwerem")
    } finally {
      setSlotsLoading(false)
    }
  }, [slotsMonth])
  
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/admin/check")
        setIsAuthenticated(res.ok)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }
    check()
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchSlots()
  }, [fetchSlots, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchBookings()
  }, [fetchBookings, isAuthenticated])
  
  const handleAction = async (token: string, action: "accept" | "reject") => {
    setActionLoading(token)
    try {
      await fetch(`/api/bookings/${token}/${action}`)
      await fetchBookings()
    } catch (error) {
      console.error("Error performing action:", error)
    } finally {
      setActionLoading(null)
    }
  }
  
  const pendingBookings = bookings.filter(b => b.status === "pending")
  const confirmedBookings = bookings.filter(b => b.status === "confirmed")
  const rejectedBookings = bookings.filter(b => b.status === "rejected")
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatSlotDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("pl-PL", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const dateToYmd = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  const buildTimeOptions = () => {
    const options: string[] = []
    for (let h = 8; h <= 19; h++) {
      for (const m of [0, 30]) {
        const hh = String(h).padStart(2, "0")
        const mm = String(m).padStart(2, "0")
        options.push(`${hh}:${mm}`)
      }
    }
    return options
  }

  const timeOptions = buildTimeOptions()

  const toggleTime = (t: string) => {
    setSelectedTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()
    )
  }

  const handleCreateSlots = async () => {
    if (!createDate || selectedTimes.length === 0) return

    setCreateSlotsLoading(true)
    setCreateSlotsError(null)
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateToYmd(createDate), times: selectedTimes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error("Failed to create slots:", data)
        setCreateSlotsError(data.error || "Nie udało się dodać terminów")
        return
      }
      await fetchSlots()
    } catch (error) {
      console.error("Error creating slots:", error)
      setCreateSlotsError("Błąd połączenia z serwerem")
    } finally {
      setCreateSlotsLoading(false)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    setDeleteSlotLoading(id)
    try {
      await fetch(`/api/admin/slots?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      await fetchSlots()
    } catch (error) {
      console.error("Error deleting slot:", error)
    } finally {
      setDeleteSlotLoading(null)
    }
  }
  
  const BookingCard = ({ booking }: { booking: Booking }) => {
    const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending
    const isPending = booking.status === "pending"
    const isActionLoading = actionLoading === booking.token
    
    return (
      <Card className="bg-card/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{booking.client_name}</h3>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{booking.procedure_name}</p>
            </div>
          </div>
          
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{booking.slot_display}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{booking.client_email}</span>
            </div>
            {booking.client_phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{booking.client_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Utworzono: {formatDate(booking.created_at)}</span>
            </div>
          </div>
          
          {isPending && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleAction(booking.token, "accept")}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Akceptuj
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => handleAction(booking.token, "reject")}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Odrzuć
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
  
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <User className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )

  const handleLogin = async () => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setLoginError(data.error || "Nie udało się zalogować")
        setIsAuthenticated(false)
        return
      }
      setIsAuthenticated(true)
      setLoginPassword("")
      await fetchSlots()
      await fetchBookings()
    } catch (e) {
      console.error(e)
      setLoginError("Błąd połączenia z serwerem")
      setIsAuthenticated(false)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE" })
    } finally {
      setIsAuthenticated(false)
      setBookings([])
      setSlots([])
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="font-semibold">Panel Właściciela</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchBookings} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Odśwież
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {!authChecked ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !isAuthenticated ? (
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Zaloguj do panelu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Wpisz hasło admina (z `ADMIN_PASSWORD` w `.env.local`).
              </div>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Hasło"
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
              {loginError && (
                <div className="text-sm text-red-400">{loginError}</div>
              )}
              <Button onClick={handleLogin} disabled={loginLoading || !loginPassword}>
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logowanie…
                  </>
                ) : (
                  "Zaloguj"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
          {/* Slots Manager */}
          <Card className="mb-6 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-4">
              <span>Terminy</span>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={slotsMonth}
                  onChange={(e) => setSlotsMonth(e.target.value)}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
                <Button variant="ghost" size="sm" onClick={fetchSlots} disabled={slotsLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${slotsLoading ? "animate-spin" : ""}`} />
                  Odśwież
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Wyloguj
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Dodaj terminy</div>
                <div className="grid gap-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Data</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full text-left">
                          <Input
                            readOnly
                            value={createDate ? dateToYmd(createDate) : ""}
                            placeholder="Wybierz datę"
                          />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DateCalendar
                          mode="single"
                          selected={createDate}
                          onSelect={(date) => {
                            setCreateDate(date)
                            setSelectedTimes([])
                            setCalendarOpen(false)
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">Godziny</div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTimes(timeOptions)}
                        >
                          Wszystkie
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTimes([])}
                        >
                          Wyczyść
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {timeOptions.map((t) => {
                        const selected = selectedTimes.includes(t)
                        return (
                          <Button
                            key={t}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => toggleTime(t)}
                            className="justify-center"
                          >
                            {t}
                          </Button>
                        )
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Wybrane: {selectedTimes.length}
                    </div>
                  </div>
                  <Button onClick={handleCreateSlots} disabled={createSlotsLoading}>
                    {createSlotsLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Dodawanie…
                      </>
                    ) : (
                      "Dodaj terminy"
                    )}
                  </Button>
                  {createSlotsError && (
                    <div className="text-sm text-red-400">{createSlotsError}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Lista terminów</div>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : slotsError ? (
                  <div className="text-sm text-red-400 py-6">{slotsError}</div>
                ) : slots.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6">
                    Brak terminów w wybranym miesiącu.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                    {slots.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{formatSlotDate(s.start_time)}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{s.is_booked ? "Zajęty" : "Wolny"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={s.is_booked ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                            {s.is_booked ? "Zajęty" : "Wolny"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={s.is_booked || deleteSlotLoading === s.id}
                            onClick={() => handleDeleteSlot(s.id)}
                          >
                            {deleteSlotLoading === s.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Usuń"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{pendingBookings.length}</p>
              <p className="text-xs text-muted-foreground">Oczekujące</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{confirmedBookings.length}</p>
              <p className="text-xs text-muted-foreground">Potwierdzone</p>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{rejectedBookings.length}</p>
              <p className="text-xs text-muted-foreground">Odrzucone</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              Oczekujące
              {pendingBookings.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 text-[10px] font-bold flex items-center justify-center text-background">
                  {pendingBookings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">Potwierdzone</TabsTrigger>
            <TabsTrigger value="rejected">Odrzucone</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingBookings.length > 0 ? (
              <div className="grid gap-4">
                {pendingBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState message="Brak oczekujących rezerwacji" />
            )}
          </TabsContent>
          
          <TabsContent value="confirmed" className="space-y-4">
            {confirmedBookings.length > 0 ? (
              <div className="grid gap-4">
                {confirmedBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState message="Brak potwierdzonych rezerwacji" />
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="space-y-4">
            {rejectedBookings.length > 0 ? (
              <div className="grid gap-4">
                {rejectedBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState message="Brak odrzuconych rezerwacji" />
            )}
          </TabsContent>
        </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
