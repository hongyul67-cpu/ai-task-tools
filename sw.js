// 서비스워커: 앱 셸과 PDF 라이브러리를 캐시해 오프라인·CDN 차단 상황에서도 동작하게 한다.
// 같은 출처 파일은 네트워크 우선(항상 최신) + 오프라인일 때 캐시 대체,
// CDN 라이브러리는 캐시 우선(버전 고정이라 갱신 불필요).
const CACHE='attools-v2';
const PRECACHE=[
  'index.html',
  'common.js',
  'manifest.webmanifest',
  '가이드.html',
  '구글폼_가이드.html',
  '과제목록.html',
  'AI실습과제_제출도구.html',
  '과제양식_만들기도구.html',
  '과제채점_도구_교사용.html',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    // 일부(CDN 차단 등)가 실패해도 나머지는 캐시되도록 개별 처리
    await Promise.allSettled(PRECACHE.map(u=>c.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()) if(k!==CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // 네트워크 우선: 배포 갱신이 즉시 반영되고, 오프라인이면 캐시로 대체
    e.respondWith((async()=>{
      try{
        const res=await fetch(req);
        if(res&&res.ok){ const c=await caches.open(CACHE); c.put(req,res.clone()); }
        return res;
      }catch(err){
        const hit=await caches.match(req,{ignoreSearch:true});
        if(hit) return hit;
        throw err;
      }
    })());
  }else{
    // CDN: 캐시 우선(응답이 opaque여도 저장 가능)
    e.respondWith((async()=>{
      const hit=await caches.match(req);
      if(hit) return hit;
      const res=await fetch(req);
      const c=await caches.open(CACHE);
      c.put(req,res.clone());
      return res;
    })());
  }
});
