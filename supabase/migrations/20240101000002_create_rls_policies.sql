-- Enable Row Level Security on all tables
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chapter_links ENABLE ROW LEVEL SECURITY;

-- Chapters policies
DROP POLICY IF EXISTS "Users can view chapters they belong to" ON public.chapters;
CREATE POLICY "Users can view chapters they belong to"
ON public.chapters FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = chapters.id AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Presidents can update their chapter" ON public.chapters;
CREATE POLICY "Presidents can update their chapter"
ON public.chapters FOR UPDATE
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = chapters.id 
    AND ucl.is_active = true 
    AND r.name = 'President'
  )
);

DROP POLICY IF EXISTS "Anyone can create chapters" ON public.chapters;
CREATE POLICY "Anyone can create chapters"
ON public.chapters FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Roles policies (read-only for most users)
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
CREATE POLICY "Anyone can view roles"
ON public.roles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Chapter members can view each other" ON public.users;
CREATE POLICY "Chapter members can view each other"
ON public.users FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl1.user_id 
    FROM public.user_chapter_links ucl1
    JOIN public.user_chapter_links ucl2 ON ucl1.chapter_id = ucl2.chapter_id
    WHERE ucl2.user_id = users.id 
    AND ucl1.is_active = true 
    AND ucl2.is_active = true
  )
);

-- User chapter links policies
DROP POLICY IF EXISTS "Users can view their own chapter links" ON public.user_chapter_links;
CREATE POLICY "Users can view their own chapter links"
ON public.user_chapter_links FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chapter links" ON public.user_chapter_links;
CREATE POLICY "Users can insert their own chapter links"
ON public.user_chapter_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Chapter members can view chapter links" ON public.user_chapter_links;
CREATE POLICY "Chapter members can view chapter links"
ON public.user_chapter_links FOR SELECT
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    WHERE ucl.chapter_id = user_chapter_links.chapter_id 
    AND ucl.is_active = true
  )
);

DROP POLICY IF EXISTS "Presidents can manage chapter links" ON public.user_chapter_links;
CREATE POLICY "Presidents can manage chapter links"
ON public.user_chapter_links FOR ALL
USING (
  auth.uid() IN (
    SELECT ucl.user_id 
    FROM public.user_chapter_links ucl 
    JOIN public.roles r ON ucl.role_id = r.id
    WHERE ucl.chapter_id = user_chapter_links.chapter_id 
    AND ucl.is_active = true 
    AND r.name = 'President'
  )
);
