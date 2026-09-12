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
async function loadAccountData(){if(!session)return;window.__comoaraSession=session;try{const [notes,favs,state]=await Promise.all([rest('bible_notes?select=id,book,chapter,verse,note,created_at&order=created_at.desc'),rest('favorite_verses?select=id,book,chapter,verse,created_at&order=created_at.desc'),rest('reading_state?select=book,chapter&limit=1')]);$('notesCount').textContent=notes.length;$('favoritesCount').textContent=favs.length;window.__accountNotes=notes;$('savedNotes').innerHTML=notes.length?notes.map(n=>{const safe=window.sanitizeBibleNoteHtml?window.sanitizeBibleNoteHtml(n.note||''):esc(n.note||'');return `<div class="savedItem"><b>📝 ${esc(n.book)} ${n.chapter}${n.verse?':'+n.verse:''}</b><div class="noteHtml">${safe}</div><button onclick="window.editBibleNote('${n.id}')">Editează</button> <button onclick="window.deleteBibleNote('${n.id}')">Șterge</button></div>`}).join(''):'<p class="muted">Nu ai încă notițe salvate.</p>';$('savedFavorites').innerHTML=favs.length?favs.map(f=>`<div class="savedItem"><b>❤️ ${esc(f.book)} ${f.chapter}:${f.verse}</b><button onclick="window.deleteFavorite('${f.id}')">Șterge</button></div>`).join(''):'<p class="muted">Nu ai încă versete favorite.</p>';if(state?.[0]){$('lastReading').textContent=state[0].book+' '+state[0].chapter;$('continueFree').dataset.book=state[0].book;$('continueFree').dataset.chapter=state[0].chapter;}}catch(e){console.warn(e)}}
window.__comoaraRest=rest;window.__comoaraLoadAccountData=loadAccountData;window.__comoaraSetMsg=setMsg;window.__comoaraSession=session;
window.deleteBibleNote=async id=>{if(!session)return;await rest('bible_notes?id=eq.'+id,{method:'DELETE'});loadAccountData()};
window.deleteFavorite=async id=>{if(!session)return;await rest('favorite_verses?id=eq.'+id,{method:'DELETE'});loadAccountData()};
window.saveBibleNote=async(book,chapter,verse)=>{window.openRichBibleNote(book,chapter,verse)};
window.toggleFavorite=async(book,chapter,verse)=>{if(!session){location.hash='cont';setMsg('Conectează-te pentru a salva versete favorite.',true);return}const q=`favorite_verses?user_id=eq.${session.user.id}&book=eq.${encodeURIComponent(book)}&chapter=eq.${chapter}&verse=eq.${verse}&select=id`;const found=await rest(q);if(found.length)await rest('favorite_verses?id=eq.'+found[0].id,{method:'DELETE'});else await rest('favorite_verses',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify({user_id:session.user.id,book,chapter,verse})});loadAccountData();alert(found.length?'Scos din favorite.':'Salvat la favorite. ❤️')};
async function saveReading(book,chapter){if(!session)return;await rest('reading_state?on_conflict=user_id',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:session.user.id,book,chapter,updated_at:new Date().toISOString()})}).catch(()=>{})}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
window.openFreeBible=async function(bookName,chapter){const code=BOOKMAP[bookName];if(!code)return;const overlay=document.createElement('div');overlay.className='readerOverlay';overlay.innerHTML=`<div class="readerPanel"><div class="readerTop"><h2>${esc(bookName)} ${chapter}</h2><button class="readerClose">← Înapoi</button></div><div class="readerBody"><div id="freeContent" class="readerLoading">Se încarcă Biblia…</div></div></div>`;document.body.appendChild(overlay);document.body.style.overflow='hidden';overlay.querySelector('.readerClose').onclick=()=>{overlay.remove();document.body.style.overflow=''};try{const bible=await loadRccv(),ch=bible[code]?.[String(chapter)];if(!ch)throw new Error('Capitolul nu a fost găsit.');const verses=Object.entries(ch).filter(([,t])=>String(t).trim()).sort((a,b)=>+a[0]-+b[0]);overlay.querySelector('#freeContent').className='';overlay.querySelector('#freeContent').innerHTML=`<article class="chapter"><h3>${esc(bookName)} ${chapter}</h3>${verses.map(([n,t])=>`<div class="freeVerse"><p class="verse"><span class="verseNum">${n}</span>${esc(t)}</p><div class="verseActions"><button onclick="toggleFavorite('${esc(bookName).replace(/'/g,"\\'")}',${chapter},${n})">♡ Favorite</button><button onclick="saveBibleNote('${esc(bookName).replace(/'/g,"\\'")}',${chapter},${n})">📝 Notiță</button><button onclick="openBibleCommentary('${esc(bookName).replace(/'/g,"\\'")}',${chapter},${n})">💬 Comentarii</button></div></div>`).join('')}</article>`;saveReading(bookName,chapter);loadAccountData()}catch(e){overlay.querySelector('#freeContent').innerHTML='<div class="readerError">'+esc(e.message)+'</div>'}}
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
 async function selectChapter(n){chapter=n;if(!bible)bible=await loadRccv();renderChapters();overlay.querySelector('.bibleAppGrid').dataset.step='reading';overlay.querySelector('#appReadingTitle').textContent=book+' '+chapter;const code=BOOKMAP[book],ch=bible[code]?.[String(chapter)],box=overlay.querySelector('#appReading');if(!ch){box.innerHTML='<p>Capitolul nu a fost găsit.</p>';return}const q=book.replace(/'/g,"\\'");box.innerHTML=Object.entries(ch).filter(([,t])=>String(t).trim()).sort((a,b)=>+a[0]-+b[0]).map(([n,t])=>`<div class="appVerse"><span class="appVerseNum">${n}</span><span>${h(t)}</span><span class="appVerseActions"><button title="Favorite" onclick="toggleFavorite('${q}',${chapter},${n})">♡</button><button title="Notiță" onclick="saveBibleNote('${q}',${chapter},${n})">📝</button><button title="Comentarii" onclick="openBibleCommentary('${q}',${chapter},${n})">💬</button></span></div>`).join('');if(typeof saveReading==='function')saveReading(book,chapter)}
 window.openBibleApp=()=>make();
 document.addEventListener('click',e=>{const a=e.target.closest('a[href="#biblia"],a[href="#biblia-libera"]');if(a){e.preventDefault();make()}});
 const old=document.getElementById('openFreeBible');if(old)old.textContent='Deschide Biblia ca în aplicație';if(old)old.onclick=()=>make();
})();


// ===== V16 Rich Notes Editor =====
(function installRichNotes(){
  if(document.getElementById('richNoteEditor')) return;

  const style=document.createElement('style');
  style.textContent=`
  .richNoteBackdrop{position:fixed;inset:0;background:#061827aa;z-index:12000;display:none}
  .richNoteBackdrop.open{display:block}
  .richNoteModal{position:fixed;z-index:12001;left:50%;top:50%;transform:translate(-50%,-50%) scale(.98);width:min(820px,94vw);max-height:90vh;background:#fffdf8;border-radius:18px;box-shadow:0 24px 70px #0005;display:none;overflow:hidden}
  .richNoteModal.open{display:flex;flex-direction:column;transform:translate(-50%,-50%) scale(1)}
  .richNoteTop{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:#08283d;color:#fff}
  .richNoteTop h3{margin:0;font:700 18px Arial}
  .richNoteClose{border:0;background:#ffffff20;color:#fff;width:36px;height:36px;border-radius:50%;font-size:20px}
  .richToolbar{display:flex;gap:6px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid #e4ddd0;background:#faf7ef}
  .richToolbar button,.richToolbar select{border:1px solid #d8d0c2;background:#fff;color:#08283d;border-radius:8px;min-width:36px;height:36px;padding:0 9px;font-weight:700}
  .richEditor{min-height:280px;max-height:50vh;overflow:auto;padding:18px;font:17px/1.6 Arial;color:#1d2c36;outline:none;background:#fff}
  .richEditor:empty:before{content:attr(data-placeholder);color:#9aa1a6}
  .richEditor h1{font-size:28px}.richEditor h2{font-size:23px}.richEditor h3{font-size:20px}
  .richEditor blockquote{border-left:4px solid #c99024;margin:12px 0;padding:8px 14px;background:#fff6df}
  .richNoteFoot{display:flex;justify-content:flex-end;gap:10px;padding:12px 16px;border-top:1px solid #e4ddd0;background:#faf7ef}
  .richNoteFoot button{border:0;border-radius:22px;padding:11px 18px;font-weight:800}
  .richCancel{background:#e9edf0;color:#273944}.richSave{background:#c99024;color:#fff}
  .savedItem .noteHtml{margin:9px 0;line-height:1.5}.savedItem .noteHtml p{margin:6px 0}.savedItem .noteHtml ul,.savedItem .noteHtml ol{padding-left:22px}
  @media(max-width:600px){.richNoteModal{width:100vw;height:100dvh;max-height:none;border-radius:0}.richEditor{max-height:none;flex:1;min-height:0}.richToolbar{max-height:98px;overflow:auto}}
  `;
  document.head.appendChild(style);

  const back=document.createElement('div'); back.className='richNoteBackdrop'; back.id='richNoteBackdrop';
  const modal=document.createElement('div'); modal.className='richNoteModal'; modal.id='richNoteEditor';
  modal.innerHTML=`
    <div class="richNoteTop"><h3 id="richNoteTitle">Notiță biblică</h3><button class="richNoteClose" id="richNoteClose">×</button></div>
    <div class="richToolbar">
      <select id="richBlock" title="Stil text">
        <option value="p">Text</option><option value="h2">Titlu</option><option value="h3">Subtitlu</option>
      </select>
      <button type="button" data-cmd="bold"><b>B</b></button>
      <button type="button" data-cmd="italic"><i>I</i></button>
      <button type="button" data-cmd="underline"><u>U</u></button>
      <button type="button" data-cmd="insertUnorderedList">• Listă</button>
      <button type="button" data-cmd="insertOrderedList">1. Listă</button>
      <button type="button" data-cmd="formatBlock" data-val="blockquote">❝ Citat</button>
      <button type="button" data-cmd="removeFormat">Curăță</button>
    </div>
    <div id="richEditorArea" class="richEditor" contenteditable="true" data-placeholder="Scrie aici notița ta, idei de predică, observații, aplicații..."></div>
    <div class="richNoteFoot"><button class="richCancel" id="richNoteCancel">Anulează</button><button class="richSave" id="richNoteSave">Salvează notița</button></div>`;
  document.body.append(back,modal);

  let context=null;
  const editor=modal.querySelector('#richEditorArea');
  const title=modal.querySelector('#richNoteTitle');

  function close(){back.classList.remove('open');modal.classList.remove('open');document.body.style.overflow='';context=null}
  function sanitize(html){
    const tpl=document.createElement('template'); tpl.innerHTML=html;
    const allowed=new Set(['P','BR','B','STRONG','I','EM','U','H1','H2','H3','UL','OL','LI','BLOCKQUOTE','DIV']);
    const walk=(node)=>{
      [...node.children].forEach(el=>{
        if(!allowed.has(el.tagName)){el.replaceWith(...el.childNodes);return}
        [...el.attributes].forEach(a=>el.removeAttribute(a.name));
        walk(el);
      });
    }; walk(tpl.content);
    return tpl.innerHTML.trim();
  }
  window.sanitizeBibleNoteHtml=sanitize;

  window.openRichBibleNote=function(book,chapter,verse,noteId=null,existing=''){
    if(!window.__comoaraSession){
      location.hash='cont';
      if(typeof window.__comoaraSetMsg==='function')window.__comoaraSetMsg('Conectează-te pentru a păstra notițele.',true);
      return;
    }
    context={book,chapter,verse,noteId};
    title.textContent=`📝 ${book} ${chapter}:${verse}`;
    editor.innerHTML=existing||'';
    back.classList.add('open');modal.classList.add('open');document.body.style.overflow='hidden';
    setTimeout(()=>editor.focus(),80);
  };

  back.onclick=close; modal.querySelector('#richNoteClose').onclick=close; modal.querySelector('#richNoteCancel').onclick=close;
  modal.querySelectorAll('[data-cmd]').forEach(btn=>btn.onclick=()=>{
    editor.focus(); document.execCommand(btn.dataset.cmd,false,btn.dataset.val||null);
  });
  modal.querySelector('#richBlock').onchange=e=>{editor.focus();document.execCommand('formatBlock',false,e.target.value)};

  modal.querySelector('#richNoteSave').onclick=async()=>{
    if(!context || !window.__comoaraSession)return;
    const html=sanitize(editor.innerHTML);
    const plain=editor.innerText.trim();
    if(!plain){alert('Scrie ceva în notiță.');return}
    try{
      const payload={user_id:window.__comoaraSession.user.id,book:context.book,chapter:context.chapter,verse:context.verse,note:html};
      if(context.noteId){
        await window.__comoaraRest('bible_notes?id=eq.'+context.noteId,{method:'PATCH',headers:{'Prefer':'return=minimal'},body:JSON.stringify({note:html})});
      }else{
        await window.__comoaraRest('bible_notes',{method:'POST',headers:{'Prefer':'return=minimal'},body:JSON.stringify(payload)});
      }
      close();
      if(typeof window.__comoaraLoadAccountData==='function')await window.__comoaraLoadAccountData();
    }catch(e){alert('Nu am putut salva notița. Încearcă din nou.')}
  };
})();


window.editBibleNote=function(id){const n=(window.__accountNotes||[]).find(x=>x.id===id);if(n)window.openRichBibleNote(n.book,n.chapter,n.verse,id,n.note||'')};
