/* FIT FORMULA Billing — form, invoice image, WhatsApp-to-customer, customer contact. */
const $ = id => document.getElementById(id);
const STORAGE = 'ifitBillingV1', SETTINGS = 'ifitBillingSettingsV1';
let generated = null;

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const rs = n => 'Rs. ' + Number(n || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const esc = s => String(s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };

/* ---------- form ---------- */
function nextNo() {
  const a = read(STORAGE, '[]');
  const n = a.reduce((m, x) => Math.max(m, Number((x.invoiceNo || '').match(/(\d+)$/)?.[1] || 0)), 0) + 1;
  return 'IFIT-INV-' + String(n).padStart(4, '0');
}
function row(p = {name: '', qty: 1, rate: '', discount: 0}) {
  const e = document.createElement('div');
  e.className = 'item';
  e.innerHTML = `<div class="item-top"><input class="pname" value="${esc(p.name)}" placeholder="Product name"><button class="remove" title="Remove product" type="button">×</button></div>
  <div class="row3"><div><label>Quantity</label><input class="qty" type="number" min="1" inputmode="decimal" value="${p.qty}"></div>
  <div><label>Rate (₹)</label><input class="rate" type="number" min="0" inputmode="decimal" value="${p.rate}"></div>
  <div><label>Discount (₹)</label><input class="disc" type="number" min="0" inputmode="decimal" value="${p.discount}"></div></div>
  <div class="amount">Line total: <span>₹0.00</span></div>`;
  e.querySelectorAll('input').forEach(x => x.addEventListener('input', calculate));
  e.querySelector('.remove').onclick = () => { if (document.querySelectorAll('.item').length > 1) { e.remove(); calculate(); markStale(); } };
  $('items').append(e);
  calculate();
}
function products() {
  return [...document.querySelectorAll('.item')].map(e => ({
    name: e.querySelector('.pname').value.trim(),
    qty: +e.querySelector('.qty').value || 0,
    rate: +e.querySelector('.rate').value || 0,
    discount: +e.querySelector('.disc').value || 0
  }));
}
function calculate() {
  let sub = 0, dis = 0;
  const ps = products();
  document.querySelectorAll('.item').forEach((e, i) => {
    const p = ps[i], gross = p.qty * p.rate, d = Math.min(p.discount, gross);
    sub += gross; dis += d;
    e.querySelector('.amount span').textContent = money(gross - d);
  });
  $('subtotal').textContent = money(sub);
  $('discount').textContent = '− ' + money(dis);
  $('total').textContent = money(sub - dis);
}
function form() {
  const ps = products().filter(p => p.name && p.qty > 0);
  const subtotal = ps.reduce((s, p) => s + p.qty * p.rate, 0);
  const discount = ps.reduce((s, p) => s + Math.min(p.discount, p.qty * p.rate), 0);
  return {invoiceNo: $('invoiceNo').value, date: $('date').value, customerName: $('customerName').value.trim(),
    mobile: $('mobile').value.trim(), address: $('address').value.trim(), products: ps,
    subtotal, discount, total: subtotal - discount, createdAt: new Date().toISOString()};
}
function valid() {
  const f = form();
  if (!f.customerName) { alert('Please enter the customer name.'); $('customerName').focus(); return false; }
  if (!f.products.length) { alert('Add at least one product with its name, quantity and rate.'); return false; }
  return true;
}
function saveSettings() {
  const s = {};
  ['businessName', 'businessAddress', 'businessMobile', 'terms'].forEach(id => s[id] = $(id).value);
  localStorage.setItem(SETTINGS, JSON.stringify(s));
  return s;
}
function saveInvoice(inv) {
  const a = read(STORAGE, '[]'), i = a.findIndex(x => x.invoiceNo === inv.invoiceNo);
  if (i > -1) a[i] = inv; else a.unshift(inv);
  localStorage.setItem(STORAGE, JSON.stringify(a));
  renderHistory();
}
function renderHistory() {
  const q = $('historySearch').value.toLowerCase();
  const a = read(STORAGE, '[]').filter(x => (x.invoiceNo + x.customerName + x.mobile).toLowerCase().includes(q));
  $('history').innerHTML = a.length ? a.map(x => `<div class="history-item"><div><strong>${esc(x.customerName)}</strong><small>${esc(x.invoiceNo)} · ${new Date(x.date + 'T00:00').toLocaleDateString('en-IN')}</small></div><div class="history-amt"><strong>${money(x.total)}</strong><button class="text-btn" onclick="loadInvoice('${esc(x.invoiceNo)}')">Open</button></div></div>`).join('') : '<div class="empty">No saved invoices yet.</div>';
}
window.loadInvoice = no => {
  const x = read(STORAGE, '[]').find(i => i.invoiceNo === no);
  if (!x) return;
  $('invoiceNo').value = x.invoiceNo; $('invoiceLabel').textContent = x.invoiceNo;
  $('date').value = x.date; $('customerName').value = x.customerName; $('mobile').value = x.mobile; $('address').value = x.address;
  $('items').innerHTML = ''; x.products.forEach(row);
  markStale();
  scrollTo({top: 0, behavior: 'smooth'});
};
function exportBackup() {
  const data = {exportedAt: new Date().toISOString(), invoices: read(STORAGE, '[]'), business: read(SETTINGS, '{}')};
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}), 'ifit-billing-backup-' + new Date().toISOString().slice(0, 10) + '.json');
}
function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

/* ---------- invoice image ---------- */
const loadImage = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
function wrapText(ctx, text, maxW) {
  const out = [];
  String(text || '').split(/\n/).forEach(par => {
    let line = '';
    par.split(/\s+/).filter(Boolean).forEach(word => {
      let w = word;
      while (ctx.measureText(w).width > maxW) {            // very long word: break by characters
        let k = w.length; while (k > 1 && ctx.measureText(w.slice(0, k)).width > maxW) k--;
        if (line) { out.push(line); line = ''; }
        out.push(w.slice(0, k)); w = w.slice(k);
      }
      const next = line ? line + ' ' + w : w;
      if (ctx.measureText(next).width > maxW && line) { out.push(line); line = w; } else line = next;
    });
    if (line) out.push(line);
  });
  return out;
}
function fit(ctx, img, x, y, w, h) {
  const r = Math.min(w / img.naturalWidth, h / img.naturalHeight), dw = img.naturalWidth * r, dh = img.naturalHeight * r;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
async function buildImage(inv, s, skipImages = false) {
  const [logo, seal] = skipImages ? [null, null] : await Promise.all([loadImage('assets/ifit-logo.jpeg'), loadImage('assets/ifit-seal.jpeg')]);
  const G = '#075c2b', INK = '#10251a', MUTED = '#647169', LINE = '#dce6df';
  const storeName = s.businessName || 'FIT FORMULA NUTRITION STORE';
  const M = 80, RIGHT = 1160;                         // equal 80px side margins on a 1240px page
  const COL = {num: 110, prod: 170, qty: 640, rate: 850, amt: 1130};
  const m = document.createElement('canvas').getContext('2d');   // measuring context

  /* header */
  const HDR_Y = 80, HDR_H = 200, LOGO = 150;
  const titleMax = (RIGHT - 30 - LOGO) - 30 - 110;
  let tSize = 48; m.font = `bold ${tSize}px Arial`;
  while (tSize > 30 && m.measureText(storeName).width > titleMax) { tSize -= 2; m.font = `bold ${tSize}px Arial`; }

  /* customer box (grows with address) */
  const boxTop = HDR_Y + HDR_H + 40;
  m.font = 'bold 36px Arial'; const nameLines = wrapText(m, inv.customerName, 620);
  m.font = '28px Arial';
  const infoLines = [];
  if (inv.mobile) infoLines.push(inv.mobile);
  infoLines.push(...wrapText(m, inv.address, 620));
  const nameBase0 = boxTop + 105;
  const lastName = nameBase0 + (nameLines.length - 1) * 44;
  const infoBase0 = lastName + 44;
  const lastInfo = infoLines.length ? infoBase0 + (infoLines.length - 1) * 36 : lastName;
  const boxBottom = Math.max(lastInfo, boxTop + 150) + 34;

  /* table rows (measure) */
  const tableTop = boxBottom + 50, TH = 65;
  m.font = '28px Arial';
  const rows = inv.products.map(p => {
    const lines = wrapText(m, p.name, 380);
    const d = Math.min(p.discount, p.qty * p.rate);
    const lastBase = 46 + (lines.length - 1) * 36 + (p.discount > 0 ? 32 : 0);
    return {p, lines, amount: p.qty * p.rate - d, height: lastBase + 30};
  });
  const rowsEnd = tableTop + TH + rows.reduce((t, r) => t + r.height, 0);
  const totalsTop = rowsEnd + 50;
  const contentBottom = totalsTop + 223;
  const H = Math.max(1754, contentBottom + 380);
  const fl = H - 310;                                   // footer line

  /* draw */
  const c = document.createElement('canvas'); c.width = 1240; c.height = H;
  const ctx = c.getContext('2d');
  const T = (text, x, y, font, color, align = 'left') => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(text, x, y); };
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, H);

  ctx.fillStyle = G; ctx.beginPath(); ctx.roundRect(M, HDR_Y, RIGHT - M, HDR_H, 22); ctx.fill();
  T(storeName, 110, HDR_Y + 90, `bold ${tSize}px Arial`, '#fff');
  T('NUTRITION STORE  |  CUSTOMER INVOICE', 110, HDR_Y + 142, 'bold 26px Arial', '#fff');
  const lx = RIGHT - 30 - LOGO, ly = HDR_Y + (HDR_H - LOGO) / 2;
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(lx, ly, LOGO, LOGO, 16); ctx.fill();
  if (logo) fit(ctx, logo, lx + 10, ly + 10, LOGO - 20, LOGO - 20);

  ctx.fillStyle = '#fafcfa'; ctx.strokeStyle = LINE; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(M, boxTop, RIGHT - M, boxBottom - boxTop, 16); ctx.fill(); ctx.stroke();
  T('BILL TO', 110, boxTop + 55, 'bold 25px Arial', G);
  T('INVOICE DETAILS', 790, boxTop + 55, 'bold 25px Arial', G);
  nameLines.forEach((l, i) => T(l, 110, nameBase0 + i * 44, 'bold 36px Arial', INK));
  infoLines.forEach((l, i) => T(l, 110, infoBase0 + i * 36, '28px Arial', INK));
  T(inv.invoiceNo, 790, nameBase0, 'bold 29px Arial', INK);
  T(new Date(inv.date + 'T00:00').toLocaleDateString('en-IN'), 790, nameBase0 + 46, '27px Arial', INK);

  ctx.fillStyle = '#eaf3eb'; ctx.fillRect(M, tableTop, RIGHT - M, TH);
  const hb = tableTop + 42, hf = 'bold 25px Arial';
  T('#', COL.num, hb, hf, G); T('PRODUCT', COL.prod, hb, hf, G);
  T('QTY', COL.qty, hb, hf, G, 'right'); T('RATE', COL.rate, hb, hf, G, 'right'); T('AMOUNT', COL.amt, hb, hf, G, 'right');
  let y = tableTop + TH;
  rows.forEach((r, i) => {
    const b = y + 46;
    T(String(i + 1), COL.num, b, '28px Arial', INK);
    r.lines.forEach((l, k) => T(l, COL.prod, b + k * 36, '28px Arial', INK));
    T(String(r.p.qty), COL.qty, b, '28px Arial', INK, 'right');
    T(rs(r.p.rate), COL.rate, b, '28px Arial', INK, 'right');
    T(rs(r.amount), COL.amt, b, '28px Arial', INK, 'right');
    if (r.p.discount > 0) T('Discount: ' + rs(Math.min(r.p.discount, r.p.qty * r.p.rate)), COL.prod, b + (r.lines.length - 1) * 36 + 32, '22px Arial', MUTED);
    y += r.height;
    ctx.strokeStyle = '#e4ebe5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(RIGHT, y); ctx.stroke();
  });

  ctx.strokeStyle = '#b4c8b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(700, totalsTop); ctx.lineTo(RIGHT, totalsTop); ctx.stroke();
  T('Subtotal', 730, totalsTop + 50, '29px Arial', INK); T(rs(inv.subtotal), COL.amt, totalsTop + 50, '29px Arial', INK, 'right');
  T('Discount', 730, totalsTop + 102, '29px Arial', INK); T('- ' + rs(inv.discount), COL.amt, totalsTop + 102, '29px Arial', INK, 'right');
  ctx.fillStyle = G; ctx.beginPath(); ctx.roundRect(700, totalsTop + 135, RIGHT - 700, 88, 14); ctx.fill();
  T('TOTAL', 730, totalsTop + 135 + 57, 'bold 34px Arial', '#fff'); T(rs(inv.total), COL.amt, totalsTop + 135 + 57, 'bold 34px Arial', '#fff', 'right');

  ctx.strokeStyle = '#65b52d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(M, fl); ctx.lineTo(RIGHT, fl); ctx.stroke();
  T(storeName, M, fl + 55, 'bold 25px Arial', INK);
  m.font = '22px Arial';
  const addr = wrapText(m, s.businessAddress, 640);
  addr.forEach((l, i) => T(l, M, fl + 95 + i * 29, '22px Arial', INK));
  let fy = fl + 95 + addr.length * 29 + 7;
  if (s.businessMobile) { T('Phone: ' + s.businessMobile, M, fy, '22px Arial', INK); fy += 40; }
  T(s.terms || 'Thank you for shopping with us.', M, Math.max(fy + 8, fl + 215), '20px Arial', MUTED);
  if (seal) fit(ctx, seal, RIGHT - 140, fl + 25, 140, 140);
  T('Computer-generated invoice', RIGHT, fl + 245, '20px Arial', MUTED, 'right');
  ctx.textAlign = 'left';

  try {
    return await new Promise((res, rej) => { try { c.toBlob(blob => blob ? res({blob, url: URL.createObjectURL(blob)}) : rej(new Error('blob failed')), 'image/png'); } catch (e) { rej(e); } });
  } catch (e) {
    if (!skipImages) return buildImage(inv, s, true);   // opened from local file: browser blocks logo export, so build without logos
    throw e;
  }
}

/* ---------- state + actions ---------- */
function setReady(ready) {
  ['viewBtn', 'saveImgBtn', 'waBtn', 'contactBtn', 'hint', 'newBtn'].forEach(id => $(id).classList.toggle('hidden', !ready));
  $('generateBtn').classList.toggle('hidden', ready);
  $('generateBtn').textContent = generated === null && $('generationStatus').dataset.was ? 'Regenerate invoice' : 'Generate invoice';
  $('generationStatus').textContent = ready ? 'Invoice ready' : 'Draft invoice';
}
function markStale() {
  if (!generated) return;
  URL.revokeObjectURL(generated.url); generated = null;
  $('generationStatus').dataset.was = '1';
  setReady(false);
}
async function generate() {
  if (!valid()) return;
  const btn = $('generateBtn'); btn.disabled = true; btn.textContent = 'Generating…';
  try {
    const inv = form(), s = saveSettings();
    saveInvoice(inv);
    const img = await buildImage(inv, s);
    generated = {invoice: inv, blob: img.blob, url: img.url, filename: inv.invoiceNo + '.png'};
    $('generationStatus').dataset.was = '';
    setReady(true);
  } catch (e) { alert('Could not generate the invoice: ' + e.message); btn.textContent = 'Generate invoice'; }
  finally { btn.disabled = false; }
}
function viewInvoice() { if (!generated) return; $('invoiceImagePreview').src = generated.url; $('imageDialog').showModal(); }
function saveImage() { if (generated) downloadBlob(generated.blob, generated.filename); }
function customerDigits() {
  const d = String(generated ? generated.invoice.mobile : $('mobile').value).replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  if (d.length === 11 && d[0] === '0') return '91' + d.slice(1);
  if (d.length === 12 && d.startsWith('91')) return d;
  return null;
}
function whatsappCustomer() {
  if (!generated) return;
  const num = customerDigits();
  if (!num) { alert('Enter a valid 10-digit customer mobile number first, then regenerate.'); $('mobile').focus(); return; }
  const i = generated.invoice, store = ($('businessName').value || 'FIT FORMULA NUTRITION STORE');
  const msg = `Hello ${i.customerName},\nThank you for shopping at ${store}.\n\nInvoice: ${i.invoiceNo}\nDate: ${new Date(i.date + 'T00:00').toLocaleDateString('en-IN')}\nTotal: ${rs(i.total)}\n\nYour invoice is attached.`;
  window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(msg), '_blank');
}
function saveCustomerContact() {
  if (!generated) return;
  const num = customerDigits();
  if (!num) { alert('Enter a valid 10-digit customer mobile number first, then regenerate.'); $('mobile').focus(); return; }
  const i = generated.invoice, v = x => String(x || '').replace(/\r?\n/g, ', ').replace(/([,;\\])/g, '\\$1');
  const card = ['BEGIN:VCARD', 'VERSION:3.0', `N:;${v(i.customerName)};;;`, `FN:${v(i.customerName)}`, `TEL;TYPE=CELL:+${num}`,
    i.address && `ADR;TYPE=HOME:;;${v(i.address)};;;;`, `NOTE:Customer - FIT FORMULA (${i.invoiceNo})`, 'END:VCARD'].filter(Boolean).join('\r\n');
  downloadBlob(new Blob([card], {type: 'text/vcard'}), (i.customerName.replace(/[^\w]+/g, '-') || 'customer') + '.vcf');
}
function newInvoice() {
  markStale();
  ['customerName', 'mobile', 'address'].forEach(id => $(id).value = '');
  $('items').innerHTML = ''; row();
  $('date').value = new Date().toISOString().slice(0, 10);
  $('invoiceNo').value = nextNo(); $('invoiceLabel').textContent = $('invoiceNo').value;
  $('generationStatus').dataset.was = '';
  setReady(false);
  scrollTo({top: 0, behavior: 'smooth'});
}

/* ---------- init ---------- */
function init() {
  Object.entries(read(SETTINGS, '{}')).forEach(([k, v]) => { if ($(k)) $(k).value = v; });
  $('date').value = new Date().toISOString().slice(0, 10);
  $('invoiceNo').value = nextNo(); $('invoiceLabel').textContent = $('invoiceNo').value;
  row();
  $('addItem').onclick = () => { row(); markStale(); };
  $('generateBtn').onclick = generate;
  $('viewBtn').onclick = viewInvoice;
  $('saveImgBtn').onclick = saveImage;
  $('waBtn').onclick = whatsappCustomer;
  $('contactBtn').onclick = saveCustomerContact;
  $('newBtn').onclick = newInvoice;
  $('exportBtn').onclick = exportBackup;
  $('closeImageBtn').onclick = () => $('imageDialog').close();
  $('historySearch').oninput = renderHistory;
  $('main').addEventListener('input', e => { if (e.target.id !== 'historySearch') markStale(); });
  renderHistory(); setReady(false);
}
init();
