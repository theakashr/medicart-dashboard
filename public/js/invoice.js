/* ============================================================
   MediCart - Invoice Generation, Print, PDF Download
   ============================================================ */

// ── Render Invoice HTML ──────────────────────────────────────
function renderInvoice(invoice) {
  const content = document.getElementById('invoiceContent');
  const shop = shopConfig;
  const now = new Date(invoice.createdAt || Date.now());

  content.innerHTML = `
    <div class="invoice-preview" id="invoicePrint">

      <!-- Header -->
      <div class="invoice-header">
        <div class="invoice-shop">
          <div class="invoice-shop__logo">M+</div>
          <div>
            <div class="invoice-shop__name">${shop.name || 'MediCart Pharmacy'}</div>
            <div class="invoice-shop__details">
              ${shop.address || ''}<br>
              📞 ${shop.phone || ''}<br>
              GSTIN: ${shop.gstin || 'N/A'}
            </div>
          </div>
        </div>
        <div class="invoice-meta">
          <div class="invoice-meta__number">Invoice #${invoice.invoiceNumber}</div>
          <div class="invoice-meta__date">
            📅 ${formatDate(now)}<br>
            🕐 ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
        </div>
      </div>

      <!-- Customer -->
      <div class="invoice-customer">
        <div>
          <div class="invoice-customer__label">Customer</div>
          <div class="invoice-customer__value">${invoice.customer?.name || 'Walk-in Customer'}</div>
        </div>
        <div>
          <div class="invoice-customer__label">Phone</div>
          <div class="invoice-customer__value">${invoice.customer?.phone || 'N/A'}</div>
        </div>
        <div>
          <div class="invoice-customer__label">Payment</div>
          <div class="invoice-customer__value" style="text-transform:capitalize;">${invoice.paymentMethod || 'Cash'}</div>
        </div>
        <div>
          <div class="invoice-customer__label">Status</div>
          <div class="invoice-customer__value">✅ Paid</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="invoice-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Medicine</th>
            <th>Qty</th>
            <th>Price</th>
            <th>GST</th>
            <th>Disc</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${item.medicineName}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${item.gstPercent}%</td>
              <td>${item.discountPercent > 0 ? item.discountPercent + '%' : '-'}</td>
              <td style="text-align:right">${formatCurrency(item.lineTotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Summary -->
      <div class="invoice-summary">
        <div class="invoice-summary__table">
          <div class="invoice-summary__row">
            <span>Subtotal</span>
            <span>${formatCurrency(invoice.subtotal)}</span>
          </div>
          <div class="invoice-summary__row invoice-summary__row--sub">
            <span>CGST</span>
            <span>${formatCurrency(invoice.totalCGST)}</span>
          </div>
          <div class="invoice-summary__row invoice-summary__row--sub">
            <span>SGST</span>
            <span>${formatCurrency(invoice.totalSGST)}</span>
          </div>
          ${invoice.totalDiscount > 0 ? `
          <div class="invoice-summary__row" style="color:var(--danger)">
            <span>Discount</span>
            <span>-${formatCurrency(invoice.totalDiscount)}</span>
          </div>` : ''}
          ${invoice.roundOff !== 0 ? `
          <div class="invoice-summary__row">
            <span>Round Off</span>
            <span>${invoice.roundOff >= 0 ? '+' : ''}${formatCurrency(invoice.roundOff)}</span>
          </div>` : ''}
          <hr class="invoice-summary__divider">
          <div class="invoice-summary__row invoice-summary__row--total">
            <span>Grand Total</span>
            <span>${formatCurrency(invoice.grandTotal)}</span>
          </div>
          <div style="font-size:0.6875rem;color:#64748b;text-align:right;margin-top:0.375rem;">
            ${numberToWords(invoice.grandTotal)}
          </div>
        </div>
      </div>

      <!-- Payment & QR -->
      <div class="invoice-payment">
        <div>
          <div style="font-size:0.75rem;color:#64748b;">Payment Method</div>
          <div class="invoice-payment__method">${invoice.paymentMethod === 'upi' ? '📱 UPI' : invoice.paymentMethod === 'card' ? '💳 Card' : '💵 Cash'}</div>
          ${invoice.transactionId ? `<div style="font-size:0.75rem;color:#64748b;margin-top:0.25rem;">TXN: ${invoice.transactionId}</div>` : ''}
        </div>
        <div class="invoice-qr">
          <div style="text-align:center;">
            <div style="font-size:2rem;">📱</div>
            <div>Scan to Pay</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="invoice-footer">
        <div class="invoice-footer__thankyou">🙏 Thank You for Your Purchase!</div>
        <div class="invoice-footer__note">This is a computer-generated invoice. No signature required.<br>For queries, contact: ${shop.phone || ''}</div>
      </div>
    </div>
  `;

  // Store invoice for actions
  window._currentInvoice = invoice;
}

// ── Print Invoice ────────────────────────────────────────────
document.getElementById('btnPrintInvoice').addEventListener('click', () => {
  const printContent = document.getElementById('invoicePrint');
  if (!printContent) return;

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - MediCart</title>
      <link rel="stylesheet" href="/css/invoice.css">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>body{margin:0;padding:0;} .invoice-preview{padding:1.5rem;}</style>
    </head>
    <body>
      ${printContent.outerHTML}
      <script>
        setTimeout(() => { window.print(); window.close(); }, 600);
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
});

// ── Download PDF ─────────────────────────────────────────────
document.getElementById('btnDownloadPDF').addEventListener('click', async () => {
  const element = document.getElementById('invoicePrint');
  if (!element) return;

  const btn = document.getElementById('btnDownloadPDF');
  btn.disabled = true;
  btn.innerHTML = '⏳ Generating PDF...';

  try {
    // Check libraries are loaded
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas library is not loaded. Please reload the page.');
    }

    let jsPDFClass;
    if (window.jspdf && window.jspdf.jsPDF) {
      jsPDFClass = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
      jsPDFClass = window.jsPDF;
    } else {
      throw new Error('jsPDF library is not loaded. Please reload the page.');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: false,
      backgroundColor: '#ffffff',
      logging: false
    });

    const pdf = new jsPDFClass('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

    const invoiceNum = window._currentInvoice?.invoiceNumber || 'invoice';
    pdf.save(`MediCart_${invoiceNum}.pdf`);

    showToast('PDF downloaded successfully!', 'success');
  } catch (err) {
    console.error('PDF generation error:', err);
    showToast('PDF generation failed: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📥 Download PDF';
  }
});

// ── Share WhatsApp ───────────────────────────────────────────
document.getElementById('btnShareWhatsApp').addEventListener('click', () => {
  const invoice = window._currentInvoice;
  if (!invoice) return;

  const items = invoice.items.map((item, i) =>
    `${i + 1}. ${item.medicineName} x${item.quantity} = ${formatCurrency(item.lineTotal)}`
  ).join('\n');

  const message = encodeURIComponent(
    `🏥 *${shopConfig.name || 'MediCart Pharmacy'}*\n` +
    `📋 Invoice: *${invoice.invoiceNumber}*\n` +
    `📅 ${formatDateTime(invoice.createdAt)}\n\n` +
    `👤 ${invoice.customer?.name || 'Walk-in Customer'}\n\n` +
    `📦 *Items:*\n${items}\n\n` +
    `💰 *Grand Total: ${formatCurrency(invoice.grandTotal)}*\n` +
    `💳 Payment: ${invoice.paymentMethod}\n\n` +
    `🙏 Thank you for your purchase!`
  );

  const phone = invoice.customer?.phone?.replace(/\D/g, '') || '';
  const url = phone
    ? `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${message}`
    : `https://wa.me/?text=${message}`;

  window.open(url, '_blank');
});

// ── Close Invoice Modal ──────────────────────────────────────
document.getElementById('btnCloseInvoice').addEventListener('click', () => {
  document.getElementById('invoiceModal').classList.add('hidden');
});

// Close modal on overlay click
document.getElementById('invoiceModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('invoiceModal').classList.add('hidden');
  }
});
