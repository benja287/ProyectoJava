import { Link } from 'react-router';
import { MapPin, FileText, Calendar, Users, Store } from 'lucide-react';

export function PublicHome() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl mb-6">
            V Congreso Argentino de Agroecología
          </h1>
          <p className="text-2xl mb-4 text-green-100">La Plata, Argentina • 2027</p>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-green-50">
            Más de 1500 participantes • 600+ trabajos científicos
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              to="/register"
              className="px-8 py-4 bg-white text-green-700 rounded-lg text-lg font-semibold hover:bg-green-50 transition shadow-lg"
            >
              Registrarse / Preinscripción
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-green-800 text-white rounded-lg text-lg font-semibold hover:bg-green-900 transition border-2 border-white"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Introducción */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl text-center mb-8 text-gray-800">
            Contexto del Congreso
          </h2>
          <div className="prose prose-lg mx-auto text-gray-700 space-y-4">
            <p>
              El V Congreso Argentino de Agroecología representa un espacio fundamental para el 
              encuentro, debate e intercambio de experiencias en torno a la agroecología en Argentina 
              y Latinoamérica.
            </p>
            <p>
              Este evento reúne a productores, investigadores, estudiantes, organizaciones y todos 
              aquellos comprometidos con la construcción de sistemas agroalimentarios sustentables.
            </p>
            <h3 className="text-2xl mt-8 mb-4">¿Cómo funciona un congreso de agroecología?</h3>
            <p>
              Los congresos de agroecología se caracterizan por su enfoque participativo, donde se 
              combinan presentaciones científicas, talleres temáticos, ferias agroecológicas y espacios 
              de intercambio horizontal entre todos los participantes.
            </p>
          </div>
        </div>
      </section>

      {/* Secciones Principales */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl text-center mb-12 text-gray-800">
            Secciones del Congreso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
              <MapPin className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl mb-3">Mapas y Localidad</h3>
              <p className="text-gray-600 mb-4">
                Información sobre alojamientos, turismo, recreación y mapa del congreso.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
              <FileText className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl mb-3">Circulares</h3>
              <p className="text-gray-600 mb-4">
                Documentos con las novedades del proceso organizativo.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
              <Calendar className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl mb-3">Actividades</h3>
              <p className="text-gray-600 mb-4">
                Actividades juveniles, agenda cultural y más.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
              <Store className="w-12 h-12 text-amber-600 mb-4" />
              <h3 className="text-xl mb-3">Feria Agroecológica</h3>
              <p className="text-gray-600 mb-4">
                Espacio de intercambio y comercialización de productos agroecológicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl text-center mb-8 text-gray-800">
            Historia y Evolución de los Congresos
          </h2>
          <div className="text-gray-700 space-y-4">
            <p>
              Los Congresos Argentinos de Agroecología se han consolidado como el principal espacio 
              de encuentro del movimiento agroecológico nacional, creciendo edición tras edición tanto 
              en participación como en alcance temático.
            </p>
            <p>
              Esta quinta edición marca un hito al implementar un sistema de gestión integral que 
              permitirá una mayor participación y mejor organización del evento, facilitando el acceso 
              a más de 1500 asistentes y la presentación de 600 trabajos científicos.
            </p>
          </div>
        </div>
      </section>

      {/* Actividades */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl text-center mb-12 text-gray-800">
            Actividades del Congreso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <Users className="w-16 h-16 text-green-600 mb-4 mx-auto" />
              <h3 className="text-2xl text-center mb-4">Actividades Juveniles</h3>
              <p className="text-gray-600 text-center">
                Espacios especiales dedicados a la participación de jóvenes en el movimiento agroecológico.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <Calendar className="w-16 h-16 text-purple-600 mb-4 mx-auto" />
              <h3 className="text-2xl text-center mb-4">Agenda Cultural</h3>
              <p className="text-gray-600 text-center">
                Presentaciones artísticas, musicales y culturales relacionadas con la agroecología.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <Store className="w-16 h-16 text-amber-600 mb-4 mx-auto" />
              <h3 className="text-2xl text-center mb-4">Feria Agroecológica</h3>
              <p className="text-gray-600 text-center">
                Productores de todo el país presentando sus productos agroecológicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl mb-6">
            ¿Listo para ser parte del V Congreso?
          </h2>
          <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
            Registrate ahora para acceder a todas las funcionalidades del sistema y 
            participar activamente del congreso.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-white text-green-700 rounded-lg text-lg font-semibold hover:bg-green-50 transition shadow-lg"
          >
            Comenzar Registro
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg mb-2">V Congreso Argentino de Agroecología</p>
          <p className="text-gray-400">FCAyF UNLP | La Plata 2027</p>
          <p className="text-gray-500 text-sm mt-2">Java y Aplicaciones Avanzadas | 2026</p>
        </div>
      </footer>
    </div>
  );
}
