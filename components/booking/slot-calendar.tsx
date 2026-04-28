"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Slot } from "@/lib/types"

interface SlotCalendarProps {
  slots: Slot[]
  onSelect: (slot: Slot) => void
  selected?: Slot
  isLoading?: boolean
}

const getLocalDateStr = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function SlotCalendar({ slots, onSelect, selected, isLoading }: SlotCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, Slot[]> = {}
    slots.forEach(slot => {
      const date = slot.slot_datetime.split("T")[0]
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(slot)
    })
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) =>
        a.slot_datetime.localeCompare(b.slot_datetime)
      )
    })
    return grouped
  }, [slots])

  const weekDates = useMemo(() => {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() + (weekOffset * 7))

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [weekOffset])

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('pl-PL', { weekday: 'short' }).toUpperCase()
  }

  const formatDayNumber = (date: Date) => {
    return date.getDate()
  }

  const formatTime = (datetime: string) => {
    return datetime.split("T")[1]?.slice(0, 5) || ""
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return getLocalDateStr(date) === getLocalDateStr(today)
  }

  const hasSlots = (date: Date) => {
    const dateStr = getLocalDateStr(date)
    return slotsByDate[dateStr] && slotsByDate[dateStr].length > 0
  }

  const timeSlotsForDate = selectedDate ? slotsByDate[selectedDate] || [] : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
          disabled={weekOffset === 0}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {weekDates[0].toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset(prev => prev + 1)}
          disabled={weekOffset >= 3}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date) => {
          const dateStr = getLocalDateStr(date)
          const hasSlotsForDay = hasSlots(date)
          const isSelected = selectedDate === dateStr
          const isSunday = date.getDay() === 0

          return (
            <button
              key={dateStr}
              onClick={() => hasSlotsForDay && setSelectedDate(dateStr)}
              disabled={!hasSlotsForDay || isSunday}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded-lg transition-all",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : hasSlotsForDay
                    ? "hover:bg-muted text-foreground"
                    : "text-muted-foreground/50 cursor-not-allowed",
                isToday(date) && !isSelected && "ring-1 ring-primary"
              )}
            >
              <span className="text-[10px] font-medium">{formatDayName(date)}</span>
              <span className={cn(
                "text-lg font-semibold",
                hasSlotsForDay ? "" : "opacity-40"
              )}>
                {formatDayNumber(date)}
              </span>
              {hasSlotsForDay && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1",
                  isSelected ? "bg-primary-foreground" : "bg-primary"
                )} />
              )}
            </button>
          )
        })}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Dostępne godziny</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {timeSlotsForDate.map((slot) => {
              const isSlotSelected = selected?.id === slot.id
              return (
                <button
                  key={slot.id}
                  onClick={() => onSelect(slot)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    isSlotSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:border-primary hover:bg-card/80 text-foreground"
                  )}
                >
                  {formatTime(slot.slot_datetime)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!selectedDate && slots.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Wybierz dzień, aby zobaczyć dostępne godziny
        </p>
      )}

      {slots.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Brak dostępnych terminów dla wybranego zabiegu
        </p>
      )}
    </div>
  )
}
