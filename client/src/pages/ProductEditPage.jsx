import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import ProductForm from '../components/ProductForm';

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product || data);
      } catch (err) {
        alert(err.response?.data?.message || 'Could not load product');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const onSubmit = async (form) => {
    try {
      await api.put(`/products/${id}`, form);
      navigate(`/products/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to update product');
    }
  };

  if (loading || !product) return <div className="app-loader"><div className="spinner" /></div>;

  return (
    <div className="card-surface">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="section-title mb-1">Edit product</h5>
          <p className="text-muted small mb-0">Update purchase details, warranty terms and coverage.</p>
        </div>
      </div>
      <ProductForm initial={product} onSubmit={onSubmit} submitting={false} onCancel={() => navigate(`/products/${id}`)} />
    </div>
  );
}
