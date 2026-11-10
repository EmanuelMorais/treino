const {test}=require('node:test'),assert=require('node:assert/strict');
const athlete=require('../src/domain/athlete-context.js'),engine=require('../program-engine.js'),proposal=require('../src/domain/programme-proposal.js'),records=require('../src/domain/workout-records.js'),contract=require('../src/domain/document-contract.js'),backup=require('../src/data/backup-format.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const profile=extra=>({...engine.defaults(),name:'Synthetic athlete',adult:true,consent:true,goals:['strength'],primaryGoal:'strength',equipment:['dumbbells','bench'],weeks:4,...extra});
const activity=extra=>({id:'external-1',name:'Synthetic run',sport:'running',weekday:0,minutes:45,kind:'easy',...extra});
test('legacy profiles remain general and missing baseline metrics stay unknown',()=>{
 const p=profile();delete p.athlete;assert.deepEqual(engine.profileErrors(p),[]);
 const old=engine.generate(p),current=engine.generate(profile());assert.deepEqual(current.sessions,old.sessions);
 assert.equal(athlete.defaults().weeklyMinutes,'');assert.equal(athlete.defaults().weeklyKm,'');assert.equal(athlete.valid(undefined),true);
});
test('invalid dates, duplicate identities and malformed calendar values are rejected before import',()=>{
 const base={...athlete.defaults(),calendar:[activity()]};assert.equal(athlete.valid(base),true);
 for(const change of [c=>c.eventDate='2027-02-30',c=>c.calendar.push(activity()),c=>c.calendar[0].weekday=7,c=>c.calendar[0].minutes=-5,c=>c.calendar[0].minutes=30.5,c=>c.calendar[0].name=' ',c=>c.calendar[0].id='__proto__',c=>c.calendar[0].sport='unknown',c=>c.weeklyMinutes='NaN',c=>c.sessionsPerWeek='2.5',c=>c.targetTime='03:99']){
  const c=clone(base);change(c);assert.equal(athlete.valid(c),false);
  const doc={version:1,plans:[],history:[],drafts:{},favorites:[],profile:{answers:profile({athlete:c})}};assert.equal(contract.valid(doc),false);
 }
});
test('specialized sport and event intents are never silently generated as general programmes',()=>{
 for(const sport of Object.keys(athlete.SPORTS))for(const intent of ['complement','event']){
  const c={...athlete.defaults(),intent,sport,sportName:sport==='other'?'Synthetic sport':'',eventDate:intent==='event'?'2027-04-01':''};
  const p=profile({athlete:c}),before=JSON.stringify(p),result=engine.generate(p);
  assert.equal(result.reason,'sport-module-unavailable');assert.equal(result.reviewRequired,true);assert.equal(result.sessions,undefined);assert.match(result.errors[0],/ainda não está disponível/);assert.equal(JSON.stringify(p),before);
 }
 const incomplete=profile({athlete:{...athlete.defaults(),intent:'event'}});assert.match(engine.profileErrors(incomplete).join(' '),/modalidade principal/);assert.match(engine.profileErrors(incomplete).join(' '),/data da prova/);
 assert.deepEqual(engine.profileErrors(incomplete,false),[]);
});
test('weekly commitments count all declared activities without changing them or treating them as performed work',()=>{
 const c={...athlete.defaults(),calendar:[activity(),activity({id:'external-2',sport:'padel',name:'Synthetic match',weekday:4,minutes:90,kind:'match'})]},before=clone(c);
 const report=athlete.week(c,[{weekday:0,estimatedMinutes:35},{weekday:2,estimatedMinutes:40}]);
 assert.equal(report.externalMinutes,135);assert.equal(report.strengthMinutes,75);assert.equal(report.totalMinutes,210);assert.deepEqual(report.conflicts,[0]);assert.equal(report.externalSessions,2);assert.equal(report.strengthSessions,2);
 report.days[0].external[0].name='changed copy';assert.deepEqual(c,before);
});
test('general generation requires an explicit choice before stacking strength onto declared activities',()=>{
 const c={...athlete.defaults(),calendar:[activity()]},p=profile({athlete:c}),before=clone(p);
 assert.match(engine.generate(p).errors.join(' '),/Segunda/);assert.deepEqual(p,before);
 const separate=engine.generate({...p,preferredDays:[1,3,5]});assert.equal(separate.errors,undefined);assert.deepEqual(separate.sessions.filter(s=>s.week===1).map(s=>s.weekday),[1,3,5]);assert.match(separate.warnings.join(' '),/45 min/);
 const combined=engine.generate({...p,athlete:{...c,allowSameDay:true}});assert.equal(combined.errors,undefined);assert.match(combined.warnings.join(' '),/Confirmaste força/);
});
test('activation and programme snapshots preserve context; import cannot bypass unconfirmed overlaps',()=>{
 const c={...athlete.defaults(),calendar:[activity()],allowSameDay:true},p=profile({athlete:c}),generated=proposal.prepare(engine.generate(p));
 const doc={version:1,plans:[],history:[],drafts:{},favorites:[],profile:{answers:p}};let serial=0;
 const activated=proposal.activate(doc,generated,{uid:()=> 'fixture-'+(++serial),now:1}).document;
 assert.deepEqual(activated.questionnaireVersions[0].answers.athlete,c);assert.deepEqual(activated.plans.slice(0,3).map(p=>p.program.weekday),[0,2,4]);
 const migrated=records.upgrade(activated);assert.equal(migrated.minClientBuild,9);assert.equal(contract.valid(migrated),true);assert.deepEqual(backup.decode(clone(migrated)).value.profile.answers.athlete,c);
 const shared=backup.planEnvelope(migrated.plans[0]);assert.equal(JSON.stringify(shared).includes('Synthetic run'),false);assert.equal(shared.profile,undefined);
 generated.profile.athlete.allowSameDay=false;assert.ok(proposal.summary(generated).issues.some(issue=>issue.blocking));assert.throws(()=>proposal.activate(doc,generated,{uid:()=> 'unused'}),/calendário/);
});
test('legacy weekday migration uses the archived questionnaire and survives its later deletion',()=>{
 const p=profile({preferredDays:[1,3,5]}),generated=proposal.prepare(engine.generate(p)),doc={version:1,plans:[],history:[],drafts:{},favorites:[],profile:{answers:p}};let serial=0;
 const old=proposal.activate(doc,generated,{uid:()=> 'legacy-'+(++serial),now:1}).document;
 old.plans.forEach(plan=>delete plan.program.weekday);old.profile.answers=profile({preferredDays:[0,2,4]});
 const original=clone(old),next=records.upgrade(old);
 assert.deepEqual(next.plans.slice(0,3).map(plan=>plan.program.weekday),[1,3,5]);assert.deepEqual(old,original);
 delete next.questionnaireVersions;
 assert.deepEqual(records.upgrade(next).plans.slice(0,3).map(plan=>plan.program.weekday),[1,3,5]);
});
