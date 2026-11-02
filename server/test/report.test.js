const test = require('node:test');
const assert = require('node:assert/strict');
const { Writable } = require('node:stream');
const Product = require('../models/Product');
const ServiceRecord = require('../models/ServiceRecord');
const Document = require('../models/Document');
const { productsReport } = require('../controllers/reportController');

test('products PDF paginates without adding blank footer pages', async (t) => {
  const original = {
    productFind: Product.find,
    serviceFind: ServiceRecord.find,
    documentCount: Document.countDocuments,
  };
  t.after(() => {
    Product.find = original.productFind;
    ServiceRecord.find = original.serviceFind;
    Document.countDocuments = original.documentCount;
  });

  Product.find = () => ({
    sort: async () => Array.from({ length: 32 }, (_, index) => ({
      name: `Product ${index + 1}`,
      brand: 'Example',
      category: 'Other',
      warrantyEnd: new Date('2027-01-01T00:00:00.000Z'),
      warrantyStatus: 'active',
      daysRemaining: 60,
      purchasePrice: 1000,
    })),
  });
  ServiceRecord.find = () => ({ populate: async () => [] });
  Document.countDocuments = async () => 0;

  const chunks = [];
  const response = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });
  response.setHeader = () => {};
  const finished = new Promise((resolve, reject) => {
    response.once('finish', resolve);
    response.once('error', reject);
  });

  await productsReport(
    { user: { _id: 'sample-user', name: 'Sample User', email: 'sample@example.test' } },
    response,
    (error) => response.destroy(error)
  );
  await finished;

  const pdf = Buffer.concat(chunks);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.match(pdf.toString('latin1'), /\/Count 2\b/);
});
