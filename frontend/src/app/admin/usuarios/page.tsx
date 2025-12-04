'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';
import { FiEye, FiEdit, FiLock, FiUserMinus, FiUserPlus, FiX } from 'react-icons/fi';

// Definir el tipo para un usuario individual
interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  rol: string;
  empresa_id?: number | null;
  activo: boolean;
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'detalle' | 'crear' | 'reset'>('detalle');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre_completo: '',
    rol: 'consultor',
    empresa_id: ''
  });
  const [resetEmail, setResetEmail] = useState('');

  const fetchUsuarios = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const data = await api.get('/api/admin/usuarios', authToken);
      
      if (data.usuarios && Array.isArray(data.usuarios)) {
        setUsuarios(data.usuarios);
      } else {
        setError('Formato de respuesta inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError(err.message || 'Error al cargar usuarios');
      if (err.message?.includes('401') || err.message?.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      const user = JSON.parse(storedUser);
      if (user.rol === 'admin') {
        setToken(storedToken);
        fetchUsuarios(storedToken);
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router, fetchUsuarios]);

  const handleVerDetalle = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setModalType('detalle');
    setShowModal(true);
  };

  const handleEditar = (id: number) => {
    router.push(`/admin/editar-usuario/${id}`);
  };

  const handleDesactivar = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas desactivar este usuario?')) return;
    
    try {
      await api.put(`/api/admin/usuarios/${id}/desactivar`, {}, token);
      toast.success('Usuario desactivado correctamente');
      fetchUsuarios(token);
    } catch (err: any) {
      console.error('Error al desactivar usuario:', err);
      toast.error(err.message || 'Error al desactivar usuario');
    }
  };

  const handleResetPassword = (email: string) => {
    setResetEmail(email);
    setModalType('reset');
    setShowModal(true);
  };

  const handleCrearUsuario = () => {
    setModalType('crear');
    setShowModal(true);
    setFormData({
      email: '',
      password: '',
      nombre_completo: '',
      rol: 'consultor',
      empresa_id: ''
    });
  };

  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/usuarios/reset-password', {
        email: resetEmail
      }, token);
      
      toast.success('Contraseña restablecida correctamente. El usuario recibirá su nueva contraseña por email.');
      setShowModal(false);
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err);
      toast.error(err.message || 'Error al restablecer contraseña');
    }
  };

  const handleSubmitCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos según rol
    if (formData.rol === 'cliente' && !formData.empresa_id) {
      toast.error('Los clientes deben estar vinculados a una empresa');
      return;
    }
    
    if ((formData.rol === 'admin' || formData.rol === 'consultor') && formData.empresa_id) {
      toast.error('Los administradores y consultores no pueden tener empresa asignada');
      return;
    }

    try {
      await api.post('/api/admin/usuarios', formData, token);
      
      toast.success('Usuario creado exitosamente');
      setShowModal(false);
      fetchUsuarios(token);
    } catch (err: any) {
      console.error('Error al crear usuario:', err);
      toast.error(err.message || 'Error al crear usuario');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600 flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Cargando usuarios...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <button
            onClick={handleCrearUsuario}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiUserPlus size={18} />
            <span>Crear Usuario</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Rol</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Empresa</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {usuario.nombre_completo}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{usuario.email}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.rol === 'admin' ? 'bg-green-100 text-green-800' :
                      usuario.rol === 'consultor' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {usuario.empresa_id ? `Empresa ${usuario.empresa_id}` : 'N/A'}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVerDetalle(usuario)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        title="Ver detalles"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditar(usuario.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="Editar usuario"
                      >
                        <FiEdit size={16} />
                      </button>
                      {usuario.activo && (
                        <>
                          <button
                            onClick={() => handleDesactivar(usuario.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="Desactivar usuario"
                          >
                            <FiUserMinus size={16} />
                          </button>
                          <button
                            onClick={() => handleResetPassword(usuario.email)}
                            className="text-amber-600 hover:text-amber-900 flex items-center"
                            title="Restablecer contraseña"
                          >
                            <FiLock size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuarios.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron usuarios
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'detalle' ? 'Detalles del Usuario' : 
                 modalType === 'crear' ? 'Crear Nuevo Usuario' : 
                 'Restablecer Contraseña'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                <FiX size={24} />
              </button>
            </div>

            {modalType === 'detalle' && selectedUsuario && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">ID</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedUsuario.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombre Completo</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedUsuario.nombre_completo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedUsuario.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Rol</label>
                  <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    selectedUsuario.rol === 'admin' ? 'bg-green-100 text-green-800' :
                    selectedUsuario.rol === 'consultor' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedUsuario.rol.charAt(0).toUpperCase() + selectedUsuario.rol.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Empresa</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedUsuario.empresa_id ? `Empresa ${selectedUsuario.empresa_id}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado</label>
                  <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                    selectedUsuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUsuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            )}

            {modalType === 'reset' && (
              <form onSubmit={handleSubmitReset} className="space-y-4">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">
                    Email del usuario
                  </label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Se generará una nueva contraseña temporal y se enviará al usuario por email
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
                  >
                    Restablecer Contraseña
                  </button>
                </div>
              </form>
            )}

            {modalType === 'crear' && (
              <form onSubmit={handleSubmitCrear} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
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
                      value={formData.rol}
                      onChange={(e) => {
                        setFormData({...formData, rol: e.target.value, empresa_id: ''});
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="admin">Administrador</option>
                      <option value="consultor">Consultor</option>
                      <option value="cliente">Cliente</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.rol === 'cliente' 
                        ? 'Los clientes deben estar vinculados a una empresa' 
                        : 'Administradores y consultores no tienen empresa asignada'}
                    </p>
                  </div>

                  {formData.rol === 'cliente' && (
                    <div>
                      <label htmlFor="empresa_id" className="block text-sm font-medium text-gray-700">
                        ID de la Empresa
                      </label>
                      <input
                        id="empresa_id"
                        name="empresa_id"
                        type="number"
                        required
                        min="1"
                        value={formData.empresa_id}
                        onChange={(e) => setFormData({...formData, empresa_id: e.target.value})}
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
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Crear Usuario
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}