const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const ServiceRecord = require('../models/ServiceRecord');

const placeholderName = process.env.PLACEHOLDER_NAME || 'Sample User';
const placeholderEmail = (process.env.PLACEHOLDER_EMAIL || 'user@warrantyvault.local').toLowerCase();
const placeholderPassword = process.env.PLACEHOLDER_PASSWORD || 'Password123!';

const toIsoDate = (daysAgoOrAhead = 0) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysAgoOrAhead);
  return date;
};

module.exports = async function seedPlaceholderData() {
  const existingUser = await User.findOne({ email: placeholderEmail });
  const user = existingUser || await User.create({
    name: placeholderName,
    email: placeholderEmail,
    password: await bcrypt.hash(placeholderPassword, 10),
    role: 'user',
    emailReminders: true,
    reminderDays: 30,
  });

  const productCount = await Product.countDocuments({ user: user._id });
  if (productCount > 0) {
    console.log('🧩 Placeholder data already present for user:', placeholderEmail);
    return user;
  }

  const products = await Product.insertMany([
    {
      user: user._id,
      name: 'iPhone 14 Pro',
      brand: 'Apple',
      category: 'Mobile',
      purchaseDate: toIsoDate(-180),
      purchasePrice: 124000,
      invoiceNumber: 'INV-IPH14-01',
      store: 'Apple Store',
      serialNumber: 'APL-IPH-14-001',
      warrantyStart: toIsoDate(-180),
      warrantyEnd: toIsoDate(45),
      warrantyProvider: 'Apple Care+',
      coverageDetails: 'Includes accidental damage coverage and battery replacement support.',
      photo: '',
    },
    {
      user: user._id,
      name: 'Dell XPS 13',
      brand: 'Dell',
      category: 'Laptop',
      purchaseDate: toIsoDate(-240),
      purchasePrice: 98000,
      invoiceNumber: 'INV-DXPS-77',
      store: 'TechHub',
      serialNumber: 'DEL-XPS-1301',
      warrantyStart: toIsoDate(-240),
      warrantyEnd: toIsoDate(-10),
      warrantyProvider: 'Dell Premium Support',
      coverageDetails: 'Includes hardware support for 1 year with premium onsite service.',
      photo: '',
    },
    {
      user: user._id,
      name: 'Samsung 4K Smart TV',
      brand: 'Samsung',
      category: 'TV',
      purchaseDate: toIsoDate(-400),
      purchasePrice: 76000,
      invoiceNumber: 'INV-SAM-4K-22',
      store: 'ElectroMart',
      serialNumber: 'SAM-TV-4K-882',
      warrantyStart: toIsoDate(-400),
      warrantyEnd: toIsoDate(90),
      warrantyProvider: 'Samsung Care',
      coverageDetails: '2-year panel and repair coverage with standard service support.',
      photo: '',
    },
  ]);

  await ServiceRecord.insertMany([
    {
      user: user._id,
      product: products[0]._id,
      serviceDate: toIsoDate(-30),
      serviceType: 'Repair',
      description: 'Screen replacement completed after impact damage. Device restored and tested successfully.',
      serviceCenter: 'Apple Authorized Service',
      cost: 15000,
    },
    {
      user: user._id,
      product: products[1]._id,
      serviceDate: toIsoDate(-55),
      serviceType: 'Maintenance',
      description: 'Cooling system cleaned, battery health check, and system diagnostics completed.',
      serviceCenter: 'TechHub Service Desk',
      cost: 4200,
    },
    {
      user: user._id,
      product: products[2]._id,
      serviceDate: toIsoDate(-12),
      serviceType: 'Inspection',
      description: 'Firmware update and panel calibration check completed with no major issues.',
      serviceCenter: 'Samsung Service Center',
      cost: 3800,
    },
  ]);

  console.log('🧩 Placeholder user data seeded for:', placeholderEmail);
  console.log('🔐 Ready-to-use account:');
  console.log(`   Email: ${placeholderEmail}`);
  console.log(`   Password: ${placeholderPassword}`);

  return user;
};
