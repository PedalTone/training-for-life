// Safari can leave an IndexedDB open/transaction pending after foreground changes.
// Bound each operation, abort late writes, and let callers use their existing fallback.
export function withSessionStore<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>,timeoutMs=5000):Promise<T> {
 return new Promise((resolve,reject)=>{
  let settled=false,database:IDBDatabase|undefined,transaction:IDBTransaction|undefined;
  const fail=(error:unknown)=>{if(settled)return;settled=true;clearTimeout(timer);try{transaction?.abort();}catch{}database?.close();reject(error);};
  const timer=setTimeout(()=>fail(new Error('Workout storage timed out.')),timeoutMs);
  try{
   const request=indexedDB.open('training-for-life',1);
   request.onblocked=()=>fail(new Error('Workout storage is blocked.'));
   request.onerror=()=>fail(request.error||new Error('Workout storage unavailable.'));
   request.onupgradeneeded=()=>{if(settled){request.transaction?.abort();return;}if(!request.result.objectStoreNames.contains('sessions'))request.result.createObjectStore('sessions',{keyPath:'id'});};
   request.onsuccess=()=>{
    database=request.result;if(settled){database.close();return;}
    try{
     transaction=database.transaction('sessions',mode);
     transaction.onabort=()=>fail(transaction?.error||new Error('Workout storage transaction failed.'));
     transaction.onerror=()=>fail(transaction?.error||new Error('Workout storage transaction failed.'));
     const operation=action(transaction.objectStore('sessions'));
     transaction.oncomplete=()=>{if(settled)return;settled=true;clearTimeout(timer);database?.close();resolve(operation.result);};
    }catch(error){fail(error);}
   };
  }catch(error){fail(error);}
 });
}
