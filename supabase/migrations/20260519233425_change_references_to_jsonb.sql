/*
  # Change references column type to jsonb

  ## Changes
  - `stories` table: alters `references` from text to jsonb to store an array of strings
    - Drops default first, converts existing values, then re-sets default as empty array
*/

ALTER TABLE stories ALTER COLUMN "references" DROP DEFAULT;

ALTER TABLE stories
  ALTER COLUMN "references" TYPE jsonb
  USING CASE WHEN "references" IS NULL OR "references" = '' THEN '[]'::jsonb ELSE to_jsonb("references") END;

ALTER TABLE stories ALTER COLUMN "references" SET DEFAULT '[]'::jsonb;
