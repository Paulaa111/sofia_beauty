"use client"

import { useState, useEffect, useRef } from "react"
import { ChatMessage } from "./chat-message"
import { ProcedureSelect } from "./procedure-select"
import { SlotCalendar } from "./slot-calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Check, Calendar, User, Phone, Mail, ArrowLeft } from "lucide-react"
import type { Slot, BookingFormData } from "@/lib/types"

type Step = "welcome" | "procedure" | "datetime" | "contact" | "confirm" | "success"

interface Message {
  id: string
  text: string
  isBot: boolean
  step: Step
  showUI?: boolean
}

const SOFIA_MESSAGES: Record<Step, string> = {
  welcome: "Cześć! Jestem Sofia, Twoja wirtualna asystentka. Chętnie pomogę Ci zarezerwować wizytę. Jaki zabieg Cię interesuje?",
  procedure: "Świetny wybór! Teraz wybierzmy najlepszy termin dla Ciebie.",
  datetime: "Doskonale! Potrzebuję jeszcze kilku informacji, żeby sfinalizować rezerwację.",
  contact: "Prawie gotowe! Sprawdź, czy wszystko się zgadza.",
  confirm: "Twoja rezerwacja została wysłana! Otrzymasz potwierdzenie mailem po akceptacji przez właściciela salonu.",
  success: ""
}

export function BookingWizard() {
  const [step, setStep] = useState<Step>("welcome")
  const [messages, setMessages] = useState<Message[]>([])
  const [formData, setFormData] = useState<BookingFormData>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    procedureName: "",
  })
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Add initial message
  useEffect(() => {
    setMessages([{
      id: "welcome",
      text: SOFIA_MESSAGES.welcome,
      isBot: true,
      step: "welcome",
      showUI: true
    }])
  }, [])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Fetch slots when procedure is selected
  useEffect(() => {
    if (formData.procedureName && step === "datetime") {
      fetchSlots(formData.procedureName)
    }
  }, [formData.procedureName, step])
  
  const fetchSlots = async (procedure: string) => {
    setIsLoadingSlots(true)
    try {
      const res = await fetch(`/api/slots?procedure=${encodeURIComponent(procedure)}`)
      if (res.ok) {
        const data = await res.json()
        setSlots(data.slots || [])
      }
    } catch (error) {
      console.error("Error fetching slots:", error)
    } finally {
      setIsLoadingSlots(false)
    }
  }
  
  const addBotMessage = (text: string, newStep: Step, showUI = true) => {
    setMessages(prev => [...prev, {
      id: `bot-${Date.now()}`,
      text,
      isBot: true,
      step: newStep,
      showUI
    }])
  }
  
  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      text,
      isBot: false,
      step
    }])
  }
  
  const handleProcedureSelect = (procedure: string) => {
    setFormData(prev => ({ ...prev, procedureName: procedure }))
    addUserMessage(procedure)
    setTimeout(() => {
      setStep("datetime")
      addBotMessage(SOFIA_MESSAGES.procedure, "datetime")
    }, 300)
  }
  
  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot)
  }
  
  const handleSlotConfirm = () => {
    if (!selectedSlot) return
    addUserMessage(selectedSlot.slot_display)
    setTimeout(() => {
      setStep("contact")
      addBotMessage(SOFIA_MESSAGES.datetime, "contact")
    }, 300)
  }
  
  const validateContact = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.clientName.trim()) {
      newErrors.clientName = "Imię jest wymagane"
    }
    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = "Email jest wymagany"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = "Nieprawidłowy adres email"
    }
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = "Telefon jest wymagany"
    } else if (!/^[\d\s+-]{9,}$/.test(formData.clientPhone.replace(/\s/g, ''))) {
      newErrors.clientPhone = "Nieprawidłowy numer telefonu"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleContactSubmit = () => {
    if (!validateContact()) return
    addUserMessage(`${formData.clientName}, ${formData.clientEmail}`)
    setTimeout(() => {
      setStep("confirm")
      addBotMessage(SOFIA_MESSAGES.contact, "confirm")
    }, 300)
  }
  
  const handleConfirmBooking = async () => {
    if (!selectedSlot) return
    setIsSubmitting(true)
    
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slotId: selectedSlot.id,
          slotDisplay: selectedSlot.slot_display
        })
      })
      
      if (res.ok) {
        setStep("success")
        addBotMessage(SOFIA_MESSAGES.confirm, "success", false)
      } else {
        const error = await res.json()
        alert(error.message || "Wystąpił błąd podczas rezerwacji")
      }
    } catch (error) {
      console.error("Booking error:", error)
      alert("Wystąpił błąd podczas rezerwacji")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleBack = () => {
    if (step === "datetime") {
      setStep("welcome")
      setFormData(prev => ({ ...prev, procedureName: "" }))
      setSelectedSlot(null)
    } else if (step === "contact") {
      setStep("datetime")
    } else if (step === "confirm") {
      setStep("contact")
    }
  }
  
  const handleReset = () => {
    setStep("welcome")
    setFormData({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      procedureName: "",
    })
    setSelectedSlot(null)
    setSlots([])
    setMessages([{
      id: "welcome-reset",
      text: SOFIA_MESSAGES.welcome,
      isBot: true,
      step: "welcome",
      showUI: true
    }])
  }
  
  const renderStepUI = (message: Message) => {
    if (!message.showUI) return null
    
    switch (message.step) {
      case "welcome":
        return step === "welcome" && (
          <ProcedureSelect 
            onSelect={handleProcedureSelect}
            selected={formData.procedureName}
          />
        )
      
      case "datetime":
        return step === "datetime" && (
          <div className="space-y-4">
            <SlotCalendar
              slots={slots}
              onSelect={handleSlotSelect}
              selected={selectedSlot || undefined}
              isLoading={isLoadingSlots}
            />
            {selectedSlot && (
              <Button 
                onClick={handleSlotConfirm}
                className="w-full"
              >
                Potwierdź termin
              </Button>
            )}
          </div>
        )
      
      case "contact":
        return step === "contact" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Imię i nazwisko</label>
                </div>
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Anna Kowalska"
                  className={errors.clientName ? "border-destructive" : ""}
                />
                {errors.clientName && (
                  <p className="text-xs text-destructive mt-1">{errors.clientName}</p>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Email</label>
                </div>
                <Input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="anna@example.com"
                  className={errors.clientEmail ? "border-destructive" : ""}
                />
                {errors.clientEmail && (
                  <p className="text-xs text-destructive mt-1">{errors.clientEmail}</p>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Telefon</label>
                </div>
                <Input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                  placeholder="+48 123 456 789"
                  className={errors.clientPhone ? "border-destructive" : ""}
                />
                {errors.clientPhone && (
                  <p className="text-xs text-destructive mt-1">{errors.clientPhone}</p>
                )}
              </div>
            </div>
            
            <Button onClick={handleContactSubmit} className="w-full">
              Dalej
            </Button>
          </div>
        )
      
      case "confirm":
        return step === "confirm" && (
          <div className="space-y-4">
            <Card className="p-4 space-y-3 bg-card/50">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Zabieg</p>
                  <p className="font-medium">{formData.procedureName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Termin</p>
                  <p className="font-medium">{selectedSlot?.slot_display}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Dane kontaktowe</p>
                  <p className="font-medium">{formData.clientName}</p>
                  <p className="text-sm text-muted-foreground">{formData.clientEmail}</p>
                  <p className="text-sm text-muted-foreground">{formData.clientPhone}</p>
                </div>
              </div>
            </Card>
            
            <Button 
              onClick={handleConfirmBooking} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Wysyłanie..." : "Potwierdź rezerwację"}
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card/50">
        {step !== "welcome" && step !== "success" && (
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
          S
        </div>
        <div>
          <h2 className="font-semibold">Sofia</h2>
          <p className="text-xs text-muted-foreground">Asystentka rezerwacji</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message.text} 
            isBot={message.isBot}
          >
            {message.isBot && renderStepUI(message)}
          </ChatMessage>
        ))}
        
        {/* Success State */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Rezerwacja wysłana!</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Otrzymasz email z potwierdzeniem, gdy właściciel salonu zaakceptuje Twoją wizytę.
              </p>
            </div>
            <Button onClick={handleReset} variant="outline">
              Zarezerwuj kolejną wizytę
            </Button>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
