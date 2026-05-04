
-- Add monthly target columns to targets table
ALTER TABLE public.targets
  ADD COLUMN IF NOT EXISTS jan numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feb numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mar numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS apr numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS may numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jun numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jul numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aug numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sep numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS oct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nov numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dec numeric DEFAULT 0;

-- Add monthly actual/accomplishment columns
ALTER TABLE public.targets
  ADD COLUMN IF NOT EXISTS jan_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feb_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mar_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS apr_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS may_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jun_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS jul_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aug_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sep_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS oct_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nov_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dec_actual numeric DEFAULT 0;

-- Add semester totals
ALTER TABLE public.targets
  ADD COLUMN IF NOT EXISTS first_sem_target numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_sem_actual numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS second_sem_target numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS second_sem_actual numeric DEFAULT 0;

-- Add responsible_person field to programs for direct person-activity mapping
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS responsible_person_name text;
