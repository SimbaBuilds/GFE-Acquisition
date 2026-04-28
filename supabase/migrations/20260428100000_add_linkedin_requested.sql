alter table leads add column linkedin_connection_requested boolean not null default false;

create index idx_leads_linkedin_requested on leads(linkedin_connection_requested) where linkedin_connection_requested = true;
