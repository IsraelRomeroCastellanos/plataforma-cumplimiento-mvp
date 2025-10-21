// frontend/pages/admin/usuarios.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    rol: 'cliente',
    empresa_id: ''
  });

  const router = useRouter();

  // Cargar usuarios y empresas al iniciar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [usuariosRes, empresasRes] = await Promise.all([
          axios.get('/api/admin/usuarios', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/empresas', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUsuarios(usuariosRes.data.usuarios);
        setEmpresas(empresasRes.data.empresas);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar datos');
      }
    };

    fetchData();
  }, [router]);

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Abrir modal para crear
  const handleCreate = () => {
    setEditId(null);
    setFormData({
      email: '',
      password: '',
      nombre_completo: '',
      rol: 'cliente',
      empresa_id: ''
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (usuario: any) => {
    setEditId(usuario.id);
    setFormData({
      email: usuario.email,
      password: '', // No se muestra la contraseña al editar
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol,
      empresa_id: usuario.empresa_id?.toString() || ''
    });
    setShowModal(true);
  };

  // Desactivar usuario
  const handleDeactivate = async (id: number) => {
    if (!confirm('¿Está seguro de desactivar este usuario?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/admin/usuarios/${id}`, { activo: false }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: false } : u));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al desactivar usuario');
    }
  };

  // Guardar usuario (crear o editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');

    try {
      if (editId) {
        // Editar
        const payload: any = {
          email: formData.email,
          nombre_completo: formData.nombre_completo,
          rol: formData.rol
        };
        if (formData.rol === 'cliente') {
          payload.empresa_id = formData.empresa_id ? Number(formData.empresa_id) : null;
        }
        await axios.put(`/api/admin/usuarios/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Crear
        const payload = {
          ...formData,
          empresa_id: formData.rol === 'cliente' ? (formData.empresa_id ? Number(formData.empresa_id) : null) : null
        };
        await axios.post('/api/admin/usuarios', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Recargar lista
      const res = await axios.get('/api/admin/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(res.data.usuarios);
      setShowModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1>Gestión de Usuarios</h1>
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
            Crear Usuario
          </button>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>ID</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Email</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Nombre</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Rol</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Empresa</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Activo</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u: any) => (
              <tr key={u.id}>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.id}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.email}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.nombre_completo}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.rol}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{u.empresa_id || '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                  {u.activo ? '✅' : '❌'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(u)}
                    style={{
                      marginRight: '0.5rem',
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
                  {!u.activo ? null : (
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Desactivar
                    </button>
                  )}
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
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h2>{editId ? 'Editar Usuario' : 'Crear Usuario'}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Email: <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                {!editId && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label>Contraseña: <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    /></label>
                  </div>
                )}
                <div style={{ marginBottom: '1rem' }}>
                  <label>Nombre completo: <input
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                  /></label>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Rol:
                    <select
                      name="rol"
                      value={formData.rol}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    >
                      <option value="admin">Administrador</option>
                      <option value="consultor">Consultor</option>
                      <option value="cliente">Cliente</option>
                    </select>
                  </label>
                </div>
                {formData.rol === 'cliente' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label>Empresa:
                      <select
                        name="empresa_id"
                        value={formData.empresa_id}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                      >
                        <option value="">Seleccionar...</option>
                        {empresas.map((e: any) => (
                          <option key={e.id} value={e.id}>{e.nombre_legal}</option>
                        ))}
                      </select>
                    </label>
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