-- Private bucket for weekly doctor contractor remittance PDFs.
-- Edge functions write with service role and email signed links.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doctor-remittances',
  'doctor-remittances',
  false,
  5242880,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
