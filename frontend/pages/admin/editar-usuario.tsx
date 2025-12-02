// frontend/pages/admin/editar-usuario.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function EditarUsuario() {
  const [usuario, setUsuario] = useState<any>({});
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const [userRes, empresasRes] = await Promise.all([
          axios.get(`/api/admin/usuarios/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('/api/admin/empresas', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setUsuario(userRes.data);
        setEmpresas(empresasRes.data.empresas || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(`/api/admin/usuarios/${id}`, usuario, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Usuario actualizado correctamente');
      setTimeout(() => router.push('/admin/usuarios'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setUsuario(prev => ({ ...prev, [name]: val }));
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ padding: '2rem' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <h1>Editar Usuario</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email: <input
              name="email"
              value={usuario.email || ''}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            /></label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Nombre Completo: <input
              name="nombre_completo"
              value={usuario.nombre_completo || ''}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            /></label>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Rol:
              <select
                name="rol"
                value={usuario.rol || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="">Seleccionar</option>
                <option value="admin">Administrador</option>
                <option value="consultor">Consultor</option>
                <option value="cliente">Cliente</option>
              </select>
            </label>
          </div>
          {(usuario.rol === 'consultor' || usuario.rol === 'cliente') && (
            <div style={{ marginBottom: '1rem' }}>
              <label>Empresa:
                <select
                  name="empresa_id"
                  value={usuario.empresa_id || ''}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Seleccionar</option>
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre_legal}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label>
              <input
                type="checkbox"
                name="activo"
                checked={usuario.activo || false}
                onChange={handleChange}
              />
              Activo
            </label>
          </div>
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
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}