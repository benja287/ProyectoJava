import { Link } from 'react-router';
import { MapPin, BookOpen, Users, Building2, TrendingUp, Calendar } from 'lucide-react';
import { congressDateRangeCaption } from '../constants/congressEvent';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
export function HomePage() {
  
  const { user } = useAuth();
  const editions = [
    { year: 2019, location: 'Mendoza', attendees: 800, papers: 350 },
    { year: 2021, location: 'Resistencia (virtual)', attendees: 1000, papers: 450 },
    { year: 2023, location: 'El Bolsón', attendees: 1200, papers: 500 },
    { year: 2025, location: 'San Salvador de Jujuy', attendees: 1400, papers: 550 },
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
            <Link
              to="/historia"
              className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md hover:shadow-lg transition block"
            >
              <TrendingUp className="w-12 h-12 text-[#2d5016] mb-4" />
              <h3 className="text-xl mb-3 text-gray-800">Ediciones Anteriores</h3>
              <p className="text-gray-700 text-sm">
                Conoce la trayectoria del congreso desde 2019 hasta hoy
              </p>
              <p className="text-sm text-[#2d5016] font-medium mt-3">Ver historia →</p>
            </Link>

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

      {/* Sección histórica (banner clickeable) */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Link
              to="/historia"
              className="group block rounded-2xl overflow-hidden shadow-lg border border-green-100 hover:shadow-xl transition"
              aria-label="Ir a Historia del Congreso"
            >
              <div
                className="relative h-[320px] sm:h-[360px] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'%3E%3Cdefs%3E%3CradialGradient id='g1' cx='20%25' cy='25%25' r='75%25'%3E%3Cstop offset='0%25' stop-color='%232d5016' stop-opacity='0.35'/%3E%3Cstop offset='60%25' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g2' cx='80%25' cy='70%25' r='70%25'%3E%3Cstop offset='0%25' stop-color='%238b9b5c' stop-opacity='0.45'/%3E%3Cstop offset='55%25' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/radialGradient%3E%3ClinearGradient id='bg' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f8fafc'/%3E%3Cstop offset='100%25' stop-color='%23f1f5f9'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg)'/%3E%3Crect width='100%25' height='100%25' fill='url(%23g1)'/%3E%3Crect width='100%25' height='100%25' fill='url(%23g2)'/%3E%3Cpath d='M0 650 C 250 600 350 720 600 680 C 850 640 1050 540 1300 600 C 1450 640 1520 700 1600 680 L1600 900 L0 900 Z' fill='%232d5016' opacity='0.08'/%3E%3Cpath d='M0 720 C 220 690 380 790 620 740 C 860 690 1060 610 1320 670 C 1460 705 1525 760 1600 740 L1600 900 L0 900 Z' fill='%238b9b5c' opacity='0.10'/%3E%3C/svg%3E\")",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-transparent" />
                <div className="absolute inset-0 p-8 sm:p-10 flex items-end">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase bg-white/15 text-white border border-white/20 px-3 py-1 rounded-full mb-3">
                      Historia del congreso
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                      Evolución y memorias de las ediciones anteriores
                    </h2>
                    <p className="text-white/90 mt-3 text-sm sm:text-base">
                      Línea de tiempo con información breve, enlaces a los sitios oficiales y (cuando corresponde) a las memorias/actas.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                      Ver historia
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <p className="text-center text-xs text-gray-500 mt-4">
              Sugerencia del docente: incorporar enlaces a memorias y sitios oficiales de ediciones anteriores.
            </p>
          </div>
        </div>
      </section>

      {/* Programa — mismo enlace que la vista cronograma */}
      <section className="py-16 bg-[#eceaf2] border-t border-amber-900/10">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-wide text-amber-950 uppercase mb-2">
            Programa
          </h2>
          <p className="text-gray-600 mb-2">
            Este es el calendario de actividades: mesas temáticas, mesas redondas, pósters y talleres.
          </p>
          <div className="w-14 h-1 bg-yellow-400 mx-auto rounded-full mb-4" />
          <p className="text-sm text-gray-600 mb-8">{congressDateRangeCaption()}</p>
          <Link
            to="/ProgramaCongreso"
            className="inline-flex items-center gap-2 rounded-full bg-amber-900 text-white px-8 py-3 text-sm font-semibold hover:bg-amber-950 transition shadow-md"
          >
            <Calendar className="w-5 h-5 shrink-0" />
            Ver programa completo
          </Link>
        </div>
      </section>
    </div>
  );
}
