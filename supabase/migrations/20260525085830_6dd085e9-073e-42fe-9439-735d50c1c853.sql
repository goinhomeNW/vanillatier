
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  region TEXT NOT NULL,
  current_tier TEXT,
  peak_tier TEXT,
  retired BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read players"
  ON public.players FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert players"
  ON public.players FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update players"
  ON public.players FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete players"
  ON public.players FOR DELETE
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER TABLE public.players REPLICA IDENTITY FULL;
