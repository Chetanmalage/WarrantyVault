import { useEffect, useState } from 'react';
import api from '../api/axios';
import { catIcon } from '../utils/format';

export default function ProductPhoto({ productId, productName, category }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let active = true;
    let objectUrl = '';
    api.get(`/products/${productId}/photo`, { responseType: 'blob' })
      .then(({ data }) => {
        objectUrl = URL.createObjectURL(data);
        if (active) setSrc(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => { if (active) setSrc(''); });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [productId]);

  return src
    ? <img className="product-photo" src={src} alt={productName} />
    : <span className="product-avatar" aria-hidden="true"><i className={`bi ${catIcon(category)}`} /></span>;
}
