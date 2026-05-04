
-- OORC data table
CREATE TABLE public.oorc_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  category text DEFAULT '',
  oo text DEFAULT '',
  program text DEFAULT '',
  indicator text NOT NULL,
  annual_target numeric,
  target_q1 numeric, target_q2 numeric, target_q3 numeric, target_q4 numeric,
  target_sem1 numeric, target_sem2 numeric,
  accomp_q1 numeric, accomp_q2 numeric, accomp_q3 numeric, accomp_q4 numeric,
  accomp_sem1 numeric, accomp_sem2 numeric,
  target_jan numeric, target_feb numeric, target_mar numeric, target_apr numeric,
  target_may numeric, target_jun numeric, target_jul numeric, target_aug numeric,
  target_sep numeric, target_oct numeric, target_nov numeric, target_dec numeric,
  accomp_jan numeric, accomp_feb numeric, accomp_mar numeric, accomp_apr numeric,
  accomp_may numeric, accomp_jun numeric, accomp_jul numeric, accomp_aug numeric,
  accomp_sep numeric, accomp_oct numeric, accomp_nov numeric, accomp_dec numeric,
  pct_accomp numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.oorc_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to oorc_data" ON public.oorc_data FOR ALL USING (true) WITH CHECK (true);

-- PGS data table
CREATE TABLE public.pgs_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id uuid NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  perspective text DEFAULT '',
  strategic_objective text DEFAULT '',
  measure_no numeric,
  strategic_measure text NOT NULL,
  cy_target numeric,
  target_to_date numeric,
  target_q1 numeric, target_q2 numeric, target_q3 numeric, target_q4 numeric,
  target_sem1 numeric, target_sem2 numeric,
  accomp_to_date numeric,
  accomp_q1 numeric, accomp_q2 numeric, accomp_q3 numeric, accomp_q4 numeric,
  accomp_sem1 numeric, accomp_sem2 numeric,
  target_jan numeric, target_feb numeric, target_mar numeric, target_apr numeric,
  target_may numeric, target_jun numeric, target_jul numeric, target_aug numeric,
  target_sep numeric, target_oct numeric, target_nov numeric, target_dec numeric,
  accomp_jan numeric, accomp_feb numeric, accomp_mar numeric, accomp_apr numeric,
  accomp_may numeric, accomp_jun numeric, accomp_jul numeric, accomp_aug numeric,
  accomp_sep numeric, accomp_oct numeric, accomp_nov numeric, accomp_dec numeric,
  pct_accomp numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pgs_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to pgs_data" ON public.pgs_data FOR ALL USING (true) WITH CHECK (true);
