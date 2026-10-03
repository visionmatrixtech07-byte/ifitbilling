/* Generated-invoice workflow and A4 PDF layout. */
(() => {
  const byId = id => document.getElementById(id);
  const STORAGE_KEY = 'ifitBillingV1';
  let generated = null;
  const pdfMoney = value => `Rs. ${Number(value || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  const setReady = ready => {
    ['saveBtn', 'printBtn', 'shareBtn'].forEach(id => byId(id).disabled = !ready);
    byId('generationStatus').textContent = ready ? 'Invoice ready' : 'Draft invoice';
  };
  const saveInvoiceSilently = invoice => {
    const invoices = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = invoices.findIndex(item => item.invoiceNo === invoice.invoiceNo);
    if (index === -1) invoices.unshift(invoice); else invoices[index] = invoice;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    renderHistory();
  };
  const download = () => {
    if (!generated) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(generated.blob);
    link.download = generated.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const addText = (doc, text, x, y, maxWidth, size = 8, color = [16, 37, 26]) => {
    doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text || '', maxWidth);
    doc.text(lines, x, y);
    return y + lines.length * (size * .47);
  };
  async function createInvoicePdf() {
    if (!valid()) return null;
    if (!window.jspdf) { alert('PDF service is still loading. Please check internet and try again.'); return null; }
    const invoice = form();
    const settings = saveSettings();
    saveInvoiceSilently(invoice);
    const {jsPDF} = window.jspdf;
    const doc = new jsPDF({unit: 'mm', format: 'a4'});
    const logo = await loadLogo();
    const seal = await loadSeal();
    const M = 15, W = 180;
    doc.setFillColor(7, 92, 43); doc.roundedRect(M, 15, W, 36, 3, 3, 'F');
    if (logo) { doc.setFillColor(255); doc.roundedRect(163, 19, 27, 27, 2, 2, 'F'); doc.addImage(logo, 'JPEG', 164, 20, 25, 25); }
    doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text(settings.businessName || 'FIT FORMULA NUTRITION STORE', 21, 29);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text('NUTRITION STORE  |  CUSTOMER INVOICE', 21, 37);
    doc.setDrawColor(220, 230, 223); doc.setFillColor(250, 252, 250); doc.roundedRect(M, 59, W, 28, 2, 2, 'FD');
    doc.setTextColor(7, 92, 43); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('BILL TO', 21, 68); doc.text('INVOICE DETAILS', 139, 68);
    doc.setTextColor(16, 37, 26); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text(invoice.customerName, 21, 75);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); const customerDetails = [invoice.mobile, invoice.address].filter(Boolean).join('  |  '); doc.text(doc.splitTextToSize(customerDetails, 106), 21, 81);
    doc.setFont('helvetica', 'bold'); doc.text(invoice.invoiceNo, 139, 75); doc.setFont('helvetica', 'normal'); doc.text(new Date(invoice.date + 'T00:00').toLocaleDateString('en-IN'), 139, 81);
    let y = 98;
    const tableHead = () => { doc.setFillColor(234, 243, 235); doc.rect(M, y, W, 9, 'F'); doc.setTextColor(7, 92, 43); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('#', 19, y + 6); doc.text('PRODUCT', 29, y + 6); doc.text('QTY', 124, y + 6, {align: 'right'}); doc.text('RATE', 151, y + 6, {align: 'right'}); doc.text('AMOUNT', 190, y + 6, {align: 'right'}); y += 15; doc.setTextColor(16, 37, 26); doc.setFont('helvetica', 'normal'); };
    tableHead();
    invoice.products.forEach((product, i) => {
      const lineTotal = product.qty * product.rate - Math.min(product.discount, product.qty * product.rate);
      const rowHeight = product.discount > 0 ? 11 : 8;
      if (y + rowHeight > 190) { doc.addPage(); y = 20; tableHead(); }
      doc.setFontSize(8.5); doc.text(String(i + 1), 19, y); doc.text(doc.splitTextToSize(product.name, 82)[0], 29, y); doc.text(String(product.qty), 124, y, {align: 'right'}); doc.text(pdfMoney(product.rate), 151, y, {align: 'right'}); doc.text(pdfMoney(lineTotal), 190, y, {align: 'right'});
      if (product.discount > 0) { doc.setFontSize(7); doc.setTextColor(100, 113, 105); doc.text(`Discount: ${pdfMoney(product.discount)}`, 29, y + 4); doc.setTextColor(16, 37, 26); }
      doc.setDrawColor(235, 239, 235); doc.line(M, y + rowHeight - 3, 195, y + rowHeight - 3); y += rowHeight;
    });
    const summaryY = Math.max(y + 7, 145);
    doc.setDrawColor(180, 200, 184); doc.line(123, summaryY, 195, summaryY);
    doc.setFontSize(9); doc.text('Subtotal', 165, summaryY + 7, {align: 'right'}); doc.text(pdfMoney(invoice.subtotal), 190, summaryY + 7, {align: 'right'});
    doc.text('Discount', 165, summaryY + 14, {align: 'right'}); doc.text(`- ${pdfMoney(invoice.discount)}`, 190, summaryY + 14, {align: 'right'});
    doc.setFillColor(7, 92, 43); doc.roundedRect(123, summaryY + 20, 72, 13, 2, 2, 'F'); doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('TOTAL', 128, summaryY + 28); doc.text(pdfMoney(invoice.total), 190, summaryY + 28, {align: 'right'});
    const footerY = 244;
    doc.setDrawColor(101, 181, 45); doc.line(M, footerY - 6, 195, footerY - 6);
    doc.setTextColor(16, 37, 26); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text(settings.businessName || 'FIT FORMULA NUTRITION STORE', M, footerY + 1);
    doc.setFont('helvetica', 'normal'); let infoY = footerY + 6; infoY = addText(doc, settings.businessAddress, M, infoY, 100, 7.5); if (settings.businessMobile) infoY = addText(doc, `Phone: ${settings.businessMobile}`, M, infoY + 1, 100, 7.5); if (settings.upi) addText(doc, `UPI: ${settings.upi}`, M, infoY + 1, 100, 7.5);
    if (seal) doc.addImage(seal, 'JPEG', 161, footerY - 1, 23, 23);
    doc.setTextColor(100, 113, 105); doc.setFontSize(7); doc.text('Official seal', 172.5, footerY + 26, {align: 'center'});
    doc.setTextColor(16, 37, 26); doc.setFontSize(7.5); doc.text(settings.terms || 'Thank you for shopping with us.', M, 281);
    doc.setTextColor(100, 113, 105); doc.setFontSize(7); doc.text('Computer-generated invoice - no signature is required.', 105, 289, {align: 'center'});
    const blob = doc.output('blob');
    return {doc, blob, filename: `${invoice.invoiceNo}.pdf`, invoice};
  }
  async function generate() {
    const button = byId('pdfBtn'); button.disabled = true; button.textContent = 'Generating…';
    try { generated = await createInvoicePdf(); if (generated) { setReady(true); button.textContent = 'Regenerate invoice'; } }
    finally { if (!generated) button.textContent = 'Generate invoice'; button.disabled = false; }
  }
  async function shareInvoice() {
    if (!generated) return;
    const message = `FIT FORMULA Nutrition Store\nInvoice: ${generated.invoice.invoiceNo}\nCustomer: ${generated.invoice.customerName}\nTotal: ${pdfMoney(generated.invoice.total)}\n\nPlease find the invoice PDF attached.`;
    const file = new File([generated.blob], generated.filename, {type: 'application/pdf'});
    if (navigator.share && navigator.canShare && navigator.canShare({files: [file]})) {
      try { await navigator.share({title: 'FIT FORMULA Invoice', text: message, files: [file]}); return; } catch (error) { if (error.name === 'AbortError') return; }
    }
    download();
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }
  async function printInvoice() { if (!generated) return; const url = URL.createObjectURL(generated.blob); const win = window.open(url, '_blank'); if (win) win.onload = () => win.print(); }
  byId('pdfBtn').onclick = generate;
  byId('saveBtn').onclick = download;
  byId('shareBtn').onclick = shareInvoice;
  byId('printBtn').onclick = printInvoice;
  setReady(false);
})();
