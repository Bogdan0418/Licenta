-- Stergem coloana veche
ALTER TABLE zone_configs DROP COLUMN IF EXISTS booking_duration_minutes;

-- Adaugam coloana noua cu valoarea default
ALTER TABLE zone_configs ADD COLUMN allowed_durations VARCHAR(255) NOT NULL DEFAULT '60';