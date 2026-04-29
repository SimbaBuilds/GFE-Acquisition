alter table leads add column linkedin_not_found boolean not null default false;

create index idx_leads_linkedin_not_found on leads(linkedin_not_found) where linkedin_not_found = true;
