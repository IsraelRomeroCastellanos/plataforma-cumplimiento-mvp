// frontend/pages/cliente/clientes.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function GestionClientes() {
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre_entidad: '',
    tipo_cliente: 'persona_fisica',
    actividad_economica: '',
    alias: '',
    fecha_nacimiento_constitucion: '',
    nacionalidad: '',
    domicilio_mexico: '',
    ocupacion: '',
    empresa_id: ''
  });

  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Determinar rol del usuario de forma segura (solo en el cliente)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        setUserRole(user.role);
      }
    }
  }, []);

  // Proteger la ruta y cargar clientes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};

    if (!token || !['admin', 'consultor', 'cliente'].includes(user.role)) {
      router.push('/login');
      return;
    }

    const fetchClientes = async () => {
      try {
        const res = await axios.get('/api/cliente/mis-clientes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClientes(res.data.clientes);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar clientes');
      }
    };

    fetchClientes();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    setShowModal(true);
  };

  const handleToggleEstado = async (id: number, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    if (!confirm(`¿Está seguro de ${nuevoEstado === 'activo' ? 'activar' : 'desactivar'} este cliente?`)) return;

    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/cliente/${id}/estado`, { estado: nuevoEstado }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(prev => prev.map((c: any) => c.id === id ? { ...c, estado: nuevoEstado } : c));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar estado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/cliente/registrar', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const res = await axios.get('/api/cliente/mis-clientes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(res.data.clientes);
      setShowModal(false);
      setFormData({
        nombre_entidad: '',
        tipo_cliente: 'persona_fisica',
        actividad_economica: '',
        alias: '',
        fecha_nacimiento_constitucion: '',
        nacionalidad: '',
        domicilio_mexico: '',
        ocupacion: '',
        empresa_id: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>Mis Clientes</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCreate}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Registrar Cliente
            </button>
            <button
              onClick={() => router.push('/cliente/carga-masiva')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Carga Masiva
            </button>
          </div>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nombre</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Tipo</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Actividad</th>
              {userRole && userRole !== 'cliente' && (
                <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Empresa</th>
              )}
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Estado</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c: any) => (
              <tr key={c.id}>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{c.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{c.nombre_entidad}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{c.tipo_cliente}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{c.actividad_economica}</td>
                {userRole && userRole !== 'cliente' && (
                  <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{c.empresa}</td>
                )}
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                  {c.estado === 'activo' ? '✅' : '❌'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                  <button
                    onClick={() => handleToggleEstado(c.id, c.estado)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: c.estado === 'activo' ? '#ef4444' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {c.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal de registro */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h2>Registrar Cliente</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Nombre del Cliente: <input
                    name="nombre_entidad"
                    value={formData.nombre_entidad}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Tipo de Cliente:
                    <select
                      name="tipo_cliente"
                      value={formData.tipo_cliente}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
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
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Alias: <input
                    name="alias"
                    value={formData.alias}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Fecha Nacimiento/Constitución: <input
                    name="fecha_nacimiento_constitucion"
                    type="date"
                    value={formData.fecha_nacimiento_constitucion}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Nacionalidad: <input
                    name="nacionalidad"
                    value={formData.nacionalidad}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Domicilio en México: <input
                    name="domicilio_mexico"
                    value={formData.domicilio_mexico}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Ocupación: <input
                    name="ocupacion"
                    value={formData.ocupacion}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                {userRole && userRole !== 'cliente' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label>Empresa ID: <input
                      name="empresa_id"
                      value={formData.empresa_id}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    /></label>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? 'Guardando...' : 'Registrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}