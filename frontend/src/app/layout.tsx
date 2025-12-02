import './globals.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

export const metadata = {
  title: 'Plataforma de Cumplimiento MVP',
  description: 'Sistema de gestión de cumplimiento',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-600">
                  Sistema de Cumplimiento
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/admin/usuarios" className="text-gray-700 hover:text-blue-600">
                  Admin Usuarios
                </Link>
                <Link href="/cliente/carga-masiva" className="text-gray-700 hover:text-blue-600">
                  Carga Masiva
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow">
          {children}
        </main>
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  )
}