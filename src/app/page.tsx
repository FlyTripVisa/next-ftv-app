import Link from 'next/link';

export default function HomePage() {
  const pages = [
    { name: 'Chat Interface', path: '/chat' },
    { name: 'API: Chat Endpoint', path: '/api/chat' },
    { name: 'API: Tools Endpoint', path: '/api/tools' },
  ];

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Project Navigator</h1>
      <p>আপনার প্রজেক্টের রুটগুলো নিচে দেওয়া হলো:</p>
      <ul>
        {pages.map((page) => (
          <li key={page.path} style={{ margin: '1rem 0' }}>
            <Link href={page.path} style={{ fontSize: '1.2rem', color: '#0070f3' }}>
              Go to {page.name} ({page.path})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
