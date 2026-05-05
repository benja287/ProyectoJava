import { ExternalLink, Leaf, BookOpen, ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

type PastCongress = {
  year: number;
  title: string;
  location: string;
  dateLabel: string;
  highlight: string;
  url: string;
  memoriaUrl?: string;
  coverStyle: string;
};

const PAST_CONGRESSES: PastCongress[] = [
  {
    year: 2019,
    title: 'I Congreso Argentino de Agroecología',
    location: 'Mendoza (UNCuyo)',
    dateLabel: '18–20 sep 2019',
    highlight:
      'Primera edición: consolidó el espacio federal de intercambio entre ciencia, producción y territorios.',
    url: 'https://fca.uncuyo.edu.ar/1-congreso-argentino-de-agroecologia-concurrencia-masiva',
    memoriaUrl:
      'https://fca.uncuyo.edu.ar/ya-se-encuentra-disponible-el-libro-de-resumenes-del-primer-congreso-argentino-de-agroecologia',
    coverStyle:
      "bg-[radial-gradient(1200px_400px_at_20%_20%,rgba(45,80,22,0.25),transparent_50%),radial-gradient(900px_300px_at_70%_70%,rgba(139,155,92,0.35),transparent_60%)]",
  },
  {
    year: 2021,
    title: 'II Congreso Argentino de Agroecología',
    location: 'Resistencia (Chaco) — virtual',
    dateLabel: '13–15 oct 2021',
    highlight:
      'Edición virtual que amplió la participación federal bajo el lema “Entrelazando saberes hacia el Buen Vivir”.',
    url: 'https://agroecologiasaae2021.uncaus.edu.ar/',
    memoriaUrl: 'https://rid.unam.edu.ar/handle/20.500.12219/3883',
    coverStyle:
      "bg-[radial-gradient(1200px_400px_at_20%_20%,rgba(13,148,136,0.25),transparent_50%),radial-gradient(900px_300px_at_70%_70%,rgba(45,80,22,0.25),transparent_60%)]",
  },
  {
    year: 2023,
    title: 'III Congreso Argentino de Agroecología',
    location: 'El Bolsón (Río Negro)',
    dateLabel: '29 nov – 1 dic 2023',
    highlight:
      'Edición organizada junto a UNRN. Se publicaron actas/memorias y resúmenes extendidos por eje temático.',
    url: 'https://congresoagroecologia2023.unrn.edu.ar/',
    memoriaUrl:
      'https://publicaciones.unrn.edu.ar/index.php/CyJ/issue/view/agro-cong-III',
    coverStyle:
      "bg-[radial-gradient(1200px_400px_at_20%_20%,rgba(59,130,246,0.20),transparent_55%),radial-gradient(900px_300px_at_70%_70%,rgba(45,80,22,0.25),transparent_60%)]",
  },
  {
    year: 2025,
    title: 'IV Congreso Argentino de Agroecología',
    location: 'San Salvador de Jujuy',
    dateLabel: '12–14 nov 2025',
    highlight:
      'Edición previa al congreso 2027. Sitio del evento con información de organización, programa y comunicación.',
    url: 'https://ivcaaejujuy.unju.edu.ar/',
    coverStyle:
      "bg-[radial-gradient(1200px_400px_at_20%_20%,rgba(245,158,11,0.25),transparent_55%),radial-gradient(900px_300px_at_70%_70%,rgba(45,80,22,0.25),transparent_60%)]",
  },
];

export function HistoriaCongresoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-[#2d5016] hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100 overflow-hidden relative">
          <div className="absolute inset-0 opacity-70 pointer-events-none bg-[radial-gradient(800px_240px_at_10%_15%,rgba(45,80,22,0.18),transparent_60%),radial-gradient(700px_220px_at_90%_80%,rgba(139,155,92,0.22),transparent_55%)]" />
          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <Leaf className="w-8 h-8 text-[#2d5016]" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-gray-900">Historia del Congreso</h1>
                <p className="text-gray-700 mt-2 max-w-3xl">
                  Una mirada breve y visual a la evolución del Congreso Argentino de Agroecología. En cada edición
                  podés acceder al sitio oficial y, cuando corresponde, a las memorias/actas.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href="https://congresoagroecologia2023.unrn.edu.ar/page/organizacion/congresos/Congresos-Anteriores"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2d5016] text-white text-sm font-medium hover:bg-[#3d6b23] transition"
                  >
                    <BookOpen className="w-4 h-4" />
                    Congresos anteriores (listado)
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Volver a Inicio
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Línea de tiempo</h2>
          <p className="text-sm text-gray-600 mb-8">
            Tocá una edición para ver más información en su sitio. Si hay memorias/actas, también las podés abrir.
          </p>

          <div className="relative">
            <div className="absolute left-4 sm:left-1/2 sm:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#2d5016] to-[#8b9b5c] opacity-60" />

            <div className="space-y-10">
              {PAST_CONGRESSES.map((c, idx) => {
                const left = idx % 2 === 0;
                return (
                  <div
                    key={c.year}
                    className={`relative ${left ? 'sm:pr-[50%]' : 'sm:pl-[50%] sm:ml-auto'}`}
                  >
                    <div className={`sm:w-1/2 ${left ? 'sm:pr-8' : 'sm:pl-8'}`}>
                      <div className={`rounded-2xl shadow-md border border-gray-100 overflow-hidden bg-white`}>
                        <div className={`h-28 ${c.coverStyle}`} />
                        <div className="p-6">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-2xl font-bold text-[#2d5016]">{c.year}</div>
                              <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                {c.dateLabel}
                              </div>
                              <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {c.location}
                              </div>
                            </div>
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-black transition shrink-0"
                            >
                              Ver sitio
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          <div className="mt-4">
                            <div className="text-sm font-semibold text-gray-900">{c.title}</div>
                            <p className="text-sm text-gray-700 mt-2">{c.highlight}</p>
                          </div>

                          {c.memoriaUrl && (
                            <a
                              href={c.memoriaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#2d5016] hover:underline"
                            >
                              Ver memorias / actas
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="absolute left-4 sm:left-1/2 sm:-translate-x-1/2 top-8 w-3.5 h-3.5 rounded-full bg-[#2d5016] ring-4 ring-[#8b9b5c]/25" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-gray-500">
          Nota: si algún enlace oficial cambia, podemos actualizarlo en esta sección.
        </div>
      </div>
    </div>
  );
}

