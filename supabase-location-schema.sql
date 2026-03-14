-- ============================================
-- ORB SOCIAL - USER LOCATIONS SCHEMA
-- ============================================
-- Complete schema with RLS policies for friends-only visibility
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create user_locations table
CREATE TABLE IF NOT EXISTS public.user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    accuracy FLOAT DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    battery_level INTEGER DEFAULT NULL,
    is_charging BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_last_seen ON public.user_locations(last_seen);

-- 3. Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- 4. Enable Row Level Security
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Policy 1: Users can view their own location
CREATE POLICY "Users can view own location"
    ON public.user_locations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own location
CREATE POLICY "Users can insert own location"
    ON public.user_locations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own location
CREATE POLICY "Users can update own location"
    ON public.user_locations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own location
CREATE POLICY "Users can delete own location"
    ON public.user_locations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy 5: Friends can view each other's locations
-- This checks the friends table for accepted friendships
CREATE POLICY "Friends can view friend locations"
    ON public.user_locations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.friends
            WHERE 
                friends.status = 'accepted'
                AND (
                    (friends.user_id = auth.uid() AND friends.friend_id = user_locations.user_id)
                    OR
                    (friends.friend_id = auth.uid() AND friends.user_id = user_locations.user_id)
                )
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_seen = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update timestamps
CREATE TRIGGER update_location_timestamp_trigger
    BEFORE INSERT OR UPDATE ON public.user_locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_location_timestamp();

-- Function to clean up old locations (optional maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_locations()
RETURNS VOID AS $$
BEGIN
    -- Keep only the latest location per user
    DELETE FROM public.user_locations a
    USING public.user_locations b
    WHERE a.user_id = b.user_id
        AND a.last_seen < b.last_seen;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FRIENDS TABLE (Create if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);

-- Enable RLS on friends table
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Friends table policies
CREATE POLICY "Users can view their own friendships"
    ON public.friends
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
    ON public.friends
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships"
    ON public.friends
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friendships"
    ON public.friends
    FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================
-- 
-- 1. Run this entire script in Supabase SQL Editor
-- 2. The table will automatically track user locations
-- 3. Realtime is enabled for live updates
-- 4. RLS ensures only friends can see each other's locations
-- 
-- To broadcast location from frontend:
-- ```javascript
-- const channel = supabase.channel('user_locations_broadcast')
--   .on('broadcast', { event: 'location_update' }, (payload) => {
--     // Handle friend location update
--   })
--   .subscribe()
-- 
-- // Send location
-- channel.send({
--   type: 'broadcast',
--   event: 'location_update',
--   payload: { latitude, longitude, accuracy }
-- })
-- ```
-- 
-- To persist location to database:
-- ```javascript
-- await supabase.from('user_locations').upsert({
--   user_id: user.id,
--   latitude,
--   longitude,
--   accuracy
-- }, { onConflict: 'user_id' })
-- ```
-- 
-- ============================================
