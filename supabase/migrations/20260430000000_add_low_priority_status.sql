-- Allow new lead status `low_priority` for deprioritized leads.
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
    'unsubscribed',
    'low_priority'
  )
);
