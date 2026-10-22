const Product = require('../models/Product');
const ServiceRecord = require('../models/ServiceRecord');
const Document = require('../models/Document');

exports.getDashboard = async (req, res, next) => {
  try {
    const uid = req.user._id;

    const [products, services, documents] = await Promise.all([
      Product.find({ user: uid }).sort({ createdAt: -1 }),
      ServiceRecord.find({ user: uid }),
      Document.countDocuments({ user: uid }),
    ]);

    const active = products.filter((p) => p.warrantyStatus === 'active').length;
    const expiring = products.filter((p) => p.warrantyStatus === 'expiring').length;
    const expired = products.filter((p) => p.warrantyStatus === 'expired').length;

    const totalProductSpend = products.reduce((s, p) => s + (p.purchasePrice || 0), 0);
    const totalServiceSpend = services.reduce((s, r) => s + (r.cost || 0), 0);

    const expiringSoon = products
      .filter((p) => p.warrantyStatus === 'expiring')
      .sort((a, b) => new Date(a.warrantyEnd) - new Date(b.warrantyEnd))
      .slice(0, 6)
      .map((p) => ({
        _id: p._id, name: p.name, brand: p.brand,
        warrantyEnd: p.warrantyEnd, daysRemaining: p.daysRemaining,
      }));

    const categoryMap = {};
    products.forEach((p) => { categoryMap[p.category] = (categoryMap[p.category] || 0) + 1; });
    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const monthlyMap = {};
    services.forEach((s) => {
      const key = new Date(s.serviceDate).toISOString().slice(0, 7);
      monthlyMap[key] = (monthlyMap[key] || 0) + (s.cost || 0);
    });
    const monthlyServiceSpend = Object.entries(monthlyMap)
      .sort()
      .slice(-6)
      .map(([month, total]) => ({ month, total }));

    res.json({
      totals: {
        products: products.length, active, expiring, expired,
        documents, serviceRecords: services.length,
      },
      totalProductSpend,
      totalServiceSpend,
      expiringSoon,
      recentProducts: products.slice(0, 5),
      categoryBreakdown,
      monthlyServiceSpend,
    });
  } catch (err) { next(err); }
};