(function(){
  const body=document.body;
  body.classList.add('app-shell');

  const pageMap={
    acasa:'home', home:'home',
    planuri:'plans',
    provocari:'challenges',
    biblia:'bible','biblia-libera':'bible',
    cont:'account',
    quiz:'quiz',
    resurse:'resources',
    despre:'about'
  };
  const canonical={home:'acasa',plans:'planuri',challenges:'provocari',bible:'biblia-libera',account:'cont',quiz:'quiz',resources:'resurse',about:'despre'};

  function pageFromHash(){
    const id=(location.hash||'#acasa').slice(1);
    return pageMap[id]||'home';
  }
  function markActive(page){
    document.querySelectorAll('.links a').forEach(a=>{
      const p=pageMap[(a.getAttribute('href')||'').replace('#','')];
      a.classList.toggle('active',p===page);
    });
    document.querySelectorAll('.appBottomNav button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  }
  function showPage(page,updateHash=true){
    body.dataset.page=page;
    markActive(page);
    document.querySelector('.appMoreSheet')?.classList.remove('open');
    if(updateHash){
      const h='#'+(canonical[page]||'acasa');
      if(location.hash!==h) history.replaceState(null,'',h);
    }
    window.scrollTo({top:0,left:0,behavior:'instant'});
  }

  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]');
    if(!a) return;
    const id=(a.getAttribute('href')||'').slice(1);
    if(!pageMap[id]) return;
    e.preventDefault();
    showPage(pageMap[id]);
  });

  const nav=document.createElement('nav');
  nav.className='appBottomNav';
  nav.setAttribute('aria-label','Navigare principală');
  nav.innerHTML=`
    <button type="button" data-page="home"><span>⌂</span>Acasă</button>
    <button type="button" data-page="bible"><span>📖</span>Biblia</button>
    <button type="button" data-page="plans"><span>✓</span>Planuri</button>
    <button type="button" data-page="challenges"><span>👥</span>Provocări</button>
    <button type="button" id="appMoreBtn"><span>☰</span>Meniu</button>`;
  document.body.appendChild(nav);

  const sheet=document.createElement('div');
  sheet.className='appMoreSheet';
  sheet.innerHTML=`
    <button type="button" data-go="account">👤 Contul meu</button>
    <button type="button" data-go="account">❤️ Favorite</button>
    <button type="button" data-go="account">📝 Notițe</button>
    <button type="button" data-go="quiz">❓ Quiz creștin</button>
    <button type="button" data-go="resources">📁 Resurse utile</button>
    <button type="button" data-go="about">ℹ️ Despre proiect</button>`;
  document.body.appendChild(sheet);

  nav.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    if(b.id==='appMoreBtn'){ sheet.classList.toggle('open'); return; }
    if(b.dataset.page) showPage(b.dataset.page);
  });
  sheet.addEventListener('click',e=>{
    const b=e.target.closest('[data-go]'); if(b) showPage(b.dataset.go);
  });
  document.addEventListener('click',e=>{
    if(!sheet.contains(e.target) && !e.target.closest('#appMoreBtn')) sheet.classList.remove('open');
  });
  window.addEventListener('hashchange',()=>showPage(pageFromHash(),false));

  // Make the three home shortcut cards behave like native app tiles.
  document.querySelectorAll('.quick a[href^="#"]').forEach(a=>a.setAttribute('role','button'));

  showPage(pageFromHash(),false);
})();
