-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_stats (
    "userId",
    email,
    all_time_completed,
    current_streak,
    completed_this_week,
    completed_today,
    last_completed_date,
    subscription_level,
    ai_suggestions_enabled,
    user_mood,
    show_analytics,
    notifications_enabled,
    mood_checkins_today,
    ai_splits_today,
    last_daily_reset,
    last_activity_at,
    timezone
  ) VALUES (
    NEW.id,
    NEW.email,
    0,
    0,
    0,
    0,
    NULL,
    'free',
    true,
    'neutral',
    true,
    true,
    0,
    0,
    NOW(),
    NOW(),
    'UTC'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_stats TO anon, authenticated;
GRANT ALL ON public.tasks TO anon, authenticated; 