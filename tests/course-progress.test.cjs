const test=require('node:test'),assert=require('node:assert/strict');
const course=require('../src/domain/course-progress.js'),contract=require('../src/domain/document-contract.js'),sessions=require('../src/domain/workout-session.js');
// Synthetic programme: no personal plans or records.
const COURSE={version:3,prefix:'demo4',sessions:['A','B','C','D'],weeks:Array.from({length:12},(_,i)=>({week:i+1}))};
const exercise=id=>({id,name:'Movimento '+id,video:'',sets:2,target:'8–12',unit:'reps',start:0,note:''});
const plan=(week,session)=>({id:course.planId(COURSE,week,session),name:`Semana ${week} · ${session}`,note:'',exercises:[exercise('e1')],course:{version:3,week,session,phase:1}});
const doc=(extra={})=>({version:1,plans:[1,2,12].flatMap(w=>COURSE.sessions.map(s=>plan(w,s))).concat([{...plan(1,'M'),id:'demo4-mobility',course:{version:3,week:1,session:'M',phase:0}}]),drafts:{},history:[],favorites:[],...extra});
const record=(week,session,date,savedAt,complete=false,version=3)=>({id:`h-${week}-${session}-${savedAt}`,planId:course.planId(COURSE,week,session),planName:'x',date,note:'',savedAt,complete,exercises:[],course:{version,week,session,phase:1}});

test('without history the programme starts at week 1, first session',()=>{
 assert.deepEqual(course.next(doc(),COURSE),{week:1,session:'A',planId:'demo4-w01-A',resume:false,finished:false});
});
test('the session after the latest saved one is next; partial sessions count and order follows date then save time',()=>{
 const d=doc({history:[record(1,'A','2026-11-09',1),record(1,'B','2026-11-11',2)]});
 assert.equal(course.next(d,COURSE).planId,'demo4-w01-C');
 d.history.push(record(1,'C','2026-11-11',3,true));assert.equal(course.next(d,COURSE).planId,'demo4-w01-D');
 d.history.push(record(1,'D','2026-11-10',4));assert.equal(course.next(d,COURSE).planId,'demo4-w01-D','an older date does not move the sequence back');
});
test('the last session of a week moves to the next week; the end of the programme stays on the last session',()=>{
 assert.equal(course.next(doc({history:[record(1,'D','2026-11-14',5)]}),COURSE).planId,'demo4-w02-A');
 const end=course.next(doc({history:[record(12,'D','2027-02-05',9)]}),COURSE);assert.equal(end.finished,true);assert.equal(end.planId,'demo4-w12-D');
});
test('records from another programme version or the mobility session do not move the sequence',()=>{
 const d=doc({history:[record(1,'B','2026-11-11',2,false,2),{...record(1,'M','2026-11-12',3),planId:'demo4-mobility'}]});
 assert.equal(course.next(d,COURSE).planId,'demo4-w01-A');
});
test('a started session is resumed before suggesting a new one',()=>{
 const started=sessions.start(doc({history:[record(1,'A','2026-11-09',1)]}),{planId:'demo4-w01-C',uid:()=>'run-1',date:'2026-11-12',week:1,now:1000});
 assert.deepEqual(course.next(started.document,COURSE),{week:1,session:'C',planId:'demo4-w01-C',resume:true,finished:false});
 const d=doc();d.drafts['demo4-w02-B']={date:'2026-11-12',note:'',rows:{e1:[{kg:'10',reps:'',done:false}]}};
 assert.equal(course.next(d,COURSE).planId,'demo4-w02-B');assert.equal(course.next(d,COURSE).resume,true);
});
test('a missing next plan falls back to an available session of the programme',()=>{
 assert.equal(course.next(doc({history:[record(2,'D','2026-11-20',1)]}),COURSE).planId,'demo4-w01-A');
});
test('counts derive the total from weeks × sessions',()=>{
 const counts=course.counts(doc({history:[record(1,'A','2026-11-09',1,true),record(1,'B','2026-11-10',2,false)]}),COURSE);
 assert.deepEqual(counts,{total:48,available:12,complete:1});
});
test('the session clock uses wall-clock timestamps and excludes paused time',()=>{
 const d={};course.clockStart(d,1000);assert.equal(course.clockElapsed(d,61000),60);
 course.clockToggle(d,61000);assert.equal(course.clockElapsed(d,999000),60,'paused time does not count');
 course.clockToggle(d,121000);assert.equal(course.clockElapsed(d,181000),120);
 assert.equal(course.clockMinutes(d,181000),2);assert.equal(course.clockMinutes({},5000),0);
 assert.equal(course.clockMinutes({startedAt:1,pausedMs:0},1+300*60000),240,'duration is capped at the record limit');
});
test('starting a session records its start time; corrections of saved sessions do not',()=>{
 const started=sessions.start(doc(),{planId:'demo4-w01-A',uid:()=>'run-2',date:'2026-11-12',week:1,now:5000});
 assert.equal(started.document.drafts['run-2'].startedAt,5000);assert.equal(contract.valid(started.document),true);
 const editing=doc();editing.drafts['demo4-w01-B']={date:'2026-11-12',note:'',rows:{},editHistoryId:'h-1'};
 const resumed=sessions.start(editing,{planId:'demo4-w01-B',uid:()=>'run-3',date:'2026-11-12',week:1,now:5000});
 assert.equal(resumed.document.drafts['run-3'].startedAt,undefined);
});
test('the document contract accepts a fourth session and rejects malformed clocks',()=>{
 const d=doc({courseSession:'D'});assert.equal(contract.valid(d),true);
 d.plans[0].course.session='E';assert.equal(contract.valid(d),false);
 for(const draft of [{startedAt:-1},{startedAt:'1'},{pausedAt:10},{startedAt:10,pausedMs:-5}]){
  const bad=doc();bad.drafts.x={date:'2026-11-12',note:'',rows:{},...draft};assert.equal(contract.valid(bad),false,JSON.stringify(draft));
 }
});
test('an optional session is suggested but can be skipped and does not count towards the total',()=>{
 const OPT={...COURSE,optional:['D']};
 const d=doc({history:[record(1,'C','2026-11-12',3,true)]});
 const next=course.next(d,OPT);assert.equal(next.planId,'demo4-w01-D');
 assert.equal(course.skip(OPT,next).planId,'demo4-w02-A');assert.equal(course.skip(COURSE,next),null,'required sessions cannot be skipped');
 assert.equal(course.skip(OPT,{...next,resume:true}),null,'a started session is resumed, not skipped');
 d.history.push(record(1,'D','2026-11-13',4,true));
 assert.deepEqual(course.counts(d,OPT),{total:36,available:12,complete:1});
});
test('the chosen programme is used when it has plans; otherwise the newest programme with plans',()=>{
 const older={version:2,prefix:'old3',sessions:['A','B','C'],weeks:COURSE.weeks},newer={version:5,prefix:'new',sessions:['A'],weeks:COURSE.weeks};
 const d=doc();d.plans.push({id:'old3-w01-A',name:'x',note:'',exercises:[exercise('e1')],course:{version:2,week:1,session:'A',phase:1}});
 assert.equal(course.pick(d,[older,COURSE,newer],2).version,2);
 assert.equal(course.pick(d,[older,COURSE,newer],5).version,3,'a programme without plans is not chosen');
 assert.equal(course.pick(d,[older,COURSE,newer],undefined).version,3);
 assert.deepEqual(course.available(d,[older,COURSE,newer]).map(c=>c.version),[2,3]);
});
