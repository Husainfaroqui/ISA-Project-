\set ON_ERROR_STOP on
create function t_as(r text, sub uuid default null, app text default null) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', case when sub is null then '{}' else jsonb_build_object('sub',sub,'app_metadata',jsonb_build_object('role',app))::text end, false);
  execute 'reset role'; if r <> 'postgres' then execute 'set role '||r; end if; end $$;
create function t_n(q text) returns int language plpgsql as $$ declare n int; begin execute 'select count(*) from ('||q||') x' into n; return n; end $$;
create function t_fails(q text) returns boolean language plpgsql as $$ begin execute q; return false; exception when others then return true; end $$;
create function t_ok(cond boolean, msg text) returns void language plpgsql as $$ begin if not cond then raise exception 'FAIL: %', msg; end if; raise notice 'ok: %', msg; end $$;
create function t_rev(sid uuid, d text) returns void language plpgsql as $$ begin insert into editorial_reviews(scholar_id,decision,content_rev) select id,d,content_rev from scholars where id=sid; end $$;
create function t_noop(q text) returns boolean language plpgsql as $$ declare n int; begin execute q; get diagnostics n = row_count; return n=0; exception when others then return true; end $$;
grant execute on all functions in schema public to anon, authenticated;

do $$ declare e1 uuid:='00000000-0000-0000-0000-0000000000e1'; e2 uuid:='00000000-0000-0000-0000-0000000000e2'; u1 uuid:='00000000-0000-0000-0000-0000000000a1';
 a uuid; b uuid; ca uuid; wb uuid; begin
 -- editor e1 creates two drafts with content and sources
 perform t_as('authenticated', e1, 'editor');
 insert into scholars(slug,region,period_group) values ('pub-a','R','early') returning id into a;
 insert into scholars(slug,region,period_group) values ('draft-b','R','early') returning id into b;
 insert into scholar_translations(scholar_id,lang,name) values (a,'en','A'),(b,'en','B');
 insert into contributions(scholar_id,description) values (a,'claim A') returning id into ca;
 insert into works(scholar_id,original_title) values (b,'work B') returning id into wb;
 insert into sources(title) values ('SRC-A'),('SRC-B'),('SRC-ORPHAN');
 insert into claim_sources(contribution_id,source_id,locator,evidence_notes) select ca,id,'p.1','n' from sources where title='SRC-A';
 insert into claim_sources(work_id,source_id,locator) select wb,id,'p.2' from sources where title='SRC-B';
 perform t_ok(t_fails($q$update scholars set status='published' where slug='draft-b'$q$), 'cannot publish draft directly (must be in_review)');
 update scholars set status='in_review' where id in (a,b);
 perform t_ok(t_fails($q$update scholars set status='published' where slug='pub-a'$q$), 'publish blocked without approved review');
 perform t_rev(a,'approved');
 perform t_ok(t_fails($q$update scholars set status='published' where slug='pub-a'$q$), 'creator cannot self-approve');
 perform t_as('authenticated', e2, 'editor');
 perform t_rev(a,'approved');
 update scholars set status='published' where id=a;
 perform t_ok(t_fails($q$update scholars set status='published' where slug='draft-b'$q$) , 'draft-b still unpublishable (no review)');
 perform t_ok(t_fails($q$insert into scholars(slug,region,period_group,status) values ('x','R','early','published')$q$), 'cannot insert as published');
 perform t_ok(t_fails($q$delete from claim_sources where contribution_id is not null$q$), 'cannot remove last source of published scholar');
 perform t_ok(t_fails($q$delete from contributions$q$), 'cannot delete last sourced contribution of published scholar');
 perform t_ok(t_fails($q$update editorial_reviews set notes='x'$q$) or t_n('select 1 from editorial_reviews where notes=''x''')=0, 'reviews cannot be edited');
 perform t_ok(t_n('select 1 from editorial_reviews')=2 and t_fails($q$delete from editorial_reviews$q$) or t_n('select 1 from editorial_reviews')=2, 'reviews cannot be deleted');
 perform t_ok(t_n('select 1 from scholars')=2 and t_n('select 1 from sources')=3, 'editor sees drafts and all sources');
 -- anon
 perform t_as('anon');
 perform t_ok(t_n('select 1 from scholars')=1, 'anon sees only published scholars');
 perform t_ok(t_n('select 1 from scholar_translations')=1, 'anon sees only published translations');
 perform t_ok(t_n('select 1 from contributions')=1 and t_n('select 1 from works')=0, 'anon sees only published contributions/works');
 perform t_ok(t_n('select 1 from sources')=1, 'anon sees only sources of published scholars (not draft or orphan)');
 perform t_ok(t_n('select 1 from claim_sources')=1, 'anon sees only published claim_sources');
 perform t_ok(t_fails('select count(*) from editorial_reviews') or t_n('select 1 from editorial_reviews')=0, 'anon cannot read reviews');
 perform t_ok(t_fails('select created_by from scholars'), 'anon cannot read scholars.created_by');
 perform t_ok(t_fails($q$insert into scholars(slug,region,period_group) values ('hack','R','early')$q$), 'anon cannot insert');
 perform t_ok(t_fails($q$update scholars set region='Z'$q$) or t_n($q$select 1 from scholars where region='Z'$q$)=0, 'anon cannot update');
 -- authenticated non-editor
 perform t_as('authenticated', u1, 'user');
 perform t_ok(t_n('select 1 from scholars')=1 and t_n('select 1 from sources')=1, 'non-editor sees only published');
 perform t_ok(t_n('select 1 from editorial_reviews')=0, 'non-editor cannot read reviews');
 perform t_ok(t_fails($q$insert into scholars(slug,region,period_group) values ('hack','R','early')$q$), 'non-editor cannot insert');
 perform t_as('postgres');
end $$;

-- ===== Block 2: UPDATE guards, review integrity, invalidation after every kind of change =====
do $$ declare e1 uuid:='00000000-0000-0000-0000-0000000000e1'; e2 uuid:='00000000-0000-0000-0000-0000000000e2'; e3 uuid:='00000000-0000-0000-0000-0000000000e3';
 c uuid; d uuid; k1 uuid; kd uuid; wd uuid; sc1 uuid; sc2 uuid; sd uuid; cs1 uuid; r0 int; r1 int; st text; chg text[]; q text; i int:=0; g uuid; begin
 perform t_as('authenticated', e1, 'editor');
 insert into scholars(slug,region,period_group) values ('c-sch','R','early') returning id into c;
 insert into scholars(slug,region,period_group) values ('d-sch','R','early') returning id into d;
 insert into scholar_translations(scholar_id,lang,name) values (c,'en','C'),(d,'en','D');
 insert into contributions(scholar_id,description) values (c,'c1') returning id into k1;
 insert into contributions(scholar_id,description) values (d,'d1') returning id into kd;
 insert into works(scholar_id,original_title) values (d,'wd') returning id into wd;
 insert into sources(title) values ('S-C1') returning id into sc1;
 insert into sources(title) values ('S-C2') returning id into sc2;
 insert into sources(title) values ('S-D') returning id into sd;
 insert into claim_sources(contribution_id,source_id,locator) values (k1,sc1,'p1') returning id into cs1;
 insert into claim_sources(contribution_id,source_id,locator) values (kd,sd,'p1');
 update scholars set status='in_review' where id in (c,d);
 perform t_as('authenticated', e2, 'editor');
 perform t_rev(c,'approved');
 update scholars set status='published' where id=c;
 perform t_ok((select status from scholars where id=c)='published', 'setup: c published with a single source');
 perform t_ok(t_fails(format($q$update claim_sources set contribution_id=%L where id=%L$q$,kd,cs1)), 'UPDATE: cannot move last claim_source to another scholar''s contribution');
 perform t_ok(t_fails(format($q$update claim_sources set contribution_id=null, work_id=%L where id=%L$q$,wd,cs1)), 'UPDATE: cannot move last claim_source to another scholar''s work');
 perform t_ok(t_fails(format($q$update contributions set scholar_id=%L where id=%L$q$,d,k1)), 'UPDATE: cannot transfer the sourced contribution to another scholar');
 perform t_ok((select status from scholars where id=c)='published' and (select contribution_id from claim_sources where id=cs1)=k1, 'failed updates left scholar published and source in place');
 select content_rev into r0 from scholars where id=c;
 update scholars set content_rev=99, created_by=e2, last_edited_by=null where id=c;
 perform t_ok((select content_rev from scholars where id=c)=r0 and (select created_by from scholars where id=c)=e1, 'users cannot forge content_rev / created_by');
 -- review integrity (reviewer must state the revision reviewed)
 perform t_as('authenticated', e3, 'editor');
 perform t_ok(t_fails(format($q$insert into editorial_reviews(scholar_id,decision,content_rev) select id,'approved',content_rev-1 from scholars where id=%L$q$,d)), 'review of a stale revision is rejected');
 perform t_ok(t_fails(format($q$insert into editorial_reviews(scholar_id,decision) values (%L,'approved')$q$,d)), 'review without a stated revision is rejected');
 insert into editorial_reviews(scholar_id,decision,content_rev,reviewer) select id,'approved',content_rev,e1 from scholars where id=d;
 perform t_ok((select reviewer from editorial_reviews where scholar_id=d)=e3, 'forged reviewer is overwritten with the signed-in user');
 insert into scholars(slug,region,period_group) values ('g-draft','R','early') returning id into g;
 perform t_ok(t_fails(format($q$select t_rev(%L,'approved')$q$,g)), 'cannot review a draft');
 perform t_ok(t_fails(format($q$select t_rev(%L,'approved')$q$,c)), 'cannot review an already published scholar');
 -- every kind of substantive change demotes the scholar and invalidates the approval
 chg := array[
  format($q$update scholar_translations set name='C2' where scholar_id=%L$q$,c),
  format($q$insert into scholar_translations(scholar_id,lang,name) values (%L,'ur','x')$q$,c),
  format($q$delete from scholar_translations where scholar_id=%L and lang='ur'$q$,c),
  format($q$insert into works(scholar_id,original_title) values (%L,'W-new')$q$,c),
  format($q$update works set original_title='W2' where scholar_id=%L$q$,c),
  format($q$delete from works where scholar_id=%L$q$,c),
  format($q$insert into scholar_disciplines(scholar_id,discipline_id) select %L,id from disciplines order by id limit 1$q$,c),
  format($q$delete from scholar_disciplines where scholar_id=%L$q$,c),
  format($q$insert into scholar_disciplines(scholar_id,discipline_id) select %L,id from disciplines order by id limit 1$q$,c),
  format($q$delete from disciplines where id in (select discipline_id from scholar_disciplines where scholar_id=%L)$q$,c),
  format($q$update scholars set region='R2' where id=%L$q$,c),
  format($q$update scholars set slug='c-sch-2' where id=%L$q$,c),
  format($q$update scholars set dates_note='x' where id=%L$q$,c),
  format($q$update scholars set birth_year=900 where id=%L$q$,c),
  format($q$update scholars set period_group='classical' where id=%L$q$,c),
  format($q$update sources set title='S-C1b' where id=%L$q$,sc1),
  format($q$update sources set author='A' where id=%L$q$,sc1),
  format($q$update sources set url='https://example.org' where id=%L$q$,sc1),
  format($q$update contributions set description='c1b' where id=%L$q$,k1),
  format($q$update contributions set label='verified' where id=%L$q$,k1),
  format($q$insert into contributions(scholar_id,description) values (%L,'c-extra')$q$,c),
  format($q$delete from contributions where scholar_id=%L and description='c-extra'$q$,c),
  format($q$insert into claim_sources(contribution_id,source_id,locator) values (%L,%L,'p9')$q$,k1,sc2),
  format($q$update claim_sources set locator='p10' where locator='p9'$q$),
  format($q$update claim_sources set evidence_notes='n' where locator='p10'$q$),
  format($q$update claim_sources set source_id=%L where id=%L$q$,sc2,cs1),
  format($q$delete from claim_sources where locator='p10'$q$)];
 perform t_as('authenticated', e2, 'editor'); update scholars set status='in_review' where id=c;
 perform t_as('authenticated', e3, 'editor'); perform t_rev(c,'approved'); update scholars set status='published' where id=c;
 foreach q in array chg loop
  i:=i+1; perform t_as('authenticated', e2, 'editor');
  select content_rev into r0 from scholars where id=c;
  execute q;
  select status::text, content_rev into st, r1 from scholars where id=c;
  perform t_ok(st='in_review' and r1>r0, format('change #%s demotes scholar to in_review and bumps content_rev', i));
  perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,c)), format('change #%s: old approval cannot republish', i));
  perform t_rev(c,'approved');
  perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,c)), format('change #%s: last editor cannot approve own change', i));
  perform t_as('authenticated', e1, 'editor'); perform t_rev(c,'approved');
  perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,c)), format('change #%s: creator cannot approve', i));
  perform t_as('authenticated', e3, 'editor'); perform t_rev(c,'approved');
  update scholars set status='published' where id=c;
  perform t_ok((select status from scholars where id=c)='published', format('change #%s: fresh independent review republishes', i));
 end loop;
 perform t_as('authenticated', e2, 'editor'); update scholars set status='in_review' where id=c;
 perform t_as('authenticated', e1, 'editor'); perform t_rev(c,'changes_requested');
 perform t_as('authenticated', e2, 'editor');
 perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,c)), 'later changes_requested overrides earlier approval');
 perform t_as('authenticated', e3, 'editor'); perform t_rev(c,'approved'); update scholars set status='published' where id=c;
 perform t_ok((select status from scholars where id=c)='published', 'new approval after changes_requested publishes');
 perform t_as('anon'); perform t_ok(t_n('select 1 from scholars where slug in (''c-sch-2'',''d-sch'')')=1, 'anon sees published c-sch-2 but not d-sch');
 perform t_as('postgres');
end $$;

-- ===== Block 4: policy inventory, editor/non-editor/anon access matrix, foreign keys and cascades =====
do $$ declare e2 uuid:='00000000-0000-0000-0000-0000000000e2'; u1 uuid:='00000000-0000-0000-0000-0000000000a1'; t text; sid uuid; kid uuid; wid uuid; srcid uuid; n int; begin
 perform t_as('postgres');
 perform t_ok((select count(*) from (values
  ('claim_sources','editor_all','ALL','{authenticated}'),('claim_sources','pub_read','SELECT','{public}'),('contributions','editor_all','ALL','{authenticated}'),('contributions','pub_read','SELECT','{public}'),
  ('disciplines','editor_all','ALL','{authenticated}'),('disciplines','pub_read','SELECT','{public}'),('editorial_reviews','editor_insert','INSERT','{authenticated}'),('editorial_reviews','editor_read','SELECT','{authenticated}'),
  ('scholar_disciplines','editor_all','ALL','{authenticated}'),('scholar_disciplines','pub_read','SELECT','{public}'),('scholar_translations','editor_all','ALL','{authenticated}'),('scholar_translations','pub_read','SELECT','{public}'),
  ('scholars','editor_all','ALL','{authenticated}'),('scholars','pub_read','SELECT','{public}'),('sources','editor_all','ALL','{authenticated}'),('sources','pub_read','SELECT','{public}'),
  ('works','editor_all','ALL','{authenticated}'),('works','pub_read','SELECT','{public}')) e(t,p,c,r)
  full join (select tablename::text t, policyname::text p, cmd::text c, roles::text r from pg_policies where schemaname='public') a using (t,p,c,r) where e.t is null or a.t is null)=0, 'policy inventory matches the intended set exactly (18 policies)');
 perform t_ok((select count(*) from pg_tables where schemaname='public' and tablename in ('scholars','scholar_translations','disciplines','scholar_disciplines','sources','contributions','works','claim_sources','editorial_reviews') and rowsecurity)=9, 'RLS is enabled on all 9 tables');
 -- editors after the private-schema move: full CRUD where intended
 perform t_as('authenticated', e2, 'editor');
 insert into disciplines(slug,name_en) values ('tmp-d','Tmp'); update disciplines set name_en='Tmp2' where slug='tmp-d'; delete from disciplines where slug='tmp-d';
 insert into sources(title) values ('tmp-src') returning id into srcid; update sources set title='tmp2' where id=srcid; delete from sources where id=srcid;
 insert into scholars(slug,region,period_group) values ('tmp-sch','R','early') returning id into sid;
 insert into scholar_translations(scholar_id,lang,name) values (sid,'en','T'); update scholar_translations set name='T2' where scholar_id=sid;
 insert into contributions(scholar_id,description) values (sid,'x') returning id into kid; insert into works(scholar_id,original_title) values (sid,'w') returning id into wid;
 insert into sources(title) values ('tmp-src2') returning id into srcid;
 insert into claim_sources(contribution_id,source_id) values (kid,srcid); insert into claim_sources(work_id,source_id) values (wid,srcid);
 insert into scholar_disciplines(scholar_id,discipline_id) select sid,id from disciplines limit 1;
 perform t_ok(t_fails(format($q$delete from sources where id=%L$q$,srcid)), 'FK: a cited source cannot be deleted');
 update scholar_translations set name='T3' where scholar_id=sid; update contributions set description='y' where id=kid; update works set original_title='w2' where id=wid;
 delete from scholars where id=sid;
 perform t_ok(not exists(select 1 from scholar_translations where scholar_id=sid) and not exists(select 1 from contributions where id=kid) and not exists(select 1 from works where id=wid) and not exists(select 1 from claim_sources where contribution_id=kid or work_id=wid) and not exists(select 1 from scholar_disciplines where scholar_id=sid), 'deleting an unreviewed draft cascades cleanly (no orphans, no trigger errors)');
 delete from sources where id=srcid;
 perform t_ok((select count(*) from editorial_reviews)>0, 'editors can read reviews');
 perform t_ok(t_noop($q$update editorial_reviews set notes='x'$q$) and t_n($q$select 1 from editorial_reviews where notes='x'$q$)=0, 'editors cannot alter reviews');
 perform t_ok(t_noop('delete from editorial_reviews'), 'editors cannot delete reviews');
 perform t_ok(t_fails($q$delete from scholars where slug='d-sch'$q$) and exists(select 1 from editorial_reviews r join scholars s on s.id=r.scholar_id where s.slug='d-sch'), 'FK: a scholar with reviews cannot be deleted (audit trail preserved)');
 perform t_ok(t_fails($q$delete from scholars where slug='c-sch-2'$q$), 'FK: a published scholar with reviews cannot be deleted');
 -- non-editor signed-in user and anon: no writes anywhere
 foreach t in array array['scholars','scholar_translations','disciplines','scholar_disciplines','sources','contributions','works','claim_sources','editorial_reviews'] loop
   perform t_as('authenticated', u1, 'user'); perform t_ok(t_noop(format('delete from %I', t)), format('non-editor cannot delete from %s', t));
   perform t_as('anon'); perform t_ok(t_noop(format('delete from %I', t)), format('anon cannot delete from %s', t));
 end loop;
 perform t_as('authenticated', u1, 'user');
 perform t_ok(t_fails($q$insert into disciplines(slug,name_en) values ('x','x')$q$) and t_fails($q$insert into sources(title) values ('x')$q$) and t_fails($q$insert into scholars(slug,region,period_group) values ('x','R','early')$q$), 'non-editor cannot insert disciplines/sources/scholars');
 perform t_as('postgres');
end $$;

-- ===== Block 3: function privileges and table privileges =====
do $$ declare u1 uuid:='00000000-0000-0000-0000-0000000000a1'; begin
 perform t_as('postgres');
 perform t_ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef and n.nspname in ('public','private') and not ('search_path=""' = any(coalesce(p.proconfig,'{}')))), 'every SECURITY DEFINER function pins an empty search_path');
 perform t_ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef and n.nspname in ('public','private') and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute'))), 'no SECURITY DEFINER function is executable by anon/authenticated/PUBLIC');
 perform t_ok(not has_function_privilege('anon','private.is_editor()','execute') and has_function_privilege('authenticated','private.is_editor()','execute'), 'is_editor: authenticated only');
 perform t_ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname not like 't\_%' and not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')), 'no project functions in public (nothing exposed as RPC)');
 perform t_as('anon'); perform t_ok(t_fails('select private.is_editor()') and t_fails('select private.check_scholar_sourced(gen_random_uuid())'), 'anon cannot call private functions');
 perform t_as('authenticated',u1,'user'); perform t_ok(t_fails('select private.check_scholar_sourced(gen_random_uuid())') and t_fails('select private.touch_scholar(gen_random_uuid())'), 'signed-in users cannot call private functions');
 perform t_ok(t_fails('truncate scholars cascade'), 'signed-in users cannot TRUNCATE');
 perform t_as('anon'); perform t_ok(t_fails('truncate scholars cascade'), 'anon cannot TRUNCATE');
 perform t_as('postgres'); perform t_ok((select count(*) from scholars)>=3, 'data intact after TRUNCATE attempts');
end $$;

-- ===== Block 5: schema USAGE vs function EXECUTE (private.is_editor() inside RLS policies) =====
do $$ declare e2 uuid:='00000000-0000-0000-0000-0000000000e2'; u1 uuid:='00000000-0000-0000-0000-0000000000a1'; t text; begin
 perform t_as('postgres');
 perform t_ok(not has_schema_privilege('authenticated','private','usage') and not has_schema_privilege('anon','private','usage'), 'design: neither anon nor authenticated has USAGE on schema private');
 perform t_ok(has_function_privilege('authenticated','private.is_editor()','execute') and not has_function_privilege('anon','private.is_editor()','execute'), 'design: EXECUTE on private.is_editor() is granted to authenticated only');
 perform t_ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname<>'is_editor' and (has_function_privilege('authenticated',p.oid,'execute') or has_function_privilege('anon',p.oid,'execute'))), 'design: every other private function is non-executable for anon/authenticated');
 -- editors evaluate every policy that calls private.is_editor() without schema USAGE
 perform t_as('authenticated', e2, 'editor');
 foreach t in array array['scholars','scholar_translations','disciplines','scholar_disciplines','sources','contributions','works','claim_sources','editorial_reviews'] loop
   perform t_ok(t_n(format('select 1 from %I', t)) >= 0 and not t_fails(format('select count(*) from %I', t)), format('editor can SELECT %s (policy evaluates private.is_editor())', t));
 end loop;
 perform t_ok(t_n('select 1 from editorial_reviews')>0, 'editor reads existing reviews');
 perform t_ok(not t_fails($q$insert into disciplines(slug,name_en) values ('usage-probe','P')$q$) and not t_fails($q$update disciplines set name_en='P2' where slug='usage-probe'$q$) and not t_fails($q$delete from disciplines where slug='usage-probe'$q$), 'editor can insert/update/delete under editor_all');
 -- naming the private schema directly is denied (USAGE is only needed for name lookup)
 perform t_ok(t_fails('select private.is_editor()'), 'design: authenticated cannot reference private.is_editor() by name');
 perform t_ok(t_fails('select private.touch_scholar(gen_random_uuid())'), 'authenticated cannot call private.touch_scholar');
 perform t_as('anon'); perform t_ok(t_fails('select private.is_editor()') and t_fails('select private.touch_scholar(gen_random_uuid())') and t_fails('select private.scholar_of(null,null)'), 'anon cannot access private functions');
 perform t_as('authenticated', u1, 'user');
 perform t_ok(t_n('select 1 from editorial_reviews')=0 and t_fails($q$insert into disciplines(slug,name_en) values ('x','x')$q$) and t_noop('delete from sources'), 'non-editor has no editor operations');
 -- control experiment: the EXECUTE grant (not schema USAGE) is what the policies depend on
 perform t_as('postgres'); revoke execute on function private.is_editor() from authenticated;
 perform t_as('authenticated', e2, 'editor'); perform t_ok(t_fails('select count(*) from editorial_reviews'), 'control: without EXECUTE on is_editor(), editor queries fail');
 perform t_as('postgres'); grant execute on function private.is_editor() to authenticated;
 perform t_as('authenticated', e2, 'editor'); perform t_ok(not t_fails('select count(*) from editorial_reviews'), 'control: restoring EXECUTE restores editor access');
 perform t_as('postgres'); raise notice 'ALL SQL TESTS PASSED';
end $$;
