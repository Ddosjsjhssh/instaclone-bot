-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create admins table
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create tables table for game tables
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL,
  creator_telegram_user_id BIGINT NOT NULL,
  acceptor_telegram_user_id BIGINT,
  amount DECIMAL(10, 2) NOT NULL,
  game_type TEXT NOT NULL,
  options TEXT,
  status TEXT DEFAULT 'open' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for bot operations)
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on admins" ON public.admins FOR ALL USING (true);
CREATE POLICY "Allow all operations on tables" ON public.tables FOR ALL USING (true);

-- Create indexes
CREATE INDEX idx_users_telegram_id ON public.users(telegram_user_id);
CREATE INDEX idx_admins_telegram_id ON public.admins(telegram_user_id);
CREATE INDEX idx_tables_status ON public.tables(status);

-- Insert first admin
INSERT INTO public.admins (telegram_user_id, username) 
VALUES (6965488457, 'Hidden_Xman');