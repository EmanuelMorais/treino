-- Realtime Postgres Changes respects the existing per-account SELECT RLS policy.
-- Backups remain outside the publication; no grants or policies are widened.
do $$
begin
 if not exists (
  select 1 from pg_publication_tables
  where pubname='supabase_realtime' and schemaname='public' and tablename='training_documents'
 ) then
  alter publication supabase_realtime add table public.training_documents;
 end if;
end;
$$;
