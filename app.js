/* Generated-invoice workflow: PDF plus shareable invoice image and vCard contact. */
(() => {
  const byId = id => document.getElementById(id);
  const STORAGE_KEY = 'ifitBillingV1';
  let generated = null;
  const pdfMoney = value => `Rs. ${Number(value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const setReady = ready => {
    ['saveBtn', 'printBtn', 'shareBtn', 'viewImageBtn', 'saveImageBtn'].forEach(id => byId(id).disabled = !ready);
    byId('generationStatus').textContent = ready ? 'Invoice ready' : 'Draft invoice';
  };
  const saveInvoiceSilently = invoice => {
    const invoices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = invoices.findIndex(item => item.invoiceNo === invoice.invoiceNo);
    if (index === -1) invoices.unshift(invoice); else invoices[index] = invoice;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices)); renderHistory();
  };
  const downloadBlob = (blob, filename) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const downloadPdf = () => generated && downloadBlob(generated.pdfBlob, generated.pdfFilename);
  const downloadImage = () => generated && downloadBlob(generated.imageBlob, generated.imageFilename);
  const contactFile = () => {
    const store = saveSettings(), clean = value => String(value || '').replace(/\r?\n/g, ', ').replace(/,/g, '\\,');
    const number = String(store.businessMobile || '').replace(/\D/g, '');
    const card = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${clean(store.businessName || 'FIT FORMULA NUTRITION STORE')}`, `ORG:${clean(store.businessName || 'FIT FORMULA NUTRITION STORE')}`, number && `TEL;TYPE=CELL:${number}`, store.businessAddress && `ADR;TYPE=WORK:;;${clean(store.businessAddress)};;;;`, 'END:VCARD'].filter(Boolean).join('\r\n');
    return new File([card], 'FIT-FORMULA-Nutrition-Store.vcf', {type: 'text/vcard'});
  };
  const saveContact = () => downloadBlob(contactFile(), 'FIT-FORMULA-Nutrition-Store.vcf');
  const canvasText = (ctx, text, x, y, width, lineHeight) => {
    const words = String(text || '').split(/\s+/); let line = '', lines = 0;
    words.forEach(word => { const next = line ? `${line} ${word}` : word; if (ctx.measureText(next).width > width && line) { ctx.fillText(line, x, y + lines * lineHeight); line = word; lines++; } else line = next; });
    if (line) { ctx.fillText(line, x, y + lines * lineHeight); lines++; } return y + lines * lineHeight;
  };
  const invoiceImage = (invoice, settings) => new Promise(resolve => {
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d'); canvas.width = 1240; canvas.height = 1754;
    const g = '#075c2b', ink = '#10251a', muted = '#647169';
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = g; ctx.roundRect(70, 70, 1100, 220, 20); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 48px Arial'; ctx.fillText(settings.businessName || 'FIT FORMULA NUTRITION STORE', 110, 155);
    ctx.font = 'bold 26px Arial'; ctx.fillText('NUTRITION STORE  |  CUSTOMER INVOICE', 110, 210);
    ctx.fillStyle = '#fafcfa'; ctx.strokeStyle = '#dce6df'; ctx.lineWidth = 3; ctx.roundRect(70, 350, 1100, 205, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = g; ctx.font = 'bold 25px Arial'; ctx.fillText('BILL TO', 110, 410); ctx.fillText('INVOICE DETAILS', 870, 410);
    ctx.fillStyle = ink; ctx.font = 'bold 36px Arial'; ctx.fillText(invoice.customerName, 110, 463); ctx.font = '28px Arial';
    canvasText(ctx, [invoice.mobile, invoice.address].filter(Boolean).join('  |  '), 110, 510, 680, 35);
    ctx.font = 'bold 29px Arial'; ctx.fillText(invoice.invoiceNo, 870, 463); ctx.font = '27px Arial'; ctx.fillText(new Date(invoice.date + 'T00:00').toLocaleDateString('en-IN'), 870, 510);
    let y = 635; ctx.fillStyle = '#eaf3eb'; ctx.fillRect(70, y, 1100, 65); ctx.fillStyle = g; ctx.font = 'bold 25px Arial';
    ctx.fillText('#', 95, y + 42); ctx.fillText('PRODUCT', 165, y + 42); ctx.fillText('QTY', 760, y + 42); ctx.fillText('RATE', 890, y + 42); ctx.fillText('AMOUNT', 1015, y + 42); y += 115;
    invoice.products.forEach((p, i) => { const amount = p.qty * p.rate - Math.min(p.discount, p.qty * p.rate); ctx.fillStyle = ink; ctx.font = '28px Arial'; ctx.fillText(String(i + 1), 95, y); ctx.fillText(p.name.slice(0, 32), 165, y); ctx.fillText(String(p.qty), 780, y); ctx.fillText(pdfMoney(p.rate), 875, y); ctx.fillText(pdfMoney(amount), 1015, y); if (p.discount) { ctx.fillStyle = muted; ctx.font = '22px Arial'; ctx.fillText(`Discount: ${pdfMoney(p.discount)}`, 165, y + 34); y += 28; } ctx.strokeStyle = '#e4ebe5'; ctx.beginPath(); ctx.moveTo(70, y + 26); ctx.lineTo(1170, y + 26); ctx.stroke(); y += 74; });
    y = Math.max(y + 30, 1070); ctx.strokeStyle = '#b4c8b8'; ctx.beginPath(); ctx.moveTo(735, y); ctx.lineTo(1170, y); ctx.stroke(); ctx.fillStyle = ink; ctx.font = '29px Arial'; ctx.fillText('Subtotal', 850, y + 52); ctx.fillText(pdfMoney(invoice.subtotal), 1025, y + 52); ctx.fillText('Discount', 850, y + 104); ctx.fillText(`- ${pdfMoney(invoice.discount)}`, 1025, y + 104);
    ctx.fillStyle = g; ctx.roundRect(735, y + 142, 435, 88, 14); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 34px Arial'; ctx.fillText('TOTAL', 765, y + 198); ctx.fillText(pdfMoney(invoice.total), 985, y + 198);
    ctx.strokeStyle = '#65b52d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(70, 1470); ctx.lineTo(1170, 1470); ctx.stroke(); ctx.fillStyle = ink; ctx.font = 'bold 25px Arial'; ctx.fillText(settings.businessName || 'FIT FORMULA NUTRITION STORE', 70, 1525); ctx.font = '22px Arial'; let footerY = canvasText(ctx, settings.businessAddress, 70, 1565, 640, 29); if (settings.businessMobile) ctx.fillText(`Phone: ${settings.businessMobile}`, 70, footerY + 30); ctx.fillStyle = muted; ctx.font = '20px Arial'; ctx.fillText(settings.terms || 'Thank you for shopping with us.', 70, 1675);
    canvas.toBlob(blob => resolve({blob, url: URL.createObjectURL(blob)}), 'image/png');
  });
  async function createInvoicePdf() {
    if (!valid()) return null;
    if (!window.jspdf) { alert('PDF service is still loading. Please check internet and try again.'); return null; }
    const invoice = form(), settings = saveSettings(); saveInvoiceSilently(invoice);
    const {jsPDF} = window.jspdf, doc = new jsPDF({unit: 'mm', format: 'a4'}), logo = await loadLogo(), seal = await loadSeal();
    const M = 15, W = 180; doc.setFillColor(7, 92, 43); doc.roundedRect(M, 15, W, 40, 3, 3, 'F');
    if (logo) { doc.setFillColor(255); doc.roundedRect(163, 20, 27, 27, 2, 2, 'F'); doc.addImage(logo, 'JPEG', 164, 21, 25, 25); }
    doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.text(settings.businessName || 'FIT FORMULA NUTRITION STORE', 21, 31); doc.setFont('helvetica', 'normal'); doc.setFontSize(16); doc.text('NUTRITION STORE  |  CUSTOMER INVOICE', 21, 42);
    doc.setDrawColor(220,230,223); doc.setFillColor(250,252,250); doc.roundedRect(M,64,W,38,2,2,'FD'); doc.setTextColor(7,92,43); doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text('BILL TO',21,75); doc.text('INVOICE DETAILS',137,75);
    doc.setTextColor(16,37,26); doc.setFontSize(20); doc.text(invoice.customerName,21,86); doc.setFont('helvetica','normal'); doc.setFontSize(15); const details=[invoice.mobile,invoice.address].filter(Boolean).join('  |  '); doc.text(doc.splitTextToSize(details,104),21,95); doc.setFont('helvetica','bold'); doc.text(invoice.invoiceNo,137,86); doc.setFont('helvetica','normal'); doc.text(new Date(invoice.date+'T00:00').toLocaleDateString('en-IN'),137,95);
    let y=116; const tableHead=()=>{doc.setFillColor(234,243,235);doc.rect(M,y,W,12,'F');doc.setTextColor(7,92,43);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text('#',19,y+8);doc.text('PRODUCT',29,y+8);doc.text('QTY',124,y+8,{align:'right'});doc.text('RATE',151,y+8,{align:'right'});doc.text('AMOUNT',190,y+8,{align:'right'});y+=20;doc.setTextColor(16,37,26);doc.setFont('helvetica','normal');}; tableHead();
    invoice.products.forEach((p,i)=>{const total=p.qty*p.rate-Math.min(p.discount,p.qty*p.rate), h=p.discount?16:12;if(y+h>190){doc.addPage();y=20;tableHead();}doc.setFontSize(16);doc.text(String(i+1),19,y);doc.text(doc.splitTextToSize(p.name,80)[0],29,y);doc.text(String(p.qty),124,y,{align:'right'});doc.text(pdfMoney(p.rate),151,y,{align:'right'});doc.text(pdfMoney(total),190,y,{align:'right'});if(p.discount){doc.setFontSize(13);doc.setTextColor(100,113,105);doc.text(`Discount: ${pdfMoney(p.discount)}`,29,y+6);doc.setTextColor(16,37,26);}doc.setDrawColor(235,239,235);doc.line(M,y+h-3,195,y+h-3);y+=h;});
    const sy=Math.max(y+10,165);doc.setDrawColor(180,200,184);doc.line(120,sy,195,sy);doc.setFontSize(16);doc.text('Subtotal',164,sy+10,{align:'right'});doc.text(pdfMoney(invoice.subtotal),190,sy+10,{align:'right'});doc.text('Discount',164,sy+20,{align:'right'});doc.text(`- ${pdfMoney(invoice.discount)}`,190,sy+20,{align:'right'});doc.setFillColor(7,92,43);doc.roundedRect(120,sy+28,75,18,2,2,'F');doc.setTextColor(255);doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text('TOTAL',125,sy+40);doc.text(pdfMoney(invoice.total),190,sy+40,{align:'right'});
    const fy=250;doc.setDrawColor(101,181,45);doc.line(M,fy-6,195,fy-6);doc.setTextColor(16,37,26);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(settings.businessName||'FIT FORMULA NUTRITION STORE',M,fy+2);doc.setFont('helvetica','normal');doc.setFontSize(13);let info=fy+9;const addr=doc.splitTextToSize(settings.businessAddress||'',100);doc.text(addr,M,info);info+=addr.length*6;if(settings.businessMobile)doc.text(`Phone: ${settings.businessMobile}`,M,info+6);if(seal)doc.addImage(seal,'JPEG',161,fy-1,23,23);doc.setFontSize(13);doc.text(settings.terms||'Thank you for shopping with us.',M,281);doc.setFontSize(12);doc.setTextColor(100,113,105);doc.text('Computer-generated invoice - no signature is required.',105,289,{align:'center'});
    const image = await invoiceImage(invoice,settings); return {doc, pdfBlob:doc.output('blob'), pdfFilename:`${invoice.invoiceNo}.pdf`, imageBlob:image.blob, imageUrl:image.url, imageFilename:`${invoice.invoiceNo}.png`, invoice};
  }
  async function generate() { const button=byId('pdfBtn');button.disabled=true;button.textContent='Generating…';try{if(generated?.imageUrl)URL.revokeObjectURL(generated.imageUrl);generated=await createInvoicePdf();if(generated){setReady(true);button.textContent='Regenerate invoice';}}finally{if(!generated)button.textContent='Generate invoice';button.disabled=false;} }
  async function shareInvoice() { if (!generated) return; const message=`FIT FORMULA Nutrition Store\nInvoice: ${generated.invoice.invoiceNo}\nCustomer: ${generated.invoice.customerName}\nTotal: ${pdfMoney(generated.invoice.total)}\n\nInvoice image and store contact are attached.`; const image=new File([generated.imageBlob],generated.imageFilename,{type:'image/png'}), card=contactFile(), files=[image,card]; if(navigator.share&&navigator.canShare?.({files})){try{await navigator.share({title:'FIT FORMULA Invoice',text:message,files});return;}catch(error){if(error.name==='AbortError')return;}} downloadImage(); saveContact(); window.open(`https://wa.me/?text=${encodeURIComponent(message+' Downloaded invoice image and contact card are ready to attach.')}`,'_blank'); }
  function printInvoice(){if(!generated)return;const url=URL.createObjectURL(generated.pdfBlob),win=window.open(url,'_blank');if(win)win.onload=()=>win.print();}
  byId('pdfBtn').onclick=generate;byId('saveBtn').onclick=downloadPdf;byId('saveImageBtn').onclick=downloadImage;byId('contactBtn').onclick=saveContact;byId('shareBtn').onclick=shareInvoice;byId('printBtn').onclick=printInvoice;byId('viewImageBtn').onclick=()=>{byId('invoiceImagePreview').src=generated.imageUrl;byId('imageDialog').showModal();};byId('closeImageBtn').onclick=()=>byId('imageDialog').close();setReady(false);
})();
