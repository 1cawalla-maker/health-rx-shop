-- Add no_answer to consultation_status enum (explicit patient no-show outcome)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'no_answer'
      AND enumtypid = 'consultation_status'::regtype
  ) THEN
    ALTER TYPE consultation_status ADD VALUE 'no_answer';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
