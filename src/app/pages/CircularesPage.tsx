import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';

export function CircularesPage() {
  const { user } = useAuth();
  const [circulares] = useState<any[]>([]);
  const isAdmin = user?.currentRole === 'admin';

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl text-gray-800 mb-2">Circulares</h1>
              <p className="text-gray-600">Novedades del proceso organizativo</p>
            </div>
            {isAdmin && (
              <button className="flex items-center gap-2 px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition">
                <Plus className="w-5 h-5" />
                Nueva circular
              </button>
            )}
          </div>

          {circulares.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Todavía no hay circulares publicadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {circulares.map((circular) => (
                <div key={circular.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-800 mb-1">
                        Circular N° {circular.number} - {circular.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">{circular.date}</p>
                      <button className="text-[#2d5016] hover:text-[#3d6b23] font-medium text-sm">
                        Ver circular →
                      </button>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
