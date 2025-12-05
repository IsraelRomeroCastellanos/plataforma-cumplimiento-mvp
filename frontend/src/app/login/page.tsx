// frontend/src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Verificar si ya hay sesión activa
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      const userData = JSON.parse(user);
      // Redirigir según rol
      if (userData.rol === 'admin') {
        router.push('/dashboard');
      } else if (userData.rol === 'cliente' || userData.rol === 'consultor') {
        router.push('/cliente/clientes');
      } else {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.trim() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      // Validar entradas
      if (!formData.email || !formData.password) {
        throw new Error('Por favor ingresa email y contraseña');
      }
  
      // URL del backend con fallback seguro
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://plataforma-cumplimiento-mvp.onrender.com';
      
      console.log('🔍 Intentando login en:', `${backendUrl}/api/login`);
      
      const response = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
  
      // Verificar si la respuesta es JSON antes de parsear
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`El servidor respondió con HTML en lugar de JSON: ${textResponse.substring(0, 100)}...`);
      }
  
      const data = await response.json();
      console.log('📡 Respuesta del backend:', data);
  
      if (!response.ok) {
        // Manejar errores específicos con mayor detalle
        if (data.error === 'Credenciales inválidas') {
          throw new Error('Email o contraseña incorrectos');
        } else if (data.error === 'Usuario desactivado') {
          throw new Error('Tu cuenta está desactivada. Contacta al administrador.');
        } else {
          throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
        }
      }
  
      if (data.token && data.user) {
        // Guardar token y usuario en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast.success('¡Inicio de sesión exitoso!');
        
        // Redirigir según rol
        switch (data.user.rol) {
          case 'admin':
            router.push('/dashboard');
            break;
          case 'cliente':
          case 'consultor':
            router.push('/cliente/clientes');
            break;
          default:
            router.push('/dashboard');
        }
      } else {
        throw new Error('Respuesta inválida del servidor - faltan datos de autenticación');
      }
  
    } catch (err: any) {
      console.error('🚨 Error en login:', err);
      
      // Manejo de errores específicos para diagnóstico
      let errorMessage = 'Error al iniciar sesión. Por favor verifica tus credenciales.';
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'No se puede conectar con el servidor. Verifica tu conexión a internet y que el backend esté funcionando.';
      } else if (err.message.includes('CORS')) {
        errorMessage = 'Error de conexión entre servicios. Contacta al administrador del sistema.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Error interno del servidor. Intenta nuevamente en unos minutos.';
      } else if (err.message.includes('HTML en lugar de JSON')) {
        errorMessage = 'Error de configuración del servidor. El backend está respondiendo con HTML en lugar de JSON.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Para diagnóstico en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Detalles del error (solo desarrollo):', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={handleChange}
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
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  ¿No tienes cuenta?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/registrar-cliente"
                className="w-full flex justify-center py-2 px-4 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Registrar Nuevo Cliente
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p className="font-medium">Credenciales de prueba:</p>
              <p className="text-blue-600">Email: admin@pruebas.com</p>
              <p className="text-blue-600">Contraseña: Admin123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}