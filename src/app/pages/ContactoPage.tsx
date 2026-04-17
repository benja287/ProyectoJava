import { Mail, Phone, MapPin } from 'lucide-react';

export function ContactoPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] py-12 px-4 bg-gradient-to-br from-[#faf8f5] to-[#f3f1ed]">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl text-gray-800 mb-2">Contacto</h1>
          <p className="text-gray-600 mb-8">Ponete en contacto con la organización</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl mb-4">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#2d5016] mt-1" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-600">congreso@lira.unlp.edu.ar</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#2d5016] mt-1" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-gray-600">+54 221 423-6758</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#2d5016] mt-1" />
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-gray-600">
                      Facultad de Ciencias Agrarias y Forestales<br />
                      Calle 60 y 119, La Plata<br />
                      Buenos Aires, Argentina
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl mb-4">Formulario de Consulta</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b7c3a] bg-white"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2d5016] text-white rounded-lg hover:bg-[#3d6b23] transition font-medium"
                >
                  Enviar mensaje
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
