// frontend/components/Navbar.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  const navItems = [];
  
  if (user.role === 'admin') {
    navItems.push(
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Gestión de Usuarios', href: '/admin/usuarios' },
      { label: 'Gestión de Empresas', href: '/admin/empresas' },
      { label: 'Mis Clientes', href: '/cliente/clientes' },
      { label: 'Carga Masiva', href: '/cliente/carga-masiva' },
      { label: 'Barridos', href: '/admin/barridos' },
      { label: 'Matrices de Riesgo', href: '/admin/matrices' },
      { label: 'Cambiar Contraseña', href: '/cambiar-contrasena' }
    );
  } else if (user.role === 'consultor') {
    navItems.push(
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Empresas', href: '/consultor/empresas' },
      { label: 'Mis Clientes', href: '/cliente/clientes' },
      { label: 'Carga Masiva', href: '/cliente/carga-masiva' },
      { label: 'Alertas', href: '/consultor/alertas' },
      { label: 'Reportes', href: '/consultor/reportes' },
      { label: 'Cambiar Contraseña', href: '/cambiar-contrasena' }
    );
  } else if (user.role === 'cliente') {
    navItems.push(
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Mis Clientes', href: '/cliente/clientes' },
      { label: 'Carga Masiva', href: '/cliente/carga-masiva' },
      { label: 'Transacciones', href: '/cliente/transacciones' },
      { label: 'Reportes', href: '/cliente/reportes' },
      { label: 'Cambiar Contraseña', href: '/cambiar-contrasena' }
    );
  }

  return (
    <nav style={{
      backgroundColor: '#1e40af',
      padding: '1rem',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
          {user.role === 'admin' ? 'Consola Administrativa' :
           user.role === 'consultor' ? 'Panel Consultor' : 'Portal Cliente'}
        </h2>
      </div>
      
      <div>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          {user.email} ({user.role})
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                color: 'white',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: router.pathname === item.href ? 'underline' : 'none'
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            style={{
              color: '#f87171',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}