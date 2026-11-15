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
  ('scholars','editor_select','SELECT','{authenticated}'),('scholars','editor_insert','INSERT','{authenticated}'),('scholars','editor_update','UPDATE','{authenticated}'),('scholars','admin_delete','DELETE','{authenticated}'),('scholars','pub_read','SELECT','{public}'),('sources','editor_all','ALL','{authenticated}'),('sources','pub_read','SELECT','{public}'),
  ('works','editor_all','ALL','{authenticated}'),('works','pub_read','SELECT','{public}'),('timeline_events','editor_all','ALL','{authenticated}'),('timeline_events','pub_read','SELECT','{public}'),('scholar_relationships','editor_all','ALL','{authenticated}'),('scholar_relationships','pub_read','SELECT','{public}'),('audit_log','editor_read','SELECT','{authenticated}'),('media_assets','pub_read','SELECT','{public}'),('media_assets','editor_all','ALL','{authenticated}')) e(t,p,c,r)
  full join (select tablename::text t, policyname::text p, cmd::text c, roles::text r from pg_policies where schemaname='public') a using (t,p,c,r) where e.t is null or a.t is null)=0, 'policy inventory matches the intended set exactly (28 policies)');
 perform t_ok((select count(*) from pg_tables where schemaname='public' and tablename in ('scholars','scholar_translations','disciplines','scholar_disciplines','sources','contributions','works','claim_sources','editorial_reviews','timeline_events','scholar_relationships','audit_log','media_assets') and rowsecurity)=13, 'RLS is enabled on all 13 tables');
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
 perform t_as('authenticated', e2, 'admin'); delete from scholars where id=sid; perform t_as('authenticated', e2, 'editor');
 perform t_ok(not exists(select 1 from scholar_translations where scholar_id=sid) and not exists(select 1 from contributions where id=kid) and not exists(select 1 from works where id=wid) and not exists(select 1 from claim_sources where contribution_id=kid or work_id=wid) and not exists(select 1 from scholar_disciplines where scholar_id=sid), 'deleting an unreviewed draft cascades cleanly (no orphans, no trigger errors)');
 delete from sources where id=srcid;
 perform t_ok((select count(*) from editorial_reviews)>0, 'editors can read reviews');
 perform t_ok(t_noop($q$update editorial_reviews set notes='x'$q$) and t_n($q$select 1 from editorial_reviews where notes='x'$q$)=0, 'editors cannot alter reviews');
 perform t_ok(t_noop('delete from editorial_reviews'), 'editors cannot delete reviews');
 perform t_as('authenticated', e2, 'admin'); perform t_ok(t_fails($q$delete from scholars where slug='d-sch'$q$) and exists(select 1 from editorial_reviews r join scholars s on s.id=r.scholar_id where s.slug='d-sch'), 'FK: a scholar with reviews cannot be deleted (audit trail preserved)');
 perform t_ok(t_fails($q$delete from scholars where slug='c-sch-2'$q$), 'FK: a published scholar with reviews cannot be deleted'); perform t_as('authenticated', e2, 'editor');
 -- non-editor signed-in user and anon: no writes anywhere
 foreach t in array array['scholars','scholar_translations','disciplines','scholar_disciplines','sources','contributions','works','claim_sources','editorial_reviews','timeline_events','scholar_relationships','audit_log','media_assets'] loop
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
 perform t_ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname not in ('is_editor','is_admin') and (has_function_privilege('authenticated',p.oid,'execute') or has_function_privilege('anon',p.oid,'execute'))), 'design: every other private function is non-executable for anon/authenticated');
 -- editors evaluate every policy that calls private.is_editor() without schema USAGE
 perform t_as('authenticated', e2, 'editor');
 foreach t in array array['scholars','scholar_translations','disciplines','scholar_disciplines','sources','contributions','works','claim_sources','editorial_reviews','timeline_events','scholar_relationships','audit_log','media_assets'] loop
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
 perform t_as('postgres');end $$;

-- ===== Block 6: Phase 3 contribution layer =====
do $$ declare e1 uuid:='00000000-0000-0000-0000-0000000000e1'; e2 uuid:='00000000-0000-0000-0000-0000000000e2';
 x uuid; k uuid; sx uuid; cs uuid; st text; r0 int; begin
 perform t_as('authenticated', e1, 'editor');
 insert into scholars(slug,region,period_group) values ('x-inv','R','early') returning id into x;
 perform t_ok(t_fails(format($q$insert into contributions(scholar_id,description,kind,confidence) values (%L,'d','original_invention','medium')$q$,x)), 'constraint: original_invention requires high confidence');
 perform t_ok(t_fails(format($q$insert into contributions(scholar_id,description,kind,confidence) values (%L,'d','disputed_attribution','high')$q$,x)), 'constraint: disputed_attribution must be low/uncertain confidence');
 perform t_ok(t_fails(format($q$insert into contributions(scholar_id,description,kind) values (%L,'d','technical_improvement')$q$,x)), 'constraint: a classified contribution must state its confidence');
 perform t_ok(t_fails(format($q$insert into contributions(scholar_id,description,kind,confidence) values (%L,'d','technical_improvement','certain')$q$,x)), 'constraint: confidence vocabulary is enforced');
 perform t_ok(t_fails(format($q$insert into contributions(scholar_id,description,kind,confidence) values (%L,'d','made_up_kind','high')$q$,x)), 'enum: unknown contribution kind rejected');
 insert into contributions(scholar_id,description,title,kind,confidence,period_text,prior_state,detail) values (x,'expl','T','original_invention','high','c. test period','before','detail') returning id into k;
 insert into sources(title) values ('S-X') returning id into sx;
 insert into claim_sources(contribution_id,source_id,locator,evidence_tier) values (k,sx,'p1','community_devotional') returning id into cs;
 update scholars set status='in_review' where id=x;
 perform t_as('authenticated', e2, 'editor'); perform t_rev(x,'approved');
 perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,x)), 'gate: invention claim backed only by community/devotional evidence cannot publish');
 perform t_as('authenticated', e1, 'editor'); update claim_sources set evidence_tier='academic_research' where id=cs;
 perform t_ok((select status::text from scholars where id=x)='in_review', 'upgrading the evidence tier is a content change (still in_review)');
 perform t_as('authenticated', e2, 'editor'); perform t_rev(x,'approved'); update scholars set status='published' where id=x;
 perform t_ok((select status::text from scholars where id=x)='published', 'gate: invention claim with academic evidence + fresh review publishes');
 select content_rev into r0 from scholars where id=x;
 update contributions set kind='technical_improvement', confidence='medium' where id=k;
 select status::text into st from scholars where id=x;
 perform t_ok(st='in_review' and (select content_rev from scholars where id=x)>r0, 'reclassifying a published contribution demotes the scholar for re-review');
 perform t_as('anon'); perform t_ok(t_n('select 1 from contributions where kind is not null')=0, 'anon cannot see classified contributions of an unpublished scholar');
 perform t_as('postgres');end $$;

-- ===== Block 7: timeline events =====
do $$ declare e1 uuid:='00000000-0000-0000-0000-0000000000e1'; e2 uuid:='00000000-0000-0000-0000-0000000000e2'; e3 uuid:='00000000-0000-0000-0000-0000000000e3'; u1 uuid:='00000000-0000-0000-0000-0000000000a1';
 t uuid; k uuid; ev uuid; s1 uuid; s2 uuid; s3 uuid; c1 uuid; c2 uuid; c3 uuid; r0 int; begin
 perform t_as('authenticated', e1, 'editor');
 insert into scholars(slug,region,period_group) values ('t-ev','R','early') returning id into t;
 insert into scholar_translations(scholar_id,lang,name) values (t,'en','T');
 perform t_ok(t_fails(format($q$insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (%L,'birth','x',1010,1000,'approximate','low')$q$,t)), 'constraint: year_earliest must not exceed year_latest');
 perform t_ok(t_fails(format($q$insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (%L,'birth','x',1000,1010,'exact','low')$q$,t)), 'constraint: an exact date is a single year');
 perform t_ok(t_fails(format($q$insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (%L,'birth','x',1000,1010,'disputed','low')$q$,t)), 'constraint: a disputed date must explain the dispute');
 perform t_ok(t_fails(format($q$insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (%L,'made_up','x',1000,1000,'exact','low')$q$,t)), 'enum: unknown event type rejected');
 perform t_ok(t_fails(format($q$insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (%L,'birth','x',1000,1000,'exact','certain')$q$,t)), 'constraint: confidence vocabulary enforced on events');
 perform t_ok(t_fails(format($q$insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (%L,'birth','  ',1000,1000,'exact','low')$q$,t)), 'constraint: event title required');
 insert into contributions(scholar_id,description) values (t,'c') returning id into k;
 insert into sources(title) values ('S-T1') returning id into s1; insert into sources(title) values ('S-T2') returning id into s2; insert into sources(title) values ('S-T3') returning id into s3;
 insert into claim_sources(contribution_id,source_id,locator,evidence_tier) values (k,s1,'p1','academic_research');
 insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,date_note,confidence) values (t,'publication','Work A',1000,1010,'disputed','sources differ','low') returning id into ev;
 perform t_ok(t_fails(format($q$insert into claim_sources(contribution_id,timeline_event_id,source_id) values (%L,%L,%L)$q$,k,ev,s1)), 'constraint: a claim source cites exactly one target');
 update scholars set status='in_review' where id=t;
 perform t_as('authenticated', e2, 'editor'); perform t_rev(t,'approved');
 perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,t)), 'gate: scholar with an unsourced timeline event cannot publish');
 perform t_as('authenticated', e1, 'editor');
 insert into claim_sources(timeline_event_id,source_id,locator,evidence_tier) values (ev,s2,'p2','academic_research') returning id into c2;
 insert into claim_sources(timeline_event_id,source_id,locator,evidence_tier) values (ev,s3,'p3','academic_research') returning id into c3;
 perform t_ok((select content_rev from scholars where id=t)>1, 'adding an event source is a content change (revision bumped)');
 perform t_as('anon'); perform t_ok(t_n(format($q$select 1 from timeline_events where scholar_id=%L$q$,t))=0 and t_n(format($q$select 1 from claim_sources where timeline_event_id=%L$q$,ev))=0 and t_n($q$select 1 from sources where title in ('S-T1','S-T2','S-T3')$q$)=0, 'anon sees no events, sources or citations of a draft scholar');
 perform t_as('authenticated', e2, 'editor'); perform t_rev(t,'approved'); update scholars set status='published' where id=t;
 perform t_ok((select status::text from scholars where id=t)='published', 'gate: fully sourced events + fresh independent review publishes');
 perform t_as('anon');
 perform t_ok(t_n(format($q$select 1 from timeline_events where scholar_id=%L$q$,t))=1 and t_n(format($q$select 1 from claim_sources where timeline_event_id=%L$q$,ev))=2 and t_n($q$select 1 from sources where title in ('S-T2','S-T3')$q$)=2, 'anon sees the published scholar''s event, its citations and event sources');
 perform t_ok(t_fails(format($q$insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (%L,'birth','hack',1,1,'exact','low')$q$,t)), 'anon cannot insert events');
 perform t_as('authenticated', u1, 'user');
 perform t_ok(t_fails(format($q$insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (%L,'birth','hack',1,1,'exact','low')$q$,t)) and t_noop('delete from timeline_events'), 'non-editor cannot write events');
 perform t_as('authenticated', e2, 'editor');
 perform t_ok(t_fails(format($q$update claim_sources set timeline_event_id=null, contribution_id=%L where id=%L$q$,k,c2)) = false, 'moving one of two event sources away is allowed');
 -- c2 moved to contribution (content change demoted the scholar); restore a clean published state with two event sources
 update claim_sources set contribution_id=null, timeline_event_id=ev where id=c2;
 perform t_as('authenticated', e3, 'editor'); perform t_rev(t,'approved'); update scholars set status='published' where id=t;
 perform t_ok((select status::text from scholars where id=t)='published', 'republished after fresh independent review');
 perform t_as('authenticated', e2, 'editor');
 delete from claim_sources where id=c3;
 perform t_ok((select status::text from scholars where id=t)='in_review', 'removing a non-last event source is allowed but demotes the scholar');
 perform t_as('authenticated', e3, 'editor'); perform t_rev(t,'approved'); update scholars set status='published' where id=t;
 perform t_ok(t_fails(format($q$delete from claim_sources where id=%L$q$,c2)), 'guard: cannot remove the last source of a published scholar''s event');
 perform t_ok(t_fails(format($q$update claim_sources set timeline_event_id=null, contribution_id=%L where id=%L$q$,k,c2)), 'guard: cannot move the last event source away');
 perform t_ok((select status::text from scholars where id=t)='published', 'failed guard attempts left the scholar published');
 select content_rev into r0 from scholars where id=t;
 update timeline_events set title='Work A (revised)' where id=ev;
 perform t_ok((select status::text from scholars where id=t)='in_review' and (select content_rev from scholars where id=t)>r0, 'editing an event demotes the scholar for re-review');
 perform t_as('authenticated', e2, 'editor'); perform t_rev(t,'approved'); update scholars set status='published' where id=t;
 select content_rev into r0 from scholars where id=t;
 insert into timeline_events(scholar_id,event_type,title,year_earliest,year_latest,date_certainty,confidence) values (t,'death','D',1050,1050,'approximate','low');
 perform t_ok((select status::text from scholars where id=t)='in_review' and (select content_rev from scholars where id=t)>r0, 'adding an event demotes the scholar for re-review');
 perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,t)), 'a new unsourced event blocks republishing');
 delete from timeline_events where title='D';
 perform t_as('authenticated', e1, 'editor'); update sources set title='S-T2b' where id=s2;
 perform t_ok((select status::text from scholars where id=t)='in_review', 'editing a source cited only by an event is a content change');
 perform t_as('postgres');end $$;

-- ===== Block 8: scholar relationships and group scholars =====
do $$ declare e1 uuid:='00000000-0000-0000-0000-0000000000e1'; e2 uuid:='00000000-0000-0000-0000-0000000000e2'; e3 uuid:='00000000-0000-0000-0000-0000000000e3'; u1 uuid:='00000000-0000-0000-0000-0000000000a1';
 g uuid; m uuid; o uuid; k uuid; ko uuid; rel uuid; rel2 uuid; s1 uuid; s2 uuid; s3 uuid; c1 uuid; c2 uuid; r0 int; begin
 perform t_as('authenticated', e1, 'editor');
 insert into scholars(slug,region,period_group,scholar_kind) values ('r-group','R','early','group') returning id into g;
 insert into scholars(slug,region,period_group) values ('r-member','R','early') returning id into m;
 insert into scholars(slug,region,period_group) values ('r-other','R','early') returning id into o;
 perform t_ok(t_fails($q$insert into scholars(slug,region,period_group,scholar_kind) values ('bad-kind','R','early','team')$q$), 'constraint: scholar_kind vocabulary');
 perform t_ok(t_fails(format($q$insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (%L,%L,'teacher_of','low')$q$,m,m)), 'constraint: a scholar cannot relate to itself');
 perform t_ok(t_fails(format($q$insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (%L,%L,'made_up','low')$q$,m,o)), 'enum: unknown relationship type rejected');
 perform t_ok(t_fails(format($q$insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (%L,%L,'teacher_of','certain')$q$,m,o)), 'constraint: relationship confidence vocabulary');
 perform t_ok(t_fails(format($q$insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (%L,%L,'member_of','low')$q$,m,o)), 'rule: member_of must target a group scholar');
 perform t_ok(t_fails(format($q$insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (%L,%L,'member_of','low')$q$,g,m)), 'rule: a group cannot be the member');
 insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence,label) values (m,g,'member_of','medium','academically_supported') returning id into rel;
 perform t_ok(t_fails(format($q$insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (%L,%L,'member_of','low')$q$,m,g)), 'constraint: the same relationship cannot be recorded twice');
 insert into scholar_translations(scholar_id,lang,name) values (m,'en','M'),(g,'en','G'),(o,'en','O');
 insert into contributions(scholar_id,description) values (m,'c') returning id into k; insert into contributions(scholar_id,description) values (g,'cg') returning id into ko;
 insert into sources(title) values ('S-R1') returning id into s1; insert into sources(title) values ('S-R2') returning id into s2; insert into sources(title) values ('S-R3') returning id into s3;
 insert into claim_sources(contribution_id,source_id,locator,evidence_tier) values (k,s1,'§1','academic_research'),(ko,s1,'§1','academic_research');
 perform t_ok(t_fails(format($q$insert into claim_sources(contribution_id,relationship_id,source_id) values (%L,%L,%L)$q$,k,rel,s1)), 'constraint: one target per claim source (relationships included)');
 update scholars set status='in_review' where id in (m,g);
 perform t_as('authenticated', e2, 'editor'); perform t_rev(m,'approved'); perform t_rev(g,'approved');
 perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,m)), 'gate: an unsourced relationship blocks publishing its owner');
 perform t_as('authenticated', e1, 'editor');
 insert into claim_sources(relationship_id,source_id,locator,evidence_tier) values (rel,s2,'§2','academic_research') returning id into c1;
 insert into claim_sources(relationship_id,source_id,locator,evidence_tier) values (rel,s3,'§3','academic_research') returning id into c2;
 perform t_as('authenticated', e2, 'editor'); perform t_rev(m,'approved'); perform t_rev(g,'approved');
 update scholars set status='published' where id=m;
 perform t_as('anon');
 perform t_ok(t_n(format($q$select 1 from scholar_relationships where id=%L$q$,rel))=0 and t_n(format($q$select 1 from claim_sources where relationship_id=%L$q$,rel))=0 and t_n($q$select 1 from sources where title in ('S-R2','S-R3')$q$)=0, 'RLS: relationship and its citations stay hidden while the related scholar is unpublished');
 perform t_as('authenticated', e2, 'editor'); update scholars set status='published' where id=g;
 perform t_as('anon');
 perform t_ok(t_n(format($q$select 1 from scholar_relationships where id=%L$q$,rel))=1 and t_n(format($q$select 1 from claim_sources where relationship_id=%L$q$,rel))=2 and t_n($q$select 1 from sources where title in ('S-R2','S-R3')$q$)=2, 'RLS: relationship, citations and sources become public once BOTH scholars are published');
 perform t_ok(t_fails(format($q$insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (%L,%L,'teacher_of','low')$q$,m,o)), 'anon cannot write relationships');
 perform t_as('authenticated', u1, 'user');
 perform t_ok(t_fails(format($q$insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (%L,%L,'teacher_of','low')$q$,m,o)) and t_noop('delete from scholar_relationships'), 'non-editor cannot write relationships');
 perform t_as('authenticated', e2, 'editor');
 perform t_ok(t_fails(format($q$delete from claim_sources where id=%L$q$,c1)) = false, 'removing one of two relationship sources is allowed');
 perform t_ok((select status::text from scholars where id=m)='in_review', '...and demotes the owner for re-review');
 perform t_as('authenticated', e3, 'editor'); perform t_rev(m,'approved'); update scholars set status='published' where id=m;
 perform t_ok(t_fails(format($q$delete from claim_sources where id=%L$q$,c2)), 'guard: cannot remove the last source of a published scholar''s relationship');
 perform t_ok(t_fails(format($q$update claim_sources set relationship_id=null, contribution_id=%L where id=%L$q$,k,c2)), 'guard: cannot move the last relationship source away');
 select content_rev into r0 from scholars where id=m;
 update scholar_relationships set confidence='low' where id=rel;
 perform t_ok((select status::text from scholars where id=m)='in_review' and (select content_rev from scholars where id=m)>r0, 'editing a relationship demotes the owner for re-review');
 perform t_as('authenticated', e2, 'editor'); perform t_rev(m,'approved'); update scholars set status='published' where id=m;
 select content_rev into r0 from scholars where id=m;
 insert into scholar_relationships(scholar_id,related_scholar_id,relation_type,confidence) values (m,o,'collaborator','low');
 perform t_ok((select status::text from scholars where id=m)='in_review', 'adding a relationship demotes the owner');
 perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,m)), 'a new unsourced relationship blocks republishing');
 delete from scholar_relationships where related_scholar_id=o;
 perform t_ok((select count(*) from scholar_relationships where scholar_id=m)=1, 'deleting a relationship leaves the others');
 perform t_as('authenticated', e1, 'editor'); update scholars set scholar_kind='group' where id=m;
 perform t_ok((select status::text from scholars where id=m)='in_review', 'changing scholar_kind is a content change');
 perform t_as('postgres');end $$;

-- ===== Block 9: RBAC, archive, audit log, media, storage =====
do $$ declare e1 uuid:='00000000-0000-0000-0000-0000000000e1'; e2 uuid:='00000000-0000-0000-0000-0000000000e2'; ad uuid:='00000000-0000-0000-0000-0000000000d1'; u1 uuid:='00000000-0000-0000-0000-0000000000a1';
 a uuid; z uuid; k uuid; s1 uuid; m1 uuid; n0 bigint; r0 int; begin
 perform t_as('authenticated', e1, 'editor');
 insert into scholars(slug,region,period_group) values ('adm-del','R','modern') returning id into a;
 perform t_ok((select period_rank from scholars where id=a)=3, 'period_rank is derived from period_group');
 perform t_ok(t_noop(format($q$delete from scholars where id=%L$q$,a)) and exists(select 1 from scholars where id=a), 'RBAC: an editor cannot delete a scholar (admin only)');
 perform t_as('authenticated', ad, 'admin'); delete from scholars where id=a;
 perform t_ok(not exists(select 1 from scholars where id=a), 'RBAC: an admin can delete an unreviewed draft');
 perform t_as('authenticated', u1, 'user'); perform t_ok(t_noop('delete from scholars'), 'RBAC: a non-editor cannot delete scholars');
 -- archive workflow
 perform t_as('authenticated', e1, 'editor');
 insert into scholars(slug,region,period_group) values ('adm-arch','R','modern') returning id into z;
 insert into scholar_translations(scholar_id,lang,name) values (z,'en','Arch');
 insert into contributions(scholar_id,description) values (z,'c') returning id into k; insert into sources(title) values ('S-ARCH') returning id into s1;
 insert into claim_sources(contribution_id,source_id,locator,evidence_tier) values (k,s1,'§1','academic_research');
 perform t_ok(t_fails($q$insert into scholars(slug,region,period_group,status) values ('born-archived','R','early','archived')$q$), 'a scholar cannot be created as archived');
 update scholars set status='in_review' where id=z;
 perform t_as('authenticated', e2, 'editor'); perform t_rev(z,'approved'); update scholars set status='published' where id=z;
 perform t_ok(t_fails(format($q$update scholars set status='archived' where id=%L$q$,z)), 'RBAC: an editor cannot archive');
 perform t_as('authenticated', ad, 'admin'); update scholars set status='archived' where id=z;
 perform t_ok((select status::text from scholars where id=z)='archived', 'RBAC: an admin can archive');
 perform t_as('anon'); perform t_ok(t_n(format($q$select 1 from scholars where id=%L$q$,z))=0 and t_n(format($q$select 1 from contributions where scholar_id=%L$q$,z))=0 and t_n($q$select 1 from sources where title='S-ARCH'$q$)=0, 'archived scholars, their content and sources are hidden from the public');
 perform t_as('authenticated', e2, 'editor'); perform t_ok(t_fails(format($q$update scholars set status='in_review' where id=%L$q$,z)) and (select status::text from scholars where id=z)='archived', 'RBAC: an editor cannot restore an archived scholar');
 perform t_as('authenticated', ad, 'admin'); perform t_ok(t_fails(format($q$update scholars set status='published' where id=%L$q$,z)), 'an archived scholar cannot jump straight to published');
 update scholars set status='in_review' where id=z;
 perform t_ok((select status::text from scholars where id=z)='in_review', 'an admin can restore an archived scholar to in_review');
 perform t_as('authenticated', e2, 'editor'); update scholars set status='published' where id=z;
 perform t_ok((select status::text from scholars where id=z)='published', 'restored scholar republishes via the normal gate (review still valid for unchanged content)');
 -- audit log
 perform t_as('authenticated', ad, 'admin');
 perform t_ok((select count(*) from audit_log where scholar_id=z and table_name='scholars' and details ? 'status')>=4, 'audit: status transitions are recorded');
 perform t_ok(exists(select 1 from audit_log where scholar_id=z and table_name='scholars' and details->'status'->>'new' like '%archived%' and actor=ad and actor_role='admin'), 'audit: the archive action records actor and role');
 perform t_ok(exists(select 1 from audit_log where scholar_id=z and table_name='contributions' and action='insert') and exists(select 1 from audit_log where scholar_id=z and table_name='claim_sources' and action='insert') and exists(select 1 from audit_log where scholar_id=z and table_name='editorial_reviews' and action='insert'), 'audit: content, citation and review actions are recorded');
 select count(*) into n0 from audit_log; select content_rev into r0 from scholars where id=z; update scholar_translations set name='Arch' where scholar_id=z;
 perform t_ok((select count(*) from audit_log)=n0, 'audit: a no-op update writes nothing');
 perform t_ok((select status::text from scholars where id=z)='published' and (select content_rev from scholars where id=z)=r0, 'a no-op child update does not demote the scholar or bump the revision');
 perform t_as('authenticated', e2, 'editor');
 perform t_ok(t_n('select 1 from audit_log')>0, 'audit: editors can read the log');
 perform t_ok(t_fails($q$update audit_log set action='x'$q$) and t_fails($q$delete from audit_log$q$) and t_fails($q$insert into audit_log(action,table_name) values ('x','y')$q$), 'audit: editors cannot write, alter or delete log rows');
 perform t_as('authenticated', ad, 'admin'); perform t_ok(t_fails($q$delete from audit_log$q$), 'audit: not even an admin can delete log rows');
 perform t_as('postgres'); perform t_ok(t_fails($q$update audit_log set action='x'$q$) and t_fails($q$delete from audit_log$q$), 'audit: append-only trigger blocks even the table owner');
 perform t_as('anon'); perform t_ok(t_fails('select count(*) from audit_log'), 'audit: anon cannot read the log');
 perform t_as('authenticated', u1, 'user'); perform t_ok(t_n('select 1 from audit_log')=0, 'audit: non-editors see zero log rows (RLS)');
 -- media records
 perform t_as('authenticated', e1, 'editor');
 perform t_ok(t_fails(format($q$insert into media_assets(scholar_id,kind,storage_path,title,alt_text,license,attribution) values (%L,'image','scholars/x/a.jpg','T','alt','','Someone')$q$,z)), 'media: licence is mandatory');
 perform t_ok(t_fails(format($q$insert into media_assets(scholar_id,kind,storage_path,title,alt_text,license,attribution) values (%L,'image','scholars/x/a.jpg','T','alt','CC BY 4.0','')$q$,z)), 'media: attribution is mandatory');
 perform t_ok(t_fails(format($q$insert into media_assets(scholar_id,kind,storage_path,title,license,attribution) values (%L,'image','scholars/x/a.jpg','T','CC BY 4.0','Someone')$q$,z)), 'media: an image needs alt text');
 perform t_ok(t_fails(format($q$insert into media_assets(scholar_id,kind,storage_path,title,alt_text,license,attribution) values (%L,'image','other/a.jpg','T','alt','CC BY 4.0','Someone')$q$,z)), 'media: storage path must be under scholars/');
 perform t_ok(t_fails(format($q$insert into media_assets(scholar_id,kind,storage_path,title,alt_text,license,attribution,source_url) values (%L,'image','scholars/x/a.jpg','T','alt','CC BY 4.0','Someone','javascript:alert(1)')$q$,z)), 'media: source_url must be http(s)');
 select content_rev into r0 from scholars where id=z;
 insert into media_assets(scholar_id,kind,storage_path,title,alt_text,license,attribution,source_url) values (z,'image','scholars/adm-arch/a.jpg','Portrait','A portrait','Public domain','Museum X','https://example.org/a') returning id into m1;
 perform t_ok((select status::text from scholars where id=z)='in_review' and (select content_rev from scholars where id=z)>r0, 'media: adding an asset is a content change (demotes for re-review)');
 perform t_as('anon'); perform t_ok(t_n(format($q$select 1 from media_assets where id=%L$q$,m1))=0, 'media: hidden while the scholar is not published');
 perform t_as('authenticated', ad, 'editor'); perform t_as('authenticated', e2, 'editor'); perform t_rev(z,'approved');
 perform t_as('authenticated', ad, 'editor'); perform t_rev(z,'approved'); update scholars set status='published' where id=z;
 perform t_as('anon'); perform t_ok(t_n(format($q$select 1 from media_assets where id=%L$q$,m1))=1, 'media: visible once the scholar is published');
 perform t_ok(t_fails(format($q$insert into media_assets(scholar_id,kind,storage_path,title,license,attribution) values (%L,'document','scholars/x/d.pdf','D','CC0','Someone')$q$,z)), 'media: anon cannot write');
 perform t_as('authenticated', u1, 'user'); perform t_ok(t_fails(format($q$insert into media_assets(scholar_id,kind,storage_path,title,license,attribution) values (%L,'document','scholars/x/d.pdf','D','CC0','Someone')$q$,z)), 'media: non-editors cannot write');
 -- storage policies (stubbed storage schema)
 perform t_as('postgres');
 perform t_ok((select public from storage.buckets where id='scholar-media')=false and (select file_size_limit from storage.buckets where id='scholar-media')=10485760 and (select 'application/pdf'=any(allowed_mime_types) and not 'text/html'=any(allowed_mime_types) from storage.buckets where id='scholar-media'), 'storage: bucket is private with a 10 MB limit and an image/PDF allow-list');
 perform t_as('anon'); perform t_ok(t_fails($q$insert into storage.objects(bucket_id,name) values ('scholar-media','scholars/adm-arch/a.jpg')$q$), 'storage: anon cannot upload');
 perform t_as('authenticated', u1, 'user'); perform t_ok(t_fails($q$insert into storage.objects(bucket_id,name) values ('scholar-media','scholars/adm-arch/a.jpg')$q$), 'storage: non-editors cannot upload');
 perform t_as('authenticated', e2, 'editor');
 insert into storage.objects(bucket_id,name) values ('scholar-media','scholars/adm-arch/a.jpg'),('scholar-media','scholars/adm-arch/orphan.jpg');
 perform t_ok(t_fails($q$insert into storage.objects(bucket_id,name) values ('scholar-media','elsewhere/x.jpg')$q$) and t_fails($q$insert into storage.objects(bucket_id,name) values ('other-bucket','scholars/x.jpg')$q$), 'storage: editors can upload only under scholars/ in the media bucket');
 perform t_as('anon'); perform t_ok(t_n($q$select 1 from storage.objects where name='scholars/adm-arch/a.jpg'$q$)=1 and t_n($q$select 1 from storage.objects where name='scholars/adm-arch/orphan.jpg'$q$)=0, 'storage: the public reads only files recorded for a published scholar (not orphans)');
 perform t_as('authenticated', e2, 'editor'); perform t_ok(t_n($q$select 1 from storage.objects$q$)=2, 'storage: editors see every file');
 perform t_ok(t_noop($q$delete from storage.objects where name='scholars/adm-arch/a.jpg'$q$) and t_n($q$select 1 from storage.objects where name='scholars/adm-arch/a.jpg'$q$)=1, 'storage: an editor cannot delete a file referenced by a media record');
 delete from storage.objects where name='scholars/adm-arch/orphan.jpg';
 perform t_ok(t_n($q$select 1 from storage.objects where name='scholars/adm-arch/orphan.jpg'$q$)=0, 'storage: an editor can delete an unreferenced upload');
 perform t_as('authenticated', ad, 'admin'); delete from storage.objects where name='scholars/adm-arch/a.jpg';
 perform t_ok(t_n($q$select 1 from storage.objects$q$)=0, 'storage: an admin can delete a referenced file');
 perform t_as('postgres'); raise notice 'ALL SQL TESTS PASSED';
end $$;
