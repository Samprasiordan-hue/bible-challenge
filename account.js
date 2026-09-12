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
async function loadAccountData(){if(!session)return;try{const [notes,favs,state]=await Promise.all([rest('bible_notes?select=id,book,chapter,verse,note,created_at&order=created_at.desc'),rest('favorite_verses?select=id,book,chapter,verse,created_at&order=created_at.desc'),rest('reading_state?select=book,chapter&limit=1')]);$('notesCount').textContent=notes.length;$('favoritesCount').textContent=favs.length;window.__savedNotes=notes;$('savedNotes').innerHTML=notes.length?notes.map(n=>{const rich=String(n.note||'').includes('<')?cleanRichNote(n.note):`<p>${esc(n.note)}</p>`;return `<div class="savedItem"><b>📝 ${esc(n.book)} ${n.chapter}${n.verse?':'+n.verse:''}</b><div class="savedRichNote">${rich}</div><button onclick="window.editBibleNote('${n.id}')">Editează</button> <button onclick="window.deleteBibleNote('${n.id}')">Șterge</button></div>`}).join(''):'<p class="muted">Nu ai încă notițe salvate.</p>';$('savedFavorites').innerHTML=favs.length?favs.map(f=>`<div class="savedItem"><b>❤️ ${esc(f.book)} ${f.chapter}:${f.verse}</b><button onclick="window.deleteFavorite('${f.id}')">Șterge</button></div>`).join(''):'<p class="muted">Nu ai încă versete favorite.</p>';if(state?.[0]){$('lastReading').textContent=state[0].book+' '+state[0].chapter;$('continueFree').dataset.book=state[0].book;$('continueFree').dataset.chapter=state[0].chapter;}}catch(e){console.warn(e)}}
window.editBibleNote=id=>{const n=(window.__savedNotes||[]).find(x=>x.id===id);if(n)openRichNote(n.book,n.chapter,n.verse,id,n.note||'')};
window.deleteBibleNote=async id=>{if(!session)return;await rest('bible_notes?id=eq.'+id,{method:'DELETE'});loadAccountData()};
window.deleteFavorite=async id=>{if(!session)return;await rest('favorite_verses?id=eq.'+id,{method:'DELETE'});loadAccountData()};

let richNoteCtx=null;
function cleanRichNote(html){
  const t=document.createElement('template'); t.innerHTML=html;
  const ok=new Set(['P','BR','B','STRONG','I','EM','U','H2','H3','UL','OL','LI','BLOCKQUOTE','DIV']);
  [...t.content.querySelectorAll('*')].forEach(el=>{
    [...el.attributes].forEach(a=>el.removeAttribute(a.name));
    if(!ok.has(el.tagName)) el.replaceWith(...el.childNodes);
  });
  return t.innerHTML.trim();
}
function openRichNote(book,chapter,verse,id=null,existing=''){
  if(!session){location.hash='cont';setMsg('Conectează-te pentru a păstra notițele.',true);return}
  let root=document.getElementById('richNoteRoot');
  if(!root){
    const css=document.createElement('style');
    css.textContent=`
    #richNoteRoot{display:none;position:fixed;inset:0;z-index:30000;background:#061827aa;padding:3vh 3vw}
    #richNoteRoot.open{display:block}.richNoteBox{max-width:820px;height:90vh;margin:auto;background:#fff;border-radius:18px;overflow:hidden;display:flex;flex-direction:column}
    .richNoteHead{background:#08283d;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between}
    .richNoteHead h3{margin:0}.richNoteHead button{border:0;background:transparent;color:#fff;font-size:24px}
    .richNoteTools{display:flex;gap:6px;flex-wrap:wrap;padding:10px;background:#faf4e8;border-bottom:1px solid #eadfcf}
    .richNoteTools button,.richNoteTools select{border:1px solid #d8ccb8;background:#fff;border-radius:8px;padding:8px 10px;font-weight:700;color:#08283d}
    #richNoteArea{flex:1;overflow:auto;padding:18px;outline:none;font:17px/1.6 Arial;color:#1c2c36}
    #richNoteArea:empty:before{content:"Scrie idei, observații, schiță de predică, aplicații...";color:#97a0a6}
    #richNoteArea blockquote{border-left:4px solid #c99024;background:#fff5dc;padding:8px 12px;margin:12px 0}
    .richNoteFoot{padding:11px 15px;text-align:right;background:#faf4e8}.richNoteSave{border:0;border-radius:22px;padding:10px 18px;background:#c99024;color:#fff;font-weight:800}
    @media(max-width:600px){#richNoteRoot{padding:0}.richNoteBox{height:100dvh;border-radius:0}.richNoteTools{max-height:105px;overflow:auto}}
    `;
    document.head.appendChild(css);
    root=document.createElement('div'); root.id='richNoteRoot';
    root.innerHTML=`<div class="richNoteBox">
      <div class="richNoteHead"><h3 id="richNoteTitle">Notiță</h3><button id="richNoteClose">×</button></div>
      <div class="richNoteTools">
        <select id="richNoteStyle"><option value="p">Text</option><option value="h2">Titlu</option><option value="h3">Subtitlu</option></select>
        <button data-cmd="bold"><b>B</b></button><button data-cmd="italic"><i>I</i></button><button data-cmd="underline"><u>U</u></button>
        <button data-cmd="insertUnorderedList">• Listă</button><button data-cmd="insertOrderedList">1. Listă</button>
        <button data-cmd="formatBlock" data-val="blockquote">❝ Citat</button><button data-cmd="removeFormat">Curăță</button>
      </div>
      <div id="richNoteArea" contenteditable="true"></div>
      <div class="richNoteFoot"><button id="richNoteSave" class="richNoteSave">Salvează notița</button></div>
    </div>`;
    document.body.appendChild(root);
    root.querySelector('#richNoteClose').onclick=()=>root.classList.remove('open');
    root.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{document.getElementById('richNoteArea').focus();document.execCommand(b.dataset.cmd,false,b.dataset.val||null)});
    root.querySelector('#richNoteStyle').onchange=e=>{document.getElementById('richNoteArea').focus();document.execCommand('formatBlock',false,e.target.value)};
    root.querySelector('#richNoteSave').onclick=async()=>{
      if(!richNoteCtx)return;
      const ed=document.getElementById('richNoteArea');
      if(!ed.innerText.trim())return;
      const html=cleanRichNote(ed.innerHTML);
      if(richNoteCtx.id){
        await rest('bible_notes?id=eq.'+richNoteCtx.id,{method:'PATCH',headers:{'Prefer':'return=minimal'},body:JSON.stringify({note:html})});
      }else{
        await rest('bible_notes',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({user_id:session.user.id,book:richNoteCtx.book,chapter:richNoteCtx.chapter,verse:richNoteCtx.verse,note:html})});
      }
      root.classList.remove('open'); loadAccountData();
    };
  }
  richNoteCtx={book,chapter,verse,id};
  document.getElementById('richNoteTitle').textContent=`📝 ${book} ${chapter}:${verse}`;
  document.getElementById('richNoteArea').innerHTML=existing||'';
  root.classList.add('open');
}

window.saveBibleNote=async(book,chapter,verse)=>openRichNote(book,chapter,verse);
window.toggleFavorite=async(book,chapter,verse)=>{if(!session){location.hash='cont';setMsg('Conectează-te pentru a salva versete favorite.',true);return}const q=`favorite_verses?user_id=eq.${session.user.id}&book=eq.${encodeURIComponent(book)}&chapter=eq.${chapter}&verse=eq.${verse}&select=id`;const found=await rest(q);if(found.length)await rest('favorite_verses?id=eq.'+found[0].id,{method:'DELETE'});else await rest('favorite_verses',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({user_id:session.user.id,book,chapter,verse})});loadAccountData();alert(found.length?'Scos din favorite.':'Salvat la favorite. ❤️')};
async function saveReading(book,chapter){if(!session)return;await rest('reading_state?on_conflict=user_id',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:session.user.id,book,chapter,updated_at:new Date().toISOString()})}).catch(()=>{})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

window.COMMENTARY_LIBRARY={
  'Ioan|3':[
    {author:'Comentariu editorial penticostal',title:'Nașterea din nou și credința în Fiul',kind:'Comentariu',text:'Discuția cu Nicodim leagă intrarea în Împărăția lui Dumnezeu de nașterea din nou. Capitolul pune împreună lucrarea Duhului, credința în Fiul și darul vieții veșnice.'},
    {author:'French L. Arrington',title:'Pentru aprofundare',kind:'Autor recomandat',text:'Recomandare bibliografică pentru aprofundarea mântuirii și lucrării Duhului din perspectivă penticostală. Nu este un text copiat din lucrarea autorului.'}
  ],
  'Faptele Apostolilor|2':[
    {author:'Comentariu editorial penticostal',title:'Cincizecimea: Duhul Sfânt, putere și mărturie',kind:'Comentariu',text:'Faptele 2 descrie revărsarea Duhului Sfânt promisă de Isus, vorbirea în alte limbi, predica lui Petru și formarea comunității credincioșilor.'},
    {author:'Stanley M. Horton',title:'Duhul Sfânt și Cincizecimea',kind:'Autor recomandat',text:'Recomandare pentru aprofundarea pneumatologiei penticostale. Această fișă nu reproduce textul cărților autorului.'},
    {author:'French L. Arrington',title:'Faptele Apostolilor și viața în Duhul',kind:'Autor recomandat',text:'Recomandare pentru aprofundarea unei lecturi penticostale a Faptelor Apostolilor, fără reproducerea comentariului autorului.'}
  ],
  'Romani|8':[
    {author:'Comentariu editorial penticostal',title:'Viața în Duhul și siguranța în Hristos',kind:'Comentariu',text:'Romani 8 contrastează viața dominată de fire cu viața condusă de Duhul. Duhul locuiește în credincioși, confirmă înfierea și ajută în slăbiciune.'},
    {author:'Gordon D. Fee',title:'Pavel și lucrarea Duhului',kind:'Autor penticostal recomandat',text:'Recomandare bibliografică pentru aprofundarea textelor pauline despre Duhul Sfânt; nu este reproducere din lucrările autorului.'}
  ],
  '1 Corinteni|12':[
    {author:'Comentariu editorial penticostal',title:'Darurile Duhului și unitatea Trupului',kind:'Comentariu',text:'Diversitatea darurilor spirituale are aceeași sursă: Duhul Sfânt. Darurile sunt oferite pentru folosul comun și zidirea Trupului lui Hristos.'}
  ],
  '1 Corinteni|14':[
    {author:'Comentariu editorial penticostal',title:'Darurile spirituale în adunare',kind:'Comentariu',text:'Pavel urmărește zidirea bisericii și ordinea în închinarea comunitară. Profeția și limbile sunt discutate în raport cu înțelegerea, interpretarea și folosul comun.'}
  ],
  'Iacov|5':[
    {author:'Comentariu editorial penticostal',title:'Rugăciune, vindecare și restaurare',kind:'Comentariu',text:'Capitolul pune accent pe rugăciune, mărturisire și grija comunității pentru bolnav. Ungerea cu untdelemn este importantă în practica penticostală a rugăciunii pentru bolnavi.'}
  ]
};
window.renderChapterCommentaries=function(book,chapter){
  const esc2=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const items=window.COMMENTARY_LIBRARY[`${book}|${chapter}`]||[];
  const cards=items.length?items.map(x=>`<article class="studyCard"><div class="studyType">${esc2(x.kind)}</div><h4>${esc2(x.title)}</h4><div class="studyAuthor">${esc2(x.author)}</div><p>${esc2(x.text)}</p></article>`).join(''):`<div class="studyEmpty"><b>Nu există încă un comentariu verificat pentru acest capitol.</b><p>Biblioteca este pregătită. Nu afișăm texte inventate sau copiate fără drepturi.</p></div>`;
  return `<section class="chapterStudies"><div class="studyHeading"><div><small>COMENTARII ȘI STUDII</small><h3>${esc2(book)} ${chapter}</h3></div><span>${items.length} materiale</span></div>${cards}<div class="studyNotice">Materialele editoriale sunt originale. Teologii nominalizați sunt indicați pentru aprofundare; lucrările lor nu sunt copiate fără permisiune.</div></section>`;
};

window.openFreeBible=async function(bookName,chapter){const code=BOOKMAP[bookName];if(!code)return;const overlay=document.createElement('div');overlay.className='readerOverlay';overlay.innerHTML=`<div class="readerPanel"><div class="readerTop"><h2>${esc(bookName)} ${chapter}</h2><button class="readerClose">← Înapoi</button></div><div class="readerBody"><div id="freeContent" class="readerLoading">Se încarcă Biblia…</div></div></div>`;document.body.appendChild(overlay);document.body.style.overflow='hidden';overlay.querySelector('.readerClose').onclick=()=>{overlay.remove();document.body.style.overflow=''};try{const bible=await loadRccv(),ch=bible[code]?.[String(chapter)];if(!ch)throw new Error('Capitolul nu a fost găsit.');const verses=Object.entries(ch).filter(([,t])=>String(t).trim()).sort((a,b)=>+a[0]-+b[0]);overlay.querySelector('#freeContent').className='';overlay.querySelector('#freeContent').innerHTML=`<article class="chapter"><h3>${esc(bookName)} ${chapter}</h3>${verses.map(([n,t])=>`<div class="freeVerse"><p class="verse"><span class="verseNum">${n}</span>${esc(t)}</p><div class="verseActions"><button onclick="toggleFavorite('${esc(bookName).replace(/'/g,"\\'")}',${chapter},${n})">♡ Favorite</button><button onclick="saveBibleNote('${esc(bookName).replace(/'/g,"\\'")}',${chapter},${n})">📝 Notiță</button></div></div>`).join('')}</article>${window.renderChapterCommentaries(bookName,chapter)}`;saveReading(bookName,chapter);loadAccountData()}catch(e){overlay.querySelector('#freeContent').innerHTML='<div class="readerError">'+esc(e.message)+'</div>'}}
function setupFreeReader(){const sel=$('freeBook');Object.keys(BOOKMAP).forEach(b=>{const o=document.createElement('option');o.value=o.textContent=b;sel.appendChild(o)});$('openFreeBible').onclick=()=>openFreeBible(sel.value,Math.max(1,parseInt($('freeChapter').value)||1));$('continueFree').onclick=()=>{const b=$('continueFree').dataset.book||'Geneza',c=+$('continueFree').dataset.chapter||1;openFreeBible(b,c)}}
$('signupBtn').onclick=signup;$('loginBtn').onclick=login;$('logoutBtn').onclick=logout;setupFreeReader();renderAuth();
})();

// Bible navigator – app style
(function(){
 const OT=['Geneza','Exodul','Leviticul','Numeri','Deuteronomul','Iosua','Judecători','Rut','1 Samuel','2 Samuel','1 Împărați','2 Împărați','1 Cronici','2 Cronici','Ezra','Neemia','Estera','Iov','Psalmii','Proverbele','Eclesiastul','Cântarea Cântărilor','Isaia','Ieremia','Plângerile lui Ieremia','Ezechiel','Daniel','Osea','Ioel','Amos','Obadia','Iona','Mica','Naum','Habacuc','Țefania','Hagai','Zaharia','Maleahi'];
 const NT=['Matei','Marcu','Luca','Ioan','Faptele Apostolilor','Romani','1 Corinteni','2 Corinteni','Galateni','Efeseni','Filipeni','Coloseni','1 Tesaloniceni','2 Tesaloniceni','1 Timotei','2 Timotei','Tit','Filimon','Evrei','Iacov','1 Petru','2 Petru','1 Ioan','2 Ioan','3 Ioan','Iuda','Apocalipsa'];
 let testament='OT', book='Geneza', chapter=1, bible=null, overlay=null;
 const h=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function books(){return testament==='OT'?OT:NT}
 function make(){
  if(overlay) return;
  overlay=document.createElement('div'); overlay.className='bibleAppOverlay';
  overlay.innerHTML=`<div class="bibleAppTop"><button class="bibleAppBack">← Înapoi</button><b>📖 Comoara Ascunsă — Biblia</b></div><div class="bibleAppGrid" data-step="books"><aside class="biblePane"><div class="biblePaneTitle">Cărțile Bibliei</div><div class="testamentTabs"><button data-t="OT" class="active">Vechiul Testament</button><button data-t="NT">Noul Testament</button></div><div class="bibleList" id="appBooks"></div></aside><aside class="biblePane chapterPane"><div class="biblePaneTitle" id="appBookTitle">Geneza</div><div class="bibleList chapterList" id="appChapters"><p style="padding:12px">Alege o carte.</p></div></aside><main class="readingPane"><div class="readingHead"><button class="readingNav" id="prevChapter">‹</button><h2 id="appReadingTitle">Geneza 1</h2><button class="readingNav" id="nextChapter">›</button></div><div id="appReading"><p style="padding:25px 0">Alege o carte și un capitol.</p></div></main></div><div class="bibleMobileBar"><button data-go="books"><b>☰</b>Cărți</button><button data-go="chapters"><b>▤</b>Capitole</button><button data-go="reading"><b>📖</b>Lectură</button></div>`;
  document.body.appendChild(overlay); document.body.style.overflow='hidden';
  overlay.querySelector('.bibleAppBack').onclick=close;
  overlay.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{testament=b.dataset.t;overlay.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('active',x.dataset.t===testament));renderBooks()});
  overlay.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>overlay.querySelector('.bibleAppGrid').dataset.step=b.dataset.go);
  overlay.querySelector('#prevChapter').onclick=()=>{if(chapter>1)selectChapter(chapter-1)};
  overlay.querySelector('#nextChapter').onclick=()=>{const max=chapterCount();if(chapter<max)selectChapter(chapter+1)};
  renderBooks(); selectBook(book,false);
 }
 function close(){if(!overlay)return;overlay.remove();overlay=null;document.body.style.overflow=''}
 function renderBooks(){overlay.querySelector('#appBooks').innerHTML=books().map(b=>`<button data-book="${h(b)}" class="${b===book?'active':''}"><span>${h(b)}</span><span>›</span></button>`).join('');overlay.querySelectorAll('[data-book]').forEach(x=>x.onclick=()=>selectBook(x.dataset.book,true))}
 async function selectBook(b,mobile){book=b;chapter=1;testament=NT.includes(b)?'NT':'OT';renderBooks();overlay.querySelector('#appBookTitle').textContent=b;overlay.querySelector('#appChapters').innerHTML='<p style="padding:12px">Se încarcă capitolele…</p>';if(mobile)overlay.querySelector('.bibleAppGrid').dataset.step='chapters';try{bible=bible||await loadRccv();renderChapters();}catch(e){overlay.querySelector('#appChapters').innerHTML='<p style="padding:12px">Nu am putut încărca Biblia.</p>'}}
 function chapterCount(){const code=BOOKMAP[book];return bible&&bible[code]?Object.keys(bible[code]).filter(x=>/^\d+$/.test(x)).length:1}
 function renderChapters(){const n=chapterCount();overlay.querySelector('#appChapters').innerHTML=Array.from({length:n},(_,i)=>`<button data-ch="${i+1}" class="${i+1===chapter?'active':''}"><span>Capitolul ${i+1}</span><span>›</span></button>`).join('');overlay.querySelectorAll('[data-ch]').forEach(x=>x.onclick=()=>selectChapter(+x.dataset.ch))}
 async function selectChapter(n){chapter=n;if(!bible)bible=await loadRccv();renderChapters();overlay.querySelector('.bibleAppGrid').dataset.step='reading';overlay.querySelector('#appReadingTitle').textContent=book+' '+chapter;const code=BOOKMAP[book],ch=bible[code]?.[String(chapter)],box=overlay.querySelector('#appReading');if(!ch){box.innerHTML='<p>Capitolul nu a fost găsit.</p>';return}const q=book.replace(/'/g,"\\'");box.innerHTML=Object.entries(ch).filter(([,t])=>String(t).trim()).sort((a,b)=>+a[0]-+b[0]).map(([n,t])=>`<div class="appVerse"><span class="appVerseNum">${n}</span><span>${h(t)}</span><span class="appVerseActions"><button title="Favorite" onclick="toggleFavorite('${q}',${chapter},${n})">♡</button><button title="Notiță" onclick="saveBibleNote('${q}',${chapter},${n})">📝</button></span></div>`).join('')+window.renderChapterCommentaries(book,chapter);if(typeof saveReading==='function')saveReading(book,chapter)}
 window.openBibleApp=()=>make();
 document.addEventListener('click',e=>{const a=e.target.closest('a[href="#biblia"],a[href="#biblia-libera"]');if(a){e.preventDefault();make()}});
 const old=document.getElementById('openFreeBible');if(old)old.textContent='Deschide Biblia ca în aplicație';if(old)old.onclick=()=>make();
})();
