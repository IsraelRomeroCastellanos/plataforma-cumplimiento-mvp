// frontend/pages/admin/usuarios.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

const USUARIO_RAIZ_EMAIL = 'admin@cumplimiento.com';

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
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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

  const handleEdit = (usuario: any) => {
    setEditId(usuario.id);
    setFormData({
      email: usuario.email,
      password: '',
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol,
      empresa_id: usuario.empresa_id?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDeactivate = async (id: number, email: string) => {
    if (email === USUARIO_RAIZ_EMAIL) {
      alert('El usuario raíz no puede ser desactivado.');
      return;
    }
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

  const handleReactivate = async (id: number, email: string) => {
    if (email === USUARIO_RAIZ_EMAIL) {
      alert('El usuario raíz ya está activo.');
      return;
    }
    if (!confirm('¿Está seguro de reactivar este usuario?')) return;

    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/admin/usuarios/${id}`, { activo: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, activo: true } : u));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reactivar usuario');
    }
  };

  const handleResetPassword = (userId: number, email: string) => {
    if (email === USUARIO_RAIZ_EMAIL) {
      alert('No se puede restablecer la contraseña del usuario raíz.');
      return;
    }
    setResetUserId(userId);
    setResetResult(null);
    setShowResetModal(true);
  };

  const executeResetPassword = async () => {
    if (!resetUserId) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`/api/admin/usuarios/${resetUserId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResetResult({
        email: res.data.email,
        password: res.data.temporalPassword
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al restablecer contraseña');
      setShowResetModal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    setLoading(true);
    setError('');

    try {
      if (editId) {
        const usuarioOriginal = usuarios.find((u: any) => u.id === editId);
        if (usuarioOriginal?.email === USUARIO_RAIZ_EMAIL) {
          if (formData.rol !== 'admin' || !formData.email || !formData.nombre_completo) {
            alert('El usuario raíz no puede modificar su rol ni dejar campos vacíos.');
            setLoading(false);
            return;
          }
        }

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
        const payload = {
          ...formData,
          empresa_id: formData.rol === 'cliente' ? (formData.empresa_id ? Number(formData.empresa_id) : null) : null
        };
        await axios.post('/api/admin/usuarios', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

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
                  {u.activo ? (
                    <button
                      onClick={() => handleDeactivate(u.id, u.email)}
                      disabled={u.email === USUARIO_RAIZ_EMAIL}
                      style={{
                        marginRight: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: u.email === USUARIO_RAIZ_EMAIL ? '#9ca3af' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: u.email === USUARIO_RAIZ_EMAIL ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(u.id, u.email)}
                      disabled={u.email === USUARIO_RAIZ_EMAIL}
                      style={{
                        marginRight: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Reactivar
                    </button>
                  )}
                  <button
                    onClick={() => handleResetPassword(u.id, u.email)}
                    disabled={u.email === USUARIO_RAIZ_EMAIL}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: u.email === USUARIO_RAIZ_EMAIL ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Restablecer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal de creación/edición */}
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

        {/* Modal de Restablecimiento */}
        {showResetModal && (
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
              width: '400px'
            }}>
              <h2>Restablecer Contraseña</h2>
              {!resetResult ? (
                <>
                  <p>¿Está seguro de restablecer la contraseña de este usuario?</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      onClick={executeResetPassword}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setShowResetModal(false)}
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
                </>
              ) : (
                <>
                  <p><strong>¡Contraseña restablecida!</strong></p>
                  <p><strong>Email:</strong> {resetResult.email}</p>
                  <p><strong>Nueva contraseña:</strong> <code>{resetResult.password}</code></p>
                  <p style={{ color: 'red', fontSize: '0.9rem' }}>
                    Entregue esta contraseña al usuario y pídale que la cambie al iniciar sesión.
                  </p>
                  <button
                    onClick={() => setShowResetModal(false)}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cerrar
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}