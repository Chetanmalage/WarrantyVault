const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const ServiceRecord = require('../models/ServiceRecord');
const Document = require('../models/Document');

const BRAND = '#6d5efc';
const INK = '#0f172a';
const MUTED = '#64748b';
const OK = '#10b981';
const WARN = '#f59e0b';
const BAD = '#ef4444';
const LINE = '#e6eaf2';

const statusColor = (s) => (s === 'active' ? OK : s === 'expiring' ? WARN : BAD);
const statusBg = (s) => (s === 'active' ? '#d1fae5' : s === 'expiring' ? '#fef3c7' : '#fee2e2');
const statusLabel = (s) => (s === 'active' ? 'Active' : s === 'expiring' ? 'Expiring' : 'Expired');

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

function drawHeader(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 104).fill('#211d49');
  doc.rect(0, 101, doc.page.width, 3).fill(BRAND);
  doc.fillColor('#c7c2ff').fontSize(8).font('Helvetica-Bold')
    .text('WARRANTYVAULT  /  PERSONAL RECORD', 40, 18, { characterSpacing: 1 });
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(title, 40, 38, {
    width: doc.page.width - 80,
    ellipsis: true,
  });
  doc.fillColor('#d2d0e4').fontSize(8).font('Helvetica')
    .text(subtitle, 40, 72, { width: doc.page.width - 80, lineGap: 2 });
}

function drawFooter(doc) {
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.moveTo(40, doc.page.height - 37).lineTo(doc.page.width - 40, doc.page.height - 37)
      .strokeColor(LINE).stroke();
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
      .text('WarrantyVault  ·  Your records, in one place', 40, doc.page.height - 27, {
        width: doc.page.width - 150,
        lineBreak: false,
      })
      .text(`Page ${i + 1} of ${count}`, 40, doc.page.height - 27, {
        align: 'right', width: doc.page.width - 80,
        lineBreak: false,
      });
    doc.page.margins.bottom = bottomMargin;
  }
}

exports.productsReport = async (req, res, next) => {
  try {
    const [products, services, docCount] = await Promise.all([
      Product.find({ user: req.user._id }).sort({ createdAt: -1 }),
      ServiceRecord.find({ user: req.user._id }).populate('product', 'name'),
      Document.countDocuments({ user: req.user._id }),
    ]);

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="warrantyvault-report-${Date.now()}.pdf"`);
    doc.pipe(res);

    drawHeader(
      doc,
      'Digital Warranty & Service Report',
      `${req.user.name} • ${req.user.email}\nGenerated ${new Date().toLocaleString('en-GB')}`
    );

    const active = products.filter((p) => p.warrantyStatus === 'active').length;
    const expiring = products.filter((p) => p.warrantyStatus === 'expiring').length;
    const expired = products.filter((p) => p.warrantyStatus === 'expired').length;

    const stats = [
      { label: 'TOTAL PRODUCTS', value: products.length, color: BRAND },
      { label: 'ACTIVE', value: active, color: OK },
      { label: 'EXPIRING', value: expiring, color: WARN },
      { label: 'EXPIRED', value: expired, color: BAD },
    ];
    const cardW = (doc.page.width - 80 - 30) / 4;
    let y = 110;
    stats.forEach((s, i) => {
      const x = 40 + i * (cardW + 10);
      doc.roundedRect(x, y, cardW, 62, 10).fillAndStroke('#ffffff', LINE);
      doc.roundedRect(x, y, 4, 62, 2).fill(s.color);
      doc.fillColor(MUTED).fontSize(7).font('Helvetica-Bold')
        .text(s.label, x + 12, y + 12, { width: cardW - 20, characterSpacing: .5 });
      doc.fillColor(INK).fontSize(22).font('Helvetica-Bold').text(String(s.value), x + 12, y + 29);
    });

    y += 80;
    const purchaseSpend = products.reduce((s, p) => s + (p.purchasePrice || 0), 0);
    const serviceSpend = services.reduce((s, r) => s + (r.cost || 0), 0);
    const metrics = [
      { label: 'PURCHASE VALUE', value: fmtMoney(purchaseSpend) },
      { label: 'SERVICE SPEND', value: fmtMoney(serviceSpend) },
      { label: 'RECORDS & DOCUMENTS', value: `${services.length} services  ·  ${docCount} files` },
    ];
    const metricGap = 10;
    const metricW = (doc.page.width - 80 - metricGap * 2) / 3;
    metrics.forEach((metric, i) => {
      const x = 40 + i * (metricW + metricGap);
      doc.roundedRect(x, y, metricW, 49, 9).fillAndStroke('#f8f9ff', LINE);
      doc.fillColor(MUTED).fontSize(7).font('Helvetica-Bold')
        .text(metric.label, x + 11, y + 10, { width: metricW - 22, characterSpacing: .4 });
      doc.fillColor(INK).fontSize(10).font('Helvetica-Bold')
        .text(metric.value, x + 11, y + 25, { width: metricW - 22, ellipsis: true });
    });

    y += 72;
    doc.fillColor(INK).fontSize(13).font('Helvetica-Bold').text('Product warranties', 40, y);
    doc.fillColor(MUTED).fontSize(8).font('Helvetica')
      .text(`${products.length} ${products.length === 1 ? 'product' : 'products'} in your vault`, 40, y + 2, {
        align: 'right', width: doc.page.width - 80,
      });
    y += 22;

    const COLS = [
      { label: 'PRODUCT', x: 40, w: 200 },
      { label: 'CATEGORY', x: 240, w: 90 },
      { label: 'WARRANTY END', x: 330, w: 100 },
      { label: 'STATUS', x: 430, w: 80 },
      { label: 'DAYS', x: 510, w: 50 },
    ];

    const drawTableHeader = () => {
      doc.roundedRect(40, y, doc.page.width - 80, 22, 4).fill('#f1efff');
      COLS.forEach((c) =>
        doc.fillColor('#6259a9').fontSize(7).font('Helvetica-Bold')
          .text(c.label, c.x + 6, y + 7, { width: c.w, characterSpacing: .3 })
      );
      y += 22;
    };
    drawTableHeader();

    if (products.length === 0) {
      doc.fillColor(MUTED).fontSize(10).font('Helvetica').text('No products yet.', 46, y + 10);
      y += 30;
    }

    products.forEach((p, index) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 40; drawTableHeader(); }

      if (index % 2 === 1) doc.rect(40, y, doc.page.width - 80, 32).fill('#fbfbfe');
      doc.fillColor(INK).fontSize(9).font('Helvetica-Bold')
        .text(p.name, 46, y + 6, { width: 194, ellipsis: true });
      doc.fillColor(MUTED).fontSize(8).font('Helvetica')
        .text(p.brand || '—', 46, y + 18, { width: 194, ellipsis: true });

      doc.fillColor(INK).fontSize(9).font('Helvetica').text(p.category, 246, y + 11, { width: 84 });
      doc.fillColor(INK).fontSize(9).text(fmtDate(p.warrantyEnd), 336, y + 11, { width: 94 });

      doc.roundedRect(436, y + 8, 72, 16, 8).fill(statusBg(p.warrantyStatus));
      doc.fillColor(statusColor(p.warrantyStatus)).fontSize(8).font('Helvetica-Bold')
        .text(statusLabel(p.warrantyStatus), 436, y + 12, { width: 72, align: 'center' });

      const d = p.daysRemaining;
      doc.fillColor(INK).fontSize(9).font('Helvetica')
        .text(d < 0 ? `${Math.abs(d)}` : String(d ?? '—'), 516, y + 11, { width: 44, align: 'right' });

      doc.moveTo(40, y + 30).lineTo(doc.page.width - 40, y + 30).strokeColor(LINE).stroke();
      y += 32;
    });

    if (services.length) {
      if (y > doc.page.height - 120) { doc.addPage(); y = 40; } else y += 16;
      doc.fillColor(INK).fontSize(13).font('Helvetica-Bold').text('Recent service records', 40, y);
      y += 22;

      services.slice(0, 40).forEach((s) => {
        if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
        doc.fillColor(INK).fontSize(9).font('Helvetica-Bold')
          .text(`${s.serviceType} • ${s.product?.name || '—'} • ${fmtDate(s.serviceDate)}`, 40, y, { width: doc.page.width - 200 });
        doc.fillColor(INK).fontSize(9).font('Helvetica-Bold')
          .text(fmtMoney(s.cost), doc.page.width - 140, y, { width: 100, align: 'right' });
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
          .text(s.description, 40, y + 12, { width: doc.page.width - 200, ellipsis: true });
        doc.moveTo(40, y + 26).lineTo(doc.page.width - 40, y + 26).strokeColor(LINE).stroke();
        y += 30;
      });
    }

    drawFooter(doc);
    doc.end();
  } catch (err) { next(err); }
};

exports.productReport = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, user: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const [services, documents] = await Promise.all([
      ServiceRecord.find({ product: product._id, user: req.user._id }).sort({ serviceDate: -1 }),
      Document.find({ product: product._id, user: req.user._id }).sort({ createdAt: -1 }),
    ]);

    const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${product.name.replace(/\W+/g, '-')}-report.pdf"`);
    doc.pipe(res);

    drawHeader(doc, `Product Report • ${product.name}`, `${req.user.name} • ${req.user.email}\nGenerated ${new Date().toLocaleString('en-GB')}`);

    let y = 110;
    doc.roundedRect(40, y, doc.page.width - 80, 100, 12).fillAndStroke('#f8f9ff', LINE);
    doc.fillColor(INK).fontSize(16).font('Helvetica-Bold').text(product.name, 56, y + 18, { width: doc.page.width - 160 });
    doc.fillColor(MUTED).fontSize(10).font('Helvetica')
      .text(`${product.brand || 'No brand'} • ${product.category}`, 56, y + 42);

    const pillW = 90;
    doc.roundedRect(doc.page.width - 40 - pillW - 16, y + 18, pillW, 18, 9).fill(statusBg(product.warrantyStatus));
    doc.fillColor(statusColor(product.warrantyStatus)).fontSize(9).font('Helvetica-Bold')
      .text(statusLabel(product.warrantyStatus), doc.page.width - 40 - pillW - 16, y + 22, { width: pillW, align: 'center' });

    y += 80;
    const rows = [
      ['Purchase date', fmtDate(product.purchaseDate)],
      ['Purchase price', fmtMoney(product.purchasePrice)],
      ['Warranty start', fmtDate(product.warrantyStart)],
      ['Warranty end', fmtDate(product.warrantyEnd)],
      ['Remaining', product.daysRemaining < 0 ? `${Math.abs(product.daysRemaining)} days ago` : `${product.daysRemaining} days`],
      ['Provider', product.warrantyProvider || '—'],
      ['Invoice #', product.invoiceNumber || '—'],
      ['Serial #', product.serialNumber || '—'],
    ];
    rows.forEach(([k, v], i) => {
      const yy = y + i * 18;
      doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(k, 56, yy);
      doc.fillColor(INK).fontSize(9).font('Helvetica-Bold').text(v, 220, yy);
    });
    y += rows.length * 18 + 20;

    if (product.coverageDetails) {
      doc.fillColor(INK).fontSize(11).font('Helvetica-Bold').text('Coverage details', 40, y);
      y += 16;
      doc.fillColor(MUTED).fontSize(9).font('Helvetica').text(product.coverageDetails, 40, y, { width: doc.page.width - 80 });
      y += 30;
    }

    doc.fillColor(INK).fontSize(13).font('Helvetica-Bold').text(`Service history (${services.length})`, 40, y);
    y += 20;
    if (!services.length) {
      doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('No service records.', 40, y);
      y += 20;
    } else {
      services.forEach((s) => {
        if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
        doc.fillColor(INK).fontSize(9).font('Helvetica-Bold')
          .text(`${s.serviceType} • ${fmtDate(s.serviceDate)}`, 40, y);
        doc.fillColor(INK).fontSize(9).font('Helvetica-Bold')
          .text(fmtMoney(s.cost), doc.page.width - 140, y, { width: 100, align: 'right' });
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
          .text(s.description, 40, y + 12, { width: doc.page.width - 200, ellipsis: true });
        doc.moveTo(40, y + 26).lineTo(doc.page.width - 40, y + 26).strokeColor(LINE).stroke();
        y += 30;
      });
    }

    y += 10;
    doc.fillColor(INK).fontSize(13).font('Helvetica-Bold').text(`Documents (${documents.length})`, 40, y);
    y += 20;
    if (!documents.length) {
      doc.fillColor(MUTED).fontSize(9).font('Helvetica').text('No documents attached.', 40, y);
    } else {
      documents.forEach((d) => {
        if (y > doc.page.height - 60) { doc.addPage(); y = 40; }
        doc.fillColor(INK).fontSize(9).font('Helvetica-Bold').text(d.title, 40, y, { width: 300, ellipsis: true });
        doc.fillColor(MUTED).fontSize(8).font('Helvetica')
          .text(`${d.docType} • ${(d.size / 1024).toFixed(0)} KB • uploaded ${fmtDate(d.createdAt)}`,
            40, y + 12, { width: doc.page.width - 80 });
        y += 30;
      });
    }

    drawFooter(doc);
    doc.end();
  } catch (err) { next(err); }
};