const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const data=fs.readFileSync('data.js','utf8'),c=vm.createContext({});vm.runInContext(data+'\nthis.catalog=CATALOG',c);
test('public code has no previous personal load records or profile history',()=>{
 for(const text of [data,fs.readFileSync('app.js','utf8')])for(const phrase of ['17 kg','30 kg','11 kg','17%','Emanuel','Joana','cervical, lombar e na anca'])assert.equal(text.includes(phrase),false,phrase);
});
test('public data has video sources but no private 12-week workout prescriptions',()=>{
 assert.ok(c.catalog.length>0);assert.equal(data.includes('const PREPARED'),false);assert.equal(data.includes('bf12v2-w01-A'),false);
});
