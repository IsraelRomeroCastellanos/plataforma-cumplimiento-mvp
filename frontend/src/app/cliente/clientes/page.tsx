'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';
import Navbar from '@/components/Navbar';

// Definir el tipo para un cliente
interface Cliente {
  id: number;
  nombre_entidad: string;
  tipo_cliente: string;
  actividad_economica: string;
  estado_bien: string;
  alias?: string;
  creado_en: string;
}

export default function MisClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      const user = JSON.parse(storedUser);
      if (user.rol === 'cliente' || user.rol === 'admin' || user.rol === 'consultor') {
        setToken(storedToken);
        fetchClientes(storedToken);
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, []);

  const fetchClientes = async (authToken: string) => {
    try {
      setLoading(true);
      const data = await api.get('/api/cliente', authToken);
      
      if (data.clientes && Array.isArray(data.clientes)) {
        setClientes(data.clientes);
      } else {
        setError('Formato de respuesta inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
      setError(err.message || 'Error al cargar clientes');
      if (err.message?.includes('401') || err.message?.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCliente = () => {
    router.push('/cliente/registrar-cliente');
  };

  const handleCargarMasiva = () => {
    router.push('/cliente/carga-masiva');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Cargando clientes...</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
          <div className="flex space-x-3">
            <button
              onClick={handleCargarMasiva}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Carga Masiva
            </button>
            <button
              onClick={handleCrearCliente}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Registrar Cliente
            </button>
          </div>
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
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actividad</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Alias</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {cliente.nombre_entidad}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                      cliente.tipo_cliente === 'persona_fisica' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {cliente.tipo_cliente === 'persona_fisica' ? 'Persona Física' : 'Persona Moral'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{cliente.actividad_economica}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                      cliente.estado_bien === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cliente.estado_bien}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{cliente.alias || 'N/A'}</td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {new Date(cliente.creado_en).toLocaleDateString('es-MX')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clientes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron clientes
            </div>
          )}
        </div>
      </main>
    </div>
  );
}