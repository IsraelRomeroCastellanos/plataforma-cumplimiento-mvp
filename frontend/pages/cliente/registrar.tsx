// frontend/pages/cliente/registrar.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function RegistrarCliente() {
  const [formData, setFormData] = useState({
    nombre_entidad: '',
    tipo_cliente: 'persona_fisica',
    actividad_economica: '',
    empresa_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmpresaId, setUserEmpresaId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      setUserRole(user.role);
      if (user.role === 'cliente' && user.empresaId) {
        setUserEmpresaId(user.empresaId);
        setFormData(prev => ({ ...prev, empresa_id: user.empresaId.toString() }));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      await axios.post('/api/cliente/registrar', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Cliente registrado exitosamente');
      setTimeout(() => router.push('/cliente/clientes'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar cliente');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <h1>Registrar Cliente</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Nombre del Cliente: <input
              name="nombre_entidad"
              value={formData.nombre_entidad}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            /></label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Tipo de Cliente:
              <select
                name="tipo_cliente"
                value={formData.tipo_cliente}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="persona_fisica">Persona Física</option>
                <option value="persona_moral">Persona Moral</option>
              </select>
            </label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Actividad Económica: <input
              name="actividad_economica"
              value={formData.actividad_economica}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            /></label>
          </div>
          {userRole !== 'cliente' && (
            <div style={{ marginBottom: '1rem' }}>
              <label>ID de Empresa: <input
                name="empresa_id"
                value={formData.empresa_id}
                onChange={handleChange}
                required
                type="number"
                style={{ width: '100%", padding: '0.5rem' }}
              /></label>
            </div>
          )}
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Registrar
          </button>
        </form>
      </div>
    </div>
  );
}