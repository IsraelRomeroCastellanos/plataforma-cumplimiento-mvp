'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import { FiArrowLeft } from 'react-icons/fi';

export default function EditarUsuario() {
  const [usuario, setUsuario] = useState({
    email: '',
    nombre_completo: '',
    rol: 'consultor',
    empresa_id: '',
    activo: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { id } = useParams();
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      const user = JSON.parse(storedUser);
      if (user.rol === 'admin') {
        setToken(storedToken);
        if (id) {
          fetchUsuario(storedToken, id.toString());
        }
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [id, router]);

  const fetchUsuario = async (authToken: string, userId: string) => {
    try {
      setLoading(true);
      const data = await api.get(`/api/admin/usuarios/${userId}`, authToken);
      
      if (data.usuario) {
        setUsuario({
          email: data.usuario.email,
          nombre_completo: data.usuario.nombre_completo,
          rol: data.usuario.rol,
          empresa_id: data.usuario.empresa_id ? data.usuario.empresa_id.toString() : '',
          activo: data.usuario.activo
        });
      } else {
        setError('Usuario no encontrado');
      }
    } catch (err: any) {
      console.error('Error al cargar usuario:', err);
      setError(err.message || 'Error al cargar usuario');
      if (err.message?.includes('401') || err.message?.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Validar campos según rol
      if (usuario.rol === 'cliente' && !usuario.empresa_id) {
        throw new Error('Los clientes deben estar vinculados a una empresa');
      }
      
      if ((usuario.rol === 'admin' || usuario.rol === 'consultor') && usuario.empresa_id) {
        throw new Error('Los administradores y consultores no pueden tener empresa asignada');
      }

      await api.put(`/api/admin/usuarios/${id}`, {
        email: usuario.email,
        nombre_completo: usuario.nombre_completo,
        rol: usuario.rol,
        empresa_id: usuario.empresa_id ? parseInt(usuario.empresa_id) : null,
        activo: usuario.activo
      }, token);
      
      toast.success('Usuario actualizado correctamente');
      router.push('/admin/usuarios');
    } catch (err: any) {
      console.error('Error al actualizar usuario:', err);
      setError(err.message || 'Error al actualizar usuario');
      toast.error(err.message || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setUsuario(prev => ({ ...prev, activo: checked }));
    } else {
      setUsuario(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Cargando usuario...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex items-center">
            <button
              onClick={() => router.push('/admin/usuarios')}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={usuario.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    id="nombre_completo"
                    name="nombre_completo"
                    type="text"
                    required
                    value={usuario.nombre_completo}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="rol" className="block text-sm font-medium text-gray-700">
                    Rol
                  </label>
                  <select
                    id="rol"
                    name="rol"
                    value={usuario.rol}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="admin">Administrador</option>
                    <option value="consultor">Consultor</option>
                    <option value="cliente">Cliente</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="activo" className="flex items-center">
                    <input
                      id="activo"
                      name="activo"
                      type="checkbox"
                      checked={usuario.activo}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                  </label>
                </div>

                {usuario.rol === 'cliente' && (
                  <div>
                    <label htmlFor="empresa_id" className="block text-sm font-medium text-gray-700">
                      ID de la Empresa
                    </label>
                    <input
                      id="empresa_id"
                      name="empresa_id"
                      type="number"
                      min="1"
                      value={usuario.empresa_id}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      ID de la empresa a la que pertenece el cliente
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/usuarios')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </span>
                  ) : 'Actualizar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}