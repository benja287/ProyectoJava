import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Music, Users, Wrench, FileText } from 'lucide-react';

export function ActividadesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('juveniles');

  const tabs = [
    { id: 'juveniles', label: 'Actividades Juveniles', icon: Users, public: true },
    { id: 'cultural', label: 'Agenda Cultural', icon: Music, public: true },
    { id: 'talleres', label: 'Talleres', icon: Wrench, public: false },
    { id: 'presentaciones', label: 'Mis Presentaciones', icon: FileText, authorOnly: true },
  ];

  const canAccessTab = (tab: any) => {
    if (tab.public) return true;
    if (tab.authorOnly) return user?.currentRole === 'autor';
    return user && (user.currentRole === 'asistente' || user.currentRole === 'autor');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl text-gray-800 mb-2">Actividades</h1>
          <p className="text-gray-600 mb-8">Espacios complementarios del congreso</p>

          <div className="border-b border-gray-200 mb-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const canAccess = canAccessTab(tab);
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => canAccess && setActiveTab(tab.id)}
                    disabled={!canAccess}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-[#2d5016] text-[#2d5016]'
                        : canAccess
                        ? 'border-transparent text-gray-600 hover:text-gray-800'
                        : 'border-transparent text-gray-400 cursor-not-allowed'
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
            {activeTab === 'juveniles' && (
              <div>
                <h3 className="text-2xl mb-4">Actividades Juveniles</h3>
                <p className="text-gray-600">Espacios especiales dedicados a la participación de jóvenes en el movimiento agroecológico.</p>
              </div>
            )}
            {activeTab === 'cultural' && (
              <div>
                <h3 className="text-2xl mb-4">Agenda Cultural</h3>
                <p className="text-gray-600">Presentaciones artísticas, musicales y culturales relacionadas con la agroecología.</p>
              </div>
            )}
            {activeTab === 'talleres' && (
              <div>
                <h3 className="text-2xl mb-4">Talleres Aprobados</h3>
                <button className="mt-4 px-4 py-2 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition">
                  Proponer taller
                </button>
              </div>
            )}
            {activeTab === 'presentaciones' && user?.currentRole === 'autor' && (
              <div>
                <h3 className="text-2xl mb-4">Mis Presentaciones</h3>
                <p className="text-gray-600">Cronograma de tus presentaciones con horarios y ubicaciones.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
