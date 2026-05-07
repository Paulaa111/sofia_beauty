"use client"

import { useState, useEffect, useRef } from "react"
import { ChatMessage } from "./chat-message"
import { ProcedureSelect } from "./procedure-select"
import { SlotCalendar } from "./slot-calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Check, Calendar, User, Phone, Mail, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Slot, BookingFormData } from "@/lib/types"

type Step = "welcome" | "questions" | "procedure" | "datetime" | "contact" | "confirm" | "success"

interface Question {
  id: string
  text: string
  options: string[]
  isContraindication?: (answer: string) => boolean
  contraindicationMessage?: string
}

interface Message {
  id: string
  text: string
  isBot: boolean
  step: Step
  showUI?: boolean
}

// Pytania kwalifikujące dla każdego zabiegu
const PROCEDURE_QUESTIONS: Record<string, Question[]> = {
  "Makijaż": [
    {
      id: "okazja",
      text: "Na jaką okazję przygotowujesz makijaż?",
      options: ["Ślub", "Wesele", "Sesja foto", "Event / Impreza", "Inne"],
    },
  ],
  "Laminacja Brwi": [
    {
      id: "historia",
      text: "Czy miałaś już wcześniej laminację brwi?",
      options: ["Tak", "Nie"],
    },
    {
      id: "ciaza",
      text: "Czy jesteś w ciąży lub karmisz piersią?",
      options: ["Tak", "Nie"],
      isContraindication: (a) => a === "Tak",
      contraindicationMessage:
        "Niestety w czasie ciąży i karmienia piersią nie wykonujemy laminacji brwi. Zapraszamy po tym okresie! W razie pytań zadzwoń: +48 500 123 456.",
    },
  ],
  "Laminacja Rzęs": [
    {
      id: "lifting",
      text: "Czy miałaś wcześniej lifting lub laminację rzęs?",
      options: ["Tak", "Nie"],
    },
    {
      id: "soczewki",
      text: "Czy nosisz soczewki kontaktowe?",
      options: ["Tak", "Nie"],
    },
  ],
  "Henna Brwi": [
    {
      id: "alergia",
      text: "Czy miałaś kiedykolwiek reakcję alergiczną na hennę lub farbę do brwi?",
      options: ["Tak — miałam reakcję", "Nie, żadnych reakcji"],
      isContraindication: (a) => a === "Tak — miałam reakcję",
      contraindicationMessage:
        "Przy alergii na hennę nie możemy bezpiecznie wykonać zabiegu. Skontaktuj się z nami, żeby omówić alternatywy: +48 500 123 456.",
    },
    {
      id: "efekt",
      text: "Jaki efekt Cię interesuje?",
      options: ["Naturalny", "Wyrazisty", "Ombre"],
    },
  ],
  "Henna Rzęs": [
    {
      id: "krople",
      text: "Czy stosujesz krople do oczu lub leki okulistyczne?",
      options: ["Tak", "Nie"],
    },
    {
      id: "historia",
      text: "Czy miałaś już wcześniej hennę na rzęsach?",
      options: ["Tak", "Nie, pierwszy raz"],
    },
  ],
  "Przedłużanie Rzęs": [
    {
      id: "historia",
      text: "Czy nosiłaś wcześniej przedłużane rzęsy?",
      options: ["Tak", "Nie, pierwszy raz"],
    },
    {
      id: "efekt",
      text: "Jaki efekt Cię interesuje?",
      options: ["Naturalny", "Cat eye", "Lisie", "Dramatyczny"],
    },
  ],
}

const SOFIA_MESSAGES: Record<Step, string> = {
  welcome:
    "Cześć! Jestem Sofia, Twoja wirtualna asystentka. Chętnie pomogę Ci zarezerwować wizytę. Jaki zabieg Cię interesuje?",
  questions: "",
  procedure: "Świetnie! Teraz wybierzmy najlepszy termin dla Ciebie.",
  datetime:
    "Doskonale! Potrzebuję jeszcze kilku informacji, żeby sfinalizować rezerwację.",
  contact: "Prawie gotowe! Sprawdź, czy wszystko się zgadza.",
  confirm:
    "Twoja rezerwacja została wysłana! Otrzymasz potwierdzenie mailem po akceptacji przez właściciela salonu.",
  success: "",
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

  // Pytania kwalifikujące
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isContraindicated, setIsContraindicated] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        text: SOFIA_MESSAGES.welcome,
        isBot: true,
        step: "welcome",
        showUI: true,
      },
    ])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (formData.procedureName && step === "datetime") {
      fetchSlots(formData.procedureName)
    }
  }, [formData.procedureName, step])

  const fetchSlots = async (procedure: string) => {
    setIsLoadingSlots(true)
    try {
      const res = await fetch(
        `/api/slots?procedure=${encodeURIComponent(procedure)}`
      )
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
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        text,
        isBot: true,
        step: newStep,
        showUI,
      },
    ])
  }

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        text,
        isBot: false,
        step,
      },
    ])
  }

  const handleProcedureSelect = (procedure: string) => {
    setFormData((prev) => ({ ...prev, procedureName: procedure }))
    addUserMessage(procedure)

    const questions = PROCEDURE_QUESTIONS[procedure] || []

    setTimeout(() => {
      if (questions.length > 0) {
        setCurrentQuestions(questions)
        setQuestionIndex(0)
        setAnswers({})
        setIsContraindicated(false)
        setStep("questions")
        addBotMessage(questions[0].text, "questions", true)
      } else {
        setStep("datetime")
        addBotMessage(SOFIA_MESSAGES.procedure, "datetime")
      }
    }, 300)
  }

  const handleQuestionAnswer = (answer: string) => {
    const question = currentQuestions[questionIndex]

    // Dodaj odpowiedź użytkownika do czatu
    addUserMessage(answer)

    // Sprawdź przeciwwskazanie
    if (question.isContraindication?.(answer)) {
      setTimeout(() => {
        setIsContraindicated(true)
        addBotMessage(
          question.contraindicationMessage || "Niestety nie możemy wykonać zabiegu. Skontaktuj się z nami: +48 500 123 456.",
          "questions",
          false
        )
      }, 300)
      return
    }

    const newAnswers = { ...answers, [question.id]: answer }
    setAnswers(newAnswers)

    const nextIndex = questionIndex + 1

    setTimeout(() => {
      if (nextIndex < currentQuestions.length) {
        // Następne pytanie
        setQuestionIndex(nextIndex)
        addBotMessage(currentQuestions[nextIndex].text, "questions", true)
      } else {
        // Wszystkie pytania odpowiedziane — przejdź do kalendarza
        setStep("datetime")
        addBotMessage(SOFIA_MESSAGES.procedure, "datetime")
      }
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
    } else if (
      !/^[\d\s+-]{9,}$/.test(formData.clientPhone.replace(/\s/g, ""))
    ) {
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
          slotDisplay: selectedSlot.slot_display,
          qualifyingAnswers: answers,
        }),
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
    if (step === "questions" || step === "datetime") {
      setStep("welcome")
      setFormData((prev) => ({ ...prev, procedureName: "" }))
      setSelectedSlot(null)
      setCurrentQuestions([])
      setQuestionIndex(0)
      setAnswers({})
      setIsContraindicated(false)
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
    setCurrentQuestions([])
    setQuestionIndex(0)
    setAnswers({})
    setIsContraindicated(false)
    setMessages([
      {
        id: "welcome-reset",
        text: SOFIA_MESSAGES.welcome,
        isBot: true,
        step: "welcome",
        showUI: true,
      },
    ])
  }

  // Aktywne pytanie (ostatnie w wiadomościach bota w kroku questions)
  const activeQuestionMessageId = (() => {
    if (step !== "questions" || isContraindicated) return null
    const botQMessages = messages.filter(
      (m) => m.isBot && m.step === "questions" && m.showUI
    )
    return botQMessages[botQMessages.length - 1]?.id ?? null
  })()

  const renderStepUI = (message: Message) => {
    if (!message.showUI) return null

    switch (message.step) {
      case "welcome":
        return (
          step === "welcome" && (
            <ProcedureSelect
              onSelect={handleProcedureSelect}
              selected={formData.procedureName}
            />
          )
        )

      case "questions":
        // Renderuj przyciski tylko dla ostatniego aktywnego pytania
        if (message.id !== activeQuestionMessageId) return null
        const q = currentQuestions[questionIndex]
        if (!q) return null
        return (
          <QuestionButtons
            question={q}
            onAnswer={handleQuestionAnswer}
          />
        )

      case "datetime":
        return (
          step === "datetime" && (
            <div className="space-y-4">
              <SlotCalendar
                slots={slots}
                onSelect={handleSlotSelect}
                selected={selectedSlot || undefined}
                isLoading={isLoadingSlots}
              />
              {selectedSlot && (
                <Button onClick={handleSlotConfirm} className="w-full">
                  Potwierdź termin
                </Button>
              )}
            </div>
          )
        )

      case "contact":
        return (
          step === "contact" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Imię i nazwisko</label>
                  </div>
                  <Input
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientName: e.target.value,
                      }))
                    }
                    placeholder="Anna Kowalska"
                    className={errors.clientName ? "border-destructive" : ""}
                  />
                  {errors.clientName && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.clientName}
                    </p>
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientEmail: e.target.value,
                      }))
                    }
                    placeholder="anna@example.com"
                    className={errors.clientEmail ? "border-destructive" : ""}
                  />
                  {errors.clientEmail && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.clientEmail}
                    </p>
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clientPhone: e.target.value,
                      }))
                    }
                    placeholder="+48 123 456 789"
                    className={errors.clientPhone ? "border-destructive" : ""}
                  />
                  {errors.clientPhone && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.clientPhone}
                    </p>
                  )}
                </div>
              </div>

              <Button onClick={handleContactSubmit} className="w-full">
                Dalej
              </Button>
            </div>
          )
        )

      case "confirm":
        return (
          step === "confirm" && (
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
                    <p className="text-sm text-muted-foreground">
                      Dane kontaktowe
                    </p>
                    <p className="font-medium">{formData.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.clientEmail}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.clientPhone}
                    </p>
                  </div>
                </div>
                {Object.keys(answers).length > 0 && (
                  <div className="flex items-start gap-3 pt-1 border-t border-border">
                    <Check className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Odpowiedzi z konsultacji
                      </p>
                      {currentQuestions.map((q) =>
                        answers[q.id] ? (
                          <p key={q.id} className="text-sm">
                            <span className="text-muted-foreground">{q.text.replace("?","")}: </span>
                            <span className="font-medium">{answers[q.id]}</span>
                          </p>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
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
                Otrzymasz email z potwierdzeniem, gdy właściciel salonu
                zaakceptuje Twoją wizytę.
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

// ── Komponent przycisków odpowiedzi ──────────────────────
interface QuestionButtonsProps {
  question: Question
  onAnswer: (answer: string) => void
}

function QuestionButtons({ question, onAnswer }: QuestionButtonsProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleClick = (option: string) => {
    if (selected) return // blokuj po wyborze
    setSelected(option)
    onAnswer(option)
  }

  const isTwoOptions = question.options.length === 2

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 mt-1",
        isTwoOptions ? "flex-row" : "flex-col sm:flex-row"
      )}
    >
      {question.options.map((option) => {
        const isChosen = selected === option
        const isDisabled = selected !== null && !isChosen
        return (
          <button
            key={option}
            onClick={() => handleClick(option)}
            disabled={isDisabled}
            className={cn(
              "px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200",
              isChosen
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[0.98]"
                : isDisabled
                ? "border-border text-muted-foreground/40 bg-muted/30 cursor-not-allowed"
                : "border-border bg-card/80 text-foreground hover:border-primary/60 hover:bg-card hover:shadow-sm active:scale-[0.97]"
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
