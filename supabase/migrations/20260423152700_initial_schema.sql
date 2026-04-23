-- Leads table: mirrors CSV columns + outreach tracking fields
create table leads (
  id uuid primary key default gen_random_uuid(),
  -- CSV fields
  tier text,              -- 1, 2, 3, REF, or metro section header
  metro text,             -- Atlanta, Miami, Phoenix, Houston, San Antonio
  physician text,
  credentials text,
  own_practice text,
  associated_medspa text,
  medspa_owner_operator text,
  medspa_location text,
  phone text,
  website text,
  source_url text,
  notes text,
  -- Outreach tracking
  status text not null default 'new' check (status in ('new', 'contacted', 'sequence_active', 'replied', 'meeting_booked', 'closed_won', 'closed_lost', 'unsubscribed')),
  email text,                     -- manually added later
  linkedin_url text,              -- manually added later
  current_sequence_id uuid,       -- FK to email_sequences
  current_step_number int default 0,
  last_contacted_at timestamptz,
  next_scheduled_at timestamptz,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email sequences (templates for multi-step outreach)
create table email_sequences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Individual steps within a sequence
create table sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references email_sequences(id) on delete cascade,
  step_number int not null,
  delay_days int not null,            -- days after previous step (or enrollment)
  subject_template text not null,     -- supports {{physician}}, {{medspa}}, etc.
  body_template text not null,
  channel text not null default 'email' check (channel in ('email', 'linkedin', 'phone')),
  created_at timestamptz not null default now(),
  unique (sequence_id, step_number)
);

-- Log of all outreach actions (sent emails, LinkedIn touches, calls)
create table outreach_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  sequence_id uuid references email_sequences(id),
  step_number int,
  channel text not null check (channel in ('email', 'linkedin', 'phone', 'manual_note')),
  subject text,
  body text,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed', 'scheduled', 'cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz default now(),
  resend_message_id text,
  created_at timestamptz not null default now()
);

-- FK from leads to email_sequences
alter table leads add constraint leads_current_sequence_fk
  foreign key (current_sequence_id) references email_sequences(id) on delete set null;

-- Indexes
create index idx_leads_status on leads(status);
create index idx_leads_metro on leads(metro);
create index idx_leads_next_scheduled on leads(next_scheduled_at) where next_scheduled_at is not null;
create index idx_outreach_log_lead on outreach_log(lead_id);
create index idx_outreach_log_scheduled on outreach_log(scheduled_for) where status = 'scheduled';

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at before update on leads
  for each row execute function update_updated_at();

create trigger email_sequences_updated_at before update on email_sequences
  for each row execute function update_updated_at();

-- Seed the default 3-email sequence from automation strategy
insert into email_sequences (id, name, description) values
  ('a0000000-0000-0000-0000-000000000001', 'Default Outreach Sequence', 'Day 2: Compliance risk, Day 6: Operational pain, Day 11: Direct ask');

insert into sequence_steps (sequence_id, step_number, delay_days, subject_template, body_template, channel) values
  ('a0000000-0000-0000-0000-000000000001', 1, 2,
   'GFE compliance for {{medspa}} — quick question',
   'Hi Dr. {{physician}},

I noticed you provide medical direction for {{medspa}} in {{metro}}. I wanted to flag something that''s been catching physicians off guard:

Texas''s January 2025 synchronous video mandate for Good Faith Exams means every GFE now requires a real-time video encounter — not just a phone call or async review. Several oversight practices we work with were using Qualiphy or phone-based workflows that no longer meet the standard.

We built a platform specifically for physicians who oversee multiple medspas — synchronous video GFEs, automated clearance notes, and audit-ready documentation across all your locations from one dashboard.

Would it be worth 10 minutes to see how it works? We''re live in production doing ~15 clearances/day.

Best,
Cameron Hightower
GFE Clearance
cameron@medclearportal.com', 'email'),

  ('a0000000-0000-0000-0000-000000000001', 2, 6,
   'Managing GFEs across {{medspa_count}} locations?',
   'Hi Dr. {{physician}},

Following up briefly — I know managing oversight across multiple medspas means juggling different EMRs, inboxes, and group texts just to track clearance requests.

Our platform gives you one dashboard for every medspa, every clearance request, and every provider. No more spreadsheet billing reconciliation or digging through Google Docs for documentation.

One physician we work with went from managing 10 medspas across email/WhatsApp/Qualiphy to having everything in one place — with defensible audit trails for every encounter.

Happy to show you in a quick 10-minute screen share. No pitch deck, just the live platform.

Cameron', 'email'),

  ('a0000000-0000-0000-0000-000000000001', 3, 11,
   'Worth a quick look?',
   'Hi Dr. {{physician}},

Last note — I built the GFE compliance platform that several Texas oversight practices now use daily. Synchronous video, automated documentation, one dashboard for all locations.

If you''re open to a 10-minute call to see if it''s relevant, I''m at cameron@medclearportal.com or you can grab a slot here: [booking link]

Either way, no worries.

Cameron', 'email');
