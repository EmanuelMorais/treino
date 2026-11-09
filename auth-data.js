/* Authenticated data requests: never fall back to visitor credentials for account data. */
(function(root){
 function required(){const error=new Error('Renova o acesso para sincronizar. Os dados continuam guardados neste navegador.');error.code='AUTH_REQUIRED';return error;}
 function create(auth){
  function matches(session,id){return !!session?.access_token&&session.user?.id===id;}
  async function refresh(id){
   const result=await auth.refreshSession();
   if(result.error){if(!result.error.status||result.error.status>=500)throw result.error;throw required();}
   if(!matches(result.data?.session,id))throw required();
   return result.data.session;
  }
  async function sessionFor(id){
   const result=await auth.getSession();const session=result.data?.session;
   if(result.error||!matches(session,id)||(session.expires_at&&session.expires_at<=Math.floor(Date.now()/1000)+30))return refresh(id);
   return session;
  }
  return {async run(id,query){
   if(!id)throw required();
   const session=await sessionFor(id);
   let result=await query(session.access_token);
   // A rejected authentication request has not executed a write. Retry once with a fresh token.
   if(result.status===401){const fresh=await refresh(id);result=await query(fresh.access_token);if(result.status===401)throw required();}
   return result;
  }};
 }
 const api={create};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.TreinoAuthData=api;
})(typeof window!=='undefined'?window:this);
