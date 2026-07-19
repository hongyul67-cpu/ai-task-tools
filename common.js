// 서비스워커 등록: 앱 셸·PDF 라이브러리를 캐시해 오프라인/CDN 차단 시에도 동작
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='127.0.0.1'||location.hostname==='localhost')){
  window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}

// 공통 저장 유틸: 지원되는 브라우저(Chrome/Edge 등)에서는 저장 위치를 직접 선택할 수 있는
// '다른 이름으로 저장' 대화상자를 띄우고, 지원하지 않는 브라우저(Safari/iOS 등)에서는
// 기본 다운로드 방식으로 자동 대체합니다.
async function saveFileSmart(blob, suggestedName){
  if(window.showSaveFilePicker){
    try{
      const handle=await window.showSaveFilePicker({suggestedName});
      const writable=await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return {ok:true,picked:true};
    }catch(e){
      if(e && e.name==='AbortError') return {ok:false,cancelled:true};
      // 다른 오류면 기본 다운로드로 대체
    }
  }
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=suggestedName;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
  return {ok:true,picked:false};
}
