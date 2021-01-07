ALTER TABLE assets ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}';

UPDATE assets SET meta = '{}'::jsonb WHERE meta IS NULL;

UPDATE assets SET meta = jsonb_set(meta, '{title}', to_jsonb(title)) WHERE meta->>'title' IS NULL AND title IS NOT NULL;

UPDATE assets SET meta = jsonb_set(meta, '{width}', to_jsonb(width)) WHERE meta->>'width' IS NULL AND width IS NOT NULL;

UPDATE assets SET meta = jsonb_set(meta, '{height}', to_jsonb(height)) WHERE meta->>'height' IS NULL AND height IS NOT NULL;

