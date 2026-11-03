import test from 'node:test';
import assert from 'node:assert/strict';
import { getUpcomingWarrantyEvents } from '../src/utils/warrantyCalendar.js';

test('upcoming warranty events exclude expired and invalid dates and sort chronologically', () => {
  const products = [
    { _id: 'later', warrantyEnd: '2027-03-01', daysRemaining: 118 },
    { _id: 'expired', warrantyEnd: '2026-10-01', daysRemaining: -33 },
    { _id: 'today', warrantyEnd: '2026-11-03', daysRemaining: 0 },
    { _id: 'missing-days', warrantyEnd: '2026-11-10' },
    { _id: 'invalid-date', warrantyEnd: 'not-a-date', daysRemaining: 5 },
    { _id: 'soon', warrantyEnd: '2026-11-05', daysRemaining: 2 },
  ];

  assert.deepEqual(
    getUpcomingWarrantyEvents(products).map((product) => product._id),
    ['today', 'soon', 'later']
  );
});

test('calendar filtering does not mutate the product array', () => {
  const products = [
    { _id: 'later', warrantyEnd: '2027-01-01', daysRemaining: 59 },
    { _id: 'earlier', warrantyEnd: '2026-12-01', daysRemaining: 28 },
  ];
  const originalOrder = products.map((product) => product._id);

  getUpcomingWarrantyEvents(products);

  assert.deepEqual(products.map((product) => product._id), originalOrder);
});
