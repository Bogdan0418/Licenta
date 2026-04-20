-- Adaugare TikTok
ALTER TABLE locations
    ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255);

-- Actualizez constraint LocationType
ALTER TABLE locations
DROP CONSTRAINT IF EXISTS chk_loc_type;

ALTER TABLE locations
    ADD CONSTRAINT chk_loc_type CHECK (type IN (
                                                'RESTAURANT','BAR','CLUB','WORK_HUB','GARDEN','ROOFTOP',
                                                'CAFE','BISTRO','TEA_HOUSE',
                                                'PUB','LOUNGE','WINE_BAR','SPEAKEASY',
                                                'PIZZERIA','FAST_FOOD','DINER',
                                                'EVENT_VENUE','FOOD_HALL'
        ));