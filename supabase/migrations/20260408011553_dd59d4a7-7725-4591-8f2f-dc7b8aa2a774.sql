
-- Create responsible_persons table
CREATE TABLE public.responsible_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, division_id)
);

-- Enable RLS
ALTER TABLE public.responsible_persons ENABLE ROW LEVEL SECURITY;

-- Allow public access (standalone dashboard)
CREATE POLICY "Allow all access to responsible_persons"
  ON public.responsible_persons FOR ALL
  TO public USING (true) WITH CHECK (true);

-- Add responsible_person_id to uploads table
ALTER TABLE public.uploads ADD COLUMN responsible_person_id UUID REFERENCES public.responsible_persons(id) ON DELETE CASCADE;
