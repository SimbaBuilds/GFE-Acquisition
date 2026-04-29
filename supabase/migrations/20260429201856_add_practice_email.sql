-- Add practice_email column (separate from `email`, which is the doctor's direct/personal address).
alter table leads add column practice_email text;

-- Allow new lead status `practice_email_obtained` for the call-and-collect step.
alter table leads drop constraint if exists leads_status_check;
alter table leads add constraint leads_status_check check (
  status in (
    'new',
    'contacted',
    'practice_email_obtained',
    'sequence_active',
    'replied',
    'meeting_booked',
    'closed_won',
    'closed_lost',
    'unsubscribed'
  )
);
