(function(){
const URL='https://covrlgwobcolovrznnyk.supabase.co';
const KEY='sb_publishable_SxwNyOAxcq55BnEpjHCyow_MsbSUisX';
let session=JSON.parse(localStorage.getItem('comoara-auth')||'null');
const $=id=>document.getElementById(id);
function authHeaders(extra={}){return {'apikey':KEY,'Authorization':'Bearer '+(session?.access_token||KEY),'Content-Type':'application/json',...extra}}
async function api(path,opt={}){const r=await fetch(URL+path,{...opt,headers:{...authHeaders(),...(opt.headers||{})}});const txt=await r.text();let d=null;try{d=txt?JSON.parse(txt):null}catch{}if(!r.ok)throw new Error(d?.msg||d?.message||d?.error_description||'Eroare');return d}
function setMsg(t,err=false){const e=$('authMsg');if(e){e.textContent=t;e.style.color=err?'#a32d2d':'#2e7d52'}}
function renderAuth(){const logged=!!session?.access_token;$('authGuest').style.display=logged?'none':'block';$('authUser').style.display=logged?'block':'none';$('accountNav').textContent=logged?'Contul meu':'Conectare';if(logged){const n=session.user?.user_metadata?.display_name||session.user?.email||'Contul meu';$('accountName').textContent=n;$('accountEmail').textContent=session.user?.email||'';loadAccountData();}}
async function signup(){const name=$('signupName').value.trim(),email=$('signupEmail').value.trim(),password=$('signupPassword').value;if(name.length<2)return setMsg('Scrie numele tău.',true);if(password.length<6)return setMsg('Parola trebuie să aibă cel puțin 6 caractere.',true);try{setMsg('Creăm contul…');await api('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password,data:{display_name:name}})});setMsg('Cont creat cu succes. Acum te poți conecta. ✅')}catch(e){setMsg(e.message,true)}}
async function login(){const email=$('loginEmail').value.trim(),password=$('loginPassword').value;try{setMsg('Conectare…');const d=await api('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});session=d;localStorage.setItem('comoara-auth',JSON.stringify(d));setMsg('Te-ai conectat. ✅');renderAuth()}catch(e){setMsg('Nu am putut face conectarea: '+e.message,true)}}
async function logout(){try{await api('/auth/v1/logout',{method:'POST'})}catch{}session=null;localStorage.removeItem('comoara-auth');renderAuth();setMsg('Te-ai deconectat.')}
async function rest(path,opt={}){return api('/rest/v1/'+path,opt)}
async function loadAccountData(){if(!session)return;try{const [notes,favs,state]=await Promise.all([rest('bible_notes?select=id,book,chapter,verse,note,created_at&order=created_at.desc'),rest('favorite_verses?select=id,book,chapter,verse,created_at&order=created_at.desc'),rest('reading_state?select=book,chapter&limit=1')]);$('notesCount').textContent=notes.length;$('favoritesCount').textContent=favs.length;$('savedNotes').innerHTML=notes.length?notes.map(n=>`<div class="savedItem"><b>📝 ${esc(n.book)} ${n.chapter}${n.verse?':'+n.verse:''}</b><p>${esc(n.note)}</p><button onclick="window.deleteBibleNote('${n.id}')">Șterge</button></div>`).join(''):'<p class="muted">Nu ai încă notițe salvate.</p>';$('savedFavorites').innerHTML=favs.length?favs.map(f=>`<div class="savedItem"><b>❤️ ${esc(f.book)} ${f.chapter}:${f.verse}</b><button onclick="window.deleteFavorite('${f.id}')">Șterge</button></div>`).join(''):'<p class="muted">Nu ai încă versete favorite.</p>';if(state?.[0]){$('lastReading').textContent=state[0].book+' '+state[0].chapter;$('continueFree').dataset.book=state[0].book;$('continueFree').dataset.chapter=state[0].chapter;}}catch(e){console.warn(e)}}
window.deleteBibleNote=async id=>{if(!session)return;await rest('bible_notes?id=eq.'+id,{method:'DELETE'});loadAccountData()};
window.deleteFavorite=async id=>{if(!session)return;await rest('favorite_verses?id=eq.'+id,{method:'DELETE'});loadAccountData()};
window.saveBibleNote=async(book,chapter,verse)=>{if(!session){location.hash='cont';setMsg('Conectează-te pentru a păstra notițele.',true);return}const note=prompt(`Notiță pentru ${book} ${chapter}:${verse}`);if(!note?.trim())return;await rest('bible_notes',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({user_id:session.user.id,book,chapter,verse,note:note.trim()})});loadAccountData();alert('Notița a fost salvată. ✅')};
window.toggleFavorite=async(book,chapter,verse)=>{if(!session){location.hash='cont';setMsg('Conectează-te pentru a salva versete favorite.',true);return}const q=`favorite_verses?user_id=eq.${session.user.id}&book=eq.${encodeURIComponent(book)}&chapter=eq.${chapter}&verse=eq.${verse}&select=id`;const found=await rest(q);if(found.length)await rest('favorite_verses?id=eq.'+found[0].id,{method:'DELETE'});else await rest('favorite_verses',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({user_id:session.user.id,book,chapter,verse})});loadAccountData();alert(found.length?'Scos din favorite.':'Salvat la favorite. ❤️')};
async function saveReading(book,chapter){if(!session)return;await rest('reading_state?on_conflict=user_id',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:session.user.id,book,chapter,updated_at:new Date().toISOString()})}).catch(()=>{})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.openFreeBible=async function(bookName,chapter){const code=BOOKMAP[bookName];if(!code)return;const overlay=document.createElement('div');overlay.className='readerOverlay';overlay.innerHTML=`<div class="readerPanel"><div class="readerTop"><h2>${esc(bookName)} ${chapter}</h2><button class="readerClose">← Înapoi</button></div><div class="readerBody"><div id="freeContent" class="readerLoading">Se încarcă Biblia…</div></div></div>`;document.body.appendChild(overlay);document.body.style.overflow='hidden';overlay.querySelector('.readerClose').onclick=()=>{overlay.remove();document.body.style.overflow=''};try{const bible=await loadRccv(),ch=bible[code]?.[String(chapter)];if(!ch)throw new Error('Capitolul nu a fost găsit.');const verses=Object.entries(ch).filter(([,t])=>String(t).trim()).sort((a,b)=>+a[0]-+b[0]);overlay.querySelector('#freeContent').className='';overlay.querySelector('#freeContent').innerHTML=`<article class="chapter"><h3>${esc(bookName)} ${chapter}</h3>${verses.map(([n,t])=>`<div class="freeVerse"><p class="verse"><span class="verseNum">${n}</span>${esc(t)}</p><div class="verseActions"><button onclick="toggleFavorite('${esc(bookName).replace(/'/g,"\\'")}',${chapter},${n})">♡ Favorite</button><button onclick="saveBibleNote('${esc(bookName).replace(/'/g,"\\'")}',${chapter},${n})">📝 Notiță</button></div></div>`).join('')}</article>`;saveReading(bookName,chapter);loadAccountData()}catch(e){overlay.querySelector('#freeContent').innerHTML='<div class="readerError">'+esc(e.message)+'</div>'}}
function setupFreeReader(){const sel=$('freeBook');Object.keys(BOOKMAP).forEach(b=>{const o=document.createElement('option');o.value=o.textContent=b;sel.appendChild(o)});$('openFreeBible').onclick=()=>openFreeBible(sel.value,Math.max(1,parseInt($('freeChapter').value)||1));$('continueFree').onclick=()=>{const b=$('continueFree').dataset.book||'Geneza',c=+$('continueFree').dataset.chapter||1;openFreeBible(b,c)}}
$('signupBtn').onclick=signup;$('loginBtn').onclick=login;$('logoutBtn').onclick=logout;setupFreeReader();renderAuth();
})();

// Bible navigator – Bible + study library
(function(){
 const OT=['Geneza','Exodul','Leviticul','Numeri','Deuteronomul','Iosua','Judecători','Rut','1 Samuel','2 Samuel','1 Împărați','2 Împărați','1 Cronici','2 Cronici','Ezra','Neemia','Estera','Iov','Psalmii','Proverbele','Eclesiastul','Cântarea Cântărilor','Isaia','Ieremia','Plângerile lui Ieremia','Ezechiel','Daniel','Osea','Ioel','Amos','Obadia','Iona','Mica','Naum','Habacuc','Țefania','Hagai','Zaharia','Maleahi'];
 const NT=['Matei','Marcu','Luca','Ioan','Faptele Apostolilor','Romani','1 Corinteni','2 Corinteni','Galateni','Efeseni','Filipeni','Coloseni','1 Tesaloniceni','2 Tesaloniceni','1 Timotei','2 Timotei','Tit','Filimon','Evrei','Iacov','1 Petru','2 Petru','1 Ioan','2 Ioan','3 Ioan','Iuda','Apocalipsa'];
 const COMMENTARIES=[
  {
    id:'mh', name:'Matthew Henry Complete', author:'Matthew Henry',
    kind:'Comentariu biblic clasic', license:'Public Domain',
    description:'Comentariu clasic pentru întreaga Biblie. Deschide sursa legală pentru cartea și capitolul studiat.',
    url:'https://www.ccel.org/ccel/henry/mhc'
  },
  {
    id:'jfb', name:'Critical and Explanatory', author:'Jamieson, Fausset & Brown',
    kind:'Comentariu biblic', license:'Public Domain',
    description:'Commentary Critical and Explanatory on the Whole Bible (1871), ediție electronică declarată Public Domain.',
    url:'https://www.ccel.org/ccel/jamieson/jfb'
  },
  {
    id:'tsk', name:'TSK References', author:'Treasury of Scripture Knowledge',
    kind:'Referințe biblice', license:'Public Domain',
    description:'Aproximativ 500.000 de trimiteri și pasaje paralele pentru studiul Scripturii.',
    url:'https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=TSK'
  },
  {
    id:'pent', name:'Comentariu Penticostal', author:'Comoara Ascunsă',
    kind:'Perspectivă penticostală', license:'Conținut original',
    description:'Studii originale dezvoltate pentru Comoara Ascunsă, fără atribuirea textelor unor autori moderni.',
    url:''
  }
 ];
 const PENTECOSTAL={
  'Faptele Apostolilor|2':'Faptele 2 prezintă împlinirea promisiunii lui Isus privind puterea Duhului Sfânt. Revărsarea Duhului, vorbirea în alte limbi, predica lui Petru și răspunsul oamenilor formează împreună tabloul Cincizecimii: împuternicire pentru mărturie, proclamarea lui Hristos și nașterea unei comunități stăruitoare în învățătura apostolilor, părtășie, frângerea pâinii și rugăciuni.',
  '1 Corinteni|12':'Pavel arată că darurile spirituale sunt diverse, dar izvorăsc din același Duh. Scopul lor nu este prestigiul personal, ci folosul comun și zidirea Trupului lui Hristos. Diversitatea darurilor trebuie să funcționeze în unitate, sub domnia lui Isus.',
  '1 Corinteni|14':'În adunare, exercitarea darurilor trebuie să urmărească zidirea bisericii. Pavel păstrează loc pentru manifestările spirituale, dar cere înțelegere, interpretare și ordine. Libertatea spirituală și responsabilitatea față de comunitate nu sunt opuse.',
  'Romani|8':'Viața în Duhul este prezentată în contrast cu viața dominată de fire. Duhul locuiește în credincios, confirmă înfierea, ajută în slăbiciune și susține nădejdea până la răscumpărarea deplină.',
  'Iacov|5':'Iacov cheamă biserica la rugăciune pentru cel bolnav, implicarea prezbiterilor și ungerea cu untdelemn în Numele Domnului. Accentul rămâne pe Dumnezeu, pe rugăciunea credinței, mărturisire și restaurare.'
 };
 let testament='OT',book='Geneza',chapter=1,bible=null,overlay=null,mode='bible';
 const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function books(){return testament==='OT'?OT:NT}
 function make(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.className='bibleAppOverlay studyReader';
  overlay.innerHTML=`<div class="bibleAppTop"><button class="bibleAppBack">← Înapoi</button><b>📖 Comoara Ascunsă — Biblia</b></div>
  <div class="bibleAppGrid" data-step="books">
   <aside class="biblePane"><div class="biblePaneTitle">Cărțile Bibliei</div><div class="testamentTabs"><button data-t="OT" class="active">Vechiul Testament</button><button data-t="NT">Noul Testament</button></div><div class="bibleList" id="appBooks"></div></aside>
   <aside class="biblePane chapterPane"><div class="biblePaneTitle" id="appBookTitle">Geneza</div><div class="bibleList chapterList" id="appChapters"></div></aside>
   <main class="readingPane">
    <div class="readingHead"><button class="readingNav" id="prevChapter">‹</button><h2 id="appReadingTitle">Geneza 1</h2><button class="readingNav" id="nextChapter">›</button></div>
    <div class="readerModeTabs"><button id="modeBible" class="active">📖 Biblia</button><button id="modeStudy">📚 Comentarii și studii <span id="studyCount"></span></button></div>
    <div id="appReading"><p style="padding:25px 0">Alege o carte și un capitol.</p></div>
   </main>
  </div>
  <div class="bibleMobileBar"><button data-go="books"><b>☰</b>Cărți</button><button data-go="chapters"><b>▤</b>Capitole</button><button data-go="reading"><b>📖</b>Lectură</button></div>`;
  document.body.appendChild(overlay);document.body.style.overflow='hidden';
  overlay.querySelector('.bibleAppBack').onclick=close;
  overlay.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{testament=b.dataset.t;overlay.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('active',x.dataset.t===testament));renderBooks()});
  overlay.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>overlay.querySelector('.bibleAppGrid').dataset.step=b.dataset.go);
  overlay.querySelector('#prevChapter').onclick=()=>{if(chapter>1)selectChapter(chapter-1)};
  overlay.querySelector('#nextChapter').onclick=()=>{const max=chapterCount();if(chapter<max)selectChapter(chapter+1)};
  overlay.querySelector('#modeBible').onclick=()=>{mode='bible';renderReading()};
  overlay.querySelector('#modeStudy').onclick=()=>{mode='study';renderReading()};
  renderBooks();selectBook(book,false);
 }
 function close(){if(!overlay)return;overlay.remove();overlay=null;document.body.style.overflow=''}
 function renderBooks(){overlay.querySelector('#appBooks').innerHTML=books().map(b=>`<button data-book="${h(b)}" class="${b===book?'active':''}"><span>${h(b)}</span><span>›</span></button>`).join('');overlay.querySelectorAll('[data-book]').forEach(x=>x.onclick=()=>selectBook(x.dataset.book,true))}
 async function selectBook(b,mobile){book=b;chapter=1;testament=NT.includes(b)?'NT':'OT';overlay.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('active',x.dataset.t===testament));renderBooks();overlay.querySelector('#appBookTitle').textContent=b;overlay.querySelector('#appChapters').innerHTML='<p style="padding:12px">Se încarcă capitolele…</p>';if(mobile)overlay.querySelector('.bibleAppGrid').dataset.step='chapters';try{bible=bible||await loadRccv();renderChapters()}catch(e){overlay.querySelector('#appChapters').innerHTML='<p style="padding:12px">Nu am putut încărca Biblia.</p>'}}
 function chapterCount(){const code=BOOKMAP[book];return bible&&bible[code]?Object.keys(bible[code]).filter(x=>/^\d+$/.test(x)).length:1}
 function renderChapters(){const n=chapterCount();overlay.querySelector('#appChapters').innerHTML=Array.from({length:n},(_,i)=>`<button data-ch="${i+1}" class="${i+1===chapter?'active':''}"><span>Capitolul ${i+1}</span><span>›</span></button>`).join('');overlay.querySelectorAll('[data-ch]').forEach(x=>x.onclick=()=>selectChapter(+x.dataset.ch))}
 async function selectChapter(n){chapter=n;if(!bible)bible=await loadRccv();renderChapters();overlay.querySelector('.bibleAppGrid').dataset.step='reading';overlay.querySelector('#appReadingTitle').textContent=book+' '+chapter;renderReading();if(typeof saveReading==='function')saveReading(book,chapter)}
 function renderReading(){
  if(!overlay||!bible)return;
  const pent=PENTECOSTAL[`${book}|${chapter}`]||'';
  overlay.querySelector('#studyCount').textContent=`(${COMMENTARIES.length})`;
  overlay.querySelector('#modeBible').classList.toggle('active',mode==='bible');
  overlay.querySelector('#modeStudy').classList.toggle('active',mode==='study');
  const box=overlay.querySelector('#appReading');
  if(mode==='study'){
   const cards=COMMENTARIES.map(v=>{
    const body=v.id==='pent'
      ? (pent ? `<div class="studyWorkBody"><p>${h(pent)}</p><small>Text original Comoara Ascunsă — ${h(book)} ${chapter}</small></div>`
              : `<div class="studyWorkBody"><p>Comentariul penticostal original pentru ${h(book)} ${chapter} este în pregătire. Nu afișăm texte inventate sub numele altor autori.</p></div>`)
      : `<div class="studyWorkBody"><p>${h(v.description)}</p><a class="commentaryOpen" href="${h(v.url)}" target="_blank" rel="noopener">Deschide sursa legală ↗</a></div>`;
    return `<details class="studyWork"><summary><span><small>${h(v.kind)} • ${h(v.license)}</small><b>${h(v.name)}</b><em>${h(v.author)}</em></span><strong>＋</strong></summary>${body}</details>`;
   }).join('');
   box.innerHTML=`<div class="studyIntro"><small>COMENTARII</small><h3>${h(book)} ${chapter}</h3><p>Comentarii și instrumente de studiu selectate pentru pasajul pe care îl citești.</p></div>${cards}`;
   return;
  }
  const code=BOOKMAP[book],ch=bible[code]?.[String(chapter)];
  if(!ch){box.innerHTML='<p>Capitolul nu a fost găsit.</p>';return}
  const q=book.replace(/'/g,"\\'");
  box.innerHTML=Object.entries(ch).filter(([,t])=>String(t).trim()).sort((a,b)=>+a[0]-+b[0]).map(([n,t])=>`<div class="appVerse"><span class="appVerseNum">${n}</span><span>${h(t)}</span><span class="appVerseActions"><button title="Favorite" onclick="toggleFavorite('${q}',${chapter},${n})">♡</button><button title="Notiță" onclick="saveBibleNote('${q}',${chapter},${n})">📝</button></span></div>`).join('');
 }
 window.openBibleApp=()=>make();
 document.addEventListener('click',e=>{const a=e.target.closest('a[href="#biblia"],a[href="#biblia-libera"]');if(a){e.preventDefault();make()}});
 const old=document.getElementById('openFreeBible');if(old){old.textContent='Deschide Biblia';old.onclick=()=>make()}
})();
