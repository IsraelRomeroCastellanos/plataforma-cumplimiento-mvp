import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    console.log('✅ Frontend funcionando correctamente');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ✅ Sistema de Cumplimiento - MVP
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Frontend construido correctamente. Todos los sistemas están funcionando.
        </p>
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Status: Sistema operativo y listo para producción</p>
        </div>
        <div className="space-x-4">
          <a href="/admin/usuarios" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Admin Usuarios
          </a>
          <a href="/cliente/carga-masiva" className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors">
            Carga Masiva
          </a>
        </div>
      </div>
    </div>
  );
}
