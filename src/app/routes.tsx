import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
<<<<<<< Updated upstream
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
import { ProponerTallerPage } from "./pages/ProponerTallerPage";
import { PanelAutor} from "./pages/PanelAutor";
import { PanelEvaluador } from "./pages/PanelEvaluador";
import { PanelAdmin } from "./pages/PanelAdmin";
import { NotificacionesPage } from "./pages/NotificacionesPage";
import { AdminMesasTematicas } from "./pages/AdminMesasTematicas";
import { AdminMesasRedondas } from "./pages/AdminMesasRedondas";
import { AdminPosters } from './pages/AdminPosters';
import { AdminCrearTaller } from './pages/AdminCrearTaller';
import { AdminCrearConferencia } from './pages/AdminCrearConferencia';
import { ProgramaCongreso} from './pages/ProgramaCongreso';
import { MiAgenda} from './pages/MiAgenda';
import { OrganizadoresPage } from "./pages/OrganizadoresPage";
import { ContactoPage } from "./pages/ContactoPage";
import { Dashboard } from "./pages/Dashboard"; 
=======

// Public
import { HomePage } from "./pages/Public/HomePage";
import { MapasPage } from "./pages/Public/MapasPage";
import { ContactoPage } from "./pages/Public/ContactoPage";
import { CircularesPage } from "./pages/Public/CircularesPage";

// Auth 
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";

// Profiles
import { RoleSelection } from "./pages/Profiles/RoleSelection";
import { PanelAutor } from "./pages/Profiles/autor/PanelAutor";
import { PanelEvaluador } from "./pages/Profiles/evaluador/PanelEvaluador";
import { PanelAdmin } from "./pages/Profiles/administrador/PanelAdmin";
import { PanelAsistente } from "./pages/Profiles/asistente/PanelAsistente";
// Admin
import { AdminMesasTematicas } from "./pages/Profiles/administrador/AdminMesasTematicas";
import { AdminMesasRedondas } from "./pages/Profiles/administrador/AdminMesasRedondas";
import { AdminPosters } from './pages/Profiles/administrador/AdminPosters';
import { AdminCrearTaller } from './pages/Profiles/administrador/AdminCrearTaller';
import { AdminCrearConferencia } from './pages/Profiles/administrador/AdminCrearConferencia';
import { AdminCircularForm } from "./pages/Profiles/administrador/AdminCircularForm";


// Otras páginas
import { ActividadesPage } from "./pages/ActividadesPage"; //1
import { Dashboard } from "./pages/Dashboard";//3
import { EnvioTrabajosPage } from "./pages/EnvioTrabajosPage"; //4
import { FeriaPage } from "./pages/FeriaPage";//5
import { InscripcionPage } from "./pages/InscripcionPage";//6
import { MiAgenda} from './pages/MiAgenda'; //8
import { NotificacionesPage } from "./pages/NotificacionesPage"; //9
import { OrganizadoresPage } from "./pages/OrganizadoresPage"; //10
import { PerfilPage } from "./pages/PerfilPage"; //11
import { ProgramaCongreso} from './pages/ProgramaCongreso';//12
import { ProgramaDetalladoPage } from "./pages/ProgramaDetalladoPage";//13
import { ProponerTallerPage } from "./pages/ProponerTallerPage";//15
import { VerPresentacionesGenerales} from "./pages/VerPresentacionesGenerales";//17
/**
 * 
 * AgendaPage 2
 * InscriptionPage 7
 * ProgramaPage 14
 * SubmitWork 16
 */



>>>>>>> Stashed changes
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
      { path: "proponer-taller", Component: ProponerTallerPage },
      { path: "mis-presentaciones", Component: PanelAutor },
      { path: "evaluador", Component: PanelEvaluador },
      { path: "admin", Component: PanelAdmin },
      { path: "notificaciones", Component: NotificacionesPage },
      { path: "admin/mesas-tematicas", Component: AdminMesasTematicas },
      { path: "admin/mesas-redondas", Component: AdminMesasRedondas },  
      { path: "ProgramaCongreso", Component: ProgramaCongreso}, 
      { path: "MiAgenda", Component: MiAgenda}, 
      { path: "admin/posters", Component: AdminPosters },
      { path: "admin/crear-taller", Component: AdminCrearTaller },
      { path: "admin/crear-conferencia", Component: AdminCrearConferencia },
      { path: "organizadores", Component: OrganizadoresPage },
      { path: "contacto", Component: ContactoPage },
    ],
  },
]);
