// src/app/cliente/clientes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { toast } from 'react-toastify';

export default function GestionClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [empresaId, setEmpresaId] = useState<number | null>(null);

  const fetchClientes = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cliente', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      if (response.data && Array.isArray(response.data.clientes)) {
        setClientes(response.data.clientes);
      } else {
        setError('Formato de respuesta inesperado');
      }
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
      setError(err.response?.data?.error || 'Error al cargar clientes');
      if (err.response?.status === 401 || err.response?.status === 403) {
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
      setToken(storedToken);
      
      if (user.rol === 'cliente') {
        setEmpresaId(user.empresa_id);
      } else if (user.rol === 'consultor' || user.rol === 'admin') {
        setEmpresaId(null);
      }
      
      fetchClientes(storedToken);
    } else {
      router.push('/login');
    }
  }, [router, fetchClientes]);

  const handleVerDetalle = (id: number) => {
    router.push(`/cliente/clientes/${id}`);
  };

  const handleCargarMasiva = () => {
    router.push('/cliente/carga-masiva');
  };

  const handleRegistrarCliente = () => {
    router.push('/cliente/registrar-cliente');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Cargando clientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
            <div className="flex space-x-3">
              <button
                onClick={handleCargarMasiva}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Carga Masiva
              </button>
              <button
                onClick={handleRegistrarCliente}
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
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">ID</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nombre Entidad</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo Cliente</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actividad Económica</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado Bien</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Alias</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fecha Registro</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {cliente.id}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">{cliente.nombre_entidad}</td>
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
                        {cliente.estado_bien.charAt(0).toUpperCase() + cliente.estado_bien.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">{cliente.alias || 'N/A'}</td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {new Date(cliente.creado_en).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleVerDetalle(cliente.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ver
                        </button>
                      </div>
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
        </div>
      </main>
    </div>
  );
}