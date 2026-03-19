create extension if not exists "uuid-ossp";

create table if not exists boards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text default '',
  position integer default 0,
  created_at timestamptz default now()
);

create table if not exists groups (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  ui_class text default '',
  position integer default 0,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null,
  status text default 'Assigned',
  priority text default 'Medium',
  assessor text default 'Unassigned',
  due_date date,
  qa_status text default 'Pending',
  magicplan_status text default 'No',
  issues text[] default '{}',
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  author text default 'Team',
  text text not null,
  created_at timestamptz default now()
);

insert into boards (name, description, position)
select * from (
  values
    ('Domna EPC Pipeline', 'Track assessments from allocation through QA and submission.', 1),
    ('Assessor Performance', 'Manager overview of quality, recurring issues, and support needs.', 2)
) as seed(name, description, position)
where not exists (select 1 from boards);

with board_refs as (
  select id, name from boards
)
insert into groups (board_id, name, ui_class, position)
select * from (
  select (select id from board_refs where name = 'Domna EPC Pipeline'), 'Assigned', 'assigned', 1
  union all
  select (select id from board_refs where name = 'Domna EPC Pipeline'), 'Survey Done', 'survey', 2
  union all
  select (select id from board_refs where name = 'Domna EPC Pipeline'), 'QA', 'qa', 3
  union all
  select (select id from board_refs where name = 'Domna EPC Pipeline'), 'Submitted', 'submitted', 4
  union all
  select (select id from board_refs where name = 'Assessor Performance'), 'Needs Support', 'support', 1
  union all
  select (select id from board_refs where name = 'Assessor Performance'), 'Stable', 'stable', 2
) seed(board_id, name, ui_class, position)
where not exists (select 1 from groups);

with group_refs as (
  select g.id, g.name, b.name as board_name
  from groups g
  join boards b on b.id = g.board_id
)
insert into tasks (group_id, title, status, priority, assessor, due_date, qa_status, magicplan_status, issues, notes)
select * from (
  select
    (select id from group_refs where board_name = 'Domna EPC Pipeline' and name = 'Assigned'),
    '117 Alderney Street - Tabeeb', 'Assigned', 'High', 'Tabeeb', '2026-03-20', 'Pending', 'No', array['Ventilation'], 'Awaiting upload of full folder information.'
  union all
  select
    (select id from group_refs where board_name = 'Domna EPC Pipeline' and name = 'Assigned'),
    '23 Digby Road - Horace', 'Assigned', 'Medium', 'Horace', '2026-03-21', 'Pending', 'No', array['Heating', 'Wall Types'], 'Previous correction issue noted. Needs double-check before resubmission.'
  union all
  select
    (select id from group_refs where board_name = 'Domna EPC Pipeline' and name = 'Survey Done'),
    '36a London Road - Horace', 'Survey Done', 'High', 'Horace', '2026-03-19', 'In Review', 'Yes', array['Room in Roof', 'Ventilation', 'MagicPlan'], 'Survey complete. Inputs require technical validation.'
  union all
  select
    (select id from group_refs where board_name = 'Domna EPC Pipeline' and name = 'QA'),
    '1 Llys Drew SE16 3EY', 'QA', 'High', 'Lewis', '2026-03-19', 'Needs Correction', 'Yes', array['Ventilation', 'Door Undercut', 'Trickle Vents'], 'Cross-check floor plan PDF against condition report merge.'
  union all
  select
    (select id from group_refs where board_name = 'Domna EPC Pipeline' and name = 'Submitted'),
    'Sample Completed Job', 'Submitted', 'Low', 'Allan', '2026-03-18', 'Passed', 'Yes', array[]::text[], 'Ready for archive.'
  union all
  select
    (select id from group_refs where board_name = 'Assessor Performance' and name = 'Needs Support'),
    'Horace - Performance Review', 'Review', 'High', 'Horace', '2026-03-22', 'Open', 'Mixed', array['Main Heating', 'Ventilation', 'Room in Roof', 'Wall Types', 'MagicPlan'], 'Would benefit from structured support on classification and QA close-out discipline.'
  union all
  select
    (select id from group_refs where board_name = 'Assessor Performance' and name = 'Stable'),
    'Lewis - Performance Review', 'Review', 'Medium', 'Lewis', '2026-03-25', 'Open', 'Yes', array['Minor QA Queries'], 'Generally strong consistency. Small technical queries only.'
) seed(group_id, title, status, priority, assessor, due_date, qa_status, magicplan_status, issues, notes)
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
  union all
  select (select id from tasks where title = 'Horace - Performance Review' limit 1), 'Manager', 'Recurring audit issues require targeted coaching.'
) seed(task_id, author, text)
where not exists (select 1 from comments);
