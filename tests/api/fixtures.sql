-- API test fixtures (TEST ONLY): publish the researched batch scholars through the REAL gate, add extra published scholars for pagination.
do $$ declare s record; e2 uuid:='00000000-0000-0000-0000-0000000000e2'; sid uuid; k uuid; sr uuid; i int; begin
  insert into scholar_translations(scholar_id,lang,name) select id,'ar','محمد بن موسى الخوارزمي' from scholars where slug='al-khwarizmi';
  insert into scholar_translations(scholar_id,lang,name) select id,'ur','محمد بن موسیٰ الخوارزمی' from scholars where slug='al-khwarizmi';
  for s in select id from scholars where slug in ('al-khwarizmi','al-kindi','banu-musa','muhammad-ibn-musa-ibn-shakir','ahmad-ibn-musa-ibn-shakir') loop
    update scholars set status='in_review' where id=s.id;
    insert into editorial_reviews(scholar_id,decision,content_rev,reviewer) select id,'approved',content_rev,e2 from scholars where id=s.id;
    update scholars set status='published' where id=s.id;
  end loop;
  for i in 1..4 loop
    insert into scholars(slug,region,period_group) values ('fx-'||i, case i when 1 then 'Persia' when 2 then 'Andalusia' else 'South Asia' end, case i when 1 then 'classical' when 2 then 'classical' else 'modern' end) returning id into sid;
    insert into scholar_translations(scholar_id,lang,name) values (sid,'en','Fixture '||i);
    if i = 1 then insert into scholar_translations(scholar_id,lang,name) values (sid,'ar','ابن سينا'); end if;   -- Arabic-only name containing Arabic yeh (U+064A)
    insert into scholar_disciplines(scholar_id,discipline_id) select sid,id from disciplines where name_en = case i when 1 then 'Medicine' else 'Philosophy' end;
    insert into contributions(scholar_id,description) values (sid,'fixture contribution') returning id into k;
    insert into sources(title) values ('Fixture source '||i) returning id into sr;
    insert into claim_sources(contribution_id,source_id,locator,evidence_tier) values (k,sr,'§1','academic_research');
    update scholars set status='in_review' where id=sid;
    insert into editorial_reviews(scholar_id,decision,content_rev,reviewer) select id,'approved',content_rev,e2 from scholars where id=sid;
    update scholars set status='published' where id=sid;
  end loop;
end $$;
