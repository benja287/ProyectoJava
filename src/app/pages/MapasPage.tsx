import { useState } from 'react';
import { MapPin, Building2, Palmtree } from 'lucide-react';

export function MapasPage() {
  const [activeTab, setActiveTab] = useState('alojamientos');

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl text-gray-800 mb-2">Mapas y Localidad</h1>
          <p className="text-gray-600 mb-8">Información útil para tu estadía en La Plata</p>

          <div className="border-b border-gray-200 mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'alojamientos', label: 'Alojamientos', icon: Building2 },
                { id: 'turismo', label: 'Turismo y Recreación', icon: Palmtree },
                { id: 'mapa', label: 'Mapa del Congreso', icon: MapPin },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-[#2d5016] text-[#2d5016]'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="py-6">
            {activeTab === 'alojamientos' && (
              <div>
                <h3 className="text-2xl mb-4">Alojamientos</h3>
                <p className="text-gray-600">Lista de opciones organizadas por zona y presupuesto.</p>
              </div>
            )}
            {activeTab === 'turismo' && (
              <div>
                <h3 className="text-2xl mb-4">Turismo y Recreación</h3>
                <p className="text-gray-600">Actividades turísticas cerca de la sede del congreso.</p>
              </div>
            )}
            {activeTab === 'mapa' && (
              <div>
                <h3 className="text-2xl mb-4">Mapa del Congreso</h3>
                <div className="bg-gray-100 rounded-lg p-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Mapa interactivo de la sede</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
