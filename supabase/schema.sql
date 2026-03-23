create extension if not exists "uuid-ossp";

create table if not exists boards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  position integer default 0,
  archived_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  ui_class text default '',
  position integer default 0,
  archived_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null,
  position integer default 0,
  status text default 'Assigned',
  priority text default 'Medium',
  assessor text default 'Unassigned',
  due_date date,
  qa_status text default 'Pending',
  magicplan_status text default 'No',
  issues text[] default '{}',
  notes text default '',
  archived_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  author text default 'Team',
  text text not null,
  created_at timestamptz default now()
);

create table if not exists board_columns (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  column_type text not null default 'text',
  options_json jsonb not null default '[]'::jsonb,
  position integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists task_column_values (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  board_column_id uuid not null references board_columns(id) on delete cascade,
  value_text text default '',
  created_at timestamptz default now(),
  unique (task_id, board_column_id)
);

create table if not exists board_views (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  search_text text default '',
  assessor_filter text default 'All',
  priority_filter text default 'All',
  qa_filter text default 'All',
  archived_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists board_people (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  role text not null default 'Assessor',
  archived_at timestamptz,
  created_at timestamptz default now(),
  unique (board_id, name)
);

create table if not exists workspace_views (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  view_type text not null default 'main',
  position integer not null default 0,
  locked boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists task_attachments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_url text not null,
  category text not null default 'General',
  file_size bigint default 0,
  content_type text default '',
  created_at timestamptz default now()
);

create table if not exists automation_rules (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  trigger_type text not null default 'field_equals',
  trigger_field text default '',
  trigger_value text default '',
  action_type text not null default 'notify',
  action_value text default '',
  archived_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists task_activities (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  activity_type text not null default 'update',
  title text not null,
  description text default '',
  created_at timestamptz default now()
);

create table if not exists task_dependencies (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  depends_on_task_id uuid not null references tasks(id) on delete cascade,
  created_at timestamptz default now(),
  unique (task_id, depends_on_task_id)
);

create table if not exists task_time_entries (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  minutes integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists task_templates (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  payload_json jsonb not null default '{}'::jsonb,
  archived_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists user_profiles (
  id uuid primary key,
  email text,
  full_name text default '',
  role_name text not null default 'Viewer',
  created_at timestamptz default now()
);

create table if not exists board_memberships (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  user_id uuid not null,
  role_name text not null default 'Viewer',
  created_at timestamptz default now(),
  unique (board_id, user_id)
);

create table if not exists board_permissions (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  role_name text not null,
  can_manage_structure boolean not null default false,
  can_edit_deals boolean not null default true,
  can_delete_deals boolean not null default false,
  created_at timestamptz default now(),
  unique (board_id, role_name)
);

create table if not exists board_notifications (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  title text not null,
  body text not null default '',
  notification_type text not null default 'info',
  dedupe_key text,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists notification_channels (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  channel_type text not null default 'email',
  target text not null,
  channel_label text not null default '',
  delivery_url text default '',
  enabled boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists board_invites (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  email text not null,
  role_name text not null default 'Viewer',
  invite_token text not null,
  status text not null default 'pending',
  created_at timestamptz default now(),
  accepted_at timestamptz
);

insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public task files are readable'
  ) then
    create policy "Public task files are readable"
    on storage.objects
    for select
    using (bucket_id = 'task-files');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public task files are uploadable'
  ) then
    create policy "Public task files are uploadable"
    on storage.objects
    for insert
    with check (bucket_id = 'task-files');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public task files are removable'
  ) then
    create policy "Public task files are removable"
    on storage.objects
    for delete
    using (bucket_id = 'task-files');
  end if;
end $$;

insert into boards (name, description, position)
select * from (
  values
    ('Domna Homes Operations Platform', '', 1)
) as seed(name, description, position)
where not exists (select 1 from boards);

with board_refs as (
  select id, name from boards
)
insert into groups (board_id, name, ui_class, position)
select * from (
  select (select id from board_refs where name = 'Domna Homes Operations Platform'), 'Assigned', 'assigned', 1
  union all
  select (select id from board_refs where name = 'Domna Homes Operations Platform'), 'Survey Done', 'survey', 2
  union all
  select (select id from board_refs where name = 'Domna Homes Operations Platform'), 'QA', 'qa', 3
  union all
  select (select id from board_refs where name = 'Domna Homes Operations Platform'), 'Submitted', 'submitted', 4
) seed(board_id, name, ui_class, position)
where not exists (select 1 from groups);

with group_refs as (
  select g.id, g.name, b.name as board_name
  from groups g
  join boards b on b.id = g.board_id
)
insert into tasks (group_id, title, position, status, priority, assessor, due_date, qa_status, magicplan_status, issues, notes)
select * from (
  select
    (select id from group_refs where board_name = 'Domna Homes Operations Platform' and name = 'Assigned'),
    '117 Alderney Street - Tabeeb', 1, 'Assigned', 'High', 'Tabeeb', '2026-03-20', 'Pending', 'No', array['Ventilation'], 'Awaiting upload of full folder information.'
  union all
  select
    (select id from group_refs where board_name = 'Domna Homes Operations Platform' and name = 'Assigned'),
    '23 Digby Road - Horace', 2, 'Assigned', 'Medium', 'Horace', '2026-03-21', 'Pending', 'No', array['Heating', 'Wall Types'], 'Previous correction issue noted. Needs double-check before resubmission.'
  union all
  select
    (select id from group_refs where board_name = 'Domna Homes Operations Platform' and name = 'Survey Done'),
    '36a London Road - Horace', 1, 'Survey Done', 'High', 'Horace', '2026-03-19', 'In Review', 'Yes', array['Room in Roof', 'Ventilation', 'MagicPlan'], 'Survey complete. Inputs require technical validation.'
  union all
  select
    (select id from group_refs where board_name = 'Domna Homes Operations Platform' and name = 'QA'),
    '1 Llys Drew SE16 3EY', 1, 'QA', 'High', 'Lewis', '2026-03-19', 'Needs Correction', 'Yes', array['Ventilation', 'Door Undercut', 'Trickle Vents'], 'Cross-check floor plan PDF against condition report merge.'
  union all
  select
    (select id from group_refs where board_name = 'Domna Homes Operations Platform' and name = 'Submitted'),
    'Sample Completed Job', 1, 'Submitted', 'Low', 'Allan', '2026-03-18', 'Passed', 'Yes', array[]::text[], 'Ready for archive.'
) seed(group_id, title, position, status, priority, assessor, due_date, qa_status, magicplan_status, issues, notes)
where not exists (select 1 from tasks);

insert into comments (task_id, author, text)
select * from (
  select (select id from tasks where title = '117 Alderney Street - Tabeeb' limit 1), 'Seb', 'Check folder completeness before QA.'
  union all
  select (select id from tasks where title = '23 Digby Road - Horace' limit 1), 'Manager', 'Ensure full condition report is aligned with photo evidence.'
  union all
  select (select id from tasks where title = '36a London Road - Horace' limit 1), 'QA', 'Verify room-in-roof classification and ventilation strategy.'
  union all
  select (select id from tasks where title = '1 Llys Drew SE16 3EY' limit 1), 'Seb', 'Merged PDF nearly working. Floor plan extraction still incomplete.'
) seed(task_id, author, text)
where not exists (select 1 from comments);
