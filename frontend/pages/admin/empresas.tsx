// frontend/pages/admin/empresas.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre_legal: '',
    rfc: '',
    tipo_entidad: 'persona_moral'
  });

  const router = useRouter();

  // Cargar empresas al iniciar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    const fetchEmpresas = async () => {
      try {
        const res = await axios.get('/api/admin/empresas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmpresas(res.data.empresas);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar empresas');
      }
    };

    fetchEmpresas();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    setEditId(null);
    setFormData({
      nombre_legal: '',
      rfc: '',
      tipo_entidad: 'persona_moral'
    });
    setShowModal(true);
  };

  const handleEdit = (empresa: any) => {
    setEditId(empresa.id);
    setFormData({
      nombre_legal: empresa.nombre_legal,
      rfc: empresa.rfc || '',
      tipo_entidad: empresa.tipo_entidad
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');

    try {
      if (editId) {
        await axios.put(`/api/admin/empresas/${editId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/admin/empresas', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Recargar lista
      const res = await axios.get('/api/admin/empresas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmpresas(res.data.empresas);
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>Gestión de Empresas</h1>
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
            Crear Empresa
          </button>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nombre Legal</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>RFC</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Tipo</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((e: any) => (
              <tr key={e.id}>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{e.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{e.nombre_legal}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{e.rfc || '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{e.tipo_entidad}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(e)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal */}
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
              width: '500px'
            }}>
              <h2>{editId ? 'Editar Empresa' : 'Crear Empresa'}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Nombre Legal: <input
                    name="nombre_legal"
                    value={formData.nombre_legal}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>RFC: <input
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Tipo de Entidad:
                    <select
                      name="tipo_entidad"
                      value={formData.tipo_entidad}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    >
                      <option value="persona_fisica">Persona Física</option>
                      <option value="persona_moral">Persona Moral</option>
                    </select>
                  </label>
                </div>
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
                    {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
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