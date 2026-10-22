const ServiceRecord = require('../models/ServiceRecord');
const Product = require('../models/Product');

exports.getServices = async (req, res, next) => {
  try {
    const query = { user: req.user._id };
    if (req.query.product) query.product = req.query.product;

    const services = await ServiceRecord.find(query)
      .populate('product', 'name brand category')
      .sort({ serviceDate: -1 });

    res.json(services);
  } catch (err) { next(err); }
};

exports.createService = async (req, res, next) => {
  try {
    const { product, serviceDate, description, serviceType, serviceCenter, cost } = req.body;
    if (!product || !serviceDate || !description)
      return res.status(400).json({ message: 'Product, service date and description are required' });

    const exists = await Product.findOne({ _id: product, user: req.user._id });
    if (!exists) return res.status(404).json({ message: 'Product not found' });

    const record = await ServiceRecord.create({
      user: req.user._id, product, serviceDate, description,
      serviceType: serviceType || 'Repair',
      serviceCenter: serviceCenter || '',
      cost: Number(cost) || 0,
    });

    res.status(201).json(await record.populate('product', 'name brand category'));
  } catch (err) { next(err); }
};

exports.updateService = async (req, res, next) => {
  try {
    const record = await ServiceRecord.findOne({ _id: req.params.id, user: req.user._id });
    if (!record) return res.status(404).json({ message: 'Service record not found' });

    const { serviceDate, description, serviceType, serviceCenter, cost } = req.body;
    if (serviceDate) record.serviceDate = serviceDate;
    if (description) record.description = description;
    if (serviceType) record.serviceType = serviceType;
    if (serviceCenter !== undefined) record.serviceCenter = serviceCenter;
    if (cost !== undefined) record.cost = Number(cost) || 0;

    await record.save();
    res.json(record);
  } catch (err) { next(err); }
};

exports.deleteService = async (req, res, next) => {
  try {
    const record = await ServiceRecord.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!record) return res.status(404).json({ message: 'Service record not found' });
    res.json({ message: 'Service record deleted' });
  } catch (err) { next(err); }
};