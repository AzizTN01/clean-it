import React, { useEffect, useState } from 'react';

function Options(){
  const [sites, setSites] = useState({});

  useEffect(()=>{
    chrome.storage.local.get(null, res => {
      const data = {};
      Object.keys(res).forEach(k=>{
        if (k.startsWith('cleanweb:')) data[k.replace('cleanweb:','')] = res[k];
      });
      setSites(data);
    });
  },[]);

  function resetDomain(domain){
    chrome.storage.local.remove(['cleanweb:' + domain], ()=>{
      const copy = {...sites}; delete copy[domain]; setSites(copy);
    });
  }

  function resetAll(){
    const keys = Object.keys(sites).map(d=>'cleanweb:'+d);
    chrome.storage.local.remove(keys, ()=> setSites({}));
  }

  return (
    <div style={{padding:20,fontFamily:'system-ui'}}>
      <h2>Sites nettoyés</h2>
      {Object.keys(sites).length === 0 && <div>Aucun site nettoyé pour l'instant.</div>}
      <ul>
        {Object.entries(sites).map(([domain, list]) => (
          <li key={domain} style={{marginBottom:12}}>
            <div style={{fontWeight:600}}>{domain}</div>
            <div style={{fontSize:13,color:'#444'}}>{list.length} sélecteur(s)</div>
            <div style={{marginTop:6}}>
              <button onClick={()=>resetDomain(domain)} style={{marginRight:8}}>Réinitialiser</button>
            </div>
          </li>
        ))}
      </ul>
      <hr />
      <button onClick={resetAll}>Réinitialiser tout</button>
    </div>
  );
}

export default Options;
