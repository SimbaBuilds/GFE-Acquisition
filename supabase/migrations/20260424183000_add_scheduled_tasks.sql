-- Generic scheduled tasks: cron-driven dispatcher for non-email work (sms, webhooks, etc).
-- Sits alongside outreach_log, which stays lead-specific. Keeps generic infra separate from domain logic.
create table scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type text not null check (task_type in ('sms')),
  payload jsonb not null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'failed', 'cancelled')),
  attempts int not null default 0,
  last_error text,
  last_response jsonb,
  completed_at timestamptz,
  idempotency_key text unique,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_scheduled_tasks_due on scheduled_tasks(scheduled_for) where status = 'scheduled';

-- Seed: July 1, 2026 SMS reminder for FDA peptide advisory committee outcome.
insert into scheduled_tasks (task_type, payload, scheduled_for, idempotency_key, notes) values (
  'sms',
  jsonb_build_object(
    'phone', '+15127690768',
    'message', 'FDA peptide advisory committee — check StatNews + FDA.gov for outcome on BPC-157 and 6 other peptides under compounding access review (RFK Jr / Joe Rogan thread).'
  ),
  '2026-07-01T14:00:00Z',
  'peptide-reminder-2026-07-01',
  'Reminder for FDA pharmacy compounding advisory committee meeting on peptides'
);
