import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ProductForm from '../components/ProductForm';

export default function ProductAddPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const onSubmit = async (form) => {
    setSaving(true);
    try {
      await api.post('/products', form);
      navigate('/products');
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card-surface">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="section-title mb-1">Add new product</h5>
          <p className="text-muted small mb-0">Create a tracked item with purchase, warranty and coverage details.</p>
        </div>
      </div>
      <ProductForm initial={null} onSubmit={onSubmit} submitting={saving} onCancel={() => navigate('/products')} />
    </div>
  );
}
