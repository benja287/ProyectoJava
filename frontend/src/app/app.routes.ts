/**
 * Mapa de rutas de la SPA.
 * Cada entrada define: URL → componente (+ guards + data opcional).
 * Los guards se ejecutan ANTES de mostrar el componente en <router-outlet>.
 */
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';
import { asistenteGuard } from './auth/asistente.guard';
import { seleccionRolGuard } from './auth/seleccion-rol.guard';
import { InicioComponent } from './pages/inicio/inicio.component';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { SeleccionRolComponent } from './pages/seleccion-rol/seleccion-rol.component';
import { UsuariosListaComponent } from './pages/admin/usuarios-lista/usuarios-lista.component';
import { UsuarioDetalleComponent } from './pages/admin/usuario-detalle/usuario-detalle.component';
import { UsuarioAltaComponent } from './pages/admin/usuario-alta/usuario-alta.component';
import { PagosPendientesComponent } from './pages/admin/pagos-pendientes/pagos-pendientes.component';
import { PagosListaComponent } from './pages/admin/pagos-lista/pagos-lista.component';
import { ActividadesAdminComponent } from './pages/admin/actividades/actividades-admin.component';
import { TrabajosAdminComponent } from './pages/admin/trabajos/trabajos-admin.component';
import { AsignacionesEvaluadorComponent } from './pages/evaluador/asignaciones/asignaciones-evaluador.component';
import { TrabajosAutorComponent } from './pages/autor/trabajos/trabajos-autor.component';
import { CronogramaParticipanteComponent } from './pages/participante/cronograma/cronograma-participante.component';
import { InscripcionParticipanteComponent } from './pages/participante/inscripcion/inscripcion-participante.component';
import { PagoParticipanteComponent } from './pages/participante/pago/pago-participante.component';
import { InscripcionesAdminComponent } from './pages/admin/inscripciones/inscripciones-admin.component';
import { PanelAsistenteComponent } from './pages/asistente/panel-asistente.component';
import { MesasTematicasAdminComponent } from './pages/admin/mesas-tematicas/mesas-tematicas-admin.component';
import { SesionPostersAdminComponent } from './pages/admin/sesion-posters/sesion-posters-admin.component';
import { ComiteOcComponent } from './pages/organizador/comite/comite-oc.component';
import { ProponerTallerAsistenteComponent } from './pages/asistente/proponer-taller/proponer-taller-asistente.component';
import { CertificadoAsistenteComponent } from './pages/asistente/certificado-asistente.component';
import { PanelAdminComponent } from './pages/admin/panel-admin/panel-admin.component';
import { PanelRolComponent } from './pages/panel-rol/panel-rol.component';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';
import { AdminEstadisticasComponent } from './pages/admin/admin-estadisticas/admin-estadisticas.component';
import { CircularFormAdminComponent } from './pages/admin/circular-form/circular-form-admin.component';
import { CircularesPublicasComponent } from './pages/circulares/circulares-publicas.component';
import { ProgramaCongresoComponent } from './pages/programa/programa-congreso.component';
import { MesaRedondaAdminComponent } from './pages/admin/mesa-redonda/mesa-redonda-admin.component';
import { CrearTallerAdminComponent } from './pages/admin/crear-taller/crear-taller-admin.component';
import { CrearConferenciaAdminComponent } from './pages/admin/crear-conferencia/crear-conferencia-admin.component';

const admin = roleGuard(['ADMINISTRADOR']);
const organizador = roleGuard(['ORGANIZADOR_CIENTIFICO']);
const evaluador = roleGuard(['EVALUADOR']);
const autor = roleGuard(['AUTOR']);

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'programa', component: ProgramaCongresoComponent },
  { path: 'circulares', component: CircularesPublicasComponent },
  { path: 'login', component: LoginComponent },
  { path: 'seleccion-rol', component: SeleccionRolComponent, canActivate: [authGuard, seleccionRolGuard] },
  { path: 'registro', component: RegistroComponent },

  // Inscripción al congreso (usuario registrado sin rol asistente aún)
  {
    path: 'inscripcion',
    component: InscripcionParticipanteComponent,
    canActivate: [authGuard],
  },

  // Panel asistente al congreso (tras aprobación de inscripción/pago)
  {
    path: 'asistente',
    component: PanelAsistenteComponent,
    canActivate: [asistenteGuard],
  },
  {
    path: 'asistente/cronograma',
    component: CronogramaParticipanteComponent,
    canActivate: [asistenteGuard],
  },
  {
    path: 'asistente/trabajos',
    component: TrabajosAutorComponent,
    canActivate: [asistenteGuard],
    data: { perfilTrabajos: 'asistente' },
  },
  {
    path: 'asistente/taller',
    component: ProponerTallerAsistenteComponent,
    canActivate: [asistenteGuard],
  },
  {
    path: 'asistente/certificado',
    component: CertificadoAsistenteComponent,
    canActivate: [asistenteGuard],
  },

  // Redirects legacy participante → nuevas rutas
  { path: 'participante', redirectTo: 'asistente', pathMatch: 'full' },
  { path: 'participante/inscripcion', redirectTo: 'inscripcion', pathMatch: 'full' },
  { path: 'participante/cronograma', redirectTo: 'asistente/cronograma', pathMatch: 'full' },
  { path: 'participante/trabajos', redirectTo: 'asistente/trabajos', pathMatch: 'full' },
  { path: 'participante/pago', redirectTo: 'inscripcion', pathMatch: 'full' },

  { path: 'notificaciones', component: NotificacionesComponent, canActivate: [authGuard] },

  // --- Perfil Administrador ---
  {
    path: 'admin',
    component: PanelAdminComponent,
    canActivate: [admin],
  },
  { path: 'admin/usuarios', component: UsuariosListaComponent, canActivate: [admin] },
  { path: 'admin/usuarios/nuevo', component: UsuarioAltaComponent, canActivate: [admin] },
  { path: 'admin/usuarios/:id', component: UsuarioDetalleComponent, canActivate: [admin] },
  { path: 'admin/pagos', component: PagosPendientesComponent, canActivate: [admin] },
  { path: 'admin/pagos/todos', component: PagosListaComponent, canActivate: [admin] },
  { path: 'admin/inscripciones', component: InscripcionesAdminComponent, canActivate: [admin] },
  { path: 'admin/actividades', component: ActividadesAdminComponent, canActivate: [admin] },
  { path: 'admin/mesas-tematicas', component: MesasTematicasAdminComponent, canActivate: [admin] },
  { path: 'admin/mesas-redondas', component: MesaRedondaAdminComponent, canActivate: [admin] },
  { path: 'admin/sesion-posters', component: SesionPostersAdminComponent, canActivate: [admin] },
  { path: 'admin/crear-taller', component: CrearTallerAdminComponent, canActivate: [admin] },
  { path: 'admin/crear-conferencia', component: CrearConferenciaAdminComponent, canActivate: [admin] },
  { path: 'admin/trabajos', component: TrabajosAdminComponent, canActivate: [admin] },
  { path: 'admin/estadisticas', component: AdminEstadisticasComponent, canActivate: [admin] },
  { path: 'admin/circulares/nueva', component: CircularFormAdminComponent, canActivate: [admin] },
  { path: 'admin/circulares/editar/:id', component: CircularFormAdminComponent, canActivate: [admin] },

  // --- Perfil Organizador científico ---
  {
    path: 'organizador',
    component: PanelRolComponent,
    canActivate: [organizador],
    data: {
      titulo: 'Comité Académico',
      descripcion: 'Prevalidación formal, evaluadores por eje y asignación de trabajos.',
      colorTema: 'indigo',
      iconoTema: '🎓',
      acciones: [
        {
          label: 'Panel del Comité Académico',
          route: '/organizador/comite',
          descripcion: 'Precheck, evaluadores por eje, asignaciones y confirmación final.',
          icono: '✓',
          color: 'violeta',
        },
      ],
    },
  },
  {
    path: 'organizador/comite',
    component: ComiteOcComponent,
    canActivate: [organizador],
  },
  {
    path: 'organizador/asignaciones',
    redirectTo: 'organizador/comite',
    pathMatch: 'full',
  },
  {
    path: 'organizador/promover',
    redirectTo: 'organizador/comite',
    pathMatch: 'full',
  },

  // --- Perfil Evaluador ---
  {
    path: 'evaluador',
    component: PanelRolComponent,
    canActivate: [evaluador],
    data: {
      titulo: 'Panel Evaluador',
      descripcion: 'Aceptá asignaciones y registrá evaluaciones de trabajos.',
      colorTema: 'teal',
      iconoTema: '📝',
      acciones: [
        {
          label: 'Mis asignaciones',
          route: '/evaluador/asignaciones',
          descripcion: 'Aceptá convocatorias, revisá PDFs y enviá tu dictamen.',
          icono: '📄',
          color: 'teal',
        },
      ],
    },
  },
  {
    path: 'evaluador/asignaciones',
    component: AsignacionesEvaluadorComponent,
    canActivate: [evaluador],
  },

  // --- Perfil Autor ---
  {
    path: 'autor',
    component: PanelRolComponent,
    canActivate: [autor],
    data: {
      titulo: 'Panel Autor',
      descripcion: 'Gestioná tus trabajos científicos y su estado de evaluación.',
      colorTema: 'naranja',
      iconoTema: '📄',
      acciones: [
        {
          label: 'Mis trabajos',
          route: '/autor/trabajos',
          descripcion: 'Creá borradores, adjuntá PDFs y seguí el estado.',
          icono: '📑',
          color: 'naranja',
        },
      ],
    },
  },
  { path: 'autor/trabajos', component: TrabajosAutorComponent, canActivate: [autor], data: { perfilTrabajos: 'autor' } },

  { path: '**', redirectTo: '' },
];
