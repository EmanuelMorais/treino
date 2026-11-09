const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../auth-data.js');
const session=(token='jwt-user-a',id='user-a')=>({access_token:token,user:{id},expires_at:Math.floor(Date.now()/1000)+3600});
test('never sends an account request as a visitor when cached login has no session',async()=>{
 let calls=0;
 const auth={getSession:async()=>({data:{session:null}}),refreshSession:async()=>({error:{status:400}})};
 await assert.rejects(create(auth).run('user-a',()=>{calls++;return {status:200}}),e=>e.code==='AUTH_REQUIRED');assert.equal(calls,0);
});
test('renews a missing session and sends the new access token',async()=>{
 const auth={getSession:async()=>({data:{session:null}}),refreshSession:async()=>({data:{session:session('fresh-jwt')}})};
 const result=await create(auth).run('user-a',async token=>({status:200,data:token}));assert.equal(result.data,'fresh-jwt');
});
test('does not send an old account payload after another account signs in',async()=>{
 let calls=0;
 const auth={getSession:async()=>({data:{session:session('jwt-b','user-b')}}),refreshSession:async()=>({data:{session:session('jwt-b','user-b')}})};
 await assert.rejects(create(auth).run('user-a',()=>{calls++}),e=>e.code==='AUTH_REQUIRED');assert.equal(calls,0);
});
test('retries an authentication rejection once with a refreshed token',async()=>{
 const tokens=[];let refreshed=0;
 const auth={getSession:async()=>({data:{session:session('old-jwt')}}),refreshSession:async()=>{refreshed++;return {data:{session:session('new-jwt')}}}};
 const result=await create(auth).run('user-a',async token=>{tokens.push(token);return {status:tokens.length===1?401:200}});
 assert.equal(result.status,200);assert.deepEqual(tokens,['old-jwt','new-jwt']);assert.equal(refreshed,1);
});
test('stops after a second authentication rejection instead of an anonymous retry loop',async()=>{
 let calls=0;
 const auth={getSession:async()=>({data:{session:session()}}),refreshSession:async()=>({data:{session:session('new-jwt')}})};
 await assert.rejects(create(auth).run('user-a',async()=>{calls++;return {status:401}}),e=>e.code==='AUTH_REQUIRED');assert.equal(calls,2);
});
test('does not retry permissions or concurrency errors as authentication failures',async()=>{
 let refreshed=0;
 const auth={getSession:async()=>({data:{session:session()}}),refreshSession:async()=>{refreshed++;throw Error('must not refresh')}};
 const api=create(auth);for(const status of [403,409])assert.equal((await api.run('user-a',async()=>({status}))).status,status);assert.equal(refreshed,0);
});
