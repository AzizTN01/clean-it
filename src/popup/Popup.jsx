import React, { useEffect, useState } from 'react';

function Popup(){
  const [status, setStatus] = useState('idle');
  const [site, setSite] = useState('');

  useEffect(()=>{
    // get active tab domain
    chrome.tabs.query({active:true,currentWindow:true},tabs=>{
      const url = tabs[0]?.url || '';
      try{ setSite(new URL(url).hostname); }catch(e){ console.warn('Invalid URL:', e); }
    });
  },[]);

  function startSelect(){
    chrome.tabs.query({active:true,currentWindow:true}, (tabs)=>{
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, {type:'CLEANWEB_START_SELECT'}, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Content script not ready, trying executeScript fallback');
          // Fallback: inject the start selection directly
          chrome.scripting.executeScript({
            target: {tabId},
            func: () => {
              if (window.cleanweb && window.cleanweb.startSelectingMode) {
                window.cleanweb.startSelectingMode();
              }
            }
          });
        }
        setStatus('selecting');
      });
    });
  }

  function resetSite(){
    chrome.tabs.query({active:true,currentWindow:true}, (tabs)=>{
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, {type:'CLEANWEB_RESET_SITE'}, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Content script not ready');
        }
      });
    });
  }

  return (
    <div style={{fontFamily:'system-ui',width:320,padding:12}}>
      <h3>CleanWeb</h3>
      <div style={{marginBottom:8}}>Site: <strong>{site}</strong></div>
      <button onClick={startSelect} style={{width:'100%',padding:8,marginBottom:6}}>Entrer en mode édition</button>
      <button onClick={resetSite} style={{width:'100%',padding:8,background:'#eee'}}>Réinitialiser ce site</button>
      <div style={{marginTop:12,fontSize:12,color:'#666'}}>Mode: {status}</div>
      <a href={'options.html'} style={{display:'block',marginTop:8}}>Gérer les sites nettoyés</a>
    </div>
  );
}

export default Popup;
