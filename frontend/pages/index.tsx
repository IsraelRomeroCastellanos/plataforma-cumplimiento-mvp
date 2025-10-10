import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await axios.get('/api/health');
        setBackendStatus('✅ OK');
      } catch (err) {
        setBackendStatus('❌ Error');
      }
    };

    const checkDB = async () => {
      try {
        const res = await axios.get('/api/test-db');
        setDbStatus('✅ DB OK');
      } catch (err) {
        setDbStatus('❌ DB Error');
      }
    };

    checkBackend();
    checkDB();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🧪 Prueba de Conexión MVP</h1>
      <p><strong>Frontend (Vercel):</strong> ✅ OK</p>
      <p><strong>Backend:</strong> {backendStatus}</p>
      <p><strong>Base de datos:</strong> {dbStatus}</p>
    </div>
  );
}