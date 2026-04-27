-- BeautyFlow Booking App - Database Schema
-- Run this script to create the required tables

-- Slots table: available time slots for procedures
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_name TEXT NOT NULL,
  slot_display TEXT NOT NULL,        -- e.g., "Poniedziałek, 15.01 · 10:00"
  slot_datetime TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'available', -- available, reserved, confirmed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table: client reservations
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  procedure_name TEXT NOT NULL,
  slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
  slot_display TEXT,
  token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_slots_datetime ON slots(slot_datetime);
CREATE INDEX IF NOT EXISTS idx_slots_procedure ON slots(procedure_name);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_token ON bookings(token);
