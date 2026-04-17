import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { RoleSelection } from "./pages/RoleSelection";
import { CircularesPage } from "./pages/CircularesPage";
import { ActividadesPage } from "./pages/ActividadesPage";
import { FeriaPage } from "./pages/FeriaPage";
import { PanelAsistente} from "./pages/PanelAsistente";
import { VerPresentacionesGenerales} from "./pages/VerPresentacionesGenerales";
import { ProgramaDetalladoPage } from "./pages/ProgramaDetalladoPage";
import { MapasPage } from "./pages/MapasPage";
import { InscripcionPage } from "./pages/InscripcionPage";
import { EnvioTrabajosPage } from "./pages/EnvioTrabajosPage";
import { PanelAutor} from "./pages/PanelAutor";
import { PanelEvaluador } from "./pages/PanelEvaluador";
import { PanelAdmin } from "./pages/PanelAdmin";
import { NotificacionesPage } from "./pages/NotificacionesPage";
import { OrganizadoresPage } from "./pages/OrganizadoresPage";
import { ContactoPage } from "./pages/ContactoPage";
import { Dashboard } from "./pages/Dashboard"; 
export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "forgot-password", Component: ForgotPassword },
      { path: "select-role", Component: RoleSelection },
      { path: "circulares", Component: CircularesPage },
      { path: "actividades", Component: ActividadesPage },
      { path: "feria", Component: FeriaPage },
      { path: "asistente", Component: PanelAsistente },
      { path: "verpresentacionesgenerales", Component: VerPresentacionesGenerales },
      { path: "programa-detallado", Component: ProgramaDetalladoPage },
      { path: "mapas", Component: MapasPage },
      { path: "inscripcion", Component: InscripcionPage },
      { path: "envio-trabajos", Component: EnvioTrabajosPage },
      { path: "mis-presentaciones", Component: PanelAutor },
      { path: "evaluador", Component: PanelEvaluador },
      { path: "admin", Component: PanelAdmin },
      { path: "notificaciones", Component: NotificacionesPage },
      { path: "organizadores", Component: OrganizadoresPage },
      { path: "contacto", Component: ContactoPage },
    ],
  },
]);
