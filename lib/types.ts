// Database types for the booking system

export interface Slot {
  id: string
  procedure_name: string
  slot_display: string
  slot_datetime: string
  status: 'available' | 'reserved' | 'confirmed'
  created_at: string
}

export interface Booking {
  id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  procedure_name: string
  slot_id: string | null
  slot_display: string | null
  token: string
  status: 'pending' | 'confirmed' | 'rejected'
  summary: string | null
  created_at: string
}

export interface Procedure {
  name: string
  duration: number // in minutes
  description: string
}

export const PROCEDURES: Procedure[] = [
  {
    name: 'Makijaż okolicznościowy',
    duration: 60,
    description: 'Profesjonalny makijaż na specjalne okazje'
  },
  {
    name: 'Laminacja Brwi',
    duration: 45,
    description: 'Laminacja i stylizacja brwi'
  },
  {
    name: 'Laminacja Rzęs',
    duration: 60,
    description: 'Laminacja i lifting rzęs'
  },
  {
    name: 'Henna + Regulacja Brwi',
    duration: 30,
    description: 'Henna brwi z regulacją'
  },
  {
    name: 'Przedłużanie Rzęs 1:1',
    duration: 90,
    description: 'Klasyczne przedłużanie rzęs metodą 1:1'
  }
]

// Booking wizard step types
export type WizardStep = 'welcome' | 'procedure' | 'contact' | 'datetime' | 'confirm' | 'success'

export interface BookingFormData {
  clientName: string
  clientEmail: string
  clientPhone: string
  procedure: string
  slotId: string
  slotDisplay: string
}
