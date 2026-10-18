import foodsSeed from './foods.json' with { type: 'json' };

const KEY = 'bpk-local-v1';
const coinUnit = '<i class="coin-icon coin-unit" role="img" aria-label="koin"></i>';
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kiosks = [
  {id:'Healthy Food',label:'Healthy Food',x:55,y:87,emoji:'🥗'},
  {id:'Warteg',label:'Warteg',x:13,y:17,emoji:'🍱'},
  {id:'Mie dan bakso',label:'Mie & Bakso',x:37,y:11,emoji:'🍜'},
  {id:'Gorengan',label:'Gorengan',x:60,y:11,emoji:'🥟'},
  {id:'Minuman',label:'Minuman',x:84,y:17,emoji:'🥤'},
  {id:'Soto & Pecel',label:'Soto & Pecel',x:91,y:36,emoji:'🥣'},
  {id:'Sate',label:'Sate',x:87,y:62,emoji:'🍢'},
  {id:'Nasi Padang',label:'Nasi Padang',x:79,y:85,emoji:'🍛'},
  {id:'Bubur',label:'Bubur',x:29,y:85,emoji:'🍚'},
  {id:'Ikan',label:'Ikan',x:9,y:56,emoji:'🐟'},
];
const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const shiftDate = (date,n) => { const [y,m,d]=date.split('-').map(Number); const x=new Date(y,m-1,d+n); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
const fmtDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'});
const format = (number) => Math.round(number).toLocaleString('id-ID');
let state;
try { state=JSON.parse(localStorage.getItem(KEY)) || {}; } catch { state={}; }
state.logs ||= []; state.custom ||= []; state.budgets ||= {};
let selectedDate=today();
let selectedFood=null;
let selectedSize=1;
let selectedQty=1;
let selectedKiosk=null;
let busy=false;
const save = () => localStorage.setItem(KEY,JSON.stringify(state));
const currentKiosk = kiosk => ['Soto','Pecel dan ketoprak'].includes(kiosk) ? 'Soto & Pecel' : kiosk;
const allFoods = () => [...foodsSeed,...state.custom].map(food=>({...food,kiosk:currentKiosk(food.kiosk)}));
const foodById = (id) => allFoods().find(f=>f.id===id);
const grams = (food,size) => food.grams[size];
const calories = (food,size,qty) => Math.round(food.kcal100*grams(food,size)*qty/100);
const usedFor = (date) => state.logs.filter(l=>l.date===date).reduce((n,l)=>n+l.kcal,0);
const budgetFor = (date) => state.budgets[date] ?? state.profile?.budget ?? 1800;
function calculateBudget(p){
  if(!p || p.age<18 || p.age>79 || p.pregnant==='Ya' || p.breastfeeding==='Ya' || !['Perempuan','Laki-laki'].includes(p.sex)) return null;
  const ree=10*p.weight+6.25*p.height-5*p.age+(p.sex==='Laki-laki'?5:-161);
  const pal={Rendah:1.4,Ringan:1.6,Aktif:1.8}[p.activity];
  if(!pal || ree<=0) return null;
  const maintenance=Math.round(ree*pal);
  const budget=p.goal==='Turun bertahap'?maintenance-Math.round(Math.min(maintenance*.1,300)):maintenance;
  return budget<1200?null:{maintenance,budget};
}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),3100);}
let sheetCloseTimer;
function closeFoodInline(){$('foodInline').hidden=true;$('foodInline').innerHTML='';$('foodInline').style.height='';}
function openSheet(title,html){clearTimeout(sheetCloseTimer);closeFoodInline();$('diaryOverlay').hidden=true;$('searchResults').hidden=true;$('searchInput').blur();const sheet=document.querySelector('#overlay .sheet');sheet.classList.remove('food-sheet','wallet-sheet','profile-sheet','drawer-open');sheet.classList.toggle('food-sheet',html.includes('id="payButton"'));$('sheetTitle').textContent=title;$('sheetBody').innerHTML=html;$('overlay').hidden=false;requestAnimationFrame(()=>requestAnimationFrame(()=>sheet.classList.add('drawer-open')));$('closeSheet').focus();}
function closeSheet(){const overlay=$('overlay'),sheet=overlay.querySelector('.sheet');sheet.classList.remove('drawer-open');clearTimeout(sheetCloseTimer);sheetCloseTimer=setTimeout(()=>{overlay.hidden=true;$('sheetBody').innerHTML='';},800);}
function renderWallet(){
  const budget=budgetFor(selectedDate),used=usedFor(selectedDate),remaining=budget-used;
  const date=new Date(`${selectedDate}T12:00:00`);
  $('dateLabel').textContent=`${date.toLocaleDateString('id-ID',{weekday:'long'})} ${date.getDate()} ${date.toLocaleDateString('en-GB',{month:'short'})}`;
  $('tableLabel').textContent=selectedDate===today()?'Meja hari ini':'Meja';
  $('tableDate').textContent=$('dateLabel').textContent;
  $('remainingValue').textContent=format(remaining);
  $('spentLine').innerHTML=`Terpakai ${format(used)} / ${format(budget)} ${coinUnit}`;
  $('meterFill').style.width=`${Math.max(0,Math.min(100,used/budget*100))}%`;
  $('overLine').hidden=remaining>=0;
  $('overLine').innerHTML=remaining<0?`${fmtDate(selectedDate)}: ${format(-remaining)} ${coinUnit} di atas anggaran`:'';
}
function emojiFor(food){return kiosks.find(k=>k.id===currentKiosk(food?.kiosk))?.emoji || '🍽️';}
function renderDiary(){
  $('diaryDate').textContent=fmtDate(selectedDate);
  const logs=state.logs.filter(l=>l.date===selectedDate).sort((a,b)=>b.time.localeCompare(a.time));
  const list=$('diaryList');
  if(!logs.length){list.innerHTML='<div class="diary-empty">Meja masih kosong. Cari makanan lalu bayar dengan kalori.</div>';return;}
  list.innerHTML=logs.map(l=>`<div class="diary-item"><span class="food-emoji" aria-hidden="true">${emojiFor(l)}</span><div class="diary-main"><strong>${escapeHtml(l.name)}</strong><small>${escapeHtml(l.time)} · ${escapeHtml(l.mealLabel)} · ${escapeHtml(l.portionLabel)} ${l.qty!==1?`· ${l.qty}×`:''}${l.custom?' · Estimasi pengguna':''}</small></div><div class="diary-kcal">${format(l.kcal)} ${coinUnit}</div><div class="diary-actions"><button data-edit="${escapeHtml(l.id)}" aria-label="Edit ${escapeHtml(l.name)}">Edit</button><button data-delete="${escapeHtml(l.id)}" aria-label="Hapus ${escapeHtml(l.name)}">×</button></div></div>`).join('')+`<div class="diary-total">Total ${format(usedFor(selectedDate))} ${coinUnit}</div>`;
  list.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editLog(b.dataset.edit));
  list.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteLog(b.dataset.delete));
}
function renderMap(){
  $('kioskHotspots').innerHTML=kiosks.map(k=>`<button type="button" class="kiosk-pin ${selectedKiosk===k.id?'active':''}" style="left:${k.x}%;top:${k.y}%" data-kiosk="${escapeHtml(k.id)}" aria-label="Lihat makanan kios ${escapeHtml(k.label)}">${k.emoji} ${escapeHtml(k.label)}</button>`).join('');
  $('kioskHotspots').querySelectorAll('button').forEach(b=>b.onclick=()=>{
    selectedKiosk=b.dataset.kiosk;
    $('searchInput').value='';
    renderResults();renderMap();

    toast(`Menampilkan makanan dari kios ${selectedKiosk}`);
  });
  const logs=state.logs.filter(l=>l.date===selectedDate&&!pendingDeliveries.has(l.id));
  $('tableDish').textContent=logs.length?emojiFor(logs.at(-1))+(logs.length>1?` +${logs.length-1}`:''):'';
}
function renderResults(){
  const q=$('searchInput').value.trim().toLocaleLowerCase('id-ID');
  const box=$('searchResults');
  if(!q && !selectedKiosk){box.hidden=true;box.innerHTML='';return;}
  let items=allFoods().filter(f=>(!selectedKiosk || f.kiosk===selectedKiosk) && (!q || `${f.name} ${f.kiosk} ${f.aliases.join(' ')}`.toLocaleLowerCase('id-ID').includes(q)));
  box.hidden=false;
  if(!items.length){box.innerHTML=`<div class="empty-results">Belum ada yang cocok. Coba kata lain atau <button id="emptyCustom" class="text-button" type="button">buat makanan sendiri</button>.</div>`;$('emptyCustom').onclick=showCustom;return;}
  box.innerHTML=items.slice(0,30).map(f=>`<button class="result" type="button" data-food="${escapeHtml(f.id)}"><span class="result-icon" aria-hidden="true">${emojiFor(f)}</span><span class="result-info"><strong>${escapeHtml(f.name)}</strong><small>${escapeHtml(f.kiosk)} · sedang ±${f.grams[1]} g</small></span><span class="result-kcal">±${format(calories(f,1,1))} ${coinUnit}</span></button>`).join('');
  box.querySelectorAll('[data-food]').forEach(b=>b.onclick=()=>showFood(foodById(b.dataset.food)));
}
function render(){renderWallet();renderDiary();renderMap();renderResults();}
function foodSheetHtml(food){
  const k= kiosks.find(x=>x.id===food.kiosk);
  return `<div class="food-head"><span class="big-emoji" aria-hidden="true">${emojiFor(food)}</span><div><strong>${escapeHtml(food.name)}</strong><small>${escapeHtml(food.kiosk)} · ${food.kcal100} kkal / 100 g${food.custom?' · Estimasi pengguna':''}</small></div></div>
  ${food.sourceUrl?`<p class="inline-note"><a href="${escapeHtml(food.sourceUrl)}" target="_blank" rel="noopener noreferrer">Sumber estimasi bahan</a></p>`:''}
  <div class="form-group"><label>Porsi</label><div class="segmented" id="sizeButtons"><button type="button" data-size="0">Kecil</button><button type="button" data-size="1">Sedang</button><button type="button" data-size="2">Besar</button></div><p id="portionInfo" class="inline-note"></p></div>
  <div class="form-group"><label>Jumlah</label><div class="segmented" id="qtyButtons"><button type="button" data-qty="0.5">½×</button><button type="button" data-qty="1">1×</button><button type="button" data-qty="2">2×</button></div></div>
  <div class="form-row"><div class="form-group"><label for="mealLabel">Waktu makan</label><select id="mealLabel"><option>Sarapan</option><option selected>Makan siang</option><option>Makan malam</option><option>Camilan</option></select></div><div class="form-group"><label for="mealTime">Jam</label><input id="mealTime" type="time" value="${new Date().toTimeString().slice(0,5)}" /></div></div>
  <div class="payment-summary"><span>1 ${coinUnit} = 1 kkal</span><strong id="paymentCost"></strong></div>
  <button id="payButton" class="primary-button" type="button">Bayar dengan kalori</button>
  ${k?`<button id="viewKiosk" class="text-button" type="button">Lihat kios ${escapeHtml(k.label)}</button>`:''}
  <p class="inline-note">Bayar berarti mencatat makanan yang sudah dimakan. Berat porsi kios adalah estimasi awal; koreksi ½× atau 2× gratis.</p>`;
}
function updateFoodSheet(food){
  document.querySelectorAll('[data-size]').forEach(b=>b.classList.toggle('active',Number(b.dataset.size)===selectedSize));
  document.querySelectorAll('[data-qty]').forEach(b=>b.classList.toggle('active',Number(b.dataset.qty)===selectedQty));
  $('portionInfo').textContent=`${['Kecil','Sedang','Besar'][selectedSize]} · sekitar ${grams(food,selectedSize)} g. ${food.portionStatus}.`;
  $('paymentCost').innerHTML=`${format(calories(food,selectedSize,selectedQty))} ${coinUnit}`;
  $('payButton').innerHTML=`Bayar ${format(calories(food,selectedSize,selectedQty))} ${coinUnit}`;
}
function showFood(food){
  if(!food)return;
  selectedFood=food;selectedSize=1;selectedQty=1;
  const inline=$('foodInline');
  inline.style.height=`${Math.max(260,Math.min(430,$('searchResults').offsetHeight||300))}px`;
  inline.innerHTML=`<button id="closeFoodInline" class="food-inline-close" type="button" aria-label="Tutup detail makanan">×</button>${foodSheetHtml(food)}`;
  $('searchResults').hidden=true;inline.hidden=false;
  $('closeFoodInline').onclick=()=>{closeFoodInline();$('searchInput').focus();renderResults();};
  document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{selectedSize=Number(b.dataset.size);updateFoodSheet(food);});
  document.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>{selectedQty=Number(b.dataset.qty);updateFoodSheet(food);});
  $('payButton').onclick=pay;
  if($('viewKiosk'))$('viewKiosk').onclick=()=>{selectedKiosk=food.kiosk;closeFoodInline();renderMap();$('mapViewport').scrollIntoView({behavior:'smooth',block:'center'});toast('Kios asal ditandai di peta');};
  updateFoodSheet(food);
}
// Feet coordinates follow the open aisles, independently of kiosk label positions.
const deliveryRoutes = {
  'Healthy Food': [[53,75],[51,68],[48,61]],
  'Warteg': [[30,34],[34,47],[36,59],[48,61]],
  'Mie dan bakso': [[37,28],[34,38],[34,48],[36,59],[48,61]],
  'Gorengan': [[58,28],[71,35],[73,48],[66,59],[55,61]],
  'Minuman': [[77,34],[73,48],[66,59],[55,61]],
  'Soto & Pecel': [[84,43],[74,50],[66,59],[55,61]],
  'Sate': [[78,57],[67,62],[55,61]],
  'Nasi Padang': [[71,73],[64,66],[55,61]],
  'Bubur': [[33,73],[38,66],[48,61]],
  'Ikan': [[23,57],[35,63],[48,61]],
};
const pendingDeliveries = new Set();
const deliveryQueue = [];
let delivering = false;
const pauseDelivery = ms => new Promise(resolve => setTimeout(resolve, ms));
function animatePayment(log){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){pendingDeliveries.delete(log.id);renderMap();return;}
  deliveryQueue.push(log);
  void deliverNext();
}
// One animation clock moves the waiter and camera together, without a jump to the table.
function deliveryIsActive(log){
  return log.date===selectedDate&&state.logs.some(item=>item.id===log.id)&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function deliveryFrame(duration,log,draw){
  return new Promise(resolve=>{
    let start,last;
    function frame(now){
      if(!deliveryIsActive(log)){resolve(false);return;}
      start??=now;last??=now;
      const t=Math.min(1,(now-start)/duration);
      draw(t,Math.min(50,now-last));last=now;
      if(t<1)requestAnimationFrame(frame);else resolve(true);
    }
    requestAnimationFrame(frame);
  });
}
function faceDeliveryDirection(dx,dy){
  const courier=$('courier');
  courier.dataset.view=dy>0?'front':'back';
  // Keep the previous horizontal facing for a straight vertical segment.
  if(Math.abs(dx)>.01)courier.style.setProperty('--facing',dx<0?-1:1);
}
function followDelivery(x,y,blend){
  const viewport=$('mapViewport'),canvas=$('mapCanvas');
  const left=Math.max(0,Math.min(canvas.clientWidth-viewport.clientWidth,canvas.clientWidth*x/100-viewport.clientWidth*.5));
  const top=Math.max(0,Math.min(canvas.clientHeight-viewport.clientHeight,canvas.clientHeight*y/100-viewport.clientHeight*.48));
  viewport.scrollTo({left:viewport.scrollLeft+(left-viewport.scrollLeft)*blend,top:viewport.scrollTop+(top-viewport.scrollTop)*blend,behavior:'instant'});
}
// Payment and delivery share one queue: the waiter only starts after receipt.
async function sendMoneyToKiosk(log){
  const kioskId=currentKiosk(log.kiosk);
  const kiosk=kiosks.find(k=>k.id===kioskId)||kiosks.find(k=>k.id==='Warteg');
  const viewport=$('mapViewport'),canvas=$('mapCanvas');
  const from={left:viewport.scrollLeft,top:viewport.scrollTop};
  const to={left:Math.max(0,Math.min(canvas.clientWidth-viewport.clientWidth,canvas.clientWidth*kiosk.x/100-viewport.clientWidth/2)),top:Math.max(0,Math.min(canvas.clientHeight-viewport.clientHeight,canvas.clientHeight*kiosk.y/100-viewport.clientHeight*.38))};
  if(!await deliveryFrame(500,log,t=>{const ease=t*t*(3-2*t);viewport.scrollTo({left:from.left+(to.left-from.left)*ease,top:from.top+(to.top-from.top)*ease,behavior:'instant'});}))return false;
  const shell=document.querySelector('.app-shell');
  const origin=$('remainingValue').getBoundingClientRect();
  const start={x:origin.left+origin.width/2,y:origin.top+origin.height/2};
  const layer=document.createElement('div');
  layer.className='coin-stream';layer.setAttribute('aria-hidden','true');
  const coins=Array.from({length:6},()=>{
    const coin=document.createElement('i');coin.className='coin-icon';
    layer.append(coin);return coin;
  });
  shell.append(layer);
  const valid=()=>log.date===selectedDate&&state.logs.some(item=>item.id===log.id)&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{
    const received=await new Promise(resolve=>{
      let began;
      function step(time){
        if(!valid()){resolve(false);return;}
        began??=time;
        const elapsed=time-began;
        const pin=[...$('kioskHotspots').querySelectorAll('button')].find(b=>b.dataset.kiosk===kiosk.id);
        if(!pin){resolve(false);return;}
        const target=pin.getBoundingClientRect(),bounds=shell.getBoundingClientRect();
        const end={x:target.left+target.width/2,y:target.bottom+24};
        coins.forEach((coin,index)=>{
          const t=Math.max(0,Math.min(1,(elapsed-index*170)/1150));
          const ease=t*t*(3-2*t),arc=Math.sin(t*Math.PI);
          const x=start.x+(end.x-start.x)*ease+arc*(index%2?18:-18)-bounds.left;
          const y=start.y+(end.y-start.y)*t*t+arc*(14+index*4)-bounds.top;
          const absorb=Math.max(0,(t-.72)/.28);
          const scale=(.65+.35*Math.min(1,t/.15))*(1-absorb);
          coin.style.transform=`translate(${x-18}px,${y-18}px) rotate(${t*(index%2?240:-240)}deg) scale(${scale})`;
          coin.style.opacity=String(Math.min(1,t/.08)*(1-absorb));
        });
        if(elapsed<1150+(coins.length-1)*170)requestAnimationFrame(step);else resolve(true);
      }
      requestAnimationFrame(step);
    });
    if(!received)return false;
    const pin=[...$('kioskHotspots').querySelectorAll('button')].find(b=>b.dataset.kiosk===kiosk.id);
    if(pin){const receipt=pin.animate([{boxShadow:'0 0 0 0 #b9e3a9'},{boxShadow:'0 0 0 12px #b9e3a900'},{boxShadow:'0 0 0 0 #b9e3a900'}],{duration:350});await receipt.finished;}
    return valid();
  }finally{layer.remove();}
}

async function deliverNext(){
  if(delivering)return;
  delivering=true;
  const courier=$('courier');
  try {
    while(deliveryQueue.length){
      const log=deliveryQueue.shift();
      try {
        if(log.date!==selectedDate||!state.logs.some(item=>item.id===log.id))continue;
        const route=deliveryRoutes[currentKiosk(log.kiosk)]||deliveryRoutes.Warteg;
        const [startX,startY]=route[0];
        courier.style.left=`${startX}%`;courier.style.top=`${startY}%`;
        if(!await sendMoneyToKiosk(log))continue;
        const kiosk=kiosks.find(k=>k.id===currentKiosk(log.kiosk))||kiosks.find(k=>k.id==='Warteg');
        const distance=Math.hypot(kiosk.x-startX,kiosk.y-startY)||1;
        const exit=[startX+(kiosk.x-startX)/distance*4,startY+(kiosk.y-startY)/distance*4];
        const path=[exit,...route];
        courier.style.left=`${exit[0]}%`;courier.style.top=`${exit[1]}%`;
        courier.style.opacity='0';
        courier.style.clipPath='inset(0 0 100% 0)';
        courier.classList.add('is-delivering','is-walking');
        let completed=true;
        for(let i=1;i<path.length;i++){
          const [x,y]=path[i], [px,py]=path[i-1];
          faceDeliveryDirection(x-px,y-py);
          const duration=i===1?700:Math.max(450,Math.hypot(x-px,y-py)*65);
          completed=await deliveryFrame(duration,log,(t,dt)=>{
            const cx=px+(x-px)*t,cy=py+(y-py)*t;
            courier.style.left=`${cx}%`;courier.style.top=`${cy}%`;
            if(i===1){courier.style.opacity=String(Math.min(1,t*3));courier.style.clipPath=`inset(0 0 ${(1-t)*100}% 0)`;}
            followDelivery(cx,cy,1-Math.exp(-dt/180));
          });
          if(!completed)break;
        }
        if(!completed)continue;
        courier.classList.remove('is-walking');
        if(log.date===selectedDate){
          const [arrivalX,arrivalY]=route[route.length-1];
          faceDeliveryDirection(50-arrivalX,49-arrivalY);
          courier.classList.add('is-serving');
          await pauseDelivery(350);
          pendingDeliveries.delete(log.id);renderMap();
          $('tableDish').classList.remove('dish-arrived');void $('tableDish').offsetWidth;$('tableDish').classList.add('dish-arrived');
          await pauseDelivery(400);
        }
      } catch(error){
        console.warn('Animasi pengantaran tidak selesai; catatan tetap tersimpan.',error);
      } finally {
        $('walletFlying').classList.remove('paying');
        pendingDeliveries.delete(log.id);
        courier.classList.remove('is-delivering','is-walking','is-serving');
        courier.style.opacity='';courier.style.clipPath='';
        renderMap();
      }
    }
  } finally { delivering=false; }
}

function pay(){
  if(busy||!selectedFood)return;
  const time=$('mealTime').value,label=$('mealLabel').value;
  if(!time){toast('Isi jam makan dulu.');return;}
  busy=true;
  const food=selectedFood,id=crypto.randomUUID();
  const log={id,foodId:food.id,name:food.name,kiosk:food.kiosk,custom:!!food.custom,date:selectedDate,time,mealLabel:label,size:selectedSize,qty:selectedQty,portionLabel:`${['Kecil','Sedang','Besar'][selectedSize]} · ${grams(food,selectedSize)} g`,kcal:calories(food,selectedSize,selectedQty)};
  if(state.logs.some(l=>l.id===id)){busy=false;return;}
  try{state.logs.push(log);state.budgets[selectedDate]??=state.profile?.budget??1800;save();pendingDeliveries.add(log.id);closeFoodInline();$('searchInput').value='';selectedKiosk=null;render();animatePayment(log);toast(`${food.name} tercatat. Pembayaran berhasil.`);}catch(e){state.logs=state.logs.filter(l=>l.id!==id);toast('Gagal menyimpan. Coba lagi.');}finally{busy=false;}
}
function editLog(id){
  const log=state.logs.find(l=>l.id===id);if(!log)return;
  openSheet('Edit catatan',`<p class="history-note">${escapeHtml(log.name)} · ${format(log.kcal)} ${coinUnit}</p><div class="form-row"><div class="form-group"><label for="editQty">Jumlah porsi</label><select id="editQty"><option value="0.5">½×</option><option value="1">1×</option><option value="2">2×</option></select></div><div class="form-group"><label for="editLabel">Waktu makan</label><select id="editLabel"><option>Sarapan</option><option>Makan siang</option><option>Makan malam</option><option>Camilan</option></select></div></div><div class="form-group"><label for="editTime">Jam</label><input id="editTime" type="time" value="${escapeHtml(log.time)}" /></div><button id="saveEdit" class="primary-button" type="button">Simpan perubahan</button>`);
  $('editQty').value=String(log.qty);$('editLabel').value=log.mealLabel;
  $('saveEdit').onclick=()=>{const food=foodById(log.foodId);const qty=Number($('editQty').value);log.qty=qty;log.mealLabel=$('editLabel').value;log.time=$('editTime').value||log.time;log.kcal=food?calories(food,log.size,qty):Math.round(log.kcal*qty/(log.qty||1));save();closeSheet();render();toast('Catatan diperbarui.');};
}
function deleteLog(id){
  const log=state.logs.find(l=>l.id===id);if(!log)return;
  openSheet('Hapus catatan?',`<p>${escapeHtml(log.name)} (${format(log.kcal)} ${coinUnit}) akan dihapus dari meja dan riwayat hari ini.</p><div class="button-row"><button id="cancelDelete" class="secondary-button" type="button">Batal</button><button id="confirmDelete" class="primary-button" type="button">Hapus catatan</button></div>`);
  $('cancelDelete').onclick=closeSheet;$('confirmDelete').onclick=()=>{state.logs=state.logs.filter(l=>l.id!==id);save();closeSheet();render();toast('Catatan dihapus.');};
}
function showCopy(){
  const yesterday=shiftDate(selectedDate,-1),source=state.logs.filter(l=>l.date===yesterday);
  if(!source.length){toast('Belum ada menu pada hari sebelumnya.');return;}
  openSheet('Salin menu kemarin',`<p class="history-note">Dari ${fmtDate(yesterday)} ke ${fmtDate(selectedDate)}. Dompet belum berubah sebelum konfirmasi.</p><div class="copy-list">${source.map(l=>`<label class="copy-row"><input type="checkbox" data-copy="${escapeHtml(l.id)}" checked /><span>${escapeHtml(l.name)} · ${format(l.kcal)} ${coinUnit}</span></label>`).join('')}</div><div class="payment-summary" style="margin-top:13px"><span>Total pilihan</span><strong id="copyTotal"></strong></div><button id="confirmCopy" class="primary-button" type="button">Catat pilihan hari ini</button>`);
  const update=()=>{const ids=[...document.querySelectorAll('[data-copy]:checked')].map(x=>x.dataset.copy);$('copyTotal').innerHTML=`${format(source.filter(l=>ids.includes(l.id)).reduce((n,l)=>n+l.kcal,0))} ${coinUnit}`;};
  document.querySelectorAll('[data-copy]').forEach(c=>c.onchange=update);update();
  $('confirmCopy').onclick=()=>{const ids=[...document.querySelectorAll('[data-copy]:checked')].map(x=>x.dataset.copy);if(!ids.length){toast('Pilih setidaknya satu makanan.');return;}const current=new Date().toTimeString().slice(0,5);for(const l of source.filter(x=>ids.includes(x.id)))state.logs.push({...l,id:crypto.randomUUID(),date:selectedDate,time:current});state.budgets[selectedDate]??=state.profile?.budget??1800;save();closeSheet();render();toast(`${ids.length} makanan disalin ke ${fmtDate(selectedDate)}.`);};
}
function showCustom(){
  openSheet('Makanan sendiri',`<p class="inline-note">Masukkan estimasi yang lo tahu. Makanan ini hanya tersimpan di browser ini.</p><div class="form-group"><label for="customName">Nama makanan</label><input id="customName" maxlength="80" placeholder="Contoh: lauk rumah" /></div><div class="form-row"><div class="form-group"><label for="customKcal">Kalori per porsi sedang</label><input id="customKcal" type="number" min="1" max="3000" step="1" placeholder="250" /></div><div class="form-group"><label for="customGram">Berat porsi sedang (g)</label><input id="customGram" type="number" min="1" max="2000" step="1" value="100" /></div></div><button id="saveCustom" class="primary-button" type="button">Simpan dan pilih makanan</button>`);
  $('saveCustom').onclick=()=>{const name=$('customName').value.trim(),kcal=Number($('customKcal').value),gram=Number($('customGram').value);if(!name||!Number.isInteger(kcal)||kcal<1||kcal>3000||!Number.isInteger(gram)||gram<1||gram>2000){toast('Isi nama, kalori 1–3.000, dan berat 1–2.000 g.');return;}const food={id:`custom-${crypto.randomUUID()}`,name,kiosk:'Makanan sendiri',kcal100:kcal*100/gram,grams:[Math.round(gram*.75),gram,Math.round(gram*1.5)],aliases:[],portionStatus:'Estimasi pengguna',custom:true};state.custom.push(food);save();showFood(food);};
}
function showProfile(){
  const p=state.profile||{age:30,sex:'Perempuan',activity:'Rendah',weight:70,height:170,pregnant:'Tidak',breastfeeding:'Tidak',goal:'Jaga berat'};
  openSheet(state.profile?'Atur profil':'Buat dompet kalori',`<p class="inline-note">Isi profil untuk memperkirakan anggaran kalori harian.</p><div class="form-row profile-measurements"><div class="form-group"><label for="age">Usia</label><input id="age" type="number" min="18" max="79" value="${p.age}" /></div><div class="form-group"><label for="weight">Berat (kg)</label><input id="weight" type="number" min="20" max="350" value="${p.weight}" /></div><div class="form-group"><label for="height">Tinggi (cm)</label><input id="height" type="number" min="100" max="250" value="${p.height}" /></div></div><div class="form-group"><label for="sex">Koefisien rumus</label><select id="sex"><option>Perempuan</option><option>Laki-laki</option><option>Tidak ingin menyebutkan</option></select></div><div class="form-row"><div class="form-group"><label for="activity">Aktivitas</label><select id="activity"><option>Rendah</option><option>Ringan</option><option>Aktif</option></select></div><div class="form-group"><label for="goal">Tujuan</label><select id="goal"><option>Jaga berat</option><option>Turun bertahap</option></select></div></div><div class="form-row"><div class="form-group"><label for="pregnant">Hamil?</label><select id="pregnant"><option>Tidak</option><option>Ya</option></select></div><div class="form-group"><label for="breastfeeding">Menyusui?</label><select id="breastfeeding"><option>Tidak</option><option>Ya</option></select></div></div><div id="profileResult" class="profile-result"></div><button id="saveProfile" class="primary-button" type="button">Simpan profil dan anggaran</button><p class="inline-note">Rumus Mifflin–St Jeor × faktor aktivitas. Pilihan turun bertahap mengurangi 10%, maksimal 300 kkal/hari. Belum ditinjau ahli gizi untuk rekomendasi publik.</p>`);
  document.querySelector('#overlay .sheet').classList.add('profile-sheet');
  for(const key of ['sex','activity','goal','pregnant','breastfeeding'])$(key).value=p[key];
  const read=()=>({age:Number($('age').value),sex:$('sex').value,weight:Number($('weight').value),height:Number($('height').value),activity:$('activity').value,goal:$('goal').value,pregnant:$('pregnant').value,breastfeeding:$('breastfeeding').value});
  const update=()=>{const data=read(),result=calculateBudget(data);$('profileResult').textContent=result?`Perkiraan jaga berat ${format(result.maintenance)} kkal/hari. Anggaran ${data.goal.toLowerCase()} ${format(result.budget)} kkal/hari.`:'Profil ini memerlukan anggaran yang ditentukan bersama tenaga kesehatan. Perhitungan otomatis tidak tersedia.';};
  document.querySelectorAll('#sheetBody input,#sheetBody select').forEach(el=>el.oninput=update);update();
  $('saveProfile').onclick=()=>{const data=read(),result=calculateBudget(data);if(!result){toast('Perhitungan otomatis tidak tersedia untuk profil ini.');return;}if(!Number.isFinite(data.age)||!Number.isFinite(data.weight)||!Number.isFinite(data.height)||data.weight<20||data.weight>350||data.height<100||data.height>250){toast('Periksa usia, berat, dan tinggi.');return;}state.profile={...data,budget:result.budget};state.budgets[today()]=result.budget;save();closeSheet();render();toast('Dompet kalori siap dipakai.');};
}

$('searchInput').addEventListener('input',()=>{closeFoodInline();selectedKiosk=null;renderResults();renderMap();});
$('searchInput').addEventListener('focus',renderResults);
document.addEventListener('pointerdown',event=>{
  if(!event.target.closest('.search-section')){$('searchResults').hidden=true;closeFoodInline();}
});
$('customButton').onclick=showCustom;$('profileButton').onclick=showProfile;
$('copyButton').onclick=showCopy;
$('prevDay').onclick=()=>{selectedDate=shiftDate(selectedDate,-1);render();};
$('nextDay').onclick=()=>{selectedDate=shiftDate(selectedDate,1);render();};
$('tableHotspot').onclick=()=>{$('searchInput').blur();$('searchResults').hidden=true;renderDiary();$('diaryOverlay').hidden=false;$('closeDiary').focus();};
$('closeDiary').onclick=()=>{$('diaryOverlay').hidden=true;$('tableHotspot').focus();};
$('diaryOverlay').onclick=e=>{if(e.target===$('diaryOverlay'))$('diaryOverlay').hidden=true;};
 $('walletDetailsButton').onclick=()=>{const budget=budgetFor(selectedDate),used=usedFor(selectedDate),remaining=budget-used;openSheet('Dompet hari ini',`<div class="wallet-detail-logo"><img src="./assets/dompetkalori-logo-transparent.png" alt="DompetKalori" /></div><div class="wallet-detail-date">${fmtDate(selectedDate)}</div><div class="wallet-detail-rows"><div><span>Anggaran</span><strong>${format(budget)} ${coinUnit}</strong></div><div><span>Terpakai</span><strong>${format(used)} ${coinUnit}</strong></div><div><span>Sisa</span><strong class="wallet-detail-remaining">${format(remaining)} ${coinUnit}</strong></div></div><p class="inline-note">${used>budget?'Di atas anggaran. Kamu tetap bisa mencatat makanan.':'Atur Anggaran di menu Settings'}</p>`);document.querySelector('#overlay .sheet').classList.add('wallet-sheet');};
$('mapPanLeft').onclick=()=>$('mapViewport').scrollBy({left:-Math.max(180,$('mapViewport').clientWidth*.72),behavior:'smooth'});
$('mapPanRight').onclick=()=>$('mapViewport').scrollBy({left:Math.max(180,$('mapViewport').clientWidth*.72),behavior:'smooth'});
$('closeSheet').onclick=closeSheet;
$('overlay').addEventListener('click',e=>{if(e.target===$('overlay'))closeSheet();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('diaryOverlay').hidden=true;if(!$('overlay').hidden)closeSheet();$('searchResults').hidden=true;}});
render();
if(!state.profile)showProfile();

// Follow the visible viewport when mobile browser chrome or keyboard changes height.
function syncViewport(){const viewport=window.visualViewport;document.documentElement.style.setProperty('--app-height',`${viewport?.height||innerHeight}px`);document.documentElement.style.setProperty('--app-top',`${viewport?.offsetTop||0}px`);}
syncViewport();window.visualViewport?.addEventListener('resize',syncViewport);window.visualViewport?.addEventListener('scroll',syncViewport);window.addEventListener('resize',syncViewport);
requestAnimationFrame(()=>{const viewport=$('mapViewport');viewport.scrollLeft=(viewport.scrollWidth-viewport.clientWidth)/2;});
