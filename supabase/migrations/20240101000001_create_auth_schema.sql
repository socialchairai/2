-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_tier AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Create chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    fraternity_name VARCHAR(255) NOT NULL,
    chapter_code VARCHAR(10) NOT NULL,
    location VARCHAR(255),
    founded_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_name, fraternity_name, chapter_code)
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    avatar_url TEXT,
    tier user_tier DEFAULT 'free',
    status user_status DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_chapter_links table
CREATE TABLE IF NOT EXISTS public.user_chapter_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chapters_school_fraternity ON public.chapters(school_name, fraternity_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_chapter_links_user_id ON public.user_chapter_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_links_chapter_id ON public.user_chapter_links(chapter_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_links_active ON public.user_chapter_links(is_active) WHERE is_active = true;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_chapter_links_updated_at BEFORE UPDATE ON public.user_chapter_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO public.roles (name, description, permissions) VALUES
('Social Chair', 'Responsible for planning and organizing social events', '{"events": ["create", "read", "update", "delete"], "tasks": ["create", "read", "update", "delete"]}'),
('Treasurer', 'Manages chapter finances and budgets', '{"budget": ["create", "read", "update", "delete"], "events": ["read"], "tasks": ["read"]}'),
('President', 'Chapter leader with full access', '{"all": ["create", "read", "update", "delete"]}'),
('Vice President', 'Assistant to president with elevated permissions', '{"events": ["create", "read", "update", "delete"], "tasks": ["create", "read", "update", "delete"], "budget": ["read"]}'),
('Secretary', 'Manages chapter records and communications', '{"events": ["read"], "tasks": ["create", "read", "update"], "budget": ["read"]}'),
('Member', 'Basic chapter member', '{"events": ["read"], "tasks": ["read"], "budget": ["read"]}');

-- Enable realtime for all tables
alter publication supabase_realtime add table public.chapters;
alter publication supabase_realtime add table public.roles;
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.user_chapter_links;
