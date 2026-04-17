import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Settings, Users, FileText, CheckCircle, XCircle } from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inscriptions, setInscriptions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  
    if (user.currentRole === 'evaluador') {
      navigate('/evaluador');
      return;
    }
  
    if (user.currentRole === 'admin') {
      navigate('/admin');
      return;
    }
  }, [user, navigate]);

  if (!user) return null;

const handleApprove = (userId: string) => {
  const users = JSON.parse(localStorage.getItem('congress_users') || '[]');

  const updatedUsers = users.map((u: any) => {
    if (u.id === userId) {
      return {
        ...u,
        inscriptionStatus: 'confirmed',
        roles: u.roles?.includes('asistente')
          ? u.roles
          : [...(u.roles || []), 'asistente'], // ✅ evita duplicados
        currentRole: 'asistente'
      };
    }
    return u;
  });

  localStorage.setItem('congress_users', JSON.stringify(updatedUsers));

  // 🔥 ACTUALIZAR current_user SI ES EL MISMO
  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');

  if (currentUser.id === userId) {
    const updatedCurrentUser = {
      ...currentUser,
      roles: currentUser.roles?.includes('asistente')
        ? currentUser.roles
        : [...(currentUser.roles || []), 'asistente'],
      currentRole: 'asistente',
      inscriptionStatus: 'confirmed'
    };

    localStorage.setItem('current_user', JSON.stringify(updatedCurrentUser));

    window.location.reload(); // ✅ necesario en tu enfoque actual
  }

  setInscriptions(inscriptions.filter(i => i.id !== userId));
};

  const handleReject = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('congress_users') || '[]');
    const updatedUsers = users.map((u: any) => {
      if (u.id === userId) {
        return { ...u, inscriptionStatus: 'rejected' };
      }
      return u;
    });
    localStorage.setItem('congress_users', JSON.stringify(updatedUsers));
    setInscriptions(inscriptions.filter(i => i.id !== userId));
  };

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4">
            <Settings className="w-12 h-12" />
            <div>
              <h1 className="text-4xl">Panel de Administración</h1>
              <p className="text-indigo-100 mt-2">Gestión completa del congreso</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Inscripciones Pendientes</p>
            <p className="text-3xl text-blue-600">{inscriptions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Asistentes Confirmados</p>
            <p className="text-3xl text-green-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <FileText className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Trabajos Recibidos</p>
            <p className="text-3xl text-purple-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <Users className="w-8 h-8 text-amber-600 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Autores Aprobados</p>
            <p className="text-3xl text-amber-600">0</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-2xl text-gray-800 mb-6">Gestionar Inscripciones</h2>
          
          {inscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay inscripciones pendientes de aprobación
            </div>
          ) : (
            <div className="space-y-4">
              {inscriptions.map((inscription) => (
                <div key={inscription.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {inscription.name} {inscription.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{inscription.email}</p>
                      <p className="text-sm text-gray-600">
                        {inscription.institution} - {inscription.province}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(inscription.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleReject(inscription.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl text-gray-800 mb-4">Cargar Programa</h3>
            <p className="text-gray-600 mb-4">
              Agregar conferencias, mesas temáticas y talleres
            </p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Gestionar Programa
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl text-gray-800 mb-4">Gestionar Evaluadores</h3>
            <p className="text-gray-600 mb-4">
              Crear y asignar evaluadores a trabajos
            </p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              Administrar Evaluadores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
