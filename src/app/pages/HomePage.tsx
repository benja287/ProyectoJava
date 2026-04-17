import { Link } from 'react-router';
import { MapPin, BookOpen, Users, Building2, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
export function HomePage() {
  
  const { user } = useAuth();
  const editions = [
    { year: 2019, location: 'Mendoza', attendees: 800, papers: 350 },
    { year: 2021, location: 'Buenos Aires', attendees: 1000, papers: 450 },
    { year: 2023, location: 'Córdoba', attendees: 1200, papers: 500 },
    { year: 2025, location: 'Rosario', attendees: 1400, papers: 550 },
    { year: 2027, location: 'La Plata', attendees: 1500, papers: 600 },
  ];
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
  
    // 👑 ADMIN
    if (user.currentRole === 'admin') {
      navigate('/admin');
      return;
    }
  
    // 🧑‍⚖️ EVALUADOR
    if (user.currentRole === 'evaluador') {
      navigate('/evaluador');
      return;
    }
  
    // 📝 AUTOR
    if (user.currentRole === 'autor') {
      navigate('/mis-presentaciones'); // o donde quieras
      return;
    }
  
    // 🎓 ASISTENTE
    if (user.currentRole === 'asistente') {
      navigate('/asistente');
      return;
    }
  
  }, [user, navigate]);
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#2d5016] via-[#3d6b23] to-[#4d7c33] text-white py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            V Congreso Argentino de Agroecología
          </h1>
          <p className="text-2xl mb-2 text-green-100">La Plata, Argentina • 2027</p>
          <p className="text-xl mb-3 text-green-200">Organizado por LIRA - UNLP</p>
          <p className="text-lg mb-8 max-w-3xl mx-auto text-green-50">
            Más de 1500 participantes • 600+ trabajos científicos
          </p>
          <div className="mt-8">
  

  {user && (!user.roles || user.roles.length === 0) && (
    <Link
      to="/inscripcion"
      className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-medium hover:bg-yellow-500 transition"
    >
      Inscribirme al Congreso
    </Link>
  )}

  {user?.inscriptionStatus === 'pending' && (
    <p className="text-yellow-200 mt-4">
      Tu inscripción está pendiente de aprobación ⏳
    </p>
  )}

  {user?.inscriptionStatus === 'confirmed' && (
    <p className="text-green-200 mt-4">
      Inscripción confirmada ✅ ¡Nos vemos en el congreso!
    </p>
  )}
</div>
          
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <TrendingUp className="w-12 h-12 text-[#2d5016] mb-4" />
              <h3 className="text-xl mb-3 text-gray-800">Ediciones Anteriores</h3>
              <p className="text-gray-700 text-sm">
                Conoce la trayectoria del congreso desde 2019 hasta hoy
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <BookOpen className="w-12 h-12 text-amber-700 mb-4" />
              <h3 className="text-xl mb-3 text-gray-800">Qué es la Agroecología</h3>
              <p className="text-gray-700 text-sm">
                Sistemas agroalimentarios sustentables y soberanía alimentaria
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <Users className="w-12 h-12 text-blue-700 mb-4" />
              <h3 className="text-xl mb-3 text-gray-800">Cómo funciona un congreso</h3>
              <p className="text-gray-700 text-sm">
                Presentaciones, talleres, ferias y espacios de intercambio
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <Building2 className="w-12 h-12 text-purple-700 mb-4" />
              <h3 className="text-xl mb-3 text-gray-800">Sede La Plata</h3>
              <p className="text-gray-700 text-sm">
                Facultad de Ciencias Agrarias y Forestales - UNLP
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl text-center mb-8 text-gray-800">
            Contexto del Congreso
          </h2>
          <div className="prose prose-lg mx-auto text-gray-700 space-y-4">
            <p className="text-lg leading-relaxed">
              El V Congreso Argentino de Agroecología representa un espacio fundamental para el 
              encuentro, debate e intercambio de experiencias en torno a la agroecología en Argentina 
              y Latinoamérica.
            </p>
            <p className="text-lg leading-relaxed">
              Este evento reúne a productores, investigadores, estudiantes, organizaciones y todos 
              aquellos comprometidos con la construcción de sistemas agroalimentarios sustentables 
              que promuevan la soberanía alimentaria y el cuidado del ambiente.
            </p>
            <p className="text-lg leading-relaxed">
              Los congresos de agroecología se caracterizan por su enfoque participativo, donde se 
              combinan presentaciones científicas, talleres temáticos, ferias agroecológicas y espacios 
              de intercambio horizontal entre todos los participantes.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl text-center mb-4 text-gray-800">
            Evolución del Congreso
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Desde la primera edición en 2019, el congreso ha crecido de manera constante, 
            consolidándose como el principal evento agroecológico del país.
          </p>
          
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 transform md:-translate-x-px h-full w-0.5 bg-gradient-to-b from-[#2d5016] to-[#8b9b5c]"></div>
              
              {editions.map((edition, index) => (
                <div key={edition.year} className={`relative mb-12 ${index % 2 === 0 ? 'md:pr-1/2' : 'md:pl-1/2 md:ml-auto'}`}>
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md hover:shadow-lg transition">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-[#2d5016]">{edition.year}</span>
                        <MapPin className="w-6 h-6 text-[#6b7c3a]" />
                      </div>
                      <h3 className="text-xl mb-3 text-gray-800">{edition.location}</h3>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Asistentes</p>
                          <p className="text-lg font-semibold text-[#2d5016]">{edition.attendees}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Trabajos</p>
                          <p className="text-lg font-semibold text-[#2d5016]">{edition.papers}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className={`absolute top-6 left-0 md:left-1/2 transform ${index % 2 === 0 ? 'md:-translate-x-1/2' : 'md:-translate-x-1/2'} w-4 h-4 rounded-full ${edition.year === 2027 ? 'bg-[#2d5016] ring-4 ring-[#8b9b5c]/30' : 'bg-[#6b7c3a]'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-[#2d5016] to-[#3d6b23] text-white">
        
      </section>
    </div>
  );
}
