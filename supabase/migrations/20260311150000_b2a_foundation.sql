create extension if not exists pgcrypto;
create type workshop_stage as enum ('lobby','icebreaker','contributions','poll','story','complete');
create type contribution_category as enum ('experience','difficulty','hope','idea');
create type moderation_status as enum ('pending','approved','rejected');
create type poll_status as enum ('draft','open','closed');
create type moderation_action as enum ('approve','reject','restore','note');

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create function public.reject_story_version_changes() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'story versions are immutable'; end $$;

create table public.workshops (
  id uuid primary key default gen_random_uuid(), title text not null check (char_length(title) between 1 and 160),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{6,12}$'), active_stage workshop_stage not null default 'lobby',
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workshop_memberships (
  workshop_id uuid not null references public.workshops on delete cascade, user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner','organizer')), created_at timestamptz not null default now(), primary key (workshop_id,user_id)
);
create table public.workshop_stages (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops on delete cascade,
  stage workshop_stage not null, position smallint not null check (position >= 0), config jsonb not null default '{}',
  unique (workshop_id,stage), unique (workshop_id,position)
);
create table public.participant_sessions (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops on delete cascade,
  user_id uuid not null references auth.users on delete cascade, display_name text check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
  unique (workshop_id,user_id), unique (id,workshop_id)
);
create table public.contributions (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops on delete cascade,
  participant_session_id uuid not null, category contribution_category not null,
  content text not null check (char_length(content) between 1 and 1000 and btrim(content) <> ''), status moderation_status not null default 'pending',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,workshop_id),
  foreign key (participant_session_id,workshop_id) references public.participant_sessions (id,workshop_id) on delete cascade
);
create table public.polls (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 500), status poll_status not null default 'draft',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id,workshop_id)
);
create table public.poll_options (
  id uuid primary key default gen_random_uuid(), poll_id uuid not null references public.polls on delete cascade,
  label text not null check (char_length(label) between 1 and 200), position smallint not null check (position >= 0),
  unique (poll_id,id), unique (poll_id,position)
);
create table public.poll_votes (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null, poll_id uuid not null, option_id uuid not null,
  participant_session_id uuid not null, created_at timestamptz not null default now(),
  foreign key (poll_id,workshop_id) references public.polls (id,workshop_id) on delete cascade,
  foreign key (poll_id,option_id) references public.poll_options (poll_id,id) on delete cascade,
  foreign key (participant_session_id,workshop_id) references public.participant_sessions (id,workshop_id) on delete cascade,
  unique (poll_id,participant_session_id)
);
create table public.story_fragment_proposals (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops on delete cascade,
  participant_session_id uuid not null, content text not null check (char_length(content) between 1 and 2000),
  status moderation_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id,workshop_id), foreign key (participant_session_id,workshop_id) references public.participant_sessions (id,workshop_id) on delete cascade
);
create table public.story_drafts (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops on delete cascade,
  title text not null default 'Untitled story', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id,workshop_id)
);
create table public.story_draft_fragments (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null, draft_id uuid not null,
  position integer not null check (position >= 0), content text not null check (char_length(content) between 1 and 4000),
  source_proposal_id uuid, unique (draft_id,position),
  foreign key (draft_id,workshop_id) references public.story_drafts (id,workshop_id) on delete cascade,
  foreign key (source_proposal_id,workshop_id) references public.story_fragment_proposals (id,workshop_id)
);
create table public.story_versions (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops on delete cascade,
  draft_id uuid not null, version integer not null check (version > 0), title text not null,
  fragments jsonb not null check (jsonb_typeof(fragments) = 'array'), created_by uuid not null references auth.users,
  created_at timestamptz not null default now(), unique (workshop_id,version), unique (id,workshop_id),
  foreign key (draft_id,workshop_id) references public.story_drafts (id,workshop_id)
);
create table public.story_publications (
  workshop_id uuid primary key references public.workshops on delete cascade, story_version_id uuid not null,
  published_by uuid not null references auth.users, published_at timestamptz not null default now(),
  foreign key (story_version_id,workshop_id) references public.story_versions (id,workshop_id)
);
create table public.projection_state (
  workshop_id uuid primary key references public.workshops on delete cascade, active_stage workshop_stage not null default 'lobby',
  active_poll_id uuid, story_version_id uuid, featured_contribution_id uuid, settings jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  foreign key (active_poll_id,workshop_id) references public.polls (id,workshop_id),
  foreign key (story_version_id,workshop_id) references public.story_versions (id,workshop_id),
  foreign key (featured_contribution_id,workshop_id) references public.contributions (id,workshop_id)
);
create table public.moderation_records (
  id uuid primary key default gen_random_uuid(), workshop_id uuid not null references public.workshops on delete cascade,
  actor_id uuid not null references auth.users, target_table text not null check (target_table in ('contributions','story_fragment_proposals')),
  target_id uuid not null, action moderation_action not null, note text check (char_length(note) <= 1000), created_at timestamptz not null default now()
);
create table public.audit_records (
  id bigint generated always as identity primary key, workshop_id uuid not null references public.workshops on delete cascade,
  actor_id uuid references auth.users, event text not null check (char_length(event) between 1 and 100),
  details jsonb not null default '{}', created_at timestamptz not null default now()
);

create index contributions_workshop_status_idx on public.contributions (workshop_id,status,created_at);
create index proposals_workshop_status_idx on public.story_fragment_proposals (workshop_id,status,created_at);
create index moderation_target_idx on public.moderation_records (target_table,target_id);
create index audit_workshop_created_idx on public.audit_records (workshop_id,created_at desc);
alter publication supabase_realtime add table public.workshops, public.contributions;
create trigger workshops_updated before update on public.workshops for each row execute function public.set_updated_at();
create trigger contributions_updated before update on public.contributions for each row execute function public.set_updated_at();
create trigger polls_updated before update on public.polls for each row execute function public.set_updated_at();
create trigger proposals_updated before update on public.story_fragment_proposals for each row execute function public.set_updated_at();
create trigger drafts_updated before update on public.story_drafts for each row execute function public.set_updated_at();
create trigger projection_updated before update on public.projection_state for each row execute function public.set_updated_at();
create trigger story_versions_immutable before update or delete on public.story_versions for each row execute function public.reject_story_version_changes();

alter table public.workshops enable row level security;
alter table public.workshop_memberships enable row level security;
alter table public.workshop_stages enable row level security;
alter table public.participant_sessions enable row level security;
alter table public.contributions enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.story_fragment_proposals enable row level security;
alter table public.story_drafts enable row level security;
alter table public.story_draft_fragments enable row level security;
alter table public.story_versions enable row level security;
alter table public.story_publications enable row level security;
alter table public.projection_state enable row level security;
alter table public.moderation_records enable row level security;
alter table public.audit_records enable row level security;

create function public.is_workshop_organizer(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workshop_memberships where workshop_id = target and user_id = auth.uid())
$$;
create function public.is_workshop_owner(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workshop_memberships where workshop_id = target and user_id = auth.uid() and role = 'owner')
$$;
create function public.is_workshop_participant(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.participant_sessions where workshop_id = target and user_id = auth.uid())
$$;
create function public.create_workshop(workshop_title text, workshop_join_code text) returns uuid language plpgsql security definer set search_path = '' as $$
declare created_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean,false) then raise exception 'anonymous workshop creation denied'; end if;
  insert into public.workshops (title,join_code) values (workshop_title,workshop_join_code) returning id into created_id;
  insert into public.workshop_memberships (workshop_id,user_id,role) values (created_id,auth.uid(),'owner'); return created_id;
end $$;
create function public.enroll_participant(input_join_code text, participant_display_name text default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare target_workshop uuid; session_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select id into target_workshop from public.workshops where join_code = upper(btrim(input_join_code)) and is_active;
  if target_workshop is null then raise exception 'active workshop not found'; end if;
  insert into public.participant_sessions (workshop_id,user_id,display_name) values (target_workshop,auth.uid(),participant_display_name)
  on conflict (workshop_id,user_id) do update set display_name = excluded.display_name,last_seen_at = now() returning id into session_id;
  return session_id;
end $$;
create function public.publish_story_version(target_workshop uuid, target_version uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_workshop_organizer(target_workshop) then raise exception 'organizer required'; end if;
  insert into public.story_publications (workshop_id,story_version_id,published_by) values (target_workshop,target_version,auth.uid())
  on conflict (workshop_id) do update set story_version_id = excluded.story_version_id,published_by = excluded.published_by,published_at = now();
end $$;

revoke all on function public.is_workshop_organizer(uuid), public.is_workshop_owner(uuid), public.is_workshop_participant(uuid), public.create_workshop(text,text), public.enroll_participant(text,text), public.publish_story_version(uuid,uuid) from public;
grant execute on function public.is_workshop_organizer(uuid), public.is_workshop_owner(uuid), public.is_workshop_participant(uuid), public.enroll_participant(text,text), public.publish_story_version(uuid,uuid) to authenticated;
revoke execute on function public.create_workshop(text,text) from anon, authenticated;
revoke insert on table public.participant_sessions from anon, authenticated;
revoke insert, update, delete on table public.workshop_memberships from anon, authenticated;
revoke insert, update, delete on table public.story_publications from anon, authenticated;
revoke update, delete on table public.story_versions from anon, authenticated;

create policy workshops_read on public.workshops for select using (public.is_workshop_participant(id) or public.is_workshop_organizer(id));
create policy workshops_update on public.workshops for update using (public.is_workshop_organizer(id)) with check (public.is_workshop_organizer(id));
create policy workshops_delete on public.workshops for delete using (public.is_workshop_owner(id));
create policy memberships_read on public.workshop_memberships for select using (user_id = auth.uid() or public.is_workshop_owner(workshop_id));
create policy stages_read on public.workshop_stages for select using (public.is_workshop_participant(workshop_id) or public.is_workshop_organizer(workshop_id));
create policy stages_organize on public.workshop_stages for all using (public.is_workshop_organizer(workshop_id)) with check (public.is_workshop_organizer(workshop_id));
create policy sessions_read on public.participant_sessions for select using (user_id = auth.uid() or public.is_workshop_organizer(workshop_id));
create policy sessions_self_update on public.participant_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy contributions_read on public.contributions for select using ((status = 'approved' and public.is_workshop_participant(workshop_id)) or participant_session_id in (select id from public.participant_sessions where user_id = auth.uid()) or public.is_workshop_organizer(workshop_id));
create policy contributions_create on public.contributions for insert with check (status = 'pending' and participant_session_id in (select id from public.participant_sessions where user_id = auth.uid() and workshop_id = contributions.workshop_id));
create policy contributions_organize on public.contributions for all using (public.is_workshop_organizer(workshop_id)) with check (public.is_workshop_organizer(workshop_id));
create policy polls_read on public.polls for select using ((status <> 'draft' and public.is_workshop_participant(workshop_id)) or public.is_workshop_organizer(workshop_id));
create policy polls_organize on public.polls for all using (public.is_workshop_organizer(workshop_id)) with check (public.is_workshop_organizer(workshop_id));
create policy options_read on public.poll_options for select using (exists(select 1 from public.polls where id = poll_id and ((status <> 'draft' and public.is_workshop_participant(workshop_id)) or public.is_workshop_organizer(workshop_id))));
create policy options_organize on public.poll_options for all using (exists(select 1 from public.polls where id = poll_id and public.is_workshop_organizer(workshop_id))) with check (exists(select 1 from public.polls where id = poll_id and public.is_workshop_organizer(workshop_id)));
create policy votes_read on public.poll_votes for select using (participant_session_id in (select id from public.participant_sessions where user_id = auth.uid()) or public.is_workshop_organizer(workshop_id));
create policy votes_create on public.poll_votes for insert with check (participant_session_id in (select id from public.participant_sessions where user_id = auth.uid() and workshop_id = poll_votes.workshop_id) and exists(select 1 from public.polls where id = poll_id and workshop_id = poll_votes.workshop_id and status = 'open'));
create policy proposals_read on public.story_fragment_proposals for select using ((status = 'approved' and public.is_workshop_participant(workshop_id)) or participant_session_id in (select id from public.participant_sessions where user_id = auth.uid()) or public.is_workshop_organizer(workshop_id));
create policy proposals_create on public.story_fragment_proposals for insert with check (status = 'pending' and participant_session_id in (select id from public.participant_sessions where user_id = auth.uid() and workshop_id = story_fragment_proposals.workshop_id));
create policy proposals_organize on public.story_fragment_proposals for all using (public.is_workshop_organizer(workshop_id)) with check (public.is_workshop_organizer(workshop_id));
create policy drafts_organize on public.story_drafts for all using (public.is_workshop_organizer(workshop_id)) with check (public.is_workshop_organizer(workshop_id));
create policy fragments_organize on public.story_draft_fragments for all using (public.is_workshop_organizer(workshop_id)) with check (public.is_workshop_organizer(workshop_id));
create policy versions_read on public.story_versions for select using (public.is_workshop_organizer(workshop_id) or (public.is_workshop_participant(workshop_id) and exists(select 1 from public.story_publications where workshop_id = story_versions.workshop_id and story_version_id = story_versions.id)));
create policy versions_create on public.story_versions for insert with check (public.is_workshop_organizer(workshop_id) and created_by = auth.uid());
create policy publications_read on public.story_publications for select using (public.is_workshop_participant(workshop_id) or public.is_workshop_organizer(workshop_id));
create policy projection_read on public.projection_state for select using (public.is_workshop_participant(workshop_id) or public.is_workshop_organizer(workshop_id));
create policy projection_organize on public.projection_state for all using (public.is_workshop_organizer(workshop_id)) with check (public.is_workshop_organizer(workshop_id));
create policy moderation_organize on public.moderation_records for all using (public.is_workshop_organizer(workshop_id)) with check (public.is_workshop_organizer(workshop_id) and actor_id = auth.uid());
create policy audit_read on public.audit_records for select using (public.is_workshop_organizer(workshop_id));
create policy audit_append on public.audit_records for insert with check (public.is_workshop_organizer(workshop_id) and actor_id = auth.uid());

revoke update on table public.participant_sessions from authenticated;
grant update (display_name,last_seen_at) on table public.participant_sessions to authenticated;
