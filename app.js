/* АгроЭкспо 3D — приложение */
function AGRO(){
"use strict";
const T=THREE,V3=T.Vector3;
const $=s=>document.querySelector(s);
const fmt=n=>Math.round(n).toLocaleString('ru-RU');
const fmt1=n=>(Math.round(n*10)/10).toLocaleString('ru-RU');
const money=n=>{const a=Math.abs(n);return a>=1e6?(n/1e6).toLocaleString('ru-RU',{maximumFractionDigits:1})+' млн ₽':fmt(n)+' ₽';};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerpA=(a,b,t)=>{let d=b-a;d=Math.atan2(Math.sin(d),Math.cos(d));return a+d*t;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const touch=matchMedia('(pointer:coarse)').matches;if(touch)document.body.classList.add('touch');

/* ================= ДАННЫЕ ================= */
const FUEL=68,WAGE=450,SHIFT=12;
const CROPS={
  wheat:{n:'Пшеница озимая',work:2.9,win:30,y:3.6,price:15500},
  barley:{n:'Ячмень яровой',work:2.7,win:30,y:3.2,price:14500},
  sunflower:{n:'Подсолнечник',work:2.6,win:26,y:2.5,price:36000},
  corn:{n:'Кукуруза на зерно',work:3.1,win:28,y:6.2,price:13500},
  beet:{n:'Сахарная свёкла',work:3.4,win:24,y:45,price:4200}
};
const OWN={
  mtz82:{n:'МТЗ-82.1 «Беларус»',hp:81,fuel:11,prod:1.0,maint:700,trade:1.6e6,color:'#2f5f9e'},
  mtz1221:{n:'МТЗ-1221',hp:130,fuel:17,prod:1.7,maint:850,trade:2.6e6,color:'#2f5f9e'},
  dt75:{n:'ДТ-75',hp:95,fuel:14,prod:1.1,maint:950,trade:0.7e6,color:'#6b7a45'},
  t150:{n:'Т-150К',hp:165,fuel:24,prod:2.0,maint:1100,trade:1.4e6,color:'#c9a227'},
  k700:{n:'К-700А «Кировец»',hp:220,fuel:38,prod:3.0,maint:1300,trade:2.2e6,color:'#d1a51f'}
};
const EXPO={
  sm2400:{n:'СМ-2400',brand:'СтепьМаш',hp:240,fuel:26,prod:3.6,maint:350,price:14.8e6,color:'#a8291e',rim:'#e9e4d6',feat:'Автопилот ГЛОНАСС/GPS, бесступенчатая трансмиссия',tire:'710/70 R42',mass:'10,8 т',lift:'9 т'},
  kt180:{n:'КТ-180',brand:'Колос-Техника',hp:180,fuel:20,prod:2.6,maint:320,price:11.2e6,color:'#2f6f33',rim:'#e8c21a',feat:'Простая механика, ремонт в поле',tire:'650/65 R38',mass:'8,1 т',lift:'7 т'},
  pp300:{n:'ПП-300',brand:'ПолеПро',hp:300,fuel:34,prod:4.2,maint:380,price:19.5e6,color:'#24529a',rim:'#d7dce2',feat:'Широкозахватные агрегаты, усиленная навеска',tire:'800/70 R42',mass:'12,6 т',lift:'11 т'}
};
const STANDS=[
  {id:'sm',brand:'СтепьМаш',slogan:'Мощность, которая считает литры',color:'#a8291e',light:'#efdcd6',x:6,z:-11,rot:0,tractor:'sm2400',full:true},
  {id:'kt',brand:'Колос-Техника',slogan:'Надёжно с первого сезона',color:'#2f6f33',light:'#d8e7d2',x:6,z:11,rot:Math.PI,tractor:'kt180'},
  {id:'pp',brand:'ПолеПро',slogan:'Больше гектаров за смену',color:'#24529a',light:'#d4e0f1',x:-16,z:11,rot:Math.PI,tractor:'pp300'}
];
const REGIONS=['Тамбовская','Воронежская','Липецкая','Белгородская','Курская','Саратовская','Ростовская','Краснодарский край'];
const FARMS=[
  {n:'АО «Заря»',r:'Тамбовская',p:1840},{n:'КФХ Сергеев А. В.',r:'Воронежская',p:1610},
  {n:'ООО «Агро-Липецк»',r:'Липецкая',p:1475},{n:'СПК им. Мичурина',r:'Тамбовская',p:1290},
  {n:'КФХ «Чернозём»',r:'Белгородская',p:1155},{n:'ООО «Кубань-Зерно»',r:'Краснодарский край',p:990},
  {n:'КФХ Ильина Е. П.',r:'Саратовская',p:760},{n:'ООО «Донская нива»',r:'Ростовская',p:640},
  {n:'КФХ «Курский колос»',r:'Курская',p:415},{n:'КФХ Белов Д. С.',r:'Липецкая',p:280}
];
const ROLES=[
  {n:'Фермер',d:'КФХ, всё сам',color:'#3d6db0',hat:'cap'},
  {n:'Агроном',d:'Поля и севооборот',color:'#3f8a4f',hat:'cap'},
  {n:'Механизатор',d:'Техника и ремонт',color:'#e07b22',hat:'helmet'},
  {n:'Руководитель',d:'Хозяйство целиком',color:'#2f3442',hat:'none'},
  {n:'Молодой фермер',d:'Начинаю своё дело',color:'#c4445a',hat:'cap'}
];
const SWATCH=['#3d6db0','#3f8a4f','#e07b22','#2f3442','#c4445a','#7b5aa6','#d8b13a'];
const TITLES=['Гость выставки','Агроном-стажёр','Агроном','Главный агроном','Механизатор года','Агромагнат'];
const FAQ=[
  ['Сколько стоит СМ-2400?','Базовая комплектация — 14,8 млн ₽ с НДС. С автопилотом ГЛОНАСС/GPS — 15,6 млн ₽.'],
  ['Есть лизинг?','Да, через партнёров: аванс от 10%, срок до 5 лет, удорожание от 6% в год с учётом госпрограмм.'],
  ['Возьмёте мою технику в трейд-ин?','Да. Оцениваем по модели, году и моточасам. Ориентир для МТЗ-1221 — около 2,6 млн ₽.'],
  ['Какая гарантия и сервис?','Гарантия 2 года или 3000 моточасов. Выездная бригада — в течение 24 часов в радиусе 300 км от сервисного центра.'],
  ['Чем он экономичнее?','Common Rail и бесступенчатая трансмиссия: около 7,2 л/га на вспашке против 10–13 л/га у машин прошлого поколения.']
];
const QUIZ=[
  ['Что такое трейд-ин?',['Сдача старой техники в зачёт новой','Аренда трактора на сезон','Страхование урожая','Лизинг без аванса'],0],
  ['Что сильнее всего влияет на расход топлива на гектар?',['Цвет кабины','Производительность агрегата и КПД двигателя','Количество зеркал','Объём топливного бака'],1],
  ['Зачем трактору автопилот ГЛОНАСС/GPS?',['Подогрев сидений','Связь с диспетчером','Ровные проходы без перекрытий','Учёт осадков'],2],
  ['Что такое агротехнический срок?',['Срок гарантии','Окно, за которое операцию нужно успеть провести','Длина смены механизатора','Срок окупаемости'],1],
  ['Чем грозит затянутый посев?',['Потерей части урожая','Ростом цены зерна','Снижением налога','Ничем'],0],
  ['Что показывает индекс NDVI?',['Влажность воздуха','Расход топлива','Состояние посевов по спутниковым снимкам','Качество дорог'],2]
];
const PRIZES=[
  {n:'Участие в розыгрыше культиватора',c:100},{n:'Кепка экспонента',c:150},
  {n:'Скидка 10% на запчасти',c:300},{n:'Бесплатное ТО трактора',c:600}
];
const PLACES=[
  {n:'Вход и регистрация',x:-24,z:0},{n:'Табло «Лидеры дня»',x:-9,z:0},{n:'Стенд «СтепьМаш»',x:6,z:-4.5},
  {n:'Стенд «Колос-Техника»',x:6,z:4.5},{n:'Стенд «ПолеПро»',x:-16,z:4.5},{n:'Агро-квиз',x:-6,z:-3.5},
  {n:'Кофе-поинт',x:-22,z:-12.5},{n:'Ворота в поле',x:27,z:0}
];

/* ================= СОСТОЯНИЕ ================= */
const KEY='agroexpo3d.v1';
// у каждого гостя свой номер, чтобы не смешивать всех в одного «Гость-417»
const GUEST='Гость-'+(100+Math.floor(Math.random()*900));
const DEF={v:1,registered:false,nick:GUEST,role:0,color:'#3d6db0',hat:'cap',
  farm:{name:'КФХ «Рассвет»',region:'Тамбовская',area:1200,crop:'wheat',tractor:'mtz1221',count:3,sat:false},
  points:0,awards:{},visited:{},viewed:{},faq:{},leads:{},drives:0,best:null,events:[],quiz:{},plow:null,sound:true};
let S;try{S=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){S=null}
if(!S||S.v!==1)S=JSON.parse(JSON.stringify(DEF));
for(const k in DEF)if(S[k]===undefined)S[k]=JSON.parse(JSON.stringify(DEF[k]));
if(S.nick==='Гость-417'||S.nick==='Гость'){S.nick=GUEST;save();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const level=()=>1+Math.floor(S.points/120);
const title=()=>TITLES[Math.min(TITLES.length-1,level()-1)];
function logEvent(x){S.events.push({t:Date.now(),x});if(S.events.length>60)S.events.shift();track(x);}

/* ================= ЖУРНАЛ НА СЕРВЕРЕ ================= */
// Если в config.js заданы адрес и ключ Supabase, действия посетителей пишутся в таблицу events (только вставка).
const CFG=window.AGRO_CFG||{},TRK={on:!!(CFG.supabaseUrl&&CFG.supabaseKey),q:[],sid:uid(),busy:false,t0:Date.now()};
function uid(){if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;
  const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
if(!S.vid){S.vid=uid();save();}
function track(action){if(!TRK.on)return;
  TRK.q.push({visitor:S.vid,session:TRK.sid,nick:S.nick,role:(ROLES[S.role]||{}).n||null,region:S.farm.region,farm:S.farm.name,points:S.points,level:level(),action:String(action).slice(0,300)});
  if(TRK.q.length>200)TRK.q.shift();}
function sbHeaders(x){const h=Object.assign({'Content-Type':'application/json',apikey:CFG.supabaseKey},x);if(!CFG.supabaseKey.startsWith('sb_'))h.Authorization='Bearer '+CFG.supabaseKey;return h;}
function trackFlush(leaving){if(!TRK.on||(TRK.busy&&!leaving)||!TRK.q.length)return;const rows=TRK.q.splice(0,50);TRK.busy=true;
  fetch(CFG.supabaseUrl.replace(/\/+$/,'')+'/rest/v1/events',{method:'POST',headers:sbHeaders({Prefer:'return=minimal'}),body:JSON.stringify(rows),keepalive:!!leaving})
    .then(r=>{if(r.status>=500||r.status===429)throw 0;if(!r.ok)console.warn('Журнал: сервер ответил',r.status);})
    .catch(()=>{if(!leaving)TRK.q.unshift(...rows);}).finally(()=>{TRK.busy=false;});}
if(TRK.on){setInterval(trackFlush,4000);
  addEventListener('pagehide',()=>{track('Ушёл · на выставке '+Math.max(1,Math.round((Date.now()-TRK.t0)/60000))+' мин');trackFlush(true);});
  track(S.registered?'Вернулся на выставку':'Открыл страницу');}

/* ================= ЗВУК ================= */
let AC=null;
function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function beep(f,d,type,vol){if(!S.sound)return;const a=audio();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.value=vol||.06;g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+(d||.15));o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+(d||.15));}
const sfx={pts:()=>{beep(880,.12,'triangle');setTimeout(()=>beep(1320,.16,'triangle'),90);},click:()=>beep(520,.05,'square',.025),bad:()=>beep(180,.25,'sawtooth',.04),lvl:()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.2,'triangle',.07),i*110))};
let engineNode=null;
function engineSound(on){
  if(on&&!engineNode&&S.sound){const a=audio();if(!a)return;const o=a.createOscillator(),o2=a.createOscillator(),f=a.createBiquadFilter(),g=a.createGain();
    o.type='sawtooth';o.frequency.value=38;o2.type='square';o2.frequency.value=19;f.type='lowpass';f.frequency.value=260;g.gain.value=0;g.gain.linearRampToValueAtTime(.09,a.currentTime+.6);
    o.connect(f);o2.connect(f);f.connect(g).connect(a.destination);o.start();o2.start();engineNode={o,o2,g,a};}
  else if(!on&&engineNode){const n=engineNode;engineNode=null;n.g.gain.linearRampToValueAtTime(0,n.a.currentTime+.3);setTimeout(()=>{try{n.o.stop();n.o2.stop();}catch(e){}},400);}
}
function engineRev(x){if(engineNode){engineNode.o.frequency.value=38+x*40;engineNode.o2.frequency.value=19+x*20;}}

/* ================= HUD, БАЛЛЫ, КВЕСТЫ ================= */
function toast(html){const t=document.createElement('div');t.className='toast';t.innerHTML=html;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),3400);}
function award(key,pts,text){
  if(key){if(S.awards[key])return false;S.awards[key]=1;}
  const lv=level();S.points+=pts;logEvent(text+' (+'+pts+')');
  toast('<b>+'+pts+'</b> · '+esc(text));sfx.pts();burst();
  if(level()>lv){setTimeout(()=>{toast('Новый уровень: <b>'+level()+'</b> · '+esc(title()));sfx.lvl();},600);netTrack();}
  save();updateHUD();checkQuests();return true;
}
const QUESTS=[
  {id:'q_stands',n:'Посети 3 стенда',d:'Зайдите на каждый стенд павильона',p:25,done:()=>Object.keys(S.visited).length>=3,prog:()=>Math.min(3,Object.keys(S.visited).length)+'/3'},
  {id:'q_eco',n:'Найди самый экономичный трактор',d:'Сравните л/га в карточках и отметьте лучший',p:30,done:()=>!!S.awards.q_eco_found},
  {id:'q_drive',n:'Тест-драйв на своём поле',d:'Пройдите сезон своей техникой и новой',p:25,done:()=>S.drives>0},
  {id:'q_quiz',n:'Агро-квиз',d:'Ответьте на все вопросы у стойки квиза',p:20,done:()=>Object.keys(S.quiz).length>=QUIZ.length,prog:()=>Object.keys(S.quiz).length+'/'+QUIZ.length}
];
const ACH=[
  {id:'a_harvest',n:'Первый урожай',m:'1',done:()=>S.drives>0},
  {id:'a_eco',n:'Экономист сезона',m:'₽',done:()=>S.best&&S.best.benefit>=1e6},
  {id:'a_plow',n:'Пахарь',m:'П',done:()=>S.plow&&S.plow.cov>=90},
  {id:'a_quiz',n:'Знаток',m:'?',done:()=>QUIZ.every((q,i)=>S.quiz[i]===1)},
  {id:'a_insp',n:'Инженер',m:'⚙',done:()=>Object.keys(EXPO).every(k=>S.awards['inspect_'+k])},
  {id:'a_mech',n:'Механизатор года',m:'★',done:()=>QUESTS.every(q=>q.done())}
];
function checkQuests(){
  QUESTS.forEach(q=>{if(q.done()&&!S.awards[q.id]){S.awards[q.id]=1;setTimeout(()=>{S.awards[q.id]=0;award(q.id,q.p,'Квест выполнен: '+q.n);},450);}});
  ACH.forEach(a=>{if(a.done()&&!S.awards[a.id]){S.awards[a.id]=1;logEvent('Ачивка: '+a.n);setTimeout(()=>{toast('Ачивка <b>«'+esc(a.n)+'»</b>');sfx.lvl();},1000);save();}});
}
function updateHUD(){
  $('#pName').textContent=S.nick;$('#pTitle').textContent='Ур. '+level()+' · '+title();
  $('#pPts').innerHTML=fmt(S.points)+'<small>баллов</small>';
  $('#pDot').textContent=level();$('#pDot').style.background=S.color;
  $('#pBar').style.width=((S.points%120)/120*100)+'%';
  $('#qCount').textContent=QUESTS.filter(q=>q.done()).length+'/'+QUESTS.length;
  if(W.ready){drawBoard();player.label.userData.draw(S.nick,subLabel());}
}

/* ================= КЛАВИАТУРА ================= */
const KL={Enter:'Enter',Escape:'Esc',Space:'Space',Backspace:'⌫'};
function decorate(root){root.querySelectorAll('[data-key]').forEach(el=>{if(el.querySelector(':scope > .kb'))return;const k=document.createElement('span');k.className='kb';k.textContent=KL[el.dataset.key]||el.dataset.key;el.appendChild(k);});}
function keyName(e){if(e.key==='Enter')return 'Enter';if(e.code==='Escape')return 'Escape';if(e.code==='Space')return 'Space';if(e.code==='Backspace')return 'Backspace';
  if(/^Digit\d$/.test(e.code))return e.code.slice(5);if(/^Numpad\d$/.test(e.code))return e.code.slice(6);if(/^Key[A-Z]$/.test(e.code))return e.code.slice(3);return e.code;}
const isVis=el=>!!(el&&el.offsetParent!==null&&!el.disabled&&!el.closest('[hidden]'));
function topLayer(){for(const id of ['fieldtool','drive','dash','reg'])if(!$('#'+id).hidden)return $('#'+id);if(!$('#sheet').hidden)return $('#sheet');if(!$('#inspect').hidden)return $('#inspect');return null;}
function pressIn(layer,k){if(!layer)return false;const el=[...layer.querySelectorAll('[data-key="'+k+'"]')].find(isVis);if(el){el.click();sfx.click();return true;}return false;}

/* ================= SHEETS ================= */
let sheetKind=null;
function openSheet(kind,t,html,mount){sheetKind=kind;$('#sheetTitle').textContent=t;$('#sheetBody').innerHTML=html;$('#sheet').hidden=false;if(mount)mount($('#sheetBody'));decorate($('#sheetBody'));}
function closeSheet(){$('#sheet').hidden=true;sheetKind=null;curInter=null;} // подсказка рядом перерисуется с новыми данными
$('#sheetX').onclick=closeSheet;
function toggleSheet(kind,fn){if(sheetKind===kind)closeSheet();else fn();}

function sheetQuests(){
  const qs=QUESTS.map(q=>`<li class="q ${q.done()?'done':''}"><span class="ck">${q.done()?'✓':''}</span><div><b>${esc(q.n)}</b><div class="small muted">${esc(q.d)}${q.prog?' · '+q.prog():''}</div></div><span class="pt">+${q.p}</span></li>`).join('');
  const bs=ACH.map(a=>`<div class="badge ${S.awards[a.id]?'on':''}"><div class="m">${a.m}</div>${esc(a.n)}</div>`).join('');
  const acts=[['Посетить стенд','+10'],['Открыть карточку техники','+5'],['Осмотреть трактор','+10'],['Собрать буклет','+15'],['Верный ответ в квизе','+10'],['Тест-драйв','+50'],['Сам за рулём','+30'],['Заявка экспоненту','+40']].map(a=>`<div>${a[0]}</div><div>${a[1]}</div>`).join('');
  openSheet('quests','Квесты дня',`<ul class="list">${qs}</ul><div class="eyebrow">Ачивки</div><div class="badges">${bs}</div><div class="eyebrow">За что дают баллы</div><div class="spec">${acts}</div>`);
}
// Живой рейтинг дня из Supabase (функция leaders_today); пока его нет — демо-хозяйства FARMS.
const LIVE={rows:null};let lbTab='farms';
function leadersFetch(){if(!TRK.on)return;
  fetch(CFG.supabaseUrl.replace(/\/+$/,'')+'/rest/v1/rpc/leaders_today',{method:'POST',headers:sbHeaders(),body:'{}'})
    .then(r=>r.ok?r.json():null).then(d=>{if(!Array.isArray(d))return;LIVE.rows=d;if(W.ready)drawBoard();if(sheetKind==='leaders')sheetLeaders(lbTab);}).catch(()=>{});}
function leaderRows(){const me={n:S.farm.name,r:S.farm.region,p:S.points,me:true};
  const others=LIVE.rows?LIVE.rows.filter(x=>x.visitor!==S.vid).map(x=>({n:x.farm||x.nick,k:x.nick,r:x.region||'',p:x.points})):FARMS;
  return others.concat([me]).sort((a,b)=>b.p-a.p);}
function sheetLeaders(tab){
  tab=lbTab=tab||'farms';let rows;
  if(tab==='farms')rows=leaderRows().map((f,i)=>`<div class="r ${f.me?'me':''}"><span class="n">${i+1}</span><div><div>${esc(f.n)}${f.me?' · вы':''}</div><div class="sub">${esc(f.k?f.k+' · '+f.r:f.r)}</div></div><span class="p">${fmt(f.p)}</span></div>`).join('');
  else{const m={};leaderRows().forEach(f=>{m[f.r]=(m[f.r]||0)+f.p});rows=Object.entries(m).sort((a,b)=>b[1]-a[1]).map((e,i)=>`<div class="r ${e[0]===S.farm.region?'me':''}"><span class="n">${i+1}</span><div>${esc(e[0])}<div class="sub">${e[0]===S.farm.region?'ваш регион':''}</div></div><span class="p">${fmt(e[1])}</span></div>`).join('');}
  const L=leaderRows(),me=L.findIndex(f=>f.me)+1,above=L[me-2];
  const hint=(LIVE.rows?'Живой рейтинг: все, кто играл сегодня. ':'')+(above?`До ${me-1}-го места — <b>${fmt(above.p-S.points+1)}</b> баллов. Обойдите «${esc(above.n)}».`:'Вы на первом месте. Удержите лидерство до конца дня.');
  openSheet('leaders','Таблица лидеров',`<div class="tabs" role="tablist"><button role="tab" aria-selected="${tab==='farms'}" data-t="farms" data-key="1">Хозяйства</button><button role="tab" aria-selected="${tab==='regions'}" data-t="regions" data-key="2">Регионы</button></div><div class="note">${hint}</div><div class="lb">${rows}</div>`,
    b=>b.querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>sheetLeaders(x.dataset.t)));
}
function sheetTeleport(){
  openSheet('teleport','Навигация по павильону',`<p class="muted" style="margin:0">Мгновенный переход к точке павильона.</p><div class="list">${PLACES.map((p,i)=>`<button class="qbtn" data-i="${i}" data-key="${i+1}">${esc(p.n)}</button>`).join('')}</div>`,
    b=>b.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{const p=PLACES[+x.dataset.i];closeSheet();fadeJump(()=>{player.pos.set(p.x,0,p.z);toast('Вы у точки «'+esc(p.n)+'»');});}));
}
function fadeJump(fn){const f=$('#fade');if(f.classList.contains('on'))return;f.classList.add('on');
  setTimeout(()=>{fn();setTimeout(()=>f.classList.remove('on'),120);},280);
}
function sheetBonuses(){
  const ps=PRIZES.map(p=>`<div class="prize"><b>${esc(p.n)}</b><span class="c">${p.c}</span><div class="bar"><i style="width:${Math.min(100,S.points/p.c*100)}%"></i></div><span class="small muted">${S.points>=p.c?'Баллов хватает':'Ещё '+(p.c-S.points)+' баллов'}</span></div>`).join('');
  openSheet('bonuses','Обмен баллов',`<p class="muted" style="margin:0">Баллы будут меняться на реальные бонусы от экспонентов. В демо витрина показывает, к чему стремиться.</p>${ps}<span class="pill" style="align-self:flex-start">обмен откроется в рабочей версии</span>`);
}
function sheetFarm(){
  const f=S.farm,c=CROPS[f.crop],o=OWN[f.tractor];
  openSheet('farm','Моя ферма',`<div class="spec"><div>Хозяйство</div><div>${esc(f.name)}</div><div>Регион</div><div>${esc(f.region)}</div><div>Площадь</div><div>${fmt1(f.area)} га${f.sat?' · снимок':''}</div><div>Культура</div><div>${esc(c.n)}</div><div>Техника</div><div>${esc(o.n)} × ${f.count}</div></div>
  ${S.best?`<div class="note"><span>Лучший расчёт: выгода <b>${money(S.best.benefit)}</b> в год с ${esc(EXPO[S.best.ex].n)}</span></div>`:''}
  ${S.plow?`<div class="note"><span>Своя вспашка: покрыто <b>${fmt(S.plow.cov)}%</b>, перекрытия ${fmt(S.plow.ovl)}%</span></div>`:''}
  <div class="list"><button class="btn" id="fEdit" data-key="1">Изменить данные</button><button class="btn ghost" id="fSat" data-key="2">Поле со спутника</button><button class="btn signal" id="fDrive" data-key="3">Выйти в поле</button></div>`,
  b=>{b.querySelector('#fEdit').onclick=()=>{closeSheet();openReg(2)};b.querySelector('#fSat').onclick=()=>{closeSheet();openFieldTool(()=>sheetFarm())};b.querySelector('#fDrive').onclick=()=>{closeSheet();openDrive()};});
}
function sheetTractor(id){
  const t=EXPO[id],own=OWN[S.farm.tractor];award('view_'+id,5,'Карточка '+t.n);S.viewed[id]=1;save();
  const lha=t.fuel/t.prod;
  openSheet('tractor',t.brand+' '+t.n,`<div class="eyebrow">${esc(t.brand)} · новинка выставки</div>
  <div class="spec"><div>Мощность</div><div>${t.hp} л. с.</div><div>Расход топлива</div><div>${t.fuel} л/ч</div><div>Производительность</div><div>${fmt1(t.prod)} га/ч</div><div>Расход на гектар</div><div>${fmt1(lha)} л/га</div><div>Шины</div><div>${t.tire}</div><div>Масса · грузоподъёмность навески</div><div>${t.mass} · ${t.lift}</div><div>Цена</div><div>${money(t.price)}</div></div>
  <p class="muted small" style="margin:0">${esc(t.feat)}. У вашего ${esc(own.n)} — ${fmt1(own.fuel/own.prod)} л/га.</p>
  <div class="list"><button class="btn signal" id="tDrive" data-key="1">Тест-драйв на моём поле</button><button class="btn" id="tIns" data-key="2">Осмотреть вблизи</button><button class="btn ghost" id="tEco" data-key="3">Это самый экономичный</button></div><div id="tMsg" class="small"></div>`,
  b=>{b.querySelector('#tDrive').onclick=()=>{closeSheet();openDrive(id)};
    b.querySelector('#tIns').onclick=()=>{closeSheet();startInspect(id)};
    b.querySelector('#tEco').onclick=()=>{const best=Object.keys(EXPO).sort((a,c)=>EXPO[a].fuel/EXPO[a].prod-EXPO[c].fuel/EXPO[c].prod)[0];
      if(id===best){if(!S.awards.q_eco_found){S.awards.q_eco_found=1;save();}b.querySelector('#tMsg').innerHTML='<b style="color:var(--field)">Верно.</b> Меньше литров на гектар нет ни у кого на выставке.';checkQuests();updateHUD();}
      else{sfx.bad();b.querySelector('#tMsg').innerHTML='<b style="color:var(--danger)">Не он.</b> У '+esc(t.n)+' '+fmt1(lha)+' л/га. Сравните расход на гектар у всех трёх.';}};});
}
function sheetFAQ(){
  let log=`<div class="msg npc">Здравствуйте, ${esc(S.nick)}! Я Ольга, консультант «СтепьМаш». Выберите вопрос цифрой на клавиатуре.</div>`;
  const render=()=>{$('#sheetBody').innerHTML=`<div class="chat">${log}</div><div class="eyebrow">Частые вопросы</div><div class="list">${FAQ.map((q,i)=>`<button class="qbtn" data-i="${i}" data-key="${i+1}">${esc(q[0])}</button>`).join('')}</div><p class="small muted" style="margin:0">Ответы демонстрационные. В рабочей версии здесь будет ИИ-консультант экспонента.</p>`;
    $('#sheetBody').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const q=FAQ[+b.dataset.i];log+=`<div class="msg me">${esc(q[0])}</div><div class="msg npc">${esc(q[1])}</div>`;award('faq_'+b.dataset.i,2,'Вопрос консультанту');render();});decorate($('#sheetBody'));};
  openSheet('faq','Консультант «СтепьМаш»','',render);
}
function sheetQuiz(){
  const next=QUIZ.findIndex((q,i)=>S.quiz[i]===undefined);
  if(next<0){const ok=QUIZ.filter((q,i)=>S.quiz[i]===1).length;openSheet('quiz','Агро-квиз',`<div class="note"><span>Все вопросы пройдены: верно <b>${ok} из ${QUIZ.length}</b>.</span></div><button class="btn ghost" id="qzR" data-key="1">Пройти заново без баллов</button>`,b=>b.querySelector('#qzR').onclick=()=>{S.quizReplay=true;quizAsk(0);});return;}
  quizAsk(next);
}
function quizAsk(i){
  const q=QUIZ[i],done=Object.keys(S.quiz).length;
  openSheet('quiz','Агро-квиз',`<div class="eyebrow">Вопрос ${i+1} из ${QUIZ.length}</div><b style="font-size:16px;line-height:1.35">${esc(q[0])}</b><div class="list">${q[1].map((a,j)=>`<button class="opt" data-j="${j}" data-key="${j+1}">${esc(a)}</button>`).join('')}</div><div id="qzMsg" class="small"></div>`,
  b=>{let answered=false;b.querySelectorAll('[data-j]').forEach(x=>x.onclick=()=>{if(answered)return;answered=true;const j=+x.dataset.j,ok=j===q[2];
    x.classList.add(ok?'ok':'bad');b.querySelector(`[data-j="${q[2]}"]`).classList.add('ok');
    if(!S.quizReplay&&S.quiz[i]===undefined){S.quiz[i]=ok?1:0;save();if(ok)award('quiz_'+i,10,'Верный ответ в квизе');else{sfx.bad();track('Квиз: вопрос '+(i+1)+' — неверно');}}
    const nx=QUIZ.findIndex((qq,k)=>k>i&&(S.quizReplay||S.quiz[k]===undefined));
    b.querySelector('#qzMsg').innerHTML=(ok?'<b style="color:var(--field)">Верно.</b>':'<b style="color:var(--danger)">Неверно.</b>')+` <span class="row" style="margin-top:10px">${nx>=0?'<button class="btn" id="qzN" data-key="Enter">Следующий вопрос</button>':'<button class="btn" id="qzN" data-key="Enter">Завершить</button>'}</span>`;
    b.querySelector('#qzN').onclick=()=>{if(nx>=0)quizAsk(nx);else{S.quizReplay=false;closeSheet();checkQuests();}};decorate(b);});});
}
function sheetHelp(){
  const K=(ks,t)=>`<span>${ks.map(k=>`<kbd>${k}</kbd>`).join('')}</span><span>${t}</span>`;
  openSheet('help','Клавиши',`<div class="eyebrow">Павильон</div><div class="keys">${[K(['W','A','S','D'],'идти, камера сама разворачивается за вами'),K(['←','→'],'повернуть камеру'),K(['↑','↓'],'приблизить, отдалить'),K(['Shift'],'бег'),K(['Space'],'прыжок'),K(['E'],'действие рядом'),K(['I'],'осмотр ближайшего трактора'),K(['C'],'вид камеры'),K(['M'],'мини-карта')].join('')}</div>
  <div class="eyebrow">Меню</div><div class="keys">${[K(['Q'],'квесты'),K(['R'],'рейтинг'),K(['T'],'навигация и телепорт'),K(['B'],'бонусы'),K(['F'],'моя ферма'),K(['G'],'дашборд'),K(['Z'],'реакции: эмодзи над головой'),K(['N'],'звук вкл/выкл'),K(['1','…','9'],'кнопки в открытой панели'),K(['Esc'],'закрыть')].join('')}</div>
  <div class="eyebrow">В поле</div><div class="keys">${[K(['W','S'],'газ, тормоз'),K(['A','D'],'руль'),K(['Space'],'опустить или поднять плуг'),K(['V'],'вид камеры'),K(['Enter'],'завершить вспашку')].join('')}</div>`);
}
const NAV={admin:()=>open('admin.html','_blank'),react:()=>toggleSheet('react',sheetReact),quests:()=>toggleSheet('quests',sheetQuests),leaders:()=>toggleSheet('leaders',()=>{sheetLeaders();leadersFetch();}),teleport:()=>toggleSheet('teleport',sheetTeleport),bonuses:()=>toggleSheet('bonuses',sheetBonuses),farm:()=>toggleSheet('farm',sheetFarm),dash:()=>openDash(),help:()=>toggleSheet('help',sheetHelp)};
document.querySelectorAll('#nav [data-open]').forEach(b=>b.onclick=()=>NAV[b.dataset.open]());

/* ================= РЕГИСТРАЦИЯ ================= */
let regStep=1;
function setWorldHud(on){['#hudTop','#help','#joy','#objective'].forEach(s=>$(s).hidden=!on);$('#minimap').hidden=!on||!mmOn;if(!on)$('#prompt').hidden=true;}
function openReg(step){
  regStep=step||1;$('#reg').hidden=false;setWorldHud(false);camMode='intro';
  $('#st2').classList.toggle('on',regStep===2);
  $('#regLead').textContent=regStep===1?'Стойка регистрации. Выберите аватар и расскажите о хозяйстве — по этим цифрам на стендах посчитаем выгоду от новой техники.':'Данные хозяйства. Они нужны только для расчётов на вашем поле и в рейтинге.';
  if(regStep===1){
    $('#regBody').innerHTML=`<label class="f">Ник на выставке<input id="rNick" maxlength="20" value="${esc(S.nick)}"></label>
    <div><div class="eyebrow" style="margin-bottom:8px">Кто вы</div><div class="roles">${ROLES.map((r,i)=>`<button class="role" aria-pressed="${S.role===i}" data-r="${i}" data-key="${i+1}"><b>${r.n}</b><span>${r.d}</span></button>`).join('')}</div></div>
    <div><div class="eyebrow" style="margin-bottom:8px">Цвет одежды</div><div class="sw">${SWATCH.map(c=>`<button aria-label="Цвет" aria-pressed="${S.color===c}" data-c="${c}" style="background:${c}"></button>`).join('')}<button class="btn ghost" id="rCol" data-key="C" style="padding:6px 10px">Следующий</button></div></div>
    <div><div class="eyebrow" style="margin-bottom:8px">Головной убор</div><div class="seg">${[['cap','Кепка'],['helmet','Каска'],['none','Без']].map(h=>`<button aria-pressed="${S.hat===h[0]}" data-h="${h[0]}">${h[1]}</button>`).join('')}</div><button class="btn ghost" id="rHat" data-key="H" style="margin-top:8px;padding:6px 10px">Следующий убор</button></div>`;
    $('#regFoot').innerHTML=`<span class="hint">Мышь не обязательна: цифры, <kbd>C</kbd>, <kbd>H</kbd>, <kbd>Enter</kbd></span><button class="btn" id="rNext" data-key="Enter">Дальше</button>`;
    const b=$('#regBody');
    b.querySelector('#rNick').oninput=e=>{S.nick=e.target.value.trim()||GUEST;player.label.userData.draw(S.nick,subLabel());};
    b.querySelectorAll('[data-r]').forEach(x=>x.onclick=()=>{S.nick=$('#rNick').value.trim()||S.nick;S.role=+x.dataset.r;S.color=ROLES[S.role].color;S.hat=ROLES[S.role].hat;openReg(1);rebuildPlayer();});
    b.querySelectorAll('[data-c]').forEach(x=>x.onclick=()=>{S.color=x.dataset.c;openReg(1);rebuildPlayer();});
    b.querySelector('#rCol').onclick=()=>{S.color=SWATCH[(SWATCH.indexOf(S.color)+1)%SWATCH.length];openReg(1);rebuildPlayer();};
    b.querySelectorAll('[data-h]').forEach(x=>x.onclick=()=>{S.hat=x.dataset.h;openReg(1);rebuildPlayer();});
    b.querySelector('#rHat').onclick=()=>{const H=['cap','helmet','none'];S.hat=H[(H.indexOf(S.hat)+1)%3];openReg(1);rebuildPlayer();};
    $('#rNext').onclick=()=>{S.nick=$('#rNick').value.trim()||GUEST;save();openReg(2)};
  }else{
    const f=S.farm;
    $('#regBody').innerHTML=`<label class="f">Название хозяйства<input id="rFarm" maxlength="40" value="${esc(f.name)}"></label>
    <div class="grid2"><label class="f">Регион<select id="rReg">${REGIONS.map(r=>`<option ${r===f.region?'selected':''}>${r}</option>`).join('')}</select></label>
    <label class="f">Площадь, га<input id="rArea" type="number" min="10" max="100000" step="1" value="${Math.round(f.area)}"></label></div>
    <label class="f">Основная культура<select id="rCrop">${Object.entries(CROPS).map(([k,c])=>`<option value="${k}" ${k===f.crop?'selected':''}>${c.n}</option>`).join('')}</select></label>
    <div class="grid2"><label class="f">Ваш трактор<select id="rTr">${Object.entries(OWN).map(([k,o])=>`<option value="${k}" ${k===f.tractor?'selected':''}>${o.n}</option>`).join('')}</select></label>
    <label class="f">Сколько единиц<input id="rCnt" type="number" min="1" max="60" value="${f.count}"></label></div>
    <div class="note"><span>${f.sat?'Поле построено по снимку: <b>'+fmt1(f.area)+' га</b>':'Можно построить поле по спутниковому снимку участка'}</span><button class="btn ghost" id="rSat" data-key="P">Поле со спутника</button></div>${TRK.on?'<p class="small muted" style="margin:0">Ник, хозяйство, регион, баллы и действия на выставке сохраняются для статистики демо. Телефон из заявок не отправляется.</p>':''}
    <span class="hint"><kbd>Tab</kbd> по полям, <kbd>Enter</kbd> войти</span>`;
    $('#regFoot').innerHTML=`<button class="btn ghost" id="rBack" data-key="Backspace">Назад</button><button class="btn signal" id="rGo" data-key="Enter">${S.registered?'Сохранить':'Войти на выставку'}</button>`;
    const read=()=>{f.name=$('#rFarm').value.trim()||'Моё хозяйство';f.region=$('#rReg').value;const a=+$('#rArea').value;if(a>0&&Math.abs(a-Math.round(f.area))>=1){f.area=a;f.sat=false;}f.crop=$('#rCrop').value;f.tractor=$('#rTr').value;f.count=clamp(Math.round(+$('#rCnt').value||1),1,60);};
    $('#rSat').onclick=()=>{read();openFieldTool(()=>openReg(2))};
    $('#rBack').onclick=()=>{read();openReg(1)};
    $('#rGo').onclick=()=>{read();const first=!S.registered;S.registered=true;save();closeReg();netTrack(true);if(first){logEvent('Регистрация: '+f.name);setTimeout(()=>toast('Добро пожаловать, <b>'+esc(S.nick)+'</b>! Цель дня — вверху экрана'),300);}updateHUD();};
  }
  decorate($('#reg'));
}
function closeReg(){$('#reg').hidden=true;setWorldHud(true);camMode='follow';yaw=0;}

/* ================= СПУТНИКОВОЕ ПОЛЕ ================= */
const field={img:null,scale:null,poly:[],sample:true};
function makeSample(){
  const c=document.createElement('canvas');c.width=900;c.height=640;const x=c.getContext('2d');
  let seed=7;const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647);
  x.fillStyle='#6f7a4c';x.fillRect(0,0,900,640);
  const cols=['#8a8d55','#6d8a46','#a49563','#5f7c3e','#9c8a5a','#7f8f4f','#b09d6a','#58743a'];
  for(let gy=0;gy<5;gy++)for(let gx=0;gx<6;gx++){const x0=gx*150+rnd()*10,y0=gy*128+rnd()*10;x.save();x.translate(x0,y0);x.rotate((rnd()-.5)*.08);
    x.fillStyle=cols[Math.floor(rnd()*cols.length)];x.fillRect(4,4,140,118);x.strokeStyle='rgba(0,0,0,.08)';x.lineWidth=1;for(let i=8;i<118;i+=5){x.beginPath();x.moveTo(6,i);x.lineTo(142,i+rnd()*2);x.stroke();}x.restore();}
  x.fillStyle='#93995b';x.beginPath();[[260,150],[640,120],[700,420],[300,470]].forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fill();
  x.save();x.clip();x.strokeStyle='rgba(60,50,20,.18)';for(let i=0;i<1100;i+=6){x.beginPath();x.moveTo(i,0);x.lineTo(i-200,640);x.stroke();}x.restore();
  x.strokeStyle='#2f4a23';x.lineWidth=9;x.lineCap='round';
  [[[250,140],[650,110]],[[655,112],[712,428]],[[60,520],[860,500]],[[200,20],[180,620]]].forEach(l=>{x.beginPath();x.moveTo(l[0][0],l[0][1]);x.lineTo(l[1][0],l[1][1]);x.stroke();});
  x.strokeStyle='#c9b98f';x.lineWidth=6;x.beginPath();x.moveTo(0,560);x.bezierCurveTo(300,540,500,600,900,575);x.stroke();
  x.strokeStyle='#4f7486';x.lineWidth=14;x.beginPath();x.moveTo(820,0);x.bezierCurveTo(780,200,880,320,790,640);x.stroke();
  x.fillStyle='rgba(255,255,255,.85)';x.fillRect(24,592,150,32);x.fillStyle='#111';x.fillRect(36,610,100,4);x.fillRect(36,603,3,11);x.fillRect(133,603,3,11);
  x.font='600 13px "Golos Text",sans-serif';x.fillText('500 м',142,615);
  return c;
}
function resetFieldToSample(){field.img=makeSample();field.sample=true;field.scale=5;field.scaleA=[36,612];field.scaleB=[136,612];field.poly=[[260,150],[640,120],[700,420],[300,470]];}
resetFieldToSample();
const polyAreaPx=p=>{let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1];}return Math.abs(a)/2;};
const fieldHa=()=>field.poly.length>2&&field.scale?polyAreaPx(field.poly)*field.scale*field.scale/1e4:0;
let ftDone=null,ftMode='poly',ftTmp=[],ftWork=null;
function openFieldTool(onDone){ftDone=onDone;$('#fieldtool').hidden=false;$('#reg').hidden=true;closeSheet();
  ftWork={img:field.img,scale:field.scale,scaleA:field.scaleA,scaleB:field.scaleB,poly:field.poly.slice()};ftMode=ftWork.scale?'poly':'scale';ftTmp=[];ftRender();decorate($('#fieldtool'));}
function ftRender(){
  const c=$('#ftCanvas'),x=c.getContext('2d');c.width=ftWork.img.width;c.height=ftWork.img.height;
  x.drawImage(ftWork.img,0,0);const lw=Math.max(2,c.width/400);
  if(ftWork.scaleA&&ftWork.scaleB){x.strokeStyle='#e8a01a';x.lineWidth=lw*1.5;x.beginPath();x.moveTo(...ftWork.scaleA);x.lineTo(...ftWork.scaleB);x.stroke();}
  ftTmp.forEach(p=>{x.fillStyle='#e8a01a';x.beginPath();x.arc(p[0],p[1],lw*3,0,7);x.fill();});
  const p=ftWork.poly;
  if(p.length){x.fillStyle='rgba(232,160,26,.25)';x.strokeStyle='#ffd166';x.lineWidth=lw;x.beginPath();p.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));if(p.length>2)x.closePath();x.fill();x.stroke();
    p.forEach(q=>{x.fillStyle='#fff';x.beginPath();x.arc(q[0],q[1],lw*2.5,0,7);x.fill();x.strokeStyle='#16231b';x.stroke();});}
  $('#ftS1').classList.toggle('on',ftMode==='scale');$('#ftS2').classList.toggle('on',ftMode==='poly');
  $('#ftScaleInfo').innerHTML=ftWork.scale?`1 пиксель = <b>${fmt1(ftWork.scale)} м</b> · <button class="btn ghost" id="ftRescale" style="padding:4px 10px">Перемерить</button>`:(ftTmp.length?'Кликните по второму концу шкалы':'Кликните по первому концу шкалы');
  const r=$('#ftRescale');if(r)r.onclick=()=>{ftMode='scale';ftTmp=[];ftWork.scaleA=ftWork.scaleB=null;ftWork.scale=null;ftRender();};
  const ha=ftWork.scale&&p.length>2?polyAreaPx(p)*ftWork.scale*ftWork.scale/1e4:0;
  $('#ftArea').textContent=ha?fmt1(ha)+' га':'— га';$('#ftUse').disabled=!ha;
  $('#ftSub').textContent=field.sample&&ftWork.img===field.img?'пример снимка':'ваш снимок';
}
$('#ftCanvas').addEventListener('pointerdown',e=>{const c=e.currentTarget,r=c.getBoundingClientRect();const p=[(e.clientX-r.left)/r.width*c.width,(e.clientY-r.top)/r.height*c.height];
  if(ftMode==='scale'){ftTmp.push(p);if(ftTmp.length===2){ftWork.scaleA=ftTmp[0];ftWork.scaleB=ftTmp[1];const d=Math.hypot(p[0]-ftTmp[0][0],p[1]-ftTmp[0][1]);ftWork.scale=(+$('#ftMeters').value||500)/Math.max(1,d);ftTmp=[];ftMode='poly';}}
  else ftWork.poly.push(p);ftRender();});
$('#ftMeters').oninput=()=>{if(ftWork&&ftWork.scaleA&&ftWork.scaleB){const d=Math.hypot(ftWork.scaleB[0]-ftWork.scaleA[0],ftWork.scaleB[1]-ftWork.scaleA[1]);ftWork.scale=(+$('#ftMeters').value||500)/Math.max(1,d);ftRender();}};
$('#ftUndo').onclick=()=>{ftWork.poly.pop();ftRender();};
$('#ftReset').onclick=()=>{ftWork.poly=[];ftMode=ftWork.scale?'poly':'scale';ftRender();};
$('#ftSample').onclick=()=>{resetFieldToSample();$('#ftMeters').value=500;ftWork={img:field.img,scale:5,scaleA:field.scaleA,scaleB:field.scaleB,poly:field.poly.slice()};ftMode='poly';ftRender();};
$('#ftFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{
  const k=Math.min(1,1600/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  ftWork={img:c,scale:null,scaleA:null,scaleB:null,poly:[]};ftMode='scale';ftTmp=[];ftRender();};im.src=rd.result;};rd.readAsDataURL(f);};
$('#ftUse').onclick=()=>{if(ftWork.img!==field.img)field.sample=false;
  Object.assign(field,{img:ftWork.img,scale:ftWork.scale,scaleA:ftWork.scaleA,scaleB:ftWork.scaleB,poly:ftWork.poly.slice()});
  S.farm.area=Math.round(fieldHa()*10)/10;S.farm.sat=true;save();logEvent('Поле по снимку: '+fmt1(S.farm.area)+' га');F.dirty=true;
  closeFieldTool();toast('Поле построено: <b>'+fmt1(S.farm.area)+' га</b>');};
function closeFieldTool(){$('#fieldtool').hidden=true;const cb=ftDone;ftDone=null;if(cb)cb();}
$('#ftX').onclick=closeFieldTool;

/* ================= РАСЧЁТ СЕЗОНА ================= */
function season(m,count){const f=S.farm,c=CROPS[f.crop];
  const hours=f.area*c.work/m.prod,days=hours/count/SHIFT,liters=hours*m.fuel;
  const fuelR=liters*FUEL,labor=hours*WAGE,maint=hours*m.maint,cost=fuelR+labor+maint;
  const loss=clamp((days-c.win)*0.6,0,25),tons=f.area*c.y*(1-loss/100);
  return {count,hours,days,liters,fuelR,labor,maint,cost,loss,tons,revenue:tons*c.price};}
function compare(exId){const own=OWN[S.farm.tractor],ex=EXPO[exId],cnt=S.farm.count;
  const nc=Math.max(1,Math.ceil(cnt*own.prod/ex.prod));const a=season(own,cnt),b=season(ex,nc);
  const benefit=(a.cost-b.cost)+(b.revenue-a.revenue),capex=nc*ex.price-cnt*own.trade;
  return {own,ex,a,b,benefit,capex,payback:benefit>0?capex/benefit:Infinity};}

/* ================= ГРАФИКИ (SVG) ================= */
function niceMax(v){const p=Math.pow(10,Math.floor(Math.log10(Math.max(1,v))));const n=v/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p;}
function cashflowSVG(R){
  const Y=8,w=560,h=230,pl=62,pr=14,pt=14,pb=30;
  const vals=[];for(let y=0;y<=Y;y++)vals.push(-R.capex+R.benefit*y);
  const mx=niceMax(Math.max(...vals.map(Math.abs))),lo=Math.min(0,Math.min(...vals))<0?-mx:0,hi=Math.max(...vals)>0?mx:0;
  const X=i=>pl+(w-pl-pr)*i/Y,Yv=v=>pt+(h-pt-pb)*(1-(v-lo)/((hi-lo)||1));
  let g='';for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4;g+=`<line x1="${pl}" x2="${w-pr}" y1="${Yv(v)}" y2="${Yv(v)}" stroke="${v===0?'#7d8b81':'#dfe5dc'}" stroke-width="${v===0?1.4:1}"/><text x="${pl-8}" y="${Yv(v)+4}" text-anchor="end" font-size="11" fill="#7d8b81" font-family="JetBrains Mono,monospace">${(v/1e6).toLocaleString('ru-RU',{maximumFractionDigits:1})}</text>`;}
  for(let i=0;i<=Y;i++)g+=`<text x="${X(i)}" y="${h-10}" text-anchor="middle" font-size="11" fill="#7d8b81" font-family="JetBrains Mono,monospace">${i}</text>`;
  const pts=vals.map((v,i)=>X(i).toFixed(1)+','+Yv(v).toFixed(1)).join(' ');
  let pay='';if(isFinite(R.payback)&&R.payback<=Y){const px=X(R.payback),py=Yv(0);pay=`<line x1="${px}" x2="${px}" y1="${pt}" y2="${h-pb}" stroke="#e8a01a" stroke-dasharray="4 4"/><circle cx="${px}" cy="${py}" r="6" fill="#e8a01a" stroke="#fff" stroke-width="2"/><text x="${px+8}" y="${pt+12}" font-size="12" font-weight="700" fill="#4a3200" font-family="Golos Text,sans-serif">окупаемость ${fmt1(R.payback)} г.</text>`;}
  const area=`${X(0)},${Yv(0)} ${pts} ${X(Y)},${Yv(0)}`;
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Накопленный эффект по годам">${g}<polygon points="${area}" fill="#2e6a3e" opacity=".1"/><polyline points="${pts}" fill="none" stroke="#2e6a3e" stroke-width="2.6" stroke-linejoin="round"/>${vals.map((v,i)=>`<circle cx="${X(i)}" cy="${Yv(v)}" r="3" fill="${v>=0?'#2e6a3e':'#b8402c'}"/>`).join('')}${pay}<text x="${pl}" y="${h-0}" font-size="10" fill="#7d8b81" font-family="Golos Text,sans-serif">годы</text></svg>`;
}
function costSVG(R){
  const w=560,rowH=46,lw=118,h=2*rowH+44,mx=niceMax(Math.max(R.a.cost,R.b.cost));const sc=v=>(w-lw-16)*v/mx;
  const parts=[['fuelR','#e8a01a','Топливо'],['labor','#2e6a3e','Механизаторы'],['maint','#7d8b81','Ремонт и ТО']];
  const bar=(r,y,name)=>{let x=lw,s='';parts.forEach(p=>{const bw=sc(r[p[0]]);s+=`<rect x="${x}" y="${y}" width="${Math.max(0,bw)}" height="24" fill="${p[1]}"/>`;x+=bw;});return `<text x="0" y="${y+17}" font-size="13" fill="#16231b" font-family="Golos Text,sans-serif">${esc(name)}</text>${s}<text x="${Math.min(w-4,x+6)}" y="${y+17}" font-size="12" font-weight="700" fill="#16231b" font-family="JetBrains Mono,monospace" text-anchor="${x+80>w?'end':'start'}">${(r.cost/1e6).toLocaleString('ru-RU',{maximumFractionDigits:1})} млн</text>`;};
  const leg=parts.map((p,i)=>`<rect x="${lw+i*140}" y="${h-16}" width="12" height="12" rx="2" fill="${p[1]}"/><text x="${lw+i*140+18}" y="${h-6}" font-size="12" fill="#4b5b50" font-family="Golos Text,sans-serif">${p[2]}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Структура затрат">${bar(R.a,8,'Ваша техника')}${bar(R.b,8+rowH,R.ex.n)}${leg}</svg>`;
}

/* ================= 3D: ОБЩЕЕ ================= */
const W={ready:false};
function mkRenderer(canvas){const r=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});r.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
  r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=.92;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;return r;}
function skyDome(){const g=new T.SphereGeometry(600,32,16);const m=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,
  uniforms:{top:{value:new T.Color('#5f9fd0')},mid:{value:new T.Color('#cfe5ef')},bot:{value:new T.Color('#9aa87a')}},
  vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top,mid,bot;varying vec3 vP;void main(){float y=vP.y;vec3 c=y>0.?mix(mid,top,pow(y,.55)):mix(mid,bot,pow(-y,.4));gl_FragColor=vec4(c,1.);}'});
  const s=new T.Mesh(g,m);s.renderOrder=-1;return s;}
function rowsTexture(){const t=AX.canvasTex(512,512,(x,w,h)=>{x.fillStyle='#7c9447';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=8){x.fillStyle=i%16?'#86a04f':'#6c8540';x.fillRect(i,0,4,h);}
  for(let i=0;i<900;i++){x.fillStyle=`rgba(${40+Math.random()*40|0},${60+Math.random()*40|0},20,.15)`;x.fillRect(Math.random()*w,Math.random()*h,3,3);}});t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
function addTrees(scene,cnt,rmin,rmax,avoid){
  const trunk=new T.CylinderGeometry(.18,.28,2.6,8),crown=new T.IcosahedronGeometry(2.2,2);
  const tm=new T.InstancedMesh(trunk,AX.std('#5a4330',0,.9),cnt),cm=new T.InstancedMesh(crown,AX.std('#3f6b2e',0,.85),cnt);
  const m=new T.Matrix4(),q=new T.Quaternion(),s=new V3(),p=new V3(),col=new T.Color();let i=0;
  while(i<cnt){const a=Math.random()*Math.PI*2,r=rmin+Math.random()*(rmax-rmin);const x=Math.cos(a)*r,z=Math.sin(a)*r*.8;if(avoid&&avoid(x,z))continue;
    const k=.8+Math.random()*.9;p.set(x,1.3*k,z);s.set(k,k,k);m.compose(p,q,s);tm.setMatrixAt(i,m);p.set(x,(3.6+Math.random()*.6)*k,z);s.set(k*(1+Math.random()*.3),k*(1.1+Math.random()*.4),k);m.compose(p,q,s);cm.setMatrixAt(i,m);
    col.setHSL(.26+Math.random()*.06,.45,.25+Math.random()*.1);cm.setColorAt(i,col);i++;}
  tm.castShadow=cm.castShadow=true;scene.add(tm,cm);
}
function softTex(){return AX.canvasTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});}
class Smoke{constructor(scene,color){this.p=[];this.tex=softTex();for(let i=0;i<46;i++){const s=new T.Sprite(new T.SpriteMaterial({map:this.tex,color:color||'#5b5f63',transparent:true,depthWrite:false,opacity:0}));s.visible=false;scene.add(s);this.p.push({s,life:0,v:new V3()});}this.acc=0;}
  emit(pos,rate,dt,wind){this.acc+=rate*dt;while(this.acc>1){this.acc--;const q=this.p.find(q=>q.life<=0);if(!q)break;q.life=1;q.s.visible=true;q.s.position.copy(pos);q.v.set((Math.random()-.5)*.4+(wind?wind.x:0),1.6+Math.random()*.6,(Math.random()-.5)*.4+(wind?wind.z:0));}}
  update(dt){this.p.forEach(q=>{if(q.life<=0)return;q.life-=dt*.55;q.s.position.addScaledVector(q.v,dt);const k=1-q.life;q.s.scale.setScalar(.35+k*2.4);q.s.material.opacity=Math.max(0,q.life)*.45;if(q.life<=0)q.s.visible=false;});}}
function makeLabel(w,opt){opt=opt||{};const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const spr=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));
  const rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath();};
  spr.userData.draw=(a,b)=>{x.clearRect(0,0,512,128);x.font='700 46px "Golos Text",sans-serif';const wa=x.measureText(a).width;x.font='700 34px "JetBrains Mono",monospace';const wb=b?x.measureText(b).width+28:0;
    const tw=Math.min(500,wa+wb+48),X=(512-tw)/2;x.fillStyle=opt.bg||'rgba(18,28,22,.82)';rr(X,22,tw,84,22);x.fill();
    x.textBaseline='middle';x.font='700 46px "Golos Text",sans-serif';x.fillStyle=opt.fg||'#fff';x.fillText(a,X+24,66,500-wb-48);
    if(b){x.font='700 34px "JetBrains Mono",monospace';x.fillStyle=opt.sub||'#e8a01a';x.fillText(b,X+tw-24-wb+28,66);}tex.needsUpdate=true;};
  spr.scale.set(w,w/4,1);return spr;}

/* ================= 3D: ПАВИЛЬОН ================= */
const canvas=$('#world');
const renderer=mkRenderer(canvas);
const scene=new T.Scene();
scene.environment=AX.makeEnvironment(renderer);
scene.add(skyDome());scene.fog=new T.Fog('#cfe5ef',70,240);
const camera=new T.PerspectiveCamera(52,1,.1,900);
scene.add(new T.HemisphereLight('#ffffff','#a69a82',.35));
const sun=new T.DirectionalLight('#fff1d8',1.8);sun.position.set(20,44,16);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-40,right:40,top:30,bottom:-30,near:1,far:120});sun.shadow.camera.updateProjectionMatrix();sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;scene.add(sun);
const {M,rbox,cyl,std,paint,MAT}=AX;
const box=(w,h,d,mat,x,y,z,p,cast)=>M(new T.BoxGeometry(w,h,d),mat,p||scene,x,y,z,cast);
const HX=32,HZ=22,HH=8.5;
const colliders=[],inter=[],spinners=[],bob=[],stands={};
function addCol(x,z,r){colliders.push({x,z,r});}

// пол: шлифованный бетон с разметкой
const floorTex=AX.canvasTex(1536,1056,(x,w,h)=>{const s=24,X=v=>(v+HX)*s,Z=v=>(v+HZ)*s;
  x.fillStyle='#aeb3ab';x.fillRect(0,0,w,h);
  for(let i=0;i<26000;i++){const g=160+Math.random()*30|0;x.fillStyle=`rgba(${g},${g+2},${g-4},.25)`;x.fillRect(Math.random()*w,Math.random()*h,2,2);}
  x.strokeStyle='rgba(70,80,70,.18)';x.lineWidth=1.5;for(let i=0;i<=64;i+=4){x.beginPath();x.moveTo(i*s,0);x.lineTo(i*s,h);x.stroke();}for(let j=0;j<=44;j+=4){x.beginPath();x.moveTo(0,j*s);x.lineTo(w,j*s);x.stroke();}
  x.fillStyle='rgba(46,106,62,.13)';x.fillRect(X(-32),Z(-2.6),64*s,5.2*s);
  [[6,-6.2,-2.6],[6,2.6,6.2],[-16,2.6,6.2],[-16,-6.2,-2.6]].forEach(b=>x.fillRect(X(b[0]-2.2),Z(b[1]),4.4*s,(b[2]-b[1])*s));
  x.fillStyle='#e8a01a';for(let i=-32;i<32;i+=2){x.fillRect(X(i),Z(-2.65),s*1.1,4);x.fillRect(X(i),Z(2.6),s*1.1,4);}
  x.fillStyle='rgba(46,106,62,.8)';x.font='800 34px "Unbounded",sans-serif';x.textBaseline='middle';x.fillText('В ПОЛЕ →',X(20.5),Z(0));
  x.fillStyle='rgba(22,35,27,.5)';x.font='800 30px "Unbounded",sans-serif';x.fillText('ВХОД',X(-30.5),Z(0));});
const floor=M(new T.PlaneGeometry(HX*2,HZ*2),new T.MeshStandardMaterial({map:floorTex,roughness:.42,metalness:0,envMapIntensity:.55}),scene,0,0,0,false);floor.rotation.x=-Math.PI/2;
// улица
const rowsT=rowsTexture();rowsT.repeat.set(60,60);
const ground=M(new T.PlaneGeometry(1200,1200),new T.MeshStandardMaterial({map:rowsT,roughness:1}),scene,0,-.03,0,false);ground.rotation.x=-Math.PI/2;
M(new T.PlaneGeometry(30,10),std('#8c8c86',0,.95),scene,47,-.01,0,false).rotation.x=-Math.PI/2;
addTrees(scene,140,90,260);
for(let i=0;i<10;i++){const b=cyl(.75,.75,1.2,24,std('#d8b968',0,.9),scene,40+(i%5)*2.2,.75,9+Math.floor(i/5)*2.2,'z');}
// стены из профлиста
const corr=AX.canvasTex(256,64,(x,w,h)=>{for(let i=0;i<w;i++){const v=Math.sin(i/w*Math.PI*16);const g=226+v*14|0;x.fillStyle=`rgb(${g},${g+3},${g})`;x.fillRect(i,0,1,h);}});corr.wrapS=corr.wrapT=T.RepeatWrapping;
const wallMat=new T.MeshStandardMaterial({map:corr,roughness:.55,metalness:.25});
const wallMatZ=wallMat.clone();wallMatZ.map=corr.clone();wallMatZ.map.repeat.set(16,1);wallMatZ.map.needsUpdate=true;
const dado=std('#2e4a37',.2,.6);
function wall(len,x,z,rotY,h,y){const m=M(new T.PlaneGeometry(len,h),wallMatZ,scene,x,y,z,false);m.rotation.y=rotY;m.receiveShadow=true;m.material.side=T.DoubleSide;
  const d=M(new T.BoxGeometry(len,1.1,.12),dado,scene,x,.55,z,false);d.rotation.y=rotY;return m;}
wall(HX*2,0,-HZ,0,HH,HH/2);wall(HX*2,0,HZ,Math.PI,HH,HH/2);
[-1,1].forEach(sd=>{const X=sd*HX;wall(HZ-4,X,-(HZ+4)/2,-sd*Math.PI/2,HH,HH/2);wall(HZ-4,X,(HZ+4)/2,-sd*Math.PI/2,HH,HH/2);
  const t=M(new T.PlaneGeometry(8,HH-5.4),wallMatZ,scene,X,5.4+(HH-5.4)/2,0,false);t.rotation.y=-sd*Math.PI/2;});
const glass=MAT.glass();
[-HZ+.08,HZ-.08].forEach(z=>{const g=M(new T.PlaneGeometry(HX*2-1,1.8),new T.MeshPhysicalMaterial({color:'#bcdce8',roughness:.05,transparent:true,opacity:.55,envMapIntensity:2}),scene,0,6.3,z,false);if(z>0)g.rotation.y=Math.PI;});
// стальные рамы
const steel=std('#3b4650',.55,.45);
function ibeam(len,mat){const g=new T.Group();g.add(new T.Mesh(new T.BoxGeometry(len,.06,.34),mat));const a=new T.Mesh(new T.BoxGeometry(len,.06,.34),mat);a.position.y=.44;g.add(a);const b=new T.Mesh(new T.BoxGeometry(len,.44,.05),mat);b.position.y=.22;g.add(b);g.traverse(m=>{if(m.isMesh){m.castShadow=true;}});return g;}
const rise=4.2,half=Math.hypot(HZ,rise),ang=Math.atan2(rise,HZ);
for(let i=-HX;i<=HX;i+=8){[-1,1].forEach(sd=>{const c=ibeam(HH,steel);c.rotation.z=Math.PI/2;c.position.set(i+.22,HH/2,sd*(HZ-.25));scene.add(c);
    const piv=new T.Group();piv.position.set(i,HH+rise/2-.45,sd*HZ/2);piv.rotation.x=sd*ang;const r=ibeam(half,steel);r.rotation.y=Math.PI/2;piv.add(r);scene.add(piv);});}
const roofG=new T.MeshPhysicalMaterial({color:'#d7ecf4',roughness:.08,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false,envMapIntensity:1.5});
[-1,1].forEach(sd=>{const r=M(new T.PlaneGeometry(HX*2,half),roofG,scene,0,HH+rise/2,sd*HZ/2,false);r.castShadow=false;r.rotation.x=-Math.PI/2+sd*ang;});
for(let z=-18;z<=18;z+=6){const b=box(HX*2,.16,.16,steel,0,HH+rise*(1-Math.abs(z)/HZ)-.1,z);}
const lightStrip=new T.MeshBasicMaterial({color:new T.Color(1.6,1.6,1.5),toneMapped:false});
for(let z=-12;z<=12;z+=12)if(z){const y=HH+rise*(1-Math.abs(z)/HZ)-.35;box(HX*2-4,.08,.35,lightStrip,0,y,z,scene,false);}
box(HX*2-4,.08,.35,lightStrip,0,HH+rise-.5,0,scene,false);
// растения
const potM=std('#e9ebe6',.1,.5),leafM=std('#3f7a34',0,.75),leafM2=std('#5a9442',0,.75);
function plant(x,z,s){s=s||1;const g=new T.Group();g.position.set(x,0,z);scene.add(g);cyl(.42*s,.32*s,.7*s,24,potM,g,0,.35*s,0);
  for(let i=0;i<5;i++){const l=M(new T.IcosahedronGeometry(.42*s,2),i%2?leafM:leafM2,g,(Math.random()-.5)*.5*s,(1.0+Math.random()*.6)*s,(Math.random()-.5)*.5*s);l.scale.set(1,1.3,1);}addCol(x,z,.5*s);}
[[-30,-20],[-30,20],[30,-20],[30,20],[-2,-20],[-2,20],[14,-20],[14,20],[-30,-6],[-30,6]].forEach(p=>plant(p[0],p[1],1.2));
// скамейки
function bench(x,z,r){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=r||0;scene.add(g);const wd=std('#a5733f',0,.7);
  for(let i=0;i<4;i++)M(rbox(2.4,.06,.12,.02),wd,g,0,.48,-.2+i*.13);M(rbox(.08,.48,.5,.02),steel,g,-1.05,.24,0);M(rbox(.08,.48,.5,.02),steel,g,1.05,.24,0);addCol(x,z,1.1);}
bench(-10,-8,0);bench(-10,8,0);bench(18,-8,0);bench(18,8,0);

/* стенды */
function buildStand(cfg){
  const g=new T.Group();g.position.set(cfg.x,0,cfg.z);g.rotation.y=cfg.rot;scene.add(g);
  const brand=paint(cfg.color),light=std(cfg.light,0,.85);
  const pg=new T.ExtrudeGeometry(AX.roundRectShape(10,10,1.1),{depth:.22,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:2,curveSegments:10});pg.rotateX(-Math.PI/2);
  const carpet=AX.canvasTex(512,512,(x,w,h)=>{x.fillStyle=cfg.light;x.fillRect(0,0,w,h);for(let i=0;i<7000;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.06})`;x.fillRect(Math.random()*w,Math.random()*h,2,2);}x.strokeStyle=cfg.color;x.globalAlpha=.25;x.lineWidth=6;x.strokeRect(30,30,w-60,h-60);});
  const plat=M(pg,new T.MeshStandardMaterial({map:carpet,roughness:.9}),g,0,0,0,false);plat.receiveShadow=true;
  const ledM=new T.MeshBasicMaterial({color:new T.Color(cfg.color).multiplyScalar(2.2),toneMapped:false});
  const ring=AX.roundRectShape(10.12,10.12,1.12);ring.holes.push(AX.roundRectShape(9.98,9.98,1.08));
  const lg=new T.ExtrudeGeometry(ring,{depth:.05,bevelEnabled:false,curveSegments:10});lg.rotateX(-Math.PI/2);M(lg,ledM,g,0,.03,0,false);
  // арка
  [-4.55,4.55].forEach(x=>{M(rbox(.6,4.6,.6,.12),brand,g,x,2.3,4.6);M(rbox(.7,.2,.7,.06),MAT.darkSteel(),g,x,.1,4.6);});
  M(rbox(9.7,1.4,.55,.1),std('#1c1f22',.4,.5),g,0,4.95,4.6);
  const logo=AX.canvasTex(1024,148,(x,w,h)=>{x.fillStyle='#111';x.fillRect(0,0,w,h);x.fillStyle=cfg.color;x.fillRect(0,0,22,h);x.fillStyle='#fff';x.font='800 60px "Unbounded",sans-serif';x.textBaseline='middle';x.fillText(cfg.brand.toUpperCase(),52,56);x.font='500 30px "Golos Text",sans-serif';x.globalAlpha=.8;x.fillText(cfg.slogan,54,112);});
  [1,-1].forEach(sd=>{const p=M(new T.PlaneGeometry(9.4,1.3),new T.MeshBasicMaterial({map:logo,toneMapped:false}),g,0,4.95,4.6+sd*.29,false);if(sd<0)p.rotation.y=Math.PI;});
  // поворотный подиум
  M(new T.CylinderGeometry(2.75,2.85,.34,64),MAT.white(),g,0,.39,-.4);
  M(new T.TorusGeometry(2.8,.04,8,96),ledM,g,0,.5,-.4,false).rotation.x=Math.PI/2;
  const turn=new T.Group();turn.position.set(0,.56,-.4);g.add(turn);
  const t=EXPO[cfg.tractor];const tr=AX.makeTractor({color:t.color,rim:t.rim,brand:t.brand,model:t.n});tr.position.x=-.4;turn.add(tr);
  spinners.push({turn,on:true,id:cfg.tractor});
  // стела с характеристиками
  const st=AX.canvasTex(256,512,(x,w,h)=>{x.fillStyle='#14201a';x.fillRect(0,0,w,h);x.fillStyle=cfg.color;x.fillRect(0,0,w,10);x.fillStyle='#fff';x.font='800 40px "Unbounded",sans-serif';x.fillText(t.n,22,72);
    const rows=[[t.hp+'','л. с.'],[fmt1(t.fuel/t.prod),'л/га'],[fmt1(t.prod),'га/ч'],[(t.price/1e6).toLocaleString('ru-RU',{maximumFractionDigits:1}),'млн ₽']];
    rows.forEach((r,i)=>{x.fillStyle='#e8a01a';x.font='700 54px "JetBrains Mono",monospace';x.fillText(r[0],22,170+i*86);x.fillStyle='#9fb3a6';x.font='500 26px "Golos Text",sans-serif';x.fillText(r[1],24,200+i*86);});});
  M(rbox(.9,1.9,.14,.04),std('#1c1f22',.4,.5),g,-3.9,1.2,-3.2);
  const sp=M(new T.PlaneGeometry(.82,1.64),new T.MeshBasicMaterial({map:st,toneMapped:false}),g,-3.9,1.2,-3.12,false);
  // стойка с буклетами
  const rack=new T.Group();rack.position.set(3.8,.22,-3.4);g.add(rack);
  M(rbox(1,1.1,.4,.04),MAT.darkSteel(),rack,0,.55,0);
  for(let i=0;i<3;i++)for(let j=0;j<2;j++){const b=M(rbox(.26,.36,.03,.01),std(['#f2f0e8',cfg.color,'#e8a01a'][i],0,.6),rack,-.32+i*.32,.75-j*.42,.22);b.rotation.x=-.25;}
  const tag=makeLabel(1.9,{bg:'rgba(232,160,26,.95)',fg:'#3d2900',sub:'#3d2900'});tag.userData.draw('Буклет','+15');tag.position.set(3.8,2.1,-3.4);g.add(tag);bob.push(tag);
  const w=v=>{g.updateMatrixWorld(true);return g.localToWorld(new V3(v[0],0,v[1]));};
  const tw=w([0,-.4]);addCol(tw.x,tw.z,2.95);[-4.55,4.55].forEach(x=>{const p=w([x,4.6]);addCol(p.x,p.z,.45);});
  const sw=w([-3.9,-3.2]);addCol(sw.x,sw.z,.55);const rw=w([3.8,-3.4]);addCol(rw.x,rw.z,.65);
  inter.push({kind:'tractor',t:cfg.tractor,pos:tw,r:4.5});
  inter.push({kind:'visit',stand:cfg,pos:w([0,0]),r:5.6});
  inter.push({kind:'book',stand:cfg,pos:rw,r:1.9,tag});
  const S0={cfg,g,tr,turn,world:w,center:w([0,0]),front:w([0,6.5])};
  if(cfg.full){
    M(rbox(6.6,3.9,.3,.06),std('#1a1c1e',.5,.4),g,0,2.75,-4.65);
    VID.tex=AX.canvasTex(512,288,()=>{});
    M(new T.PlaneGeometry(6.2,3.5),new T.MeshBasicMaterial({map:VID.tex,toneMapped:false}),g,0,2.75,-4.49,false);
    [-2.2,0,2.2].forEach(x=>{const p=w([x,-4.65]);addCol(p.x,p.z,.5);});
    // киоск
    const k=new T.Group();k.position.set(3.5,.22,2.8);g.add(k);M(rbox(.8,1.2,.55,.12),brand,k,0,.6,0);
    const ks=AX.canvasTex(256,160,(x,w,h)=>{x.fillStyle='#e8a01a';x.fillRect(0,0,w,h);x.fillStyle='#3d2900';x.font='800 30px "Unbounded",sans-serif';x.fillText('ТЕСТ-',20,62);x.fillText('ДРАЙВ',20,104);x.font='600 20px "Golos Text",sans-serif';x.fillText('на вашем поле',20,140);});
    const kp=M(new T.PlaneGeometry(.72,.45),new T.MeshBasicMaterial({map:ks,toneMapped:false}),k,0,1.3,.12,false);kp.rotation.x=-.45;
    M(rbox(.78,.06,.5,.02),MAT.darkSteel(),k,0,1.24,0);
    const kp2=w([3.5,2.8]);addCol(kp2.x,kp2.z,.55);inter.push({kind:'kiosk',t:cfg.tractor,pos:kp2,r:2.1});
    const npc=AX.makeHuman({shirt:'#f2f0e8',pants:'#2b2b2b',skin:'#ecc4a2',hair:'#6b3d24',hat:'none',vest:false});npc.position.set(-3.4,.22,2.6);g.add(npc);
    const scarf=M(rbox(.18,.3,.05,.02),brand,npc,0,1.45,.13);
    const nl=makeLabel(2.6);nl.userData.draw('Ольга','консультант');nl.position.set(-3.4,2.65,2.6);g.add(nl);
    const np=w([-3.4,2.6]);addCol(np.x,np.z,.45);inter.push({kind:'faq',pos:np,r:2.2});S0.npc=npc;
  }
  // баннер под крышей
  const ban=AX.canvasTex(512,768,(x,w,h)=>{x.fillStyle=cfg.color;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.save();x.translate(w/2,h/2);x.rotate(-Math.PI/2);x.textAlign='center';x.textBaseline='middle';x.font='800 92px "Unbounded",sans-serif';x.fillText(cfg.brand.toUpperCase(),0,-40,700);x.font='600 40px "Golos Text",sans-serif';x.globalAlpha=.85;x.fillText('новинки сезона',0,70);x.restore();});
  const bm=new T.MeshStandardMaterial({map:ban,roughness:.8,side:T.DoubleSide});
  const bp=M(new T.PlaneGeometry(2.6,3.9),bm,g,0,8.2,-1,false);
  stands[cfg.tractor]=S0;
}
const VID={tex:null};
STANDS.forEach(buildStand);
// свободное место
(function(){const g=new T.Group();g.position.set(-16,0,-11);scene.add(g);
  const pg=new T.ExtrudeGeometry(AX.roundRectShape(10,10,1.1),{depth:.06,bevelEnabled:false,curveSegments:10});pg.rotateX(-Math.PI/2);M(pg,std('#e5e8e2',0,.8),g,0,0,0,false);
  const dash=new T.LineDashedMaterial({color:'#2e6a3e',dashSize:.6,gapSize:.4});const pts=[[-5,-5],[5,-5],[5,5],[-5,5],[-5,-5]].map(p=>new V3(p[0],.09,p[1]));
  const ln=new T.Line(new T.BufferGeometry().setFromPoints(pts),dash);ln.computeLineDistances();g.add(ln);
  const s=makeLabel(4.6,{bg:'rgba(255,255,255,.94)',fg:'#16231b',sub:'#2e6a3e'});s.userData.draw('Место для стенда','свободно');s.position.set(0,1.7,0);g.add(s);
  inter.push({kind:'free',pos:new V3(-16,0,-11),r:5});})();
// регистрация
(function(){const g=new T.Group();g.position.set(-27.4,0,4.2);scene.add(g);
  const dg=new T.ExtrudeGeometry(AX.roundRectShape(1.3,4.4,.5),{depth:1.05,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:3,curveSegments:10});dg.rotateX(-Math.PI/2);
  M(dg,MAT.white(),g,0,0,0);M(rbox(1.42,.08,4.52,.03),paint('#2e6a3e'),g,0,1.12,0);
  const sg=AX.canvasTex(1024,128,(x,w,h)=>{x.fillStyle='#2e6a3e';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='800 64px "Unbounded",sans-serif';x.textBaseline='middle';x.fillText('РЕГИСТРАЦИЯ',40,68);});
  const p=M(new T.PlaneGeometry(4.2,.52),new T.MeshBasicMaterial({map:sg,toneMapped:false}),g,.67,.6,0,false);p.rotation.y=Math.PI/2;
  const rc=AX.makeHuman({shirt:'#2e6a3e',pants:'#2b2b2b',skin:'#d9a982',hair:'#2a1d14',hat:'none'});rc.position.set(-1.1,0,0);rc.rotation.y=Math.PI/2;g.add(rc);
  [2.6,4.2,5.8].forEach(z=>addCol(-27.4,z,.9));inter.push({kind:'desk',pos:new V3(-26.4,0,4.2),r:2.4});})();
// кофе-поинт
(function(){const g=new T.Group();g.position.set(-24,0,-16.5);scene.add(g);
  M(rbox(4.2,1.05,1.1,.12),std('#6d4b2f',0,.6),g,0,.53,0);M(rbox(4.4,.07,1.25,.03),std('#e9e4d8',.1,.35),g,0,1.09,0);
  M(rbox(.7,.75,.5,.06),MAT.chrome(),g,-1.2,1.48,-.1);M(rbox(.5,.25,.3,.04),MAT.plastic(),g,-1.2,1.7,.14);
  for(let i=0;i<5;i++)cyl(.06,.05,.13,16,MAT.white(),g,.2+i*.3,1.19,.2);
  const l=makeLabel(3.2,{bg:'rgba(109,75,47,.95)'});l.userData.draw('Кофе-поинт','+5');l.position.set(0,2.6,0);g.add(l);
  const b=AX.makeHuman({shirt:'#222',pants:'#222',skin:'#e9c3a0',hat:'cap',hatColor:'#6d4b2f'});b.position.set(0,0,-1.0);g.add(b);
  [-1.6,0,1.6].forEach(x=>addCol(-24+x,-16.5,.8));inter.push({kind:'coffee',pos:new V3(-24,0,-15.2),r:2.2});})();
// квиз
(function(){const g=new T.Group();g.position.set(-6,0,-5.2);scene.add(g);
  M(rbox(1.1,1.9,.5,.16),paint('#e8a01a'),g,0,.95,0);
  const qt=AX.canvasTex(256,256,(x,w,h)=>{x.fillStyle='#14201a';x.fillRect(0,0,w,h);x.fillStyle='#e8a01a';x.font='800 120px "Unbounded",sans-serif';x.textAlign='center';x.fillText('?',w/2,150);x.fillStyle='#fff';x.font='700 30px "Golos Text",sans-serif';x.fillText('АГРО-КВИЗ',w/2,216);});
  const p=M(new T.PlaneGeometry(.86,.86),new T.MeshBasicMaterial({map:qt,toneMapped:false}),g,0,1.35,.26,false);
  addCol(-6,-5.2,.7);inter.push({kind:'quiz',pos:new V3(-6,0,-4.6),r:2.1});})();
// табло
let boardTex;
(function(){const g=new T.Group();g.position.set(-9,0,0);scene.add(g);
  M(rbox(.4,3.6,7.6,.08),std('#14181b',.5,.4),g,0,6.0,0);
  [-2.9,2.9].forEach(z=>cyl(.025,.025,5,6,MAT.steel(),g,0,10.3,z));
  boardTex=AX.canvasTex(1024,470,()=>{});
  [-1,1].forEach(sd=>{const p=M(new T.PlaneGeometry(7.3,3.35),new T.MeshBasicMaterial({map:boardTex,toneMapped:false}),g,sd*.21,6.0,0,false);p.rotation.y=sd*Math.PI/2;});})();
function drawBoard(){const {x}=boardTex.userData,w=1024,h=470;x.fillStyle='#0f1813';x.fillRect(0,0,w,h);
  x.fillStyle='#e8a01a';x.font='800 46px "Unbounded",sans-serif';x.textBaseline='alphabetic';x.fillText('ЛИДЕРЫ ДНЯ',40,72);
  x.fillStyle='#8fa596';x.font='500 24px "JetBrains Mono",monospace';x.textAlign='right';x.fillText(new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'}),w-40,70);x.textAlign='left';
  leaderRows().slice(0,5).forEach((f,i)=>{const y=130+i*52;if(f.me){x.fillStyle='rgba(232,160,26,.18)';x.fillRect(28,y-36,w-56,48);}
    x.fillStyle='#5e7566';x.font='700 28px "JetBrains Mono",monospace';x.fillText(String(i+1),44,y);
    x.fillStyle='#fff';x.font='600 30px "Golos Text",sans-serif';x.fillText(f.n,100,y,560);
    x.fillStyle='#8fa596';x.font='500 22px "Golos Text",sans-serif';x.fillText(f.r,680,y,180);
    x.fillStyle=f.me?'#e8a01a':'#fff';x.font='700 30px "JetBrains Mono",monospace';x.textAlign='right';x.fillText(fmt(f.p),w-44,y);x.textAlign='left';});
  x.fillStyle='#e8a01a';x.fillRect(0,h-78,w,78);x.fillStyle='#2b1d00';x.font='700 30px "Golos Text",sans-serif';
  const me=leaderRows().findIndex(f=>f.me)+1;x.fillText(`${S.nick} · ${fmt(S.points)} баллов · ур. ${level()} · место ${me}`,40,h-28,w-80);boardTex.needsUpdate=true;}
// ворота в поле
(function(){const gm=paint('#2e6a3e');[-3.7,3.7].forEach(z=>{M(rbox(.8,5.6,.8,.12),gm,scene,31.3,2.8,z);addCol(31.3,z,.6);});M(rbox(.8,1.3,8.2,.12),gm,scene,31.3,6.0,0);
  const sign=AX.canvasTex(1024,150,(x,w,h)=>{x.fillStyle='#2e6a3e';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='800 66px "Unbounded",sans-serif';x.textBaseline='middle';x.textAlign='center';x.fillText('ВЫХОД В ПОЛЕ',w/2,h/2+4);});
  const p=M(new T.PlaneGeometry(7.6,1.15),new T.MeshBasicMaterial({map:sign,toneMapped:false}),scene,30.88,6.0,0,false);p.rotation.y=-Math.PI/2;
  inter.push({kind:'gate',pos:new V3(29.4,0,0),r:3.6});})();
// трактор у ворот снаружи
(function(){const t=AX.makeTractor({color:'#a8291e',rim:'#e9e4d6',brand:'СтепьМаш',model:'СМ-2400'});t.position.set(44,0,-6);t.rotation.y=2.4;scene.add(t);})();
// маяк цели
const beacon=new T.Group();scene.add(beacon);
(function(){const m=new T.MeshBasicMaterial({color:new T.Color('#e8a01a').multiplyScalar(1.6),toneMapped:false,transparent:true,opacity:.95});
  const c=new T.Mesh(new T.ConeGeometry(.35,.7,24),m);c.rotation.x=Math.PI;c.position.y=3.4;beacon.add(c);
  const r=new T.Mesh(new T.TorusGeometry(.9,.05,8,48),m);r.rotation.x=Math.PI/2;r.position.y=.06;beacon.add(r);beacon.userData={c,r};})();

/* персонажи */
const player={obj:null,label:null,pos:new V3(-24,0,0),rot:Math.PI/2,vy:0,y:0};
function rebuildPlayer(){if(player.obj)scene.remove(player.obj);
  player.obj=ME.admin&&ELF.tpl?makeElf():AX.makeHuman({shirt:S.color,hat:S.hat,hatColor:S.hat==='cap'?'#f2f0e8':undefined,pants:'#2d3a4a'});player.obj.position.copy(player.pos);player.obj.rotation.y=player.rot;scene.add(player.obj);
  if(!player.label){player.label=makeLabel(2.6);scene.add(player.label);}player.label.userData.draw(S.nick,subLabel());$('#pDot').style.background=S.color;netTrack();}

/* ================= АДМИН В ИГРЕ ================= */
// Организатор, вошедший в admin.html в этом же браузере (общая сессия Supabase), ходит по выставке своим эльфом (models/elf.glb).
// Админ — тот, кому журнал отдаёт строки: это разрешено только пользователям из таблицы admins.
const ME={admin:false},ELF={tpl:null,clone:null,p:null};
const subLabel=()=>ME.admin?'Админ':'Ур. '+level();
function elfLoad(){if(!ELF.p)ELF.p=Promise.all([import('./vendor/jsm/GLTFLoader.js'),import('./vendor/jsm/SkeletonUtils.js')])
  .then(([g,su])=>new Promise((res,rej)=>new g.GLTFLoader().load('models/elf.glb?v=1',res,undefined,rej)).then(gl=>{
    gl.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.frustumCulled=false;const m=o.material;
      if(m.transparent){m.transparent=false;m.alphaTest=.5;m.depthWrite=true;m.side=T.DoubleSide;}}); // волосы, брови, ресницы
    ELF.tpl=gl.scene;ELF.clone=su.clone;return ELF;}));
  return ELF.p;}
// Анимации в модели нет: шаг собирается поворотом костей. Оси поворота пересчитываются из пространства модели в пространство кости,
// руки сначала опускаются из позы «А» вдоль тела.
function makeElf(){const g=new T.Group(),m=ELF.clone(ELF.tpl);g.add(m);m.updateMatrixWorld(true);
  const X=new V3(1,0,0),down=new V3(0,-1,0),qw=new T.Quaternion(),tq=new T.Quaternion(),R={};
  const bone=n=>m.getObjectByName(n)||m.getObjectByName(n.replace('.',''));
  ['upperleg01.L','upperleg01.R','lowerleg01.L','lowerleg01.R','upperarm01.L','upperarm01.R','lowerarm01.L','lowerarm01.R'].forEach(n=>{const b=bone(n);if(!b)return;
    b.getWorldQuaternion(qw);const base=b.quaternion.clone();
    if(n.startsWith('upperarm')){const dir=new V3(0,1,0).applyQuaternion(qw),ax=dir.clone().cross(down);const ang=Math.acos(clamp(dir.dot(down),-1,1))-.12;
      if(ax.lengthSq()>1e-6){ax.normalize().applyQuaternion(qw.clone().invert());const qd=new T.Quaternion().setFromAxisAngle(ax,ang);base.multiply(qd);qw.multiply(qd);}}
    R[n.replace('.','')]={b,base,ax:X.clone().applyQuaternion(qw.clone().invert()).normalize(),cur:0};});
  const set=(k,a)=>{const r=R[k];if(!r)return;r.cur+=(a-r.cur)*.3;r.b.quaternion.copy(r.base).multiply(tq.setFromAxisAngle(r.ax,r.cur));};
  let ph=0;
  g.userData.anim=(spd,dt)=>{ph+=dt*(spd>.05?spd*1.9:0);const a=spd>.05?Math.min(.75,.22+spd*.1):0,s=Math.sin(ph);
    set('upperleg01L',-s*a);set('upperleg01R',s*a);
    set('lowerleg01L',Math.max(0,-Math.sin(ph+.6))*a*1.3);set('lowerleg01R',Math.max(0,Math.sin(ph+.6))*a*1.3);
    set('upperarm01L',s*a*.7);set('upperarm01R',-s*a*.7);set('lowerarm01L',-.2-a*.3);set('lowerarm01R',-.2-a*.3);
    m.position.y=a?Math.abs(Math.cos(ph))*.035:0;};
  g.userData.anim(0,0);return g;}
async function adminInit(){let ok=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&/[?&]elf\b/.test(location.search); // локальный предпросмотр модели
  try{if(!ok&&TRK.on&&window.supabase){const sb=supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey);const {data}=await sb.auth.getSession();
      if(data.session){const r=await sb.from('events').select('at').limit(1);ok=!!(r.data&&r.data.length);}}
    if(!ok)return;await elfLoad();}catch(e){console.warn('Админ-модель не загрузилась',e);return;}
  ME.admin=true;rebuildPlayer();netTrack(true);$('#navAdmin').hidden=false;toast('Вы на выставке как <b>администратор</b>');}
/* ================= ОДНОВРЕМЕННАЯ ИГРА ================= */
// Supabase Realtime: присутствие (кто сейчас на выставке) и трансляция координат. Работает, если в config.js задан проект.
const NET={ch:null,on:false,peers:new Map(),synced:false,sent:{x:0,z:0,r:0,w:'',t:0},trT:0};
function netInit(){if(!TRK.on||!window.supabase)return;
  let sb;try{sb=supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey,{auth:{persistSession:false,autoRefreshToken:false}});}catch(e){return;}
  const ch=sb.channel('expo',{config:{broadcast:{self:false},presence:{key:S.vid}}});NET.ch=ch;
  ch.on('presence',{event:'sync'},netSync)
    .on('presence',{event:'join'},({key,newPresences})=>{const m=newPresences[0];if(NET.synced&&key!==S.vid&&!NET.peers.has(key)&&m)toast('<b>'+esc(m.n)+'</b> зашёл на выставку');})
    .on('broadcast',{event:'r'},({payload:m})=>{const p=NET.peers.get(m.i);if(p&&REACT[m.e])say(p,m.e);})
    .on('broadcast',{event:'p'},({payload:m})=>{const p=NET.peers.get(m.i);if(!p)return;p.tgt.set(m.x,m.y||0,m.z);p.trot=m.r;p.w=m.w;
      if(!p.seen||p.cur.distanceTo(p.tgt)>6){p.cur.copy(p.tgt);p.rot=m.r;}p.seen=true;})
    .subscribe(st=>{NET.on=st==='SUBSCRIBED';if(NET.on){NET.sent.t=0;netTrack(true);}});
  setInterval(netSend,160);}
function netTrack(now){if(!NET.on||!S.registered)return;clearTimeout(NET.trT);
  NET.trT=setTimeout(()=>NET.ch.track({n:S.nick,c:S.color,h:S.hat,lv:level(),a:ME.admin?1:0}),now?0:600);}
function netSync(){const st=NET.ch.presenceState(),seen=new Set();
  for(const k in st){const m=st[k][0];if(k===S.vid||!m)continue;seen.add(k);let p=NET.peers.get(k);
    if(!p){p={cur:new V3(),tgt:new V3(),rot:0,trot:0,w:'hall',seen:false,look:'',a:null,l:makeLabel(2.4)};scene.add(p.l);NET.peers.set(k,p);}
    if(m.a&&!ELF.tpl)elfLoad().then(()=>NET.ch&&netSync()).catch(()=>{}); // админ ходит эльфом: модель грузится один раз
    const look=m.a&&ELF.tpl?'elf':m.c+'|'+m.h;
    if(p.look!==look){if(p.a)scene.remove(p.a);p.a=look==='elf'?makeElf():AX.makeHuman({shirt:m.c,hat:m.h,hatColor:m.h==='cap'?'#f2f0e8':undefined,pants:'#2d3a4a'});scene.add(p.a);p.look=look;}
    p.l.userData.draw(m.n,m.a?'Админ':'Ур. '+m.lv);p.c=m.c;}
  NET.peers.forEach((p,k)=>{if(!seen.has(k)){scene.remove(p.a,p.l);if(p.bub)scene.remove(p.bub);NET.peers.delete(k);}});
  NET.synced=true;$('#pOnline').hidden=false;$('#pOnline').textContent='Сейчас на выставке: '+(NET.peers.size+1);}
function netSend(){if(!NET.on||!S.registered)return;const now=performance.now(),w=$('#drive').hidden?'hall':'field',s=NET.sent;
  const moved=Math.hypot(player.pos.x-s.x,player.pos.z-s.z)>.05||Math.abs(player.rot-s.r)>.05||player.y>0||w!==s.w;
  if(!moved&&now-s.t<3000)return;s.x=player.pos.x;s.z=player.pos.z;s.r=player.rot;s.w=w;s.t=now;
  NET.ch.send({type:'broadcast',event:'p',payload:{i:S.vid,x:+player.pos.x.toFixed(2),z:+player.pos.z.toFixed(2),y:+player.y.toFixed(2),r:+player.rot.toFixed(2),w}});}
function netUpdate(dt){NET.peers.forEach(p=>{if(!p.a)return;const vis=p.seen&&p.w!=='field';p.a.visible=p.l.visible=vis;if(!vis)return;
  const px=p.cur.x,pz=p.cur.z;p.cur.lerp(p.tgt,1-Math.pow(.0005,dt));const spd=Math.hypot(p.cur.x-px,p.cur.z-pz)/Math.max(dt,1e-3);
  p.rot=lerpA(p.rot,p.trot,Math.min(1,dt*10));p.a.position.copy(p.cur);p.a.rotation.y=p.rot;AX.walk(p.a,p.cur.y>.01||spd<.3?0:spd,dt);
  p.l.position.set(p.cur.x,2.45+p.cur.y,p.cur.z);bubTick(p,p.cur.x,3.2+p.cur.y,p.cur.z,true,dt);});}

const BOTN=[['Иван','3'],['Марина','2'],['Алексей','5'],['Светлана','1'],['Пётр','4'],['Дарья','2'],['Николай','3'],['Руслан','1']];
const bots=BOTN.map((b,i)=>{const cols=['#7b5aa6','#3d6db0','#e07b22','#2f3442','#c4445a','#3f8a4f','#d8b13a','#5d7a8c'];
  const a=AX.makeHuman({shirt:cols[i],hat:['cap','helmet','none'][i%3],skin:['#e3b48f','#c99572','#f0c9a8'][i%3],hair:['#3a2a1e','#6b4a2a','#1e1a18'][i%3],pants:['#2d3a4a','#3d3a34','#26303a'][i%3]});
  a.position.set(-22+i*6.5,0,(Math.random()-.5)*2.4);scene.add(a);
  const l=makeLabel(1.9,{bg:'rgba(255,255,255,.88)',fg:'#16231b',sub:'#2e6a3e'});l.userData.draw(b[0],'ур.'+b[1]);scene.add(l);
  return {a,l,n:b[0],lv:+b[1],xp:0,q:[{wait:Math.random()*4}],act:'walk',away:false,spd:1.1+Math.random()*.7};});

/* поведение ботов */
// Каждый бот выбирает занятие (стенд, квиз, табло, кофе, скамейка, поле, разговор, прогулка) и идёт к нему через центральный проход.
// Любое занятие начинается и заканчивается в проходе, поэтому боты не ходят сквозь стенды.
const SW=(c,l)=>{const s=Math.sin(c.rot),k=Math.cos(c.rot);return [c.x+l[0]*k+l[1]*s,c.z-l[0]*s+l[1]*k];};
const RING=[[-4.3,-.6],[-2.2,3.3],[2.2,3.4],[4.4,-1]],RNB=[[1],[0,2],[1,3],[2]]; // точки вокруг трактора по кругу и их соседи
const rn=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
function botPlan(b){const q=[],go=p=>q.push({to:p}),wait=(s,f)=>q.push({wait:s,face:f}),aisle=x=>go([x,rn(-1.3,1.3)]),k=Math.random();
  if(k<.42){b.act='stand';const c=pick(STANDS),E=SW(c,[0,5.8]),C=SW(c,[0,-.4]);aisle(E[0]);go(E);
    let i=pick([1,2]);const path=[i];go(SW(c,RING[i]));wait(rn(5,10),c.full&&i===1&&Math.random()<.5?SW(c,[-3.4,2.6]):C);
    if(Math.random()<.65){i=pick(RNB[i]);path.push(i);go(SW(c,RING[i]));wait(rn(4,8),C);}
    if(i===3&&Math.random()<.7){go(SW(c,[3,-2.2]));wait(rn(2,4),SW(c,[3.8,-3.4]));go(SW(c,RING[3]));}
    for(let j=path.length-2;j>=0;j--)go(SW(c,RING[path[j]]));go(E);aisle(E[0]);}
  else if(k<.54){b.act='quiz';aisle(-6);go([rn(-6.6,-5.4),-3.7]);wait(rn(6,12),[-6,-5.2]);aisle(-6);}
  else if(k<.61){b.act='board';const p=[rn(-12.5,-10.5),rn(-1.4,1.4)];go(p);wait(rn(4,8),[-9.3,p[1]]);}
  else if(k<.70){b.act='coffee';aisle(-22);go([-22,-6]);go([rn(-25,-23),-14.3]);wait(rn(10,20),[-24,-16.5]);go([-22,-6]);aisle(-22);}
  else if(k<.76){b.act='bench';const x=pick([-10,18]),s=pick([-1,1]);aisle(x);go([x+rn(-.8,.8),s*6.7]);wait(rn(8,16),[x,s*2]);aisle(x);}
  else if(k<.83){b.act='field';aisle(26);go([29.4,0]);go([34,0]);q.push({away:rn(20,45)});go([29.4,0]);aisle(26);}
  else if(k<.93&&botChat(b))return;
  else{b.act='walk';aisle(rn(-24,26));wait(rn(2,6));}
  b.q=q;}
function botChat(b){const o=bots.find(x=>x!==b&&x.act==='walk'&&!x.away&&Math.abs(x.a.position.z)<2);if(!o)return false;
  const m=[(b.a.position.x+o.a.position.x)/2,rn(-1,1)],t=rn(8,14);b.act=o.act='chat';
  b.q=[{to:[m[0]-.65,m[1]]},{wait:t,face:[m[0]+.65,m[1]]}];o.q=[{to:[m[0]+.65,m[1]]},{wait:t+rn(0,2),face:[m[0]-.65,m[1]]}];return true;}
function botTick(b,dt){const s=b.q[0],P=b.a.position;
  if(!s){if(b.act==='stand'||b.act==='quiz'){b.xp++;if(b.xp%3===0)b.l.userData.draw(b.n,'ур.'+(++b.lv));}botPlan(b);return;}
  if(s.to){const dx=s.to[0]-P.x,dz=s.to[1]-P.z,l=Math.hypot(dx,dz);
    if(l<.25){b.q.shift();return;}const st=Math.min(l,b.spd*dt);P.x+=dx/l*st;P.z+=dz/l*st;b.a.rotation.y=lerpA(b.a.rotation.y,Math.atan2(dx,dz),Math.min(1,dt*8));AX.walk(b.a,b.spd,dt);}
  else if(s.away!==undefined){b.away=true;s.away-=dt;if(s.away<=0){b.away=false;b.q.shift();}}
  else{if(!s.said){s.said=true;const ch=b.act==='chat'?.85:b.act==='stand'?.3:0;if(Math.random()<ch)setTimeout(()=>say(b,pick(b.act==='chat'?[0,5,1,4]:[1,3,2])),rn(300,2500));}
    if(s.face)b.a.rotation.y=lerpA(b.a.rotation.y,Math.atan2(s.face[0]-P.x,s.face[1]-P.z),Math.min(1,dt*5));AX.walk(b.a,0,dt);s.wait-=dt;if(s.wait<=0)b.q.shift();}}


/* ================= РЕАКЦИИ ================= */
// Пузырь с эмодзи над головой на 4 секунды. Свои реакции уходят другим игрокам, боты реагируют сами в разговоре и у стендов.
const REACT=[['👋','Привет!'],['👍','Класс'],['🔥','Огонь'],['🚜','Хочу такой'],['❓','Есть вопрос'],['😂','Ха-ха']];
function makeBubble(){const c=document.createElement('canvas');c.width=384;c.height=128;const x=c.getContext('2d'),tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  const spr=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));spr.scale.set(2.1,.7,1);spr.visible=false;scene.add(spr);
  spr.userData.draw=r=>{x.clearRect(0,0,384,128);x.font='700 40px "Golos Text",sans-serif';const tw=Math.min(372,x.measureText(r[1]).width+110),X=(384-tw)/2;
    x.fillStyle='#fff';x.beginPath();x.roundRect(X,8,tw,88,26);x.moveTo(184,96);x.lineTo(192,118);x.lineTo(204,96);x.fill();
    x.textBaseline='middle';x.font='48px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';x.fillText(r[0],X+18,54);
    x.font='700 40px "Golos Text",sans-serif';x.fillStyle='#16231b';x.fillText(r[1],X+84,56,tw-100);tex.needsUpdate=true;};
  return spr;}
function say(h,i){if(!h.bub)h.bub=makeBubble();h.bub.userData.draw(REACT[i]);h.bubT=4;}
function bubTick(h,x,y,z,vis,dt){if(!h.bub||!(h.bubT>0))return;h.bubT-=dt;h.bub.visible=vis&&h.bubT>0;h.bub.position.set(x,y,z);h.bub.material.opacity=Math.min(1,h.bubT/.5);}
let reactT=0;
function react(i){const now=performance.now();if(now-reactT<1500)return;reactT=now;say(player,i);sfx.click();
  if(NET.on&&S.registered)NET.ch.send({type:'broadcast',event:'r',payload:{i:S.vid,e:i}});track('Реакция '+REACT[i][0]+' '+REACT[i][1]);}
function sheetReact(){openSheet('react','Реакции',`<p class="muted" style="margin:0">Появится над вашей головой, её увидят все в павильоне.</p><div class="list">${REACT.map((r,i)=>`<button class="qbtn" data-i="${i}" data-key="${i+1}">${r[0]} ${esc(r[1])}</button>`).join('')}</div>`,
  b=>b.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>{closeSheet();react(+x.dataset.i);}));}
const burstSys=new Smoke(scene,'#e8a01a');
function burst(){if(!player.obj)return;const p=player.pos.clone();p.y=1.8;for(let i=0;i<8;i++)burstSys.emit(p,400,.003);}
const showSmoke=new Smoke(scene);

/* видеостена */
function drawVideo(t){if(!VID.tex)return;const {x}=VID.tex.userData,w=512,h=288,hz=104;
  const g=x.createLinearGradient(0,0,0,hz);g.addColorStop(0,'#6fa8cf');g.addColorStop(1,'#d8ecf2');x.fillStyle=g;x.fillRect(0,0,w,hz);
  x.fillStyle='#4f7a36';for(let i=0;i<12;i++){x.beginPath();x.arc(i*48+((t*6)%48),hz,22,Math.PI,0);x.fill();}
  const px=((t*48)%(w+160))-80;x.fillStyle='#c9b46c';x.fillRect(0,hz,w,h-hz);
  x.fillStyle='#5a3d25';x.fillRect(0,hz,Math.max(0,px-40),h-hz);
  x.strokeStyle='rgba(30,20,10,.35)';for(let i=0;i<12;i++){const y=hz+6+i*i*1.3+i*5;x.beginPath();x.moveTo(0,y);x.lineTo(Math.max(0,px-40),y);x.stroke();}
  const ty=200;x.fillStyle='#a8291e';x.fillRect(px-60,ty-30,76,28);x.fillRect(px+16,ty-20,32,18);x.fillStyle='#9fcbe0';x.fillRect(px-52,ty-62,40,32);x.fillStyle='#f2f2ee';x.fillRect(px-58,ty-68,52,7);
  x.fillStyle='#1c1c1c';x.beginPath();x.arc(px-40,ty+4,24,0,7);x.fill();x.beginPath();x.arc(px+32,ty+8,15,0,7);x.fill();
  x.fillStyle='#e9e4d6';x.beginPath();x.arc(px-40,ty+4,11,0,7);x.fill();x.beginPath();x.arc(px+32,ty+8,7,0,7);x.fill();
  x.fillStyle='#555';x.fillRect(px-110,ty-6,46,10);
  x.fillStyle='rgba(120,90,50,.3)';for(let i=0;i<6;i++){x.beginPath();x.arc(px-120-i*18,ty-8+Math.sin(t*6+i)*6,10-i,0,7);x.fill();}
  x.fillStyle='rgba(18,28,22,.75)';x.fillRect(0,h-44,w,44);x.fillStyle='#fff';x.font='600 20px "Golos Text",sans-serif';x.fillText('СМ-2400 · вспашка, 3,6 га/ч',16,h-16);
  x.fillStyle='#e8a01a';x.font='700 18px "JetBrains Mono",monospace';x.textAlign='right';x.fillText('7,2 л/га',w-16,h-16);x.textAlign='left';
  x.fillStyle='#e23';x.beginPath();x.arc(w-20,20,6,0,7);x.fill();VID.tex.needsUpdate=true;}

/* ================= ОСМОТР ТРАКТОРА ================= */
const INS={id:null,a:.8,d:10,h:2.6,state:{}};
const HOTS=[
  {k:'hood',p:[1.6,2.3,0],n:'Двигатель',v:t=>t.hp+' л. с.'},
  {k:'cab',p:[-.7,3.5,0],n:'Кабина',v:()=>'автопилот ГЛОНАСС'},
  {k:'wheel',p:[-1.25,2.1,1.55],n:'Шины',v:t=>t.tire},
  {k:'wt',p:[3.25,1.5,0],n:'Балласт',v:()=>'900 кг'},
  {k:'hitch',p:[-2.3,1.5,0],n:'Навеска',v:t=>t.lift}
];
function startInspect(id){const s=stands[id];if(!s)return;INS.id=id;INS.a=Math.atan2(5,8);INS.d=10;INS.h=2.8;camMode='inspect';closeSheet();
  const sp=spinners.find(x=>x.id===id);sp.on=false;
  setWorldHud(false);$('#inspect').hidden=false;$('#insTitle').textContent=EXPO[id].brand+' '+EXPO[id].n+' · осмотр';
  const U=s.tr.userData;INS.state={hood:!!U.hoodOpen,door:!!U.doorOpen,lights:!!U.lightsOn,engine:!!U.engineOn,beacon:!!U.beacon.on};
  renderInspect();award('inspect_'+id,10,'Осмотр '+EXPO[id].n);
  $('#hotspots').innerHTML=HOTS.map(h=>`<div class="hs" data-h="${h.k}"><b>${h.n}</b><span>${esc(h.v(EXPO[id]))}</span></div>`).join('');}
function renderInspect(){const s=INS.state,B=[['hood','1','Капот'],['door','2','Дверь'],['lights','3','Фары'],['engine','4','Двигатель'],['beacon','5','Маячок']];
  $('#insBtns').innerHTML=B.map(b=>`<button class="btn ${s[b[0]]?'on':''}" data-a="${b[0]}" data-key="${b[1]}">${b[2]}</button>`).join('')+`<span class="break"></span><button class="btn go" data-a="drive" data-key="E">Тест-драйв</button><button class="btn out" data-a="exit" data-key="Escape">Выйти</button>`;
  $('#insBtns').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>inspectAct(b.dataset.a));decorate($('#insBtns'));}
function inspectAct(a){const tr=stands[INS.id].tr,U=tr.userData,s=INS.state;
  if(a==='exit')return stopInspect();if(a==='drive'){const id=INS.id;stopInspect();return openDrive(id);}
  s[a]=!s[a];if(a==='hood')U.hoodOpen=s.hood;if(a==='door')U.doorOpen=s.door;if(a==='lights')U.setLights(s.lights);if(a==='beacon')U.setBeacon(s.beacon);
  if(a==='engine'){U.engineOn=s.engine;engineSound(s.engine);if(s.engine)toast('Двигатель запущен: <b>'+EXPO[INS.id].hp+' л. с.</b>');}
  renderInspect();}
function stopInspect(){if(!INS.id)return;const s=stands[INS.id],U=s.tr.userData;U.engineOn=false;engineSound(false);spinners.find(x=>x.id===INS.id).on=true;INS.id=null;
  $('#inspect').hidden=true;$('#hotspots').innerHTML='';camMode='follow';setWorldHud(true);}
const tmpV=new V3();
function updateHotspots(){if(!INS.id)return;const s=stands[INS.id];const rect=canvas.getBoundingClientRect();
  $('#hotspots').querySelectorAll('.hs').forEach(el=>{const h=HOTS.find(q=>q.k===el.dataset.h);tmpV.set(h.p[0],h.p[1],h.p[2]);s.tr.localToWorld(tmpV);
    const cam=tmpV.clone().applyMatrix4(camera.matrixWorldInverse);tmpV.project(camera);const vis=cam.z<0&&Math.abs(tmpV.x)<1.05&&Math.abs(tmpV.y)<1.05;
    el.style.display=vis?'block':'none';if(vis){el.style.left=((tmpV.x+1)/2*rect.width)+'px';el.style.top=((1-tmpV.y)/2*rect.height)+'px';}});}

/* ================= ПОЛЕ (3D) ================= */
const F={r:null,scene:null,cam:null,ready:false,dirty:true,tr:null,trKey:'',plow:null,smoke:null,comp:null,paint:null,k:1,cw:0,ch:0,s:1,
  phase:'setup',ex:'sm2400',t0:0,R:null,lead:false,camMode:'chase',camA:0,camD:1,pos:new V3(),head:0,v:0,steer:0,plowDown:false,grid:null,last:null,stats:null,lastPaint:0};
function fieldInit(){
  if(F.ready)return;F.ready=true;
  F.r=mkRenderer($('#driveCanvas'));F.scene=new T.Scene();F.scene.environment=AX.makeEnvironment(F.r);
  F.scene.add(skyDome());F.scene.fog=new T.Fog('#cfe5ef',120,420);
  F.cam=new T.PerspectiveCamera(50,1,.1,1200);
  F.scene.add(new T.HemisphereLight('#ffffff','#7d8a5a',.45));
  F.sun=new T.DirectionalLight('#fff1d8',2.2);F.sun.castShadow=true;Object.assign(F.sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:120});F.sun.shadow.camera.updateProjectionMatrix();F.sun.shadow.mapSize.set(2048,2048);F.sun.shadow.bias=-.0004;F.scene.add(F.sun,F.sun.target);
  const gt=rowsTexture();gt.repeat.set(80,80);const g=M(new T.PlaneGeometry(1600,1600),new T.MeshStandardMaterial({map:gt,roughness:1}),F.scene,0,-.05,0,false);g.rotation.x=-Math.PI/2;
  addTrees(F.scene,220,70,320,(x,z)=>Math.abs(x)<64&&Math.abs(z)<64);
  F.smoke=new Smoke(F.scene);F.dust=new Smoke(F.scene,'#9b8458');
}
function fieldBuild(){
  const img=field.img;F.k=80/Math.max(img.width,img.height);
  const s=Math.min(1,1024/Math.max(img.width,img.height));F.s=s;F.cw=Math.round(img.width*s);F.ch=Math.round(img.height*s);
  if(!F.comp){F.compTex=AX.canvasTex(F.cw,F.ch,()=>{});F.comp=F.compTex.userData;}
  F.comp.c.width=F.cw;F.comp.c.height=F.ch;F.compTex.dispose();
  F.paint=document.createElement('canvas');F.paint.width=F.cw;F.paint.height=F.ch;
  if(F.plane){F.scene.remove(F.plane);F.plane.geometry.dispose();}
  F.plane=M(new T.PlaneGeometry(img.width*F.k,img.height*F.k),new T.MeshStandardMaterial({map:F.compTex,roughness:.95}),F.scene,0,.02,0,false);F.plane.rotation.x=-Math.PI/2;F.plane.receiveShadow=true;
  if(F.border)F.scene.remove(F.border);
  const P=polyPts();const pts=P.map(p=>toWorld(p[0],p[1]).setY(.15));pts.push(pts[0].clone());
  F.border=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts,false,'catmullrom',0),pts.length*12,.12,6,false),new T.MeshBasicMaterial({color:new T.Color('#ffd166').multiplyScalar(1.3),toneMapped:false}));F.scene.add(F.border);
  // сетка покрытия
  let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;P.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});
  F.bb={minX,maxX,minY,maxY};const N=70,cells=[];const cs=Math.max(maxX-minX,maxY-minY)/N;
  for(let y=minY+cs/2;y<maxY;y+=cs)for(let x=minX+cs/2;x<maxX;x+=cs)if(inPoly(x,y,P))cells.push({x,y,c:0});
  F.grid={cells,cs};F.dirty=false;
}
const polyPts=()=>field.poly.length>2?field.poly:[[0,0],[field.img.width,0],[field.img.width,field.img.height],[0,field.img.height]];
function inPoly(x,y,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
const toWorld=(ix,iy)=>new V3((ix-field.img.width/2)*F.k,0,(iy-field.img.height/2)*F.k);
const toImg=v=>[v.x/F.k+field.img.width/2,v.z/F.k+field.img.height/2];
const STAGES=[{n:'Вспашка',c:'#4e3420'},{n:'Посев',c:'#7a5a37'},{n:'Уход и защита',c:'#4d8b36'},{n:'Уборка',c:'#d6ae3a'}];
function compose(autoSt,autoSp){
  const x=F.comp.x,s=F.s,P=polyPts();x.setTransform(1,0,0,1,0,0);x.drawImage(field.img,0,0,F.cw,F.ch);x.setTransform(s,0,0,s,0,0);
  const path=()=>{x.beginPath();P.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();};
  x.save();x.beginPath();x.rect(0,0,field.img.width,field.img.height);P.slice().reverse().forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.closePath();x.fillStyle='rgba(30,40,25,.28)';x.fill('evenodd');x.restore();
  x.save();path();x.clip();
  if(autoSt!=null&&autoSt>=0){const b=F.bb,rows=ROWS,rowH=(b.maxY-b.minY)/rows;
    if(autoSt>0){x.globalAlpha=.9;x.fillStyle=STAGES[autoSt-1].c;x.fillRect(b.minX,b.minY,b.maxX-b.minX,b.maxY-b.minY);}
    x.globalAlpha=.9;x.fillStyle=STAGES[autoSt].c;const done=autoSp*rows,full=Math.floor(done),part=done-full;
    for(let i=0;i<full;i++)x.fillRect(b.minX,b.minY+i*rowH,b.maxX-b.minX,rowH+.6);
    if(full<rows){const dir=full%2?-1:1,w=(b.maxX-b.minX)*part,x0=dir>0?b.minX:b.maxX-w;x.fillRect(x0,b.minY+full*rowH,w,rowH+.6);}
    x.globalAlpha=1;
    if(autoSt>=1){x.strokeStyle=autoSt===2?'rgba(150,210,110,.55)':'rgba(255,240,200,.16)';x.lineWidth=1.2/s;for(let i=0;i<rows*3;i++){const y=b.minY+(i+.5)*rowH/3;x.beginPath();x.moveTo(b.minX,y);x.lineTo(b.maxX,y);x.stroke();}}}
  else{x.setTransform(1,0,0,1,0,0);x.drawImage(F.paint,0,0);x.setTransform(s,0,0,s,0,0);}
  x.restore();F.compTex.needsUpdate=true;}
const ROWS=8;
function fieldTractor(kind){
  const key=kind==='own'?'own_'+S.farm.tractor:F.ex;if(F.trKey===key)return;F.trKey=key;
  if(F.tr)F.scene.remove(F.tr);
  if(kind==='own'){const o=OWN[S.farm.tractor];F.tr=AX.makeTractor({color:o.color,rim:'#cfd2d4',roof:'paint',old:true});}
  else{const t=EXPO[F.ex];F.tr=AX.makeTractor({color:t.color,rim:t.rim,brand:t.brand,model:t.n});}
  F.plow=AX.makePlow(kind==='own'?'#555':EXPO[F.ex].color);F.plow.position.set(-3.35,0,0);F.tr.add(F.plow);
  F.tr.userData.engineOn=false;F.scene.add(F.tr);}
function resizeDrive(){if(!F.r)return;const c=$('#driveCanvas'),r=c.getBoundingClientRect();F.r.setSize(Math.max(1,r.width),Math.max(1,r.height),false);F.cam.aspect=r.width/Math.max(1,r.height);F.cam.updateProjectionMatrix();}
function openDrive(ex){
  if(ex)F.ex=ex;closeSheet();if(INS.id)stopInspect();
  $('#drive').hidden=false;fieldInit();if(F.dirty||!F.plane)fieldBuild();resizeDrive();
  F.phase='setup';F.lead=false;F.R=compare(F.ex);fieldTractor('ex');compose(-1,0);
  const c=toWorld((F.bb.minX+F.bb.maxX)/2,(F.bb.minY+F.bb.maxY)/2);F.pos.copy(toWorld(F.bb.minX,F.bb.minY+(F.bb.maxY-F.bb.minY)/ROWS/2));F.head=0;F.center=c;F.camA=-2.3;F.camD=1;F.camMode='orbit';
  $('#driveTitle').textContent='Поле: '+S.farm.name;$('#driveSub').textContent=fmt1(S.farm.area)+' га · '+CROPS[S.farm.crop].n;
  drawDriveSide();}
function closeDrive(){$('#drive').hidden=true;engineSound(false);F.phase='setup';}
$('#driveX').onclick=closeDrive;
function pickHTML(dis){return `<div class="pick">${Object.entries(EXPO).map(([k,t],i)=>`<button data-ex="${k}" data-key="${i+1}" aria-pressed="${k===F.ex}" ${dis?'disabled':''}><b>${t.n}</b><span>${t.brand}</span></button>`).join('')}</div>`;}
function bindPick(s){s.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>{F.ex=b.dataset.ex;F.R=compare(F.ex);F.phase='setup';F.lead=false;fieldTractor('ex');compose(-1,0);drawDriveSide();});}
function drawDriveSide(){
  const R=F.R=compare(F.ex),s=$('#driveSide'),ph=F.phase;let keys='';
  if(ph==='setup'){
    s.innerHTML=`<div class="eyebrow">Ваше поле · ${fmt1(S.farm.area)} га</div>
    <p style="margin:0;line-height:1.5">Выберите технику экспонента. Можно прогнать весь сезон в сравнении с вашей техникой или самому сесть за руль и вспахать поле.</p>${pickHTML(false)}
    <div class="spec"><div>Ваша техника</div><div>${esc(R.own.n)} × ${R.a.count}</div><div>Новая техника</div><div>${esc(R.ex.n)} × ${R.b.count}</div><div>Окно полевых работ</div><div>${CROPS[S.farm.crop].win} дней</div></div>
    <button class="btn signal" id="dRun" data-key="Enter">Сезон: сравнить с моей техникой</button>
    <button class="btn" id="dMan" data-key="M">Сам за рулём: вспашка</button>
    <button class="btn ghost" id="dSat" data-key="P">Поменять поле</button>`;
    s.querySelector('#dRun').onclick=()=>startAuto();s.querySelector('#dMan').onclick=()=>startManual();
    s.querySelector('#dSat').onclick=()=>{closeDrive();openFieldTool(()=>openDrive());};bindPick(s);
    keys=`<span class="tag"><kbd>←</kbd><kbd>→</kbd> вращать</span><span class="tag"><kbd>↑</kbd><kbd>↓</kbd> масштаб</span><span class="tag"><kbd>V</kbd> вид</span>`;
  }else if(ph==='old'||ph==='gap'||ph==='new'){
    s.innerHTML=`<div class="eyebrow">${ph==='new'?'Работает новая техника':'Работает ваша техника'}</div>
    <div class="live"><div><div class="k">Моточасы</div><div class="v" id="lvH">0</div></div><div><div class="k">Топливо, л</div><div class="v" id="lvF">0</div></div><div><div class="k">Затраты</div><div class="v" id="lvC">0</div></div></div>
    <div id="lvPrev" class="small muted"></div><button class="btn ghost" id="dFast" data-key="Space">Ускорить ×2</button><button class="btn ghost" id="dSkip" data-key="Enter">Сразу к итогам</button>`;
    s.querySelector('#dFast').onclick=()=>{F.speed=F.speed===2?1:2;};s.querySelector('#dSkip').onclick=()=>finishAuto();
    keys=`<span class="tag"><kbd>←</kbd><kbd>→</kbd> вращать</span><span class="tag"><kbd>V</kbd> вид</span>`;
  }else if(ph==='autoDone'){
    const a=R.a,b=R.b;
    const rows=[['Машин',a.count,b.count],['Моточасы за сезон',fmt(a.hours),fmt(b.hours)],['Дней полевых работ',fmt1(a.days),fmt1(b.days)],['Топливо, л',fmt(a.liters),fmt(b.liters)],['Затраты на работы',money(a.cost),money(b.cost)],['Потери урожая из-за сроков',fmt1(a.loss)+'%',fmt1(b.loss)+'%'],['Выручка с урожая',money(a.revenue),money(b.revenue)]].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td class="new">${r[2]}</td></tr>`).join('');
    const pb=R.payback===Infinity?'не окупается':(fmt1(R.payback)+' '+(R.payback<5?'года':'лет'));
    s.innerHTML=`<div class="eyebrow">Итог сезона</div>
    <div class="big"><div><div class="k">Выгода в год</div><div class="v">${money(R.benefit)}</div></div><div><div class="k">Окупаемость</div><div class="v">${pb}</div></div></div>
    <div class="chart"><div class="eyebrow" style="margin-bottom:6px">Накопленный эффект, млн ₽</div>${cashflowSVG(R)}</div>
    <div class="chart"><div class="eyebrow" style="margin-bottom:6px">Затраты на работы за сезон</div>${costSVG(R)}</div>
    <div style="overflow-x:auto"><table class="cmp"><thead><tr><th></th><th>${esc(R.own.n)}</th><th>${esc(R.ex.n)}</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="small muted" style="margin:0;line-height:1.5">Вложения: ${R.b.count} × ${money(R.ex.price)} минус трейд-ин ${R.a.count} × ${money(R.own.trade)} = ${money(R.capex)}. Дизель ${FUEL} ₽/л, механизатор ${WAGE} ₽/ч, смена ${SHIFT} ч. Цифры экспонентов демонстрационные.</p>
    ${S.leads[F.ex]?`<div class="note">Заявка на ${esc(R.ex.n)} сохранена в демо-режиме. Экспонент её не получит: отправка появится в рабочей версии.</div>`:F.lead?`<form id="dLead" class="stepcard on"><h3>Запросить предложение у ${esc(R.ex.brand)} <span class="pill">демо</span></h3>
      <label class="f">Имя<input id="lName" required value="${esc(S.nick)}"></label><label class="f">Телефон<input id="lPhone" type="tel" required placeholder="+7 900 000-00-00"></label>
      <button class="btn signal" type="submit" data-key="Enter">Сохранить заявку</button><span class="small muted">Это демо: заявка остаётся в вашем браузере, экспоненту она не уходит, а телефон никуда не отправляется. В рабочей версии экспонент получит заявку сразу.</span></form>`
      :`<button class="btn signal" id="dLeadBtn" data-key="L">Запросить предложение</button>`}
    ${pickHTML(false)}
    <div class="list"><button class="btn" id="dAgain" data-key="R">Сезон ещё раз</button><button class="btn" id="dMan" data-key="M">Сам за рулём</button><button class="btn ghost" id="dBack" data-key="Backspace">В павильон</button></div>`;
    const lb=s.querySelector('#dLeadBtn');if(lb)lb.onclick=()=>{F.lead=true;drawDriveSide();setTimeout(()=>{const p=$('#lPhone');if(p)p.focus();},50);};
    const lf=s.querySelector('#dLead');if(lf)lf.onsubmit=e=>{e.preventDefault();S.leads[F.ex]=Date.now();save();award('lead_'+F.ex,40,'Заявка: '+R.ex.brand+' '+R.ex.n);drawDriveSide();};
    s.querySelector('#dAgain').onclick=()=>startAuto();s.querySelector('#dMan').onclick=()=>startManual();s.querySelector('#dBack').onclick=closeDrive;bindPick(s);
    keys=`<span class="tag"><kbd>←</kbd><kbd>→</kbd> вращать</span><span class="tag"><kbd>V</kbd> вид</span>`;
  }else if(ph==='manual'){
    s.innerHTML=`<div class="eyebrow">Сам за рулём · ${esc(EXPO[F.ex].brand+' '+EXPO[F.ex].n)}</div>
    <p style="margin:0;line-height:1.5">Опустите плуг и вспашите поле внутри жёлтой границы. Старайтесь не ходить по уже вспаханному: перекрытия — это лишнее топливо.</p>
    <div class="keys">${[['W','S','газ, тормоз'],['A','D','руль'],['Space','','плуг вверх/вниз'],['Shift','','быстрее'],['V','','вид камеры']].map(k=>`<span><kbd>${k[0]}</kbd>${k[1]?`<kbd>${k[1]}</kbd>`:''}</span><span>${k[2]}</span>`).join('')}</div>
    <div class="live"><div><div class="k">Вспахано</div><div class="v" id="mvC">0%</div></div><div><div class="k">Перекрытия</div><div class="v" id="mvO">0%</div></div><div><div class="k">Время</div><div class="v" id="mvT">0:00</div></div></div>
    <button class="btn signal" id="mEnd" data-key="Enter">Завершить вспашку</button>`;
    s.querySelector('#mEnd').onclick=()=>finishManual();
    keys=`<span class="tag"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> вести</span><span class="tag"><kbd>Space</kbd> плуг</span><span class="tag"><kbd>V</kbd> вид</span>`;
  }else if(ph==='manualDone'){
    const st=F.stats,t=EXPO[F.ex];const full=S.farm.area*t.fuel/t.prod;const waste=full*st.ovl/100,auto=full*.02;
    s.innerHTML=`<div class="eyebrow">Итог вспашки</div>
    <div class="big"><div><div class="k">Вспахано</div><div class="v">${fmt(st.cov)}%</div></div><div><div class="k">Перекрытия</div><div class="v">${fmt(st.ovl)}%</div></div></div>
    <p style="margin:0;line-height:1.5">На всём поле в ${fmt1(S.farm.area)} га такие перекрытия — это около <b>${fmt(waste)} л</b> лишнего дизеля за одну вспашку (${money(waste*FUEL)}). Автопилот ГЛОНАСС у ${esc(t.n)} держит перекрытия около 2% — <b>${fmt(auto)} л</b>.</p>
    <div class="list"><button class="btn" id="mAgain" data-key="M">Ещё раз</button><button class="btn signal" id="dRun" data-key="Enter">Сезон: сравнить с моей техникой</button><button class="btn ghost" id="dBack" data-key="Backspace">В павильон</button></div>`;
    s.querySelector('#mAgain').onclick=()=>startManual();s.querySelector('#dRun').onclick=()=>startAuto();s.querySelector('#dBack').onclick=closeDrive;
  }
  $('#driveKeys').innerHTML=keys;decorate(s);
}
function startAuto(){F.phase='old';F.t0=performance.now();F.el=0;F.speed=1;fieldTractor('own');F.tr.userData.engineOn=true;engineSound(true);F.camMode=F.camMode==='top'?'top':'orbit';drawDriveSide();}
function finishAuto(){const R=F.R;F.phase='autoDone';S.drives++;
  if(!S.best||R.benefit>S.best.benefit)S.best={benefit:R.benefit,ex:F.ex};
  logEvent('Тест-драйв '+R.ex.n+': выгода '+money(R.benefit));award('drive_'+F.ex,50,'Тест-драйв '+R.ex.n);save();checkQuests();updateHUD();
  compose(3,1);F.tr.userData.engineOn=false;engineSound(false);drawDriveSide();}
function startManual(){F.phase='manual';fieldTractor('ex');F.trKey='';fieldTractor('ex');
  const x=F.paint.getContext('2d');x.clearRect(0,0,F.cw,F.ch);F.grid.cells.forEach(c=>c.c=0);compose(null);
  const b=F.bb;F.pos.copy(toWorld(b.minX-12/F.k,(b.minY+b.maxY)/2));F.head=0;F.v=0;F.steer=0;F.plowDown=false;F.last=null;F.mt0=performance.now();F.covered=0;F.over=0;F.camMode='chase';
  F.tr.userData.engineOn=true;engineSound(true);drawDriveSide();}
function finishManual(){const n=F.grid.cells.length;const cov=F.covered/n*100,ovl=F.covered?F.over/(F.covered+F.over)*100:0;
  F.stats={cov,ovl,time:(performance.now()-F.mt0)/1000};S.plow={cov,ovl};track('Вспашка: покрыто '+fmt(cov)+'%, перекрытия '+fmt(ovl)+'%');F.phase='manualDone';engineSound(false);F.tr.userData.engineOn=false;
  award('manual',30,'Сам за рулём');if(cov>=90)award('plow90',40,'Вспашка 90%+');save();checkQuests();drawDriveSide();}
const fkeys={};
function fieldTick(now,dt){
  const R=F.R,ph=F.phase;let pr=0,st=-1,sp=0;
  if(ph==='old'||ph==='new'||ph==='gap'){
    const Told=20,T=ph==='new'?clamp(Told*R.b.days/Math.max(.01,R.a.days),6,Told):Told;
    if(ph!=='gap')F.el+=dt*F.speed;pr=clamp(F.el/T,0,1);
    if(ph==='gap'){pr=1;if(now-F.t0>1100){F.phase='new';F.el=0;fieldTractor('ex');F.tr.userData.engineOn=true;drawDriveSide();}}
    else if(pr>=1){if(ph==='old'){F.phase='gap';F.t0=now;}else{finishAuto();return fieldRender(dt);}}
    st=Math.min(3,Math.floor(pr*4));sp=pr*4-st;if(ph==='gap'){st=3;sp=1;}
    // позиция трактора по рядам
    const b=F.bb,rowH=(b.maxY-b.minY)/ROWS,done=sp*ROWS,full=Math.min(ROWS-1,Math.floor(done)),part=done-Math.floor(done),dir=full%2?-1:1;
    const ix=dir>0?b.minX+(b.maxX-b.minX)*part:b.maxX-(b.maxX-b.minX)*part,iy=b.minY+full*rowH+rowH/2;
    const np=toWorld(ix,iy);const d=np.distanceTo(F.pos);F.pos.lerp(np,ph==='gap'?0:1);F.head=lerpA(F.head,dir>0?0:Math.PI,Math.min(1,dt*10));
    if(F.tr)F.tr.userData.spin(Math.min(d,3));
    if(now-F.lastPaint>50||ph==='gap'){compose(st,sp);F.lastPaint=now;}
    const c=ph==='new'?R.b:R.a;const h=$('#lvH');if(h){h.textContent=fmt(c.hours*pr);$('#lvF').textContent=fmt(c.liters*pr);$('#lvC').textContent=money(c.cost*pr);
      $('#lvPrev').innerHTML=ph==='new'?`Ваша техника за сезон: ${fmt(R.a.hours)} моточасов, ${fmt(R.a.liters)} л, ${money(R.a.cost)}.`:'Следом этот же сезон пройдёт техника экспонента.';}
    const m=ph==='new'?R.ex:R.own;
    setDriveHud(`<span class="tag">${ph==='new'?'Новая':'Ваша'} техника · <b>${esc((ph==='new'?m.brand+' ':'')+m.n)} × ${c.count}</b></span><span class="tag">Операция: <b>${STAGES[st].n}</b></span><span class="tag">День <b>${fmt(c.days*pr)}</b> из ${fmt(c.days)}</span><span class="tag">Ускоренная съёмка${F.speed>1?' <b>×2</b>':''}</span>`);
    if(F.plow)F.plow.position.y+=((0)-F.plow.position.y)*.2;
    $('#gauge').hidden=true;
  }else if(ph==='manual'){
    const up=fkeys.KeyW||fkeys.ArrowUp,dn=fkeys.KeyS||fkeys.ArrowDown,lt=fkeys.KeyA,rt=fkeys.KeyD,boost=fkeys.ShiftLeft||fkeys.ShiftRight;
    const vmax=boost?20:13;
    if(up)F.v=Math.min(vmax,F.v+dt*7);else if(dn)F.v=Math.max(-5,F.v-dt*12);else F.v*=Math.pow(.35,dt);
    if(F.plowDown&&F.v>8)F.v-=dt*4;
    F.steer+=(((lt?1:0)-(rt?1:0))*.55-F.steer)*Math.min(1,dt*5);
    F.head+=F.v*Math.tan(F.steer)/3.0*dt;
    F.pos.x+=Math.cos(F.head)*F.v*dt;F.pos.z-=Math.sin(F.head)*F.v*dt;
    const lim=55;F.pos.x=clamp(F.pos.x,-lim,lim);F.pos.z=clamp(F.pos.z,-lim,lim);
    F.tr.userData.spin(F.v*dt);F.tr.userData.steer.forEach(p=>p.rotation.y=F.steer);
    if(F.plow)F.plow.position.y+=((F.plowDown?0:.55)-F.plow.position.y)*Math.min(1,dt*6);
    engineRev(Math.abs(F.v)/20);
    // вспашка
    const pp=F.pos.clone().add(new V3(-Math.cos(F.head)*3.6,0,Math.sin(F.head)*3.6));const ip=toImg(pp);
    if(F.plowDown&&Math.abs(F.v)>.5){const x=F.paint.getContext('2d'),sw=8/F.k*F.s;x.save();x.beginPath();polyPts().forEach((p,i)=>i?x.lineTo(p[0]*F.s,p[1]*F.s):x.moveTo(p[0]*F.s,p[1]*F.s));x.closePath();x.clip();
      x.strokeStyle='#4e3420';x.globalAlpha=.92;x.lineCap='round';x.lineWidth=sw;x.beginPath();const l=F.last||ip;x.moveTo(l[0]*F.s,l[1]*F.s);x.lineTo(ip[0]*F.s,ip[1]*F.s);x.stroke();
      x.globalAlpha=.25;x.strokeStyle='#2c1d12';x.lineWidth=1;for(let k=-3;k<=3;k++){const o=k*sw/7;x.beginPath();x.moveTo(l[0]*F.s+Math.sin(F.head)*o,l[1]*F.s+Math.cos(F.head)*o);x.lineTo(ip[0]*F.s+Math.sin(F.head)*o,ip[1]*F.s+Math.cos(F.head)*o);x.stroke();}x.restore();
      const r=4/F.k,g=F.grid;if(!F.lastCov||Math.hypot(ip[0]-F.lastCov[0],ip[1]-F.lastCov[1])>g.cs*.5){
        g.cells.forEach(c=>{if(Math.abs(c.x-ip[0])<r&&Math.abs(c.y-ip[1])<r&&Math.hypot(c.x-ip[0],c.y-ip[1])<r){if(c.c===0){c.c=1;c.t=now;F.covered++;}else if(now-c.t>1800){F.over++;c.t=now;}else c.t=now;}});F.lastCov=ip;}
      F.last=ip;if(now-F.lastPaint>60){compose(null);F.lastPaint=now;}
      F.dust.emit(pp.clone().setY(.6),30,dt);}
    else F.last=null;
    const n=F.grid.cells.length,cov=F.covered/n*100,ovl=F.covered?F.over/(F.covered+F.over)*100:0;
    const mc=$('#mvC');if(mc){mc.textContent=fmt(cov)+'%';$('#mvO').textContent=fmt(ovl)+'%';const tt=(performance.now()-F.mt0)/1000;$('#mvT').textContent=Math.floor(tt/60)+':'+String(Math.floor(tt%60)).padStart(2,'0');}
    $('#gauge').hidden=false;$('#gauge').innerHTML=`<div class="k">Скорость</div><div class="v">${fmt(Math.abs(F.v))} <small style="font-size:13px">км/ч</small></div><div class="k">Плуг: ${F.plowDown?'опущен':'поднят'}</div><div class="bar"><i style="width:${cov}%"></i></div><div class="k">вспахано ${fmt(cov)}%</div>`;
    setDriveHud(`<span class="tag">${esc(EXPO[F.ex].brand+' '+EXPO[F.ex].n)} · <b>${F.plowDown?'пашет':'плуг поднят'}</b></span><span class="tag"><kbd>Space</kbd> плуг</span>`);
    if(cov>=96)finishManual();
  }else{$('#gauge').hidden=true;
    if(ph==='setup')setDriveHud(`<span class="tag">Ваше поле · <b>${fmt1(S.farm.area)} га</b></span><span class="tag">${esc(CROPS[S.farm.crop].n)}</span><span class="tag">Условный масштаб</span>`);
    else if(ph==='autoDone')setDriveHud(`<span class="tag">Сезон завершён</span><span class="tag">Урожай: <b>${fmt(R.b.tons)} т</b> против ${fmt(R.a.tons)} т</span>`);
    else setDriveHud(`<span class="tag">Вспашка завершена</span>`);}
  fieldRender(dt);
}
function setDriveHud(h){const d=$('#driveHud');if(d.dataset.h!==h){d.innerHTML=h;d.dataset.h=h;}}
function fieldRender(dt){
  if(F.tr){F.tr.position.copy(F.pos);F.tr.rotation.y=F.head;F.tr.userData.update(dt,performance.now()/1000);
    if(F.tr.userData.engineOn){const e=new V3();F.tr.userData.exhaust.getWorldPosition(e);F.smoke.emit(e,F.phase==='manual'?10+Math.abs(F.v):14,dt);}}
  F.smoke.update(dt);F.dust.update(dt);
  if(fkeys.ArrowLeft&&F.phase!=='manual')F.camA-=dt*1.4;if(fkeys.ArrowRight&&F.phase!=='manual')F.camA+=dt*1.4;
  if(F.phase!=='manual'){if(fkeys.ArrowUp)F.camD=clamp(F.camD-dt*.8,.4,1.8);if(fkeys.ArrowDown)F.camD=clamp(F.camD+dt*.8,.4,1.8);}
  const fw=new V3(Math.cos(F.head),0,-Math.sin(F.head));let cp,lt;
  if(F.camMode==='top'){cp=F.pos.clone().add(new V3(0,95*F.camD,1));lt=F.pos.clone();}
  else if(F.camMode==='chase'||F.phase==='manual'&&F.camMode!=='orbit'){cp=F.pos.clone().addScaledVector(fw,-15*F.camD).add(new V3(0,7.5*F.camD,0));lt=F.pos.clone().addScaledVector(fw,6);}
  else{const c=F.center.clone().lerp(F.pos,.6);cp=c.clone().add(new V3(Math.cos(F.camA)*55*F.camD,40*F.camD,Math.sin(F.camA)*55*F.camD));lt=c;}
  F.cam.position.lerp(cp,1-Math.pow(.02,dt));F.cam.userData.lt=(F.cam.userData.lt||lt.clone()).lerp(lt,1-Math.pow(.02,dt));F.cam.lookAt(F.cam.userData.lt);
  F.sun.position.copy(F.pos).add(new V3(18,40,14));F.sun.target.position.copy(F.pos);
  F.r.render(F.scene,F.cam);
}

/* ================= ДАШБОРД ================= */
function barsSVG(items,opt){const w=520,rowH=34,lw=opt.lw||130,h=items.length*rowH+8,max=opt.max||Math.max(...items.map(i=>i.v));
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(opt.label)}">${items.map((it,i)=>{const y=i*rowH+4,bw=(w-lw-90)*it.v/max;
    return `<text x="0" y="${y+20}" font-size="13" fill="#16231b" font-family="Golos Text,sans-serif">${esc(it.n)}</text><rect x="${lw}" y="${y+6}" width="${w-lw-90}" height="18" rx="4" fill="#e8eee4"/><rect x="${lw}" y="${y+6}" width="${Math.max(2,bw)}" height="18" rx="4" fill="${it.c||'#2e6a3e'}"/><text x="${w}" y="${y+20}" text-anchor="end" font-size="13" font-weight="700" fill="#16231b" font-family="JetBrains Mono,monospace">${esc(it.t)}</text>`;}).join('')}</svg>`;}
function sparkSVG(vals){const w=520,h=150,pl=44,pr=10,pt=12,pb=24,max=Math.ceil(Math.max(...vals)/400)*400;
  const X=i=>pl+(w-pl-pr)*i/(vals.length-1),Y=v=>pt+(h-pt-pb)*(1-v/max);const line=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
  let g='';for(let k=0;k<=4;k++){const v=max*k/4;g+=`<line x1="${pl}" x2="${w-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="#d5ddd2"/><text x="${pl-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="#7d8b81" font-family="JetBrains Mono,monospace">${fmt(v)}</text>`;}
  ['1','','','','5','','','','','10','','','','14'].forEach((d,i)=>{if(d)g+=`<text x="${X(i)}" y="${h-6}" text-anchor="middle" font-size="11" fill="#7d8b81" font-family="JetBrains Mono,monospace">${d} окт</text>`;});
  const L=vals.length-1;return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Посещения по дням">${g}<path d="${line} L${X(L)} ${Y(0)} L${X(0)} ${Y(0)} Z" fill="#2e6a3e" opacity=".12"/><path d="${line}" fill="none" stroke="#2e6a3e" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${X(L)}" cy="${Y(vals[L])}" r="5" fill="#e8a01a" stroke="#fff" stroke-width="2"/></svg>`;}
function heatSVG(){const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],hrs=[8,10,12,14,16,18,20,22];const w=520,h=200,pl=34,pt=8,cw=(w-pl)/hrs.length,ch=(h-pt-22)/7;let s='';
  days.forEach((d,i)=>{s+=`<text x="0" y="${pt+i*ch+ch*.65}" font-size="11" fill="#4b5b50" font-family="Golos Text,sans-serif">${d}</text>`;hrs.forEach((hh,j)=>{const v=Math.max(.05,Math.sin((j+1)/hrs.length*Math.PI)*.8+(i>4?.2:0)+((i*7+j*3)%5)/20);s+=`<rect x="${pl+j*cw+1}" y="${pt+i*ch+1}" width="${cw-2}" height="${ch-2}" rx="3" fill="#2e6a3e" opacity="${Math.min(1,v).toFixed(2)}"/>`;});});
  hrs.forEach((hh,j)=>s+=`<text x="${pl+j*cw+cw/2}" y="${h-6}" text-anchor="middle" font-size="11" fill="#7d8b81" font-family="JetBrains Mono,monospace">${hh}:00</text>`);return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Активность по часам">${s}</svg>`;}
function openDash(){closeSheet();$('#dash').hidden=false;
  const mine={visits:Object.keys(S.visited).length,drives:S.drives,leads:Object.keys(S.leads).length};const visits=12480+mine.visits,drives=1932+mine.drives,leads=214+mine.leads;
  $('#dashBody').innerHTML=`<p class="muted" style="margin:0;max-width:65ch;line-height:1.5">Так экспонент будет видеть свои показатели. Цифры выдуманы для примера, к ним вживую добавляются ваши действия в этой сессии. Настоящая статистика выставки есть у организатора.</p>
  <div class="kpis"><div class="kpi"><div class="k">Посещения стендов</div><div class="v">${fmt(visits)}</div><div class="d">+18% к прошлой неделе</div></div>
    <div class="kpi"><div class="k">Тест-драйвы</div><div class="v">${fmt(drives)}</div><div class="d">${fmt1(drives/visits*100)}% посетителей</div></div>
    <div class="kpi"><div class="k">Заявки экспонентам</div><div class="v">${fmt(leads)}</div><div class="d">${fmt1(leads/drives*100)}% после тест-драйва</div></div>
    <div class="kpi"><div class="k">Средняя расчётная выгода</div><div class="v">1,9 млн ₽</div><div class="d">в год на хозяйство</div></div></div>
  <div class="cards"><div class="card"><h3>Воронка: посещение → тест-драйв → заявка</h3>${barsSVG([{n:'Посещения',v:visits,t:fmt(visits)},{n:'Тест-драйвы',v:drives,t:fmt(drives),c:'#e8a01a'},{n:'Заявки',v:leads,t:fmt(leads),c:'#a8291e'}],{label:'Воронка',lw:110})}</div>
    <div class="card"><h3>Посещения по дням</h3>${sparkSVG([420,510,480,690,820,760,880,940,1010,1180,1090,1240,1320,1140])}</div>
    <div class="card"><h3>Популярные модели в тест-драйвах</h3>${barsSVG([{n:'СМ-2400',v:41,t:'41%',c:'#a8291e'},{n:'ПП-300',v:27,t:'27%',c:'#24529a'},{n:'КТ-180',v:22,t:'22%',c:'#2f6f33'},{n:'Прочие',v:10,t:'10%',c:'#7d8b81'}],{label:'Модели',lw:90,max:50})}</div>
    <div class="card"><h3>Когда посетители на выставке</h3>${heatSVG()}</div></div>
  <div class="card"><h3>Стенды</h3><div class="tbl"><table><thead><tr><th>Экспонент</th><th>Посещения</th><th>Время на стенде</th><th>Осмотры 3D</th><th>Тест-драйвы</th><th>Заявки</th></tr></thead><tbody>
    <tr><td>СтепьМаш</td><td>${fmt(5420+(S.visited.sm?1:0))}</td><td>7:40</td><td>${fmt(2310+(S.awards.inspect_sm2400?1:0))}</td><td>${fmt(1046+(S.awards.drive_sm2400?1:0))}</td><td>${fmt(121+(S.leads.sm2400?1:0))}</td></tr>
    <tr><td>Колос-Техника</td><td>${fmt(3870+(S.visited.kt?1:0))}</td><td>4:10</td><td>${fmt(1180+(S.awards.inspect_kt180?1:0))}</td><td>${fmt(462+(S.awards.drive_kt180?1:0))}</td><td>${fmt(51+(S.leads.kt180?1:0))}</td></tr>
    <tr><td>ПолеПро</td><td>${fmt(3190+(S.visited.pp?1:0))}</td><td>3:55</td><td>${fmt(960+(S.awards.inspect_pp300?1:0))}</td><td>${fmt(424+(S.awards.drive_pp300?1:0))}</td><td>${fmt(42+(S.leads.pp300?1:0))}</td></tr></tbody></table></div></div>
  <div class="card"><h3>Эта сессия: ${esc(S.nick)} · ${esc(S.farm.name)}</h3><div class="row" style="margin-bottom:12px"><span class="pill">${fmt(S.points)} баллов</span><span class="pill">стендов: ${mine.visits}</span><span class="pill">тест-драйвов: ${mine.drives}</span><span class="pill">заявок: ${mine.leads}</span></div>
    ${S.events.length?`<ul class="log">${S.events.slice().reverse().map(e=>`<li><time>${new Date(e.t).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time><span>${esc(e.x)}</span></li>`).join('')}</ul>`:'<p class="muted" style="margin:0">Пройдитесь по павильону — каждое действие появится здесь.</p>'}</div>`;}
$('#dashX').onclick=()=>{$('#dash').hidden=true;};

/* ================= УПРАВЛЕНИЕ ================= */
const keys={};let yaw=0,pitch=.32,dist=7.5,camMode='intro',joyV={x:0,y:0},lastManual=0,mmOn=true,camView=0;
const CAMS=[{d:7.5,p:.32,n:'за спиной'},{d:14,p:.55,n:'издалека'},{d:30,p:1.25,n:'сверху'}];
function handleEscape(){
  if(!$('#fieldtool').hidden)return closeFieldTool();
  if(!$('#drive').hidden){if(F.phase==='manual')return finishManual();return closeDrive();}
  if(!$('#dash').hidden){$('#dash').hidden=true;return;}
  if(!$('#sheet').hidden)return closeSheet();
  if(INS.id)return stopInspect();
}
addEventListener('keydown',e=>{
  audio();const k=keyName(e),inInput=e.target.matches('input,select,textarea');
  if(k==='Escape'){e.preventDefault();if(inInput)e.target.blur();return handleEscape();}
  if(inInput&&k!=='Enter')return;
  if(inInput&&k==='Enter'&&e.target.closest('form'))return;
  const driveOpen=!$('#drive').hidden;
  if(driveOpen){fkeys[e.code]=true;
    if(F.phase==='manual'){if(e.code==='Space'){e.preventDefault();F.plowDown=!F.plowDown;sfx.click();return;}if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();return;}}
    if(e.code==='KeyV'){F.camMode=F.camMode==='top'?(F.phase==='manual'?'chase':'orbit'):F.camMode==='orbit'?'chase':'top';return;}
    if(e.code.startsWith('Arrow'))e.preventDefault();}
  const layer=topLayer();
  if(layer&&pressIn(layer,k)){e.preventDefault();return;}
  if(layer&&layer.id!=='sheet'&&layer.id!=='inspect')return;
  if(INS.id){keys[e.code]=true;if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();return;}
  if(camMode!=='follow')return;
  keys[e.code]=true;if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();
  if(e.repeat)return;
  if(k==='E'||k==='Enter'){if(curInter){doInter(curInter);}return;}
  if(k==='I'){const t=nearestTractor();if(t)startInspect(t);else toast('Подойдите к трактору на стенде');return;}
  if(k==='Space'){if(player.y<=0.001)player.vy=5.4;return;}
  const map={Q:'quests',R:'leaders',T:'teleport',B:'bonuses',F:'farm',G:'dash',H:'help',Z:'react'};
  if(map[k]){NAV[map[k]]();return;}
  if(k==='C'){camView=(camView+1)%CAMS.length;dist=CAMS[camView].d;pitch=CAMS[camView].p;toast('Камера: <b>'+CAMS[camView].n+'</b>');return;}
  if(k==='M'){mmOn=!mmOn;$('#minimap').hidden=!mmOn;return;}
  if(k==='N'){S.sound=!S.sound;save();if(!S.sound)engineSound(false);toast('Звук: <b>'+(S.sound?'вкл':'выкл')+'</b>');return;}
});
addEventListener('keyup',e=>{keys[e.code]=false;fkeys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;for(const k in fkeys)fkeys[k]=false;});
let drag=null;
canvas.addEventListener('pointerdown',e=>{audio();drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=(e.clientX-drag.x),dy=(e.clientY-drag.y);
  if(INS.id){INS.a+=dx*.006;INS.h=clamp(INS.h+dy*.01,.8,6);}else{yaw+=dx*.006;pitch=clamp(pitch+dy*.004,.08,1.35);}lastManual=performance.now();drag.x=e.clientX;drag.y=e.clientY;});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{if(INS.id)INS.d=clamp(INS.d+e.deltaY*.01,5,18);else dist=clamp(dist+e.deltaY*.01,4,32);e.preventDefault();},{passive:false});
$('#driveCanvas').addEventListener('wheel',e=>{F.camD=clamp(F.camD+e.deltaY*.001,.4,1.8);e.preventDefault();},{passive:false});
const joy=$('#joy'),knob=$('#joyKnob');let jp=null;
joy.addEventListener('pointerdown',e=>{jp=e.pointerId;joy.setPointerCapture(e.pointerId);jmove(e);});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jp)jmove(e);});
const jend=()=>{jp=null;joyV={x:0,y:0};knob.style.transform='';};joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
function jmove(e){const r=joy.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width/2),y=(e.clientY-r.top-r.height/2)/(r.height/2);const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}joyV={x,y};knob.style.transform=`translate(${x*34}px,${y*34}px)`;}
$('#promptBtn').onclick=()=>{if(curInter)doInter(curInter);};

const blocked=()=>!$('#reg').hidden||!$('#drive').hidden||!$('#dash').hidden||!$('#fieldtool').hidden;
let curInter=null;
function nearestTractor(){let best=null,bd=7;inter.forEach(it=>{if(it.kind!=='tractor')return;const d=Math.hypot(player.pos.x-it.pos.x,player.pos.z-it.pos.z);if(d<bd){bd=d;best=it.t;}});return best;}
function doInter(it){
  if(it.kind==='tractor')sheetTractor(it.t);else if(it.kind==='kiosk')openDrive(it.t);else if(it.kind==='faq')sheetFAQ();
  else if(it.kind==='desk')sheetFarm();else if(it.kind==='gate')openDrive();else if(it.kind==='quiz')sheetQuiz();
  else if(it.kind==='coffee'){if(!award('coffee_'+new Date().toLocaleDateString('sv'),5,'Кофе за счёт выставки'))toast('Ещё чашку? Баллы за кофе — один раз в день');}
  else if(it.kind==='free')toast('Это место для нового экспонента. В рабочей версии — <b>бронь стенда</b> из личного кабинета');
  else if(it.kind==='book'){if(award('book_'+it.stand.id,15,'Буклет '+it.stand.brand))it.tag.visible=false;else toast('Буклет этого стенда уже у вас');}
  curInter=null;
}
function promptFor(it){
  if(it.kind==='tractor'){const t=EXPO[it.t];return [t.brand+' '+t.n,`${t.hp} л.с. · ${fmt1(t.fuel/t.prod)} л/га · ${money(t.price)}`,'Карточка','<span class="tag" style="background:var(--tint);color:var(--ink)"><kbd>I</kbd> осмотр</span>'];}
  if(it.kind==='kiosk')return ['Тест-драйв на моём поле',fmt1(S.farm.area)+' га · '+OWN[S.farm.tractor].n+' × '+S.farm.count,'Начать'];
  if(it.kind==='faq')return ['Консультант Ольга','Цены, лизинг, трейд-ин, сервис','Спросить'];
  if(it.kind==='desk')return ['Стойка регистрации','Данные хозяйства и поле со спутника','Моя ферма'];
  if(it.kind==='gate')return ['Выход в поле','Сезон или вспашка на вашем поле','В поле'];
  if(it.kind==='quiz')return ['Агро-квиз',Object.keys(S.quiz).length+' из '+QUIZ.length+' вопросов · +10 за верный','Играть'];
  if(it.kind==='coffee')return ['Кофе-поинт','Как на офлайн-выставке, только без очереди','Взять кофе'];
  if(it.kind==='free')return ['Свободное место','Здесь может стоять ваш стенд','Подробнее'];
  if(it.kind==='book')return S.awards['book_'+it.stand.id]?['Буклет '+it.stand.brand,'уже собран','Открыть']:['Буклет '+it.stand.brand,'+15 баллов','Собрать'];
}

/* цель квеста */
function objective(){
  const un=STANDS.filter(s=>!S.visited[s.id]);
  if(un.length){let b=null,bd=1e9;un.forEach(s=>{const c=stands[s.tractor].front;const d=c.distanceTo(player.pos);if(d<bd){bd=d;b=s;}});return {t:`Посетите стенд «${b.brand}»`,p:stands[b.tractor].center};}
  if(!S.awards.q_eco_found){const nv=Object.keys(EXPO).find(k=>!S.viewed[k]);const id=nv||'sm2400';return {t:nv?`Сравните расход: карточка ${EXPO[id].n}`:'Отметьте самый экономичный трактор в его карточке',p:stands[id].center};}
  if(S.drives<1)return {t:'Пройдите тест-драйв на своём поле',p:inter.find(i=>i.kind==='kiosk').pos};
  if(Object.keys(S.quiz).length<QUIZ.length)return {t:'Ответьте на все вопросы агро-квиза',p:inter.find(i=>i.kind==='quiz').pos};
  if(!S.plow)return {t:'Сядьте за руль: вспашка у ворот в поле',p:inter.find(i=>i.kind==='gate').pos};
  return null;
}
let objCache=null,objT=0;

/* мини-карта */
const mm=$('#mm'),mx=mm.getContext('2d');
function drawMinimap(){const w=mm.width,h=mm.height,X=x=>8+(x+HX)/(HX*2)*(w-16),Z=z=>8+(z+HZ)/(HZ*2)*(h-16),s=(w-16)/(HX*2);
  mx.clearRect(0,0,w,h);mx.fillStyle='#eef1ea';mx.fillRect(0,0,w,h);mx.strokeStyle='#9aa69c';mx.lineWidth=3;mx.strokeRect(X(-HX),Z(-HZ),HX*2*s,HZ*2*s);
  mx.fillStyle='#dfe6dc';mx.fillRect(X(-HX),Z(-2.6),HX*2*s,5.2*s);
  STANDS.forEach(c=>{mx.fillStyle=c.color;mx.globalAlpha=S.visited[c.id]?.55:.95;mx.fillRect(X(c.x-5),Z(c.z-5),10*s,10*s);mx.globalAlpha=1;mx.fillStyle='#fff';mx.font='700 18px "Golos Text",sans-serif';mx.textAlign='center';mx.fillText(c.brand.split('-')[0],X(c.x),Z(c.z)+6);});
  mx.setLineDash([6,5]);mx.strokeStyle='#2e6a3e';mx.strokeRect(X(-21),Z(-16),10*s,10*s);mx.setLineDash([]);
  [['#2e6a3e',-27.4,4.2,'Р'],['#6d4b2f',-24,-16.5,'К'],['#e8a01a',-6,-5.2,'?'],['#2e6a3e',31,0,'→']].forEach(p=>{mx.fillStyle=p[0];mx.beginPath();mx.arc(X(p[1]),Z(p[2]),11,0,7);mx.fill();mx.fillStyle='#fff';mx.font='800 13px "Golos Text",sans-serif';mx.fillText(p[3],X(p[1]),Z(p[2])+5);});
  mx.fillStyle='#14181b';mx.fillRect(X(-9.3),Z(-3.8),.6*s,7.6*s);
  bots.forEach(b=>{if(!b.a.visible)return;mx.fillStyle='#7d8b81';mx.beginPath();mx.arc(X(b.a.position.x),Z(b.a.position.z),4,0,7);mx.fill();});
  NET.peers.forEach(p=>{if(!p.seen||p.w==='field')return;mx.fillStyle=p.c;mx.beginPath();mx.arc(X(p.cur.x),Z(p.cur.z),7,0,7);mx.fill();mx.strokeStyle='#fff';mx.lineWidth=2.5;mx.stroke();});
  if(objCache){const t=performance.now()/300;mx.strokeStyle='#e8a01a';mx.lineWidth=3;mx.beginPath();mx.arc(X(objCache.p.x),Z(objCache.p.z),10+Math.sin(t)*3,0,7);mx.stroke();}
  mx.save();mx.translate(X(player.pos.x),Z(player.pos.z));mx.rotate(-player.rot+Math.PI);mx.fillStyle='#16231b';mx.beginPath();mx.moveTo(0,-12);mx.lineTo(8,9);mx.lineTo(0,4);mx.lineTo(-8,9);mx.closePath();mx.fill();mx.strokeStyle='#fff';mx.lineWidth=2;mx.stroke();mx.restore();
  // направление камеры
  mx.save();mx.translate(X(player.pos.x),Z(player.pos.z));mx.rotate(yaw);mx.fillStyle='rgba(232,160,26,.22)';mx.beginPath();mx.moveTo(0,0);mx.arc(0,0,46,-.5,.5);mx.closePath();mx.fill();mx.restore();
}

function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(!$('#drive').hidden)resizeDrive();}
addEventListener('resize',resize);

let last=performance.now(),vt=0,mmT=0;
function tick(now){
  requestAnimationFrame(tick);const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!$('#drive').hidden){fieldTick(now,dt);return;}
  if(!$('#dash').hidden||!$('#fieldtool').hidden)return;
  const t=now/1000;
  let mvx=0,mvz=0;const canMove=camMode==='follow'&&!blocked();
  if(canMove){if(keys.KeyW)mvz+=1;if(keys.KeyS)mvz-=1;if(keys.KeyA)mvx-=1;if(keys.KeyD)mvx+=1;mvx+=joyV.x;mvz-=joyV.y;
    if(keys.ArrowLeft){yaw-=dt*2.2;lastManual=now;}if(keys.ArrowRight){yaw+=dt*2.2;lastManual=now;}
    if(keys.ArrowUp)dist=clamp(dist-dt*8,4,32);if(keys.ArrowDown)dist=clamp(dist+dt*8,4,32);}
  const fw=new V3(Math.cos(yaw),0,Math.sin(yaw)),rt=new V3(-Math.sin(yaw),0,Math.cos(yaw));
  const mv=fw.multiplyScalar(mvz).add(rt.multiplyScalar(mvx));const ml=Math.min(1,mv.length());let spd=0;
  if(ml>.05){mv.normalize();spd=(keys.ShiftLeft||keys.ShiftRight?8.5:4.8)*ml;player.pos.addScaledVector(mv,spd*dt);
    player.rot=lerpA(player.rot,Math.atan2(mv.x,mv.z),Math.min(1,dt*12));
    if(now-lastManual>900&&!(mvz<0&&Math.abs(mvx)<.1))yaw=lerpA(yaw,Math.atan2(mv.z,mv.x),Math.min(1,dt*1.8));}
  colliders.forEach(c=>{const dx=player.pos.x-c.x,dz=player.pos.z-c.z,l=Math.hypot(dx,dz),m=c.r+.35;if(l<m&&l>1e-4){player.pos.x=c.x+dx/l*m;player.pos.z=c.z+dz/l*m;}});
  player.pos.x=clamp(player.pos.x,-HX+.8,HX-1.2);player.pos.z=clamp(player.pos.z,-HZ+1,HZ-1);
  player.vy-=16*dt;player.y=Math.max(0,player.y+player.vy*dt);if(player.y<=0)player.vy=0;
  player.obj.position.set(player.pos.x,player.y,player.pos.z);player.obj.rotation.y=player.rot;AX.walk(player.obj,player.y>0?0:spd,dt);
  player.label.position.set(player.pos.x,2.45+player.y,player.pos.z);bubTick(player,player.pos.x,3.2+player.y,player.pos.z,true,dt);
  // живых игроков больше — ботов меньше (минимум трое, чтобы павильон не пустел)
  const nb=bots.length-Math.min(NET.peers.size,bots.length-3);
  bots.forEach((b,i)=>{b.on=i<nb;b.a.visible=b.l.visible=b.on&&!b.away;if(b.bub&&!b.a.visible)b.bub.visible=false;if(!b.on)return;botTick(b,dt);b.l.position.set(b.a.position.x,2.35,b.a.position.z);bubTick(b,b.a.position.x,3.05,b.a.position.z,!b.away,dt);});
  netUpdate(dt);
  spinners.forEach(s=>{if(s.on)s.turn.rotation.y+=dt*.22;});
  Object.values(stands).forEach(s=>{s.tr.userData.update(dt,t);if(s.tr.userData.engineOn){const e=new V3();s.tr.userData.exhaust.getWorldPosition(e);showSmoke.emit(e,14,dt);}});
  showSmoke.update(dt);burstSys.update(dt);
  bob.forEach((b,i)=>b.position.y=2.1+Math.sin(t*2+i)*.12);
  vt+=dt;if(vt>1/30){drawVideo(t);vt=0;}
  // цель
  objT-=dt;if(objT<=0){objT=.4;objCache=objective();}
  if(objCache&&camMode==='follow'){beacon.visible=true;beacon.position.set(objCache.p.x,0,objCache.p.z);beacon.userData.c.position.y=3.5+Math.sin(t*3)*.25;beacon.userData.r.scale.setScalar(1+Math.sin(t*3)*.12);
    const d=Math.hypot(objCache.p.x-player.pos.x,objCache.p.z-player.pos.z);const ang=Math.atan2(objCache.p.z-player.pos.z,objCache.p.x-player.pos.x)-yaw;
    $('#objT').innerHTML=esc(objCache.t)+' · <b>'+fmt(d)+' м</b>';$('#objAr').style.transform=`rotate(${(ang*180/Math.PI).toFixed(0)}deg)`;if(!blocked())$('#objective').hidden=false;}
  else{beacon.visible=false;if(camMode==='follow'&&!objCache&&!blocked()){$('#objective').hidden=false;$('#objT').innerHTML='Все квесты выполнены. Обойдите соседей в рейтинге';$('#objAr').textContent='★';}}
  // взаимодействия
  if(camMode==='follow'&&!blocked()){let best=null,bs=1e9;
    inter.forEach(it=>{const d=Math.hypot(player.pos.x-it.pos.x,player.pos.z-it.pos.z);
      if(it.kind==='visit'){if(d<it.r&&!S.visited[it.stand.id]){S.visited[it.stand.id]=1;award('visit_'+it.stand.id,10,'Стенд '+it.stand.brand);}return;}
      if(d<it.r&&d/it.r<bs){bs=d/it.r;best=it;}});
    if(best!==curInter){curInter=best;if(best){const p=promptFor(best);$('#promptT').textContent=p[0];$('#promptS').textContent=p[1];$('#promptBtn').innerHTML=esc(p[2])+(touch?'':' <span class="kb">E</span>');$('#promptAlt').innerHTML=p[3]||'';$('#prompt').hidden=false;}else $('#prompt').hidden=true;}}
  else if(curInter){curInter=null;$('#prompt').hidden=true;}
  // камера
  if(camMode==='intro'){const narrow=innerWidth<560;const tgt=narrow?new V3(player.pos.x,1.15,player.pos.z):new V3(player.pos.x,1.3,player.pos.z+1.9);
    camera.position.lerp(new V3(player.pos.x+(narrow?5:5.4),narrow?2.3:2.0,player.pos.z+(narrow?0:.4)),.08);camera.lookAt(tgt);player.rot=Math.PI/2+Math.sin(t*.6)*.25;}
  else if(camMode==='inspect'&&INS.id){const s=stands[INS.id];
    if(keys.ArrowLeft||keys.KeyA)INS.a-=dt*1.3;if(keys.ArrowRight||keys.KeyD)INS.a+=dt*1.3;if(keys.ArrowUp)INS.d=clamp(INS.d-dt*6,5,18);if(keys.ArrowDown)INS.d=clamp(INS.d+dt*6,5,18);
    if(keys.KeyW)INS.h=clamp(INS.h+dt*2.5,.8,7);if(keys.KeyS)INS.h=clamp(INS.h-dt*2.5,.8,7);
    const c=new V3();s.turn.getWorldPosition(c);const tg=c.clone().add(new V3(0,1.5,0));
    camera.position.lerp(new V3(c.x+Math.cos(INS.a)*INS.d,c.y+INS.h,c.z+Math.sin(INS.a)*INS.d),1-Math.pow(.002,dt));camera.lookAt(tg);updateHotspots();}
  else{const tgt=new V3(player.pos.x,1.6+player.y*.5,player.pos.z);const cp=tgt.clone().add(new V3(-Math.cos(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist,-Math.sin(yaw)*Math.cos(pitch)*dist));
    cp.x=clamp(cp.x,-HX+.6,HX+6);cp.z=clamp(cp.z,-HZ+.6,HZ-.6);cp.y=Math.min(cp.y,HH+rise-.8);camera.position.lerp(cp,1-Math.pow(.0005,dt));camera.lookAt(tgt);}
  mmT-=dt;if(mmOn&&mmT<=0&&camMode==='follow'){mmT=.1;drawMinimap();}
  renderer.render(scene,camera);
}

function start(){
  W.ready=true;rebuildPlayer();netInit();adminInit();leadersFetch();if(TRK.on)setInterval(leadersFetch,30000);drawBoard();drawVideo(0);resize();camera.position.set(-18,3,0);
  $('#loading').remove();
  if(S.registered){closeReg();updateHUD();}else{openReg(1);updateHUD();}
  if(location.hash==='#dashboard')openDash();
  requestAnimationFrame(tick);
}
start();
}
(function(){let ran=false;const go=()=>{if(ran)return;ran=true;try{AGRO();}catch(e){const l=document.getElementById('loading');if(l)l.innerHTML='Не удалось запустить 3D. Нужен браузер с поддержкой WebGL.';console.error(e);}};
  const fr=document.fonts&&document.fonts.load?Promise.all(['800 40px Unbounded','600 30px "Golos Text"','700 30px "Golos Text"','500 30px "JetBrains Mono"','700 30px "JetBrains Mono"'].map(f=>document.fonts.load(f))):Promise.resolve();
  fr.then(go,go);setTimeout(go,2500);})();
