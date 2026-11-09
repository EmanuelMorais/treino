-- One private training document per authenticated account, plus the last 20 saves.
begin;
create table public.training_documents (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null check (jsonb_typeof(payload)='object' and payload->>'version'='1'),
 revision bigint not null default 1 check (revision>0),
 updated_at timestamptz not null default now(),
 constraint training_document_size check (octet_length(payload::text)<=15728640)
);
create table public.training_backups (
 user_id uuid not null references auth.users(id) on delete cascade,
 revision bigint not null check (revision>0),
 payload jsonb not null,
 created_at timestamptz not null default now(),
 primary key (user_id,revision)
);
alter table public.training_documents enable row level security;
alter table public.training_backups enable row level security;
create policy "Read own training" on public.training_documents for select to authenticated using ((select auth.uid())=user_id);
create policy "Create own training" on public.training_documents for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own training" on public.training_documents for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Read own backups" on public.training_backups for select to authenticated using ((select auth.uid())=user_id);
create policy "Create own backups" on public.training_backups for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Prune own backups" on public.training_backups for delete to authenticated using ((select auth.uid())=user_id);
revoke all on public.training_documents,public.training_backups from public,anon;
grant usage on schema public to authenticated;
grant select,insert,update on public.training_documents to authenticated;
grant select,insert,delete on public.training_backups to authenticated;

create function public.save_training_document(p_user_id uuid,p_payload jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.training_documents%rowtype;
begin
 if auth.uid() is null or auth.uid()<>p_user_id then
  raise exception using errcode='42501',message='Account mismatch';
 end if;
 if p_expected_revision is null or p_expected_revision<0 then
  raise exception using errcode='22023',message='Invalid revision';
 end if;
 if p_expected_revision=0 then
  insert into public.training_documents(user_id,payload,revision)
   values(p_user_id,p_payload,1) on conflict(user_id) do nothing returning * into saved;
 else
  update public.training_documents set payload=p_payload,revision=revision+1,updated_at=now()
   where user_id=p_user_id and revision=p_expected_revision returning * into saved;
 end if;
 if saved.user_id is null then
  raise exception using errcode='PT409',message='revision_conflict';
 end if;
 insert into public.training_backups(user_id,revision,payload) values(saved.user_id,saved.revision,saved.payload);
 delete from public.training_backups where user_id=p_user_id and revision<=saved.revision-20;
 return jsonb_build_object('revision',saved.revision,'updated_at',saved.updated_at);
end;
$$;
revoke all on function public.save_training_document(uuid,jsonb,bigint) from public,anon;
grant execute on function public.save_training_document(uuid,jsonb,bigint) to authenticated;
commit;
