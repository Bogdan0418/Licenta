ALTER TABLE zone_configs DROP COLUMN IF EXISTS open_time;
ALTER TABLE zone_configs DROP COLUMN IF EXISTS close_time;
ALTER TABLE zone_configs DROP COLUMN IF EXISTS active_days;
ALTER TABLE zone_configs ADD COLUMN schedule JSONB DEFAULT '{}'::jsonb;