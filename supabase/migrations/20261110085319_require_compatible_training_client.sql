begin;
-- A full authenticated read also proves that this protocol migration is present.
alter table public.training_documents add column client_protocol integer generated always as (8) stored;
-- Compatibility fence only: ownership, RLS and the caller JWT remain mandatory.
-- Apply before publishing the build that writes minClientBuild / session snapshots.
-- PostgREST request headers: https://docs.postgrest.org/en/stable/references/transactions.html
create or replace function public.save_training_document(p_user_id uuid,p_payload jsonb,p_expected_revision bigint)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 saved public.training_documents%rowtype;
 current_payload jsonb;
 incoming_min integer:=0;
 stored_min integer:=0;
 writer_build integer:=0;
 client_info text;
begin
 if auth.uid() is null or auth.uid()<>p_user_id then
  raise exception using errcode='42501',message='Account mismatch';
 end if;
 if p_expected_revision is null or p_expected_revision<0 then
  raise exception using errcode='22023',message='Invalid revision';
 end if;
 if p_payload ? 'minClientBuild' then
  if coalesce(p_payload->>'minClientBuild','')!~'^[0-9]{1,4}$' then
   raise exception using errcode='22023',message='Invalid client compatibility version';
  end if;
  incoming_min:=(p_payload->>'minClientBuild')::integer;
 end if;
 select payload into current_payload from public.training_documents where user_id=p_user_id for update;
 if coalesce(current_payload->>'minClientBuild','')~'^[0-9]{1,4}$' then
  stored_min:=(current_payload->>'minClientBuild')::integer;
 end if;
 client_info:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-client-info','');
 if client_info~'^treino/[0-9]{1,4}$' then writer_build:=split_part(client_info,'/',2)::integer;end if;
 if writer_build<greatest(incoming_min,stored_min) then
  raise exception using errcode='PT426',message='Atualiza a página do Treino antes de sincronizar. Esta versão não pode substituir dados mais recentes; as alterações locais foram preservadas.';
 end if;
 if p_expected_revision=0 then
  insert into public.training_documents(user_id,payload,revision)
   values(p_user_id,p_payload,1) on conflict(user_id) do nothing returning * into saved;
 else
  update public.training_documents set payload=p_payload,revision=revision+1,updated_at=now()
   where user_id=p_user_id and revision=p_expected_revision returning * into saved;
 end if;
 if saved.user_id is null then raise exception using errcode='PT409',message='revision_conflict';end if;
 insert into public.training_backups(user_id,revision,payload) values(saved.user_id,saved.revision,saved.payload);
 delete from public.training_backups where user_id=p_user_id and revision<=saved.revision-20;
 return jsonb_build_object('revision',saved.revision,'updated_at',saved.updated_at);
end;
$$;
revoke all on function public.save_training_document(uuid,jsonb,bigint) from public,anon;
grant execute on function public.save_training_document(uuid,jsonb,bigint) to authenticated;
notify pgrst,'reload schema';
commit;
