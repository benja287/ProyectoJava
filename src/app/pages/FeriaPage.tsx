import { useAuth } from '../context/AuthContext';
import { Store } from 'lucide-react';

export function FeriaPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl text-gray-800 mb-2">Feria Agroecológica</h1>
              <p className="text-gray-600">Productores de todo el país</p>
            </div>
            {user && (
              <button className="px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition">
                Inscribirme como expositor
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-6">
              <Store className="w-12 h-12 text-[#2d5016] mb-4" />
              <h3 className="text-lg font-medium mb-2">Expositor 1</h3>
              <p className="text-sm text-gray-600">Productos orgánicos - Buenos Aires</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
