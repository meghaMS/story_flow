/*
  # Add references column to stories table

  ## Changes
  - `stories` table: adds `"references"` (text) column to store AI-generated reference websites
    - Defaults to empty string
    - Nullable, so existing rows are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stories' AND column_name = 'references'
  ) THEN
    ALTER TABLE stories ADD COLUMN "references" text DEFAULT '';
  END IF;
END $$;
