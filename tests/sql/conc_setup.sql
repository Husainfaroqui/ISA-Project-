-- Helper for concurrency tests (TEST ONLY). Creates a scholar with n sourced contributions; optionally publishes it (created by e1, approved by e2).
create or replace function conc_claims(u uuid) returns void language sql as
$$ select set_config('request.jwt.claims', jsonb_build_object('sub',u,'app_metadata',jsonb_build_object('role','editor'))::text, false) $$;
create or replace function conc_make(sl text, nsrc int, pub boolean) returns void language plpgsql as $$
declare e1 uuid:='00000000-0000-0000-0000-0000000000e1'; e2 uuid:='00000000-0000-0000-0000-0000000000e2'; sid uuid; kid uuid; srcid uuid; i int;
begin
  perform conc_claims(e1);
  insert into scholars(slug,region,period_group) values (sl,'R','early') returning id into sid;
  insert into scholar_translations(scholar_id,lang,name) values (sid,'en',sl);
  for i in 1..nsrc loop
    insert into contributions(scholar_id,description) values (sid,sl||'-c'||i) returning id into kid;
    insert into sources(title) values (sl||'-S'||i) returning id into srcid;
    insert into claim_sources(contribution_id,source_id,locator) values (kid,srcid,'p'||i);
  end loop;
  update scholars set status='in_review' where id=sid;
  perform conc_claims(e2);
  insert into editorial_reviews(scholar_id,decision,content_rev) select id,'approved',content_rev from scholars where id=sid;
  if pub then update scholars set status='published' where id=sid; end if;
end $$;
