-- Seed initial time slots for the booking system
-- Generate slots for the next 30 days

-- Clear existing slots (optional - comment out if you want to keep existing data)
-- DELETE FROM slots;

-- Makijaż okolicznościowy (60 min) - 10:00, 12:00, 14:00, 16:00
INSERT INTO slots (procedure_name, slot_display, slot_datetime, status)
SELECT 
  'Makijaż okolicznościowy',
  to_char(d, 'TMDay, DD.MM') || ' · ' || t.time_slot,
  (d + t.time_slot::time)::timestamptz,
  'available'
FROM generate_series(
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '30 days',
  '1 day'::interval
) d
CROSS JOIN (VALUES ('10:00'), ('12:00'), ('14:00'), ('16:00')) AS t(time_slot)
WHERE EXTRACT(DOW FROM d) NOT IN (0) -- Exclude Sundays
ON CONFLICT DO NOTHING;

-- Laminacja Brwi (45 min) - 09:00, 11:00, 13:00, 15:00
INSERT INTO slots (procedure_name, slot_display, slot_datetime, status)
SELECT 
  'Laminacja Brwi',
  to_char(d, 'TMDay, DD.MM') || ' · ' || t.time_slot,
  (d + t.time_slot::time)::timestamptz,
  'available'
FROM generate_series(
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '30 days',
  '1 day'::interval
) d
CROSS JOIN (VALUES ('09:00'), ('11:00'), ('13:00'), ('15:00')) AS t(time_slot)
WHERE EXTRACT(DOW FROM d) NOT IN (0)
ON CONFLICT DO NOTHING;

-- Laminacja Rzęs (60 min) - 10:00, 13:00, 16:00
INSERT INTO slots (procedure_name, slot_display, slot_datetime, status)
SELECT 
  'Laminacja Rzęs',
  to_char(d, 'TMDay, DD.MM') || ' · ' || t.time_slot,
  (d + t.time_slot::time)::timestamptz,
  'available'
FROM generate_series(
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '30 days',
  '1 day'::interval
) d
CROSS JOIN (VALUES ('10:00'), ('13:00'), ('16:00')) AS t(time_slot)
WHERE EXTRACT(DOW FROM d) NOT IN (0)
ON CONFLICT DO NOTHING;

-- Henna + Regulacja Brwi (30 min) - 09:30, 11:30, 14:30, 16:30
INSERT INTO slots (procedure_name, slot_display, slot_datetime, status)
SELECT 
  'Henna + Regulacja Brwi',
  to_char(d, 'TMDay, DD.MM') || ' · ' || t.time_slot,
  (d + t.time_slot::time)::timestamptz,
  'available'
FROM generate_series(
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '30 days',
  '1 day'::interval
) d
CROSS JOIN (VALUES ('09:30'), ('11:30'), ('14:30'), ('16:30')) AS t(time_slot)
WHERE EXTRACT(DOW FROM d) NOT IN (0)
ON CONFLICT DO NOTHING;

-- Przedłużanie Rzęs 1:1 (90 min) - 10:00, 14:00
INSERT INTO slots (procedure_name, slot_display, slot_datetime, status)
SELECT 
  'Przedłużanie Rzęs 1:1',
  to_char(d, 'TMDay, DD.MM') || ' · ' || t.time_slot,
  (d + t.time_slot::time)::timestamptz,
  'available'
FROM generate_series(
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '30 days',
  '1 day'::interval
) d
CROSS JOIN (VALUES ('10:00'), ('14:00')) AS t(time_slot)
WHERE EXTRACT(DOW FROM d) NOT IN (0)
ON CONFLICT DO NOTHING;
