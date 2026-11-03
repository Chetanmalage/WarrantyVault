export function getUpcomingWarrantyEvents(products) {
  return [...products]
    .filter((product) => (
      product?.warrantyEnd
      && Number.isFinite(Number(product.daysRemaining))
      && Number(product.daysRemaining) >= 0
      && Number.isFinite(new Date(product.warrantyEnd).getTime())
    ))
    .sort((a, b) => new Date(a.warrantyEnd) - new Date(b.warrantyEnd));
}
