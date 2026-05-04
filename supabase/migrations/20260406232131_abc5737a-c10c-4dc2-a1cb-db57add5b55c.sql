
-- Create divisions table
CREATE TABLE public.divisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to divisions" ON public.divisions FOR ALL USING (true) WITH CHECK (true);

-- Seed divisions
INSERT INTO public.divisions (name, code) VALUES
  ('Business Development Division', 'BDD'),
  ('Office of the Provincial Director', 'OPD'),
  ('Consumer Protection Division', 'CPD');

-- Create uploads table
CREATE TABLE public.uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  division_id UUID REFERENCES public.divisions(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL DEFAULT 2026,
  file_path TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to uploads" ON public.uploads FOR ALL USING (true) WITH CHECK (true);

-- Create programs table
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE NOT NULL,
  organizational_outcome TEXT NOT NULL,
  program_name TEXT,
  activity TEXT NOT NULL,
  date_of_implementation TEXT,
  indicator TEXT,
  responsible_person TEXT,
  sub_industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to programs" ON public.programs FOR ALL USING (true) WITH CHECK (true);

-- Create targets table (quarterly physical targets)
CREATE TABLE public.targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  q1 NUMERIC,
  q2 NUMERIC,
  q3 NUMERIC,
  q4 NUMERIC,
  total NUMERIC,
  q1_actual NUMERIC DEFAULT 0,
  q2_actual NUMERIC DEFAULT 0,
  q3_actual NUMERIC DEFAULT 0,
  q4_actual NUMERIC DEFAULT 0,
  total_actual NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to targets" ON public.targets FOR ALL USING (true) WITH CHECK (true);

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  q1 NUMERIC DEFAULT 0,
  q2 NUMERIC DEFAULT 0,
  q3 NUMERIC DEFAULT 0,
  q4 NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  ps NUMERIC DEFAULT 0,
  traveling NUMERIC DEFAULT 0,
  training NUMERIC DEFAULT 0,
  office_supplies NUMERIC DEFAULT 0,
  fuel NUMERIC DEFAULT 0,
  other_supplies NUMERIC DEFAULT 0,
  water NUMERIC DEFAULT 0,
  electricity NUMERIC DEFAULT 0,
  postage NUMERIC DEFAULT 0,
  mobile NUMERIC DEFAULT 0,
  landline NUMERIC DEFAULT 0,
  internet NUMERIC DEFAULT 0,
  ict_internet NUMERIC DEFAULT 0,
  professional_services NUMERIC DEFAULT 0,
  janitorial NUMERIC DEFAULT 0,
  general_services NUMERIC DEFAULT 0,
  repairs_office NUMERIC DEFAULT 0,
  repairs_ict NUMERIC DEFAULT 0,
  repairs_transport NUMERIC DEFAULT 0,
  taxes NUMERIC DEFAULT 0,
  fidelity_bond NUMERIC DEFAULT 0,
  insurance NUMERIC DEFAULT 0,
  printing NUMERIC DEFAULT 0,
  representation NUMERIC DEFAULT 0,
  rents_building NUMERIC DEFAULT 0,
  rents_vehicle NUMERIC DEFAULT 0,
  other_mooe NUMERIC DEFAULT 0,
  total_mooe NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for Excel files
INSERT INTO storage.buckets (id, name, public) VALUES ('wfp-files', 'wfp-files', true);
CREATE POLICY "Allow all access to wfp-files" ON storage.objects FOR ALL USING (bucket_id = 'wfp-files') WITH CHECK (bucket_id = 'wfp-files');
