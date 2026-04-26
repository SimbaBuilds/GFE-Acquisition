-- LinkedIn outreach state per lead
alter table leads add column linkedin_connected boolean not null default false;
alter table leads add column linkedin_messaged boolean not null default false;

create index idx_leads_linkedin_connected on leads(linkedin_connected) where linkedin_connected = true;
create index idx_leads_linkedin_messaged on leads(linkedin_messaged) where linkedin_messaged = true;
