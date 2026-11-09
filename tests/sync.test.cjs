const {test}=require('node:test'),assert=require('node:assert/strict'),rules=require('../sync-core.js');
test('new account creates a document; existing account on a new device pulls',()=>{
 assert.equal(rules.decide({localExists:false,dirty:false,baseRevision:0,remote:null}),'create');
 assert.equal(rules.decide({localExists:false,dirty:false,baseRevision:0,remote:{revision:8}}),'pull');
});
test('offline edits can save against their known revision',()=>{
 assert.equal(rules.decide({localExists:true,dirty:true,baseRevision:4,remote:{revision:4}}),'push');
});
test('offline edits never silently replace a newer online document',()=>{
 assert.equal(rules.decide({localExists:true,dirty:true,baseRevision:4,remote:{revision:5}}),'conflict');
 assert.equal(rules.isConflict({code:'PT409'}),true);
});
test('changes made during a save stay pending',()=>{
 assert.equal(rules.afterSave({sentSequence:7,currentSequence:8}),true);
 assert.equal(rules.afterSave({sentSequence:8,currentSequence:8}),false);
});
