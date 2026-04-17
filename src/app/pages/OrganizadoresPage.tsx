import { Users } from 'lucide-react';

export function OrganizadoresPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <Users className="w-10 h-10 text-[#2d5016]" />
            <div>
              <h1 className="text-3xl text-gray-800">Organizadores</h1>
              <p className="text-gray-600">Equipo organizador del congreso</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl mb-3 text-gray-800">LIRA - UNLP</h3>
              <p className="text-gray-600">
                Laboratorio de Investigaciones en Recursos Agroecológicos<br />
                Universidad Nacional de La Plata
              </p>
            </div>

            <div>
              <h3 className="text-xl mb-3 text-gray-800">Facultad de Ciencias Agrarias y Forestales</h3>
              <p className="text-gray-600">
                Sede del V Congreso Argentino de Agroecología
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
