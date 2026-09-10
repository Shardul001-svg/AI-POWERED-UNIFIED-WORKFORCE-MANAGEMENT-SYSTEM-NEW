-- Enable Supabase Realtime for notifications table
begin;

-- Add notifications table to the default realtime publication if not already added
alter publication supabase_realtime add table public.notifications;

-- Set replica identity to full so postgres_changes receives complete payload for UPDATE and DELETE events
alter table public.notifications replica identity full;

commit;
