export default function Home() {
  return <h1 style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
    ✅ ¡Frontend desplegado en Vercel!<br/>
    Backend: <a href='/api/health' target='_blank'>/api/health</a>
  </h1>;
}