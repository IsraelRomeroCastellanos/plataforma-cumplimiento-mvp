// src/components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiLogOut, FiMenu, FiX, FiUser, FiShield, FiDatabase, FiUpload, FiFile } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Menú completo con roles y secciones
  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FiUser, role: 'all' },
    { href: '/admin/usuarios', label: 'Gestión de Usuarios', icon: FiShield, role: 'admin' },
    { href: '/admin/empresas', label: 'Gestión de Empresas', icon: FiDatabase, role: 'admin' },
    { href: '/cliente/clientes', label: 'Mis Clientes', icon: FiFile, role: 'cliente' },
    { href: '/cliente/carga-masiva', label: 'Carga Masiva', icon: FiUpload, role: 'cliente' },
  ];

  const shouldShowItem = (item: any) => {
    if (!user) return false;
    if (item.role === 'all') return true;
    return user.rol === item.role;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-white text-blue-600 rounded-full p-1">
                <FiShield size={24} />
              </div>
              <span className="text-xl font-bold">Sistema de Cumplimiento</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => {
              if (shouldShowItem(item)) {
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="flex items-center space-x-1 hover:text-blue-200 transition-colors py-2 px-3 rounded-md hover:bg-blue-700"
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              }
              return null;
            })}
            
            {user && (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-blue-400">
                <div className="flex flex-col items-end">
                  <span className="font-semibold">{user.nombre_completo}</span>
                  <span className="text-xs text-blue-200 capitalize">{user.rol}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 hover:text-blue-200 transition-colors py-2 px-3 rounded-md hover:bg-blue-700"
                >
                  <FiLogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
            
            {!user && (
              <Link 
                href="/login" 
                className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white focus:outline-none"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-blue-700 py-4">
          <div className="px-2 space-y-1 sm:px-3">
            {menuItems.map((item) => {
              if (shouldShowItem(item)) {
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="flex items-center space-x-2 block px-4 py-3 rounded-md text-base font-medium text-white hover:bg-blue-600"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              }
              return null;
            })}
            
            {user && (
              <>
                <div className="block px-4 py-3 text-base font-medium text-white">
                  <div className="flex flex-col">
                    <span>{user.nombre_completo}</span>
                    <span className="text-sm text-blue-200 capitalize">{user.rol}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full text-left px-4 py-3 rounded-md text-base font-medium text-white hover:bg-blue-600"
                >
                  <FiLogOut size={18} />
                  <span>Cerrar sesión</span>
                </button>
              </>
            )}
            
            {!user && (
              <Link 
                href="/login" 
                className="flex items-center space-x-2 block px-4 py-3 rounded-md text-base font-medium bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => setIsOpen(false)}
              >
                <FiLogOut size={18} />
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}