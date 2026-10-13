(()=>{
'use strict';
const COMPANY_KEY='myStorePaliaCompaniesV1';
const $=id=>document.getElementById(id);
const state={company:null,items:[],vouchers:[],view:'dashboard',editing:null,toastTimer:null};
const today=()=>new Date().toISOString().slice(0,10);
const money=n=>'₹'+(Number(n)||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const num=n=>Number.isFinite(Number(n))?Number(n):0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const companyDataKey=id=>'myStoreInventoryV1_'+id;
function getCompanies(){try{const x=JSON.parse(localStorage.getItem(COMPANY_KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
function saveCompanies(x){localStorage.setItem(COMPANY_KEY,JSON.stringify(x))}
function loadData(){try{const x=JSON.parse(localStorage.getItem(companyDataKey(state.company.id))||'{}');state.items=Array.isArray(x.items)?x.items:[];state.vouchers=Array.isArray(x.vouchers)?x.vouchers:[]}catch{state.items=[];state.vouchers=[]}}
function saveData(){localStorage.setItem(companyDataKey(state.company.id),JSON.stringify({items:state.items,vouchers:state.vouchers}))}
function showToast(msg){const el=$('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.add('hidden'),2800)}
function openModal(id){$(id).classList.remove('hidden')}
function closeModal(id){$(id).classList.add('hidden')}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-bg:not(.hidden)').forEach(m=>m.classList.add('hidden'))});
$('createCompany').addEventListener('click',()=>location.href='create-company.html');
function renderCompanyPicker(){
 const list=getCompanies();let old=$('companyPicker');if(old)old.remove();
 const bg=document.createElement('div');bg.id='companyPicker';bg.className='modal-bg';
 bg.innerHTML='<section class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><div class="eyebrow">COMPANY WORKSPACES</div><h2>Select Company</h2><p>Open a company saved in this browser.</p></div><button class="close-btn" id="pickerClose">×</button></div><div id="pickerList"></div></section>';
 document.body.appendChild(bg);$('pickerClose').onclick=()=>bg.remove();
 $('pickerList').innerHTML=list.length?list.map(c=>'<button class="quick" data-company="'+esc(c.id)+'" style="width:100%;margin:8px 0"><span class="qicon">▤</span><span><strong>'+esc(c.name)+'</strong><small>'+esc(c.businessType||c.address||c.owner||'Company profile')+'</small></span></button>').join(''):'<div class="empty"><strong>No company found</strong>Create a company profile first.</div>';
 $('pickerList').addEventListener('click',e=>{const b=e.target.closest('[data-company]');if(b){const c=list.find(x=>String(x.id)===b.dataset.company);if(c){bg.remove();openWorkspace(c)}}});
 bg.addEventListener('click',e=>{if(e.target===bg)bg.remove()});
}
$('selectCompany').addEventListener('click',renderCompanyPicker);
function openWorkspace(c){
 state.company=c;loadData();if(c&&c.id)history.replaceState(null,'',location.pathname+'?companyId='+encodeURIComponent(c.id));document.querySelectorAll('[data-menu-link]').forEach(a=>{const target=a.dataset.menuLink;a.href=target+(target.includes('?')?'&':'?')+'companyId='+encodeURIComponent(c.id)});$('startup').classList.add('hidden');$('workspace').classList.remove('hidden');
 $('activeCompany').textContent=c.name;$('footerCompany').textContent=c.name+' · My Store By PaliaAPK HUB';
 const profileImage=$('profileCompanyImage');if(profileImage){profileImage.src=c.logo||'';profileImage.alt=(c.name||'Company')+' image';profileImage.style.display=c.logo?'block':'none';}
 if($('profileCompanyName'))$('profileCompanyName').textContent=c.name||'Company';
 if($('profileCompanyType'))$('profileCompanyType').textContent=c.businessType||'Company profile';
 if($('profileCompanyOwner'))$('profileCompanyOwner').textContent=c.owner||'';
 renderAll();switchView('dashboard');
}
$('switchCompany').addEventListener('click',renderCompanyPicker);
function closeProfileMenu(){const menu=$('profileMenu'),trigger=$('profileTrigger');if(menu)menu.classList.add('hidden');if(trigger)trigger.setAttribute('aria-expanded','false')}
$('profileTrigger').addEventListener('click',e=>{e.stopPropagation();const menu=$('profileMenu'),open=menu.classList.toggle('hidden')===false;$('profileTrigger').setAttribute('aria-expanded',String(open))});
document.addEventListener('click',e=>{if(!e.target.closest('.profile-wrap'))closeProfileMenu()});
$('profileEditShop').addEventListener('click',()=>{if(state.company)location.href='company-edit.html?companyId='+encodeURIComponent(state.company.id)});
$('profileSwitchCompany').addEventListener('click',()=>{closeProfileMenu();renderCompanyPicker()});
$('profileUploadImage').addEventListener('click',()=>{if(state.company)location.href='company-edit.html?companyId='+encodeURIComponent(state.company.id)+'#logoFile'});

$('exitWorkspace').addEventListener('click',()=>{state.company=null;$('workspace').classList.add('hidden');$('startup').classList.remove('hidden');window.scrollTo(0,0)});
$('brandHome').addEventListener('click',e=>{e.preventDefault();switchView('dashboard')});
function getItem(id){return state.items.find(i=>i.id===id)}
function itemStatus(i){if(num(i.qty)<=0)return 'out';if(num(i.qty)<=num(i.minQty))return 'low';return 'ok'}
function statusBadge(i){const s=itemStatus(i);return s==='out'?'<span class="badge out">Out of stock</span>':s==='low'?'<span class="badge low">Low stock</span>':'<span class="badge">In stock</span>'}
function itemRow(i,actions=true){return '<tr><td><div class="item-name">'+esc(i.name)+'</div><div class="item-sub">'+esc(i.sku||'No item code')+'</div></td><td>'+esc(i.category||'Other')+'</td><td>'+esc(i.unit||'pcs')+'</td><td class="qty">'+num(i.qty).toLocaleString('en-IN',{maximumFractionDigits:3})+'</td><td>'+money(i.purchaseRate)+'</td><td>'+money(i.saleRate)+'</td><td>'+money(num(i.qty)*num(i.purchaseRate))+'</td><td>'+statusBadge(i)+'</td>'+(actions?'<td><button class="outline-btn" data-edit="'+esc(i.id)+'">Edit</button> <button class="outline-btn" data-voucher-in="'+esc(i.id)+'">＋</button> <button class="outline-btn" data-voucher-out="'+esc(i.id)+'">−</button></td>':'')+'</tr>'}
function emptyTable(title,desc,button=true){return '<div class="empty"><div class="empty-icon">▤</div><strong>'+title+'</strong>'+desc+(button?'<div style="margin-top:15px"><button class="primary-btn" data-empty-add>＋ Create Stock Item</button></div>':'')+'</div>'}
function tableHTML(items,actions=true){if(!items.length)return emptyTable('No stock items yet','Create your first item to start tracking real inventory.');return '<div class="table-wrap"><table><thead><tr><th>Item / SKU</th><th>Category</th><th>Unit</th><th>Balance Qty</th><th>Purchase Rate</th><th>Sale Rate</th><th>Stock Value</th><th>Status</th>'+(actions?'<th>Actions</th>':'')+'</tr></thead><tbody>'+items.map(i=>itemRow(i,actions)).join('')+'</tbody></table></div>'}
function renderShopDetails(){
 const c=state.company||{},target=$('dashboardShopDetails');
 if(!target)return;
 const val=x=>String(x||'').trim();
 const address=[c.address,c.city,c.state,c.pincode,c.country].map(val).filter(Boolean).join(', ');
 const detail=(label,value)=>value?'<div><span class="shop-detail-label">'+esc(label)+'</span><div class="shop-detail-value">'+esc(value)+'</div></div>':'';
 if(!c.name&&!address&&!c.logo){target.innerHTML='<div class="shop-profile-empty">Shop details abhi add nahi ki gayi hain. Company menu se Edit Shop Details par click karke details save karein.</div>';return;}
 target.innerHTML=(c.logo?'<img class="shop-profile-logo" src="'+esc(c.logo)+'" alt="Company image">':'<div class="shop-profile-logo" aria-label="Company image not uploaded" style="display:grid;place-items:center;color:#8a968d;font-size:24px">▧</div>')+'<div class="shop-profile-info"><div class="shop-name">'+esc(c.name||'My Store')+'</div><div><span class="badge">'+esc(val(c.businessType)||'Company')+'</span></div>'+detail('Address',address)+'</div>';
}

function renderDashboard(){
 renderShopDetails();
 const qty=state.items.reduce((s,i)=>s+num(i.qty),0),value=state.items.reduce((s,i)=>s+num(i.qty)*num(i.purchaseRate),0),low=state.items.filter(i=>itemStatus(i)!=='ok').length;
 $('statItems').textContent=state.items.length.toLocaleString('en-IN');$('statQty').textContent=qty.toLocaleString('en-IN',{maximumFractionDigits:3});$('statValue').textContent=money(value);$('statLow').textContent=low;
 $('dashboardTable').innerHTML=tableHTML([...state.items].sort((a,b)=>a.name.localeCompare(b.name)).slice(0,8),true);
 $('recentVouchers').innerHTML=renderRecentVouchers(state.vouchers.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,5));
}
function renderItems(){
 const q=($('itemSearch').value||'').trim().toLowerCase(),cat=$('categoryFilter').value;
 const list=state.items.filter(i=>(!cat||i.category===cat)&&[i.name,i.sku,i.category].join(' ').toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name));
 $('itemCountLabel').textContent=list.length+' of '+state.items.length+' items';$('itemsTable').innerHTML=tableHTML(list,true);
}
function renderRecentVouchers(list){if(!list.length)return '<div class="empty"><div class="empty-icon">⇄</div><strong>No vouchers recorded</strong>Stock In and Stock Out entries will appear here.</div>';return list.map(v=>'<div class="ledger-row"><div><strong>'+esc(v.type==='IN'?'Stock In':'Stock Out')+' · '+esc(v.itemName)+'</strong><small>'+esc(v.date)+' · '+esc(v.voucherNo||'Voucher')+(v.party?' · '+esc(v.party):'')+'</small></div><div style="text-align:right"><div class="ledger-amount '+(v.type==='IN'?'in':'out')+'">'+(v.type==='IN'?'+':'−')+num(v.qty).toLocaleString('en-IN',{maximumFractionDigits:3})+' '+esc(v.unit)+'</div><small>'+money(num(v.qty)*num(v.rate))+'</small></div></div>').join('')}
function renderVouchers(){const q=($('voucherSearch').value||'').trim().toLowerCase();const list=state.vouchers.filter(v=>[v.itemName,v.voucherNo,v.party,v.type,v.date].join(' ').toLowerCase().includes(q)).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||'').localeCompare(a.createdAt||''));if(!list.length){$('voucherTable').innerHTML=emptyTable('No stock vouchers yet','Use Stock In or Stock Out to record inventory movement.',false);return}
 $('voucherTable').innerHTML='<div class="table-wrap"><table><thead><tr><th>Date</th><th>Voucher No.</th><th>Type</th><th>Item</th><th>Party / Reference</th><th>Quantity</th><th>Rate</th><th>Amount</th><th>Narration</th></tr></thead><tbody>'+list.map(v=>'<tr><td>'+esc(v.date)+'</td><td>'+esc(v.voucherNo)+'</td><td><span class="badge '+(v.type==='IN'?'':'low')+'">'+(v.type==='IN'?'Stock In':'Stock Out')+'</span></td><td><span class="item-name">'+esc(v.itemName)+'</span></td><td>'+esc(v.party||'—')+'</td><td>'+num(v.qty).toLocaleString('en-IN',{maximumFractionDigits:3})+' '+esc(v.unit)+'</td><td>'+money(v.rate)+'</td><td>'+money(num(v.qty)*num(v.rate))+'</td><td>'+esc(v.note||'—')+'</td></tr>').join('')+'</tbody></table></div>'}
function renderReports(){
 const cost=state.items.reduce((s,i)=>s+num(i.qty)*num(i.purchaseRate),0),sale=state.items.reduce((s,i)=>s+num(i.qty)*num(i.saleRate),0);
 $('reportValue').textContent=money(cost);$('reportSaleValue').textContent=money(sale);$('reportIn').textContent=state.vouchers.filter(v=>v.type==='IN').length;$('reportOut').textContent=state.vouchers.filter(v=>v.type==='OUT').length;
 const low=state.items.filter(i=>itemStatus(i)!=='ok');$('lowStockTable').innerHTML=tableHTML(low,false);
 const cats={};state.items.forEach(i=>{const k=i.category||'Other';cats[k]??={qty:0,value:0,count:0};cats[k].qty+=num(i.qty);cats[k].value+=num(i.qty)*num(i.purchaseRate);cats[k].count++});
 const rows=Object.entries(cats).sort((a,b)=>a[0].localeCompare(b[0]));$('categoryReport').innerHTML=rows.length?'<div class="table-wrap"><table><thead><tr><th>Category</th><th>Items</th><th>Quantity</th><th>Stock Value</th></tr></thead><tbody>'+rows.map(([k,v])=>'<tr><td class="item-name">'+esc(k)+'</td><td>'+v.count+'</td><td>'+v.qty.toLocaleString('en-IN',{maximumFractionDigits:3})+'</td><td>'+money(v.value)+'</td></tr>').join('')+'</tbody></table></div>':emptyTable('No category data','Add stock items to build category reports.',false);
}
function renderAccounts(){const map={};state.vouchers.forEach(v=>{const party=(v.party||'').trim();if(!party)return;map[party]??={purchase:0,sale:0,purchaseCount:0,saleCount:0};if(v.type==='IN'){map[party].purchase+=num(v.qty)*num(v.rate);map[party].purchaseCount++}else{map[party].sale+=num(v.qty)*num(v.rate);map[party].saleCount++}});const rows=Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));$('accountsTable').innerHTML=rows.length?'<div class="table-wrap"><table><thead><tr><th>Party / Account</th><th>Purchase Total</th><th>Sale Total</th><th>Net Difference</th><th>Purchase Entries</th><th>Sale Entries</th></tr></thead><tbody>'+rows.map(([name,x])=>'<tr><td class="item-name">'+esc(name)+'</td><td>'+money(x.purchase)+'</td><td>'+money(x.sale)+'</td><td>'+money(x.sale-x.purchase)+'</td><td>'+x.purchaseCount+'</td><td>'+x.saleCount+'</td></tr>').join('')+'</tbody></table></div>':emptyTable('No account entries yet','Enter a party / reference on Purchase or Sale vouchers to build this summary.',false)}
function renderRegister(type,target){const list=state.vouchers.filter(v=>v.type===type).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));if(!list.length){$(target).innerHTML=emptyTable(type==='IN'?'No purchases recorded':'No sales recorded',type==='IN'?'Create a Purchase voucher to record stock received.':'Create a Sale voucher to record stock issued.',false);return}$(target).innerHTML='<div class="table-wrap"><table><thead><tr><th>Date</th><th>Voucher No.</th><th>Item</th><th>Party</th><th>Quantity</th><th>Rate</th><th>Amount</th><th>Narration</th></tr></thead><tbody>'+list.map(v=>'<tr><td>'+esc(v.date)+'</td><td>'+esc(v.voucherNo)+'</td><td class="item-name">'+esc(v.itemName)+'</td><td>'+esc(v.party||'—')+'</td><td>'+num(v.qty).toLocaleString('en-IN',{maximumFractionDigits:3})+' '+esc(v.unit)+'</td><td>'+money(v.rate)+'</td><td>'+money(num(v.qty)*num(v.rate))+'</td><td>'+esc(v.note||'—')+'</td></tr>').join('')+'</tbody></table></div>'}
function renderBalance(){$('balanceTable').innerHTML=tableHTML(state.items.slice().sort((a,b)=>a.name.localeCompare(b.name)),false)}
function renderAll(){renderDashboard();renderItems();renderVouchers();renderReports();renderAccounts();renderRegister('IN','purchaseTable');renderRegister('OUT','saleTable');renderBalance();refreshVoucherItemOptions()}
function switchView(view){state.view=view;['dashboard','accounts','items','purchase','sale','balance','transactions','reports'].forEach(v=>$(v+'View').classList.toggle('hidden',v!==view));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));window.scrollTo({top:0,behavior:'smooth'});if(view==='items')renderItems();if(view==='transactions')renderVouchers();if(view==='reports')renderReports();if(view==='accounts')renderAccounts();if(view==='purchase')renderRegister('IN','purchaseTable');if(view==='sale')renderRegister('OUT','saleTable');if(view==='balance')renderBalance()}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.goto)));
function openItemModal(){state.editing=null;$('itemForm').reset();$('itemModalTitle').textContent='Create Stock Item';$('itemOpening').value='0';$('itemMin').value='0';$('itemPurchase').value='0';$('itemSale').value='0';$('itemError').textContent='';openModal('itemModal')}
['addItemTop','addItemPage','quickAdd'].forEach(id=>$(id).addEventListener('click',openItemModal));
document.addEventListener('click',e=>{if(e.target.closest('[data-empty-add]'))openItemModal()});
$('itemForm').addEventListener('submit',e=>{
 e.preventDefault();const name=$('itemName').value.trim(),sku=$('itemSku').value.trim(),opening=num($('itemOpening').value);
 if(!name){$('itemError').textContent='Item name is required.';return}
 if(sku&&state.items.some(i=>i.sku.toLowerCase()===sku.toLowerCase())){$('itemError').textContent='This item code already exists. Please use a unique code.';return}
 const i={id:'itm_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),name,sku,category:$('itemCategory').value,unit:$('itemUnit').value,minQty:num($('itemMin').value),purchaseRate:num($('itemPurchase').value),saleRate:num($('itemSale').value),qty:opening,createdAt:new Date().toISOString()};
 state.items.push(i);
 if(opening>0)state.vouchers.push({id:'v_'+Date.now(),voucherNo:nextVoucherNo(),type:'IN',itemId:i.id,itemName:i.name,unit:i.unit,qty:opening,rate:i.purchaseRate,date:today(),party:'Opening Stock',note:'Opening balance',createdAt:new Date().toISOString()});
 try{saveData();closeModal('itemModal');renderAll();showToast('Stock item saved.')}catch(err){state.items=state.items.filter(x=>x.id!==i.id);showToast('Browser storage is full or unavailable. Export data and retry.')}
});
function nextVoucherNo(){return 'INV-'+String(state.vouchers.length+1).padStart(5,'0')}
function refreshVoucherItemOptions(selected=''){const sel=$('voucherItem');if(!sel)return;sel.innerHTML='<option value="">Select stock item</option>'+state.items.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+' · Balance '+num(i.qty).toLocaleString('en-IN',{maximumFractionDigits:3})+' '+esc(i.unit)+'</option>').join('');if(selected)sel.value=selected}
function openVoucher(type='IN',itemId=''){
 if(!state.items.length){showToast('Create a stock item before recording a voucher.');openItemModal();return}
 $('voucherForm').reset();$('voucherType').value=type;$('voucherDate').value=today();$('voucherQty').value='';$('voucherRate').value='0';$('voucherError').textContent='';refreshVoucherItemOptions(itemId);
 $('voucherTitle').textContent=type==='IN'?'Stock In / Purchase':'Stock Out / Issue';$('voucherDescription').textContent=type==='IN'?'Record goods received or purchased.':'Record goods issued, sold or removed from stock.';
 if(itemId){const i=getItem(itemId);if(i)$('voucherRate').value=type==='IN'?i.purchaseRate:i.saleRate}
 openModal('voucherModal');
}
['stockInQuick','quickIn','stockInPage'].forEach(id=>$(id).addEventListener('click',()=>openVoucher('IN')));
['stockOutQuick','quickOut','stockOutPage','saleAdd'].forEach(id=>$(id).addEventListener('click',()=>openVoucher('OUT')));
$('purchaseAdd').addEventListener('click',()=>openVoucher('IN'));$('balanceExport').addEventListener('click',exportItems);
$('voucherType').addEventListener('change',()=>{const i=getItem($('voucherItem').value);$('voucherTitle').textContent=$('voucherType').value==='IN'?'Stock In / Purchase':'Stock Out / Issue';if(i)$('voucherRate').value=$('voucherType').value==='IN'?i.purchaseRate:i.saleRate});
$('voucherItem').addEventListener('change',()=>{const i=getItem($('voucherItem').value);if(i)$('voucherRate').value=$('voucherType').value==='IN'?i.purchaseRate:i.saleRate});
$('voucherForm').addEventListener('submit',e=>{
 e.preventDefault();const type=$('voucherType').value,i=getItem($('voucherItem').value),qty=num($('voucherQty').value),rate=num($('voucherRate').value);
 if(!i){$('voucherError').textContent='Please select a stock item.';return}
 if(qty<=0){$('voucherError').textContent='Quantity must be greater than zero.';return}
 if(type==='OUT'&&qty>num(i.qty)){$('voucherError').textContent='Insufficient stock. Available balance: '+num(i.qty)+' '+i.unit+'.';return}
 const v={id:'v_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),voucherNo:nextVoucherNo(),type,itemId:i.id,itemName:i.name,unit:i.unit,qty,rate,date:$('voucherDate').value,party:$('voucherParty').value.trim(),note:$('voucherNote').value.trim(),createdAt:new Date().toISOString()};
 i.qty=type==='IN'?num(i.qty)+qty:num(i.qty)-qty;
 if(type==='IN'&&rate>0)i.purchaseRate=rate;if(type==='OUT'&&rate>0)i.saleRate=rate;
 state.vouchers.push(v);
 try{saveData();closeModal('voucherModal');renderAll();showToast(v.voucherNo+' saved successfully.')}catch(err){i.qty=type==='IN'?num(i.qty)-qty:num(i.qty)+qty;state.vouchers.pop();showToast('Could not save voucher. Browser storage may be full.')}
});
function openEdit(id){const i=getItem(id);if(!i)return;$('editId').value=i.id;$('editName').value=i.name;$('editSku').value=i.sku||'';$('editCategory').value=i.category||'Other';$('editUnit').value=i.unit||'pcs';$('editMin').value=num(i.minQty);$('editPurchase').value=num(i.purchaseRate);$('editSale').value=num(i.saleRate);$('editError').textContent='';openModal('editModal')}
document.addEventListener('click',e=>{
 const edit=e.target.closest('[data-edit]');if(edit)openEdit(edit.dataset.edit);
 const vin=e.target.closest('[data-voucher-in]');if(vin)openVoucher('IN',vin.dataset.voucherIn);
 const vout=e.target.closest('[data-voucher-out]');if(vout)openVoucher('OUT',vout.dataset.voucherOut);
});
$('editForm').addEventListener('submit',e=>{e.preventDefault();const i=getItem($('editId').value),name=$('editName').value.trim(),sku=$('editSku').value.trim();if(!i)return;if(!name){$('editError').textContent='Item name is required.';return}if(sku&&state.items.some(x=>x.id!==i.id&&x.sku.toLowerCase()===sku.toLowerCase())){$('editError').textContent='This item code already exists.';return}i.name=name;i.sku=sku;i.category=$('editCategory').value;i.unit=$('editUnit').value;i.minQty=num($('editMin').value);i.purchaseRate=num($('editPurchase').value);i.saleRate=num($('editSale').value);state.vouchers.forEach(v=>{if(v.itemId===i.id){v.itemName=i.name;v.unit=i.unit}});saveData();closeModal('editModal');renderAll();showToast('Item details updated.')});
$('itemSearch').addEventListener('input',renderItems);$('categoryFilter').addEventListener('change',renderItems);$('voucherSearch').addEventListener('input',renderVouchers);
function csvCell(v){const s=String(v??'');return '"'+s.replace(/"/g,'""')+'"'}
function downloadCSV(filename,rows){const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);showToast('CSV export started.')}
function exportItems(){downloadCSV('inventory-items-'+today()+'.csv',[['Item Name','SKU','Category','Unit','Quantity','Reorder Level','Purchase Rate','Sale Rate','Stock Value','Status'],...state.items.map(i=>[i.name,i.sku,i.category,i.unit,i.qty,i.minQty,i.purchaseRate,i.saleRate,num(i.qty)*num(i.purchaseRate),itemStatus(i)])])}
['exportCsv','itemsExport','reportsExport'].forEach(id=>$(id).addEventListener('click',exportItems));
function setupWorkspaceTools(){
 const calc=$('calculatorModal'),backup=$('backupModal'),exit=$('exitConfirmModal');
 $('openCalculator').addEventListener('click',()=>{openModal('calculatorModal');$('calcDisplay').focus()});
 $('backupData').addEventListener('click',()=>{ $('backupMessage').textContent='';$('restoreFile').value='';openModal('backupModal') });
 $('exitWorkspaceMenu').addEventListener('click',()=>openModal('exitConfirmModal'));
 $('confirmExit').addEventListener('click',()=>{location.href='company.html'});
 $('calcKeys').addEventListener('click',e=>{
  const b=e.target.closest('[data-calc]');if(!b)return;const k=b.dataset.calc,d=$('calcDisplay');
  if(k==='C'){d.value='0';return}
  if(k==='='){try{const expression=d.value.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');if(!/^[0-9+*/(). \-]+$/.test(expression))throw new Error('invalid');const tokens=expression.match(/(?:\d+\.?\d*|\.\d+|[()+*/-])/g)||[];if(tokens.join('')!==expression.replace(/\s/g,''))throw new Error('invalid');const values=[];const ops=[];const prec={'+':1,'-':1,'*':2,'/':2};const apply=()=>{const op=ops.pop(),b=values.pop(),a=values.pop();if(a===undefined||b===undefined)throw new Error('invalid');if(op==='+')values.push(a+b);else if(op==='-')values.push(a-b);else if(op==='*')values.push(a*b);else if(op==='/')values.push(a/b)};let expect=true;for(const t of tokens){if(/^\d|^\./.test(t)){if(!expect)throw new Error('invalid');values.push(Number(t));expect=false}else if(t==='('){if(!expect)throw new Error('invalid');ops.push(t)}else if(t===')'){while(ops.length&&ops[ops.length-1]!=='(')apply();if(ops.pop()!=='(')throw new Error('invalid');expect=false}else{if(expect&&t==='-'){values.push(0)}else if(expect)throw new Error('invalid');while(ops.length&&ops[ops.length-1]!=='('&&prec[ops[ops.length-1]]>=prec[t])apply();ops.push(t);expect=true}}if(expect)throw new Error('invalid');while(ops.length){if(ops[ops.length-1]==='(')throw new Error('invalid');apply()}if(values.length!==1||!Number.isFinite(values[0]))throw new Error('invalid');d.value=String(Number(values[0].toFixed(8)))}catch(err){d.value='Error'}return}
  if(d.value==='0'||d.value==='Error')d.value=k;else d.value+=({'÷':'÷','×':'×','−':'−'}[k]||k);
 });
 $('downloadBackup').addEventListener('click',()=>{
  if(!state.company){$('backupMessage').textContent='Select a company first.';return}
  const data={format:'my-store-palia-backup-v1',exportedAt:new Date().toISOString(),company:state.company,inventory:JSON.parse(localStorage.getItem(companyDataKey(state.company.id))||'{}'),paymentReceipts:JSON.parse(localStorage.getItem('myStorePaymentReceiptsV1_'+state.company.id)||'[]')};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='my-store-backup-'+String(state.company.name||'company').replace(/[^a-z0-9_-]+/gi,'-')+'-'+today()+'.json';a.click();URL.revokeObjectURL(url);$('backupMessage').textContent='Backup download started.';
 });
 $('chooseRestore').addEventListener('click',()=>$('restoreFile').click());
 $('restoreFile').addEventListener('change',async e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  try{const data=JSON.parse(await file.text());if(!state.company)throw new Error('Select a company first.');if(data.format!=='my-store-palia-backup-v1'||!data.inventory||!Array.isArray(data.inventory.items)||!Array.isArray(data.inventory.vouchers)||!Array.isArray(data.paymentReceipts))throw new Error('This file is not a valid My Store backup.');if(String(data.company&&data.company.id)!==String(state.company.id))throw new Error('This backup belongs to a different company. Open that company before restoring.');if(!confirm('Restore backup for '+state.company.name+'? Current inventory, vouchers and receipts for this company will be replaced.')){e.target.value='';return}localStorage.setItem(companyDataKey(state.company.id),JSON.stringify({items:data.inventory.items,vouchers:data.inventory.vouchers}));localStorage.setItem('myStorePaymentReceiptsV1_'+state.company.id,JSON.stringify(data.paymentReceipts));loadData();renderAll();$('backupMessage').textContent='Backup restored successfully.';showToast('Backup restored.')}
  catch(err){$('backupMessage').textContent=err.message||'Could not restore this backup.'}
  e.target.value='';
 });
}
function init(){
 const id=new URLSearchParams(location.search).get('companyId');const cs=getCompanies();const c=id?cs.find(x=>String(x.id)===id):null;
 if(c)openWorkspace(c);else{$('startup').classList.remove('hidden');$('workspace').classList.add('hidden')}
}
setupWorkspaceTools();
init();
})();