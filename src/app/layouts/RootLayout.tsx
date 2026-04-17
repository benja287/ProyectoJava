import { Outlet } from 'react-router';
import { Header } from '../components/Header';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
