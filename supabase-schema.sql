-- =============================================
-- CHESS KINDERGARTEN - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Users profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'child')),
  is_approved BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  kindergarten_name TEXT, -- for teachers
  garden_id UUID, -- for children (which garden they belong to)
  group_id UUID, -- for children (which group they belong to)
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gardens (managed by teachers)
CREATE TABLE public.gardens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_name TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (within gardens)
CREATE TABLE public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  garden_id UUID REFERENCES public.gardens(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_open BOOLEAN DEFAULT TRUE,
  max_children INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Online chess games
CREATE TABLE public.chess_games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  white_player_id UUID REFERENCES public.profiles(id),
  black_player_id UUID REFERENCES public.profiles(id),
  fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished', 'cancelled')),
  winner_id UUID REFERENCES public.profiles(id),
  result TEXT, -- 'white', 'black', 'draw'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game invitations
CREATE TABLE public.game_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chess_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_invitations ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- GARDENS POLICIES
CREATE POLICY "Approved gardens viewable by all authenticated" ON public.gardens
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers can create gardens" ON public.gardens
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own gardens" ON public.gardens
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Admin can update any garden" ON public.gardens
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- GROUPS POLICIES
CREATE POLICY "Groups viewable by members and teachers" ON public.groups
  FOR SELECT USING (
    auth.uid() = teacher_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND group_id = groups.id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin'))
  );

CREATE POLICY "Teachers can create groups" ON public.groups
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (SELECT 1 FROM public.gardens WHERE id = garden_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Teachers can update their groups" ON public.groups
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Admin can manage groups" ON public.groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- CHESS GAMES POLICIES
CREATE POLICY "Players can view their games" ON public.chess_games
  FOR SELECT USING (
    auth.uid() = white_player_id OR
    auth.uid() = black_player_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "Players can create games" ON public.chess_games
  FOR INSERT WITH CHECK (
    auth.uid() = white_player_id OR auth.uid() = black_player_id
  );

CREATE POLICY "Players can update their games" ON public.chess_games
  FOR UPDATE USING (
    auth.uid() = white_player_id OR auth.uid() = black_player_id
  );

-- GAME INVITATIONS POLICIES
CREATE POLICY "Players can view their invitations" ON public.game_invitations
  FOR SELECT USING (
    auth.uid() = from_player_id OR auth.uid() = to_player_id
  );

CREATE POLICY "Players can create invitations" ON public.game_invitations
  FOR INSERT WITH CHECK (auth.uid() = from_player_id);

CREATE POLICY "Players can update invitations" ON public.game_invitations
  FOR UPDATE USING (
    auth.uid() = from_player_id OR auth.uid() = to_player_id
  );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profile will be created by the app after signup with role info
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at on chess_games
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chess_games_updated_at
  BEFORE UPDATE ON public.chess_games
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chess_games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- =============================================
-- INITIAL ADMIN USER
-- After creating admin user via Auth, run:
-- INSERT INTO public.profiles (id, email, full_name, role, is_approved)
-- VALUES ('<admin-auth-uid>', 'lulik231@gmail.com', 'מנהל', 'admin', true);
-- =============================================
