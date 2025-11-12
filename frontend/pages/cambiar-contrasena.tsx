// frontend/pages/cambiar-contrasena.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function CambiarContrasena() {
  const [formData, setFormData] = useState({
    contrasenaActual: '',
    nuevaContrasena: '',
    confirmarContrasena: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.nuevaContrasena !== formData.confirmarContrasena) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post('/api/cambiar-contrasena', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('✅ Contraseña actualizada correctamente');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
        <h2>Cambiar Contraseña</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Contraseña Actual: <input
              type="password"
              name="contrasenaActual"
              value={formData.contrasenaActual}
              onChange={handleChange}
              required
            /></label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Nueva Contraseña: <input
              type="password"
              name="nuevaContrasena"
              value={formData.nuevaContrasena}
              onChange={handleChange}
              required
            /></label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Confirmar Nueva Contraseña: <input
              type="password"
              name="confirmarContrasena"
              value={formData.confirmarContrasena}
              onChange={handleChange}
              required
            /></label>
          </div>
          <button type="submit" style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Actualizar Contraseña
          </button>
        </form>
      </div>
    </div>
  );
}