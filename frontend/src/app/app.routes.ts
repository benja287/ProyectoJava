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
import { PagoDetalleComponent } from './pages/admin/pago-detalle/pago-detalle.component';
import { ArqueoCajaComponent } from './pages/admin/arqueo-caja/arqueo-caja.component';
import { TrabajosAdminComponent } from './pages/admin/trabajos/trabajos-admin.component';
import { TrabajoDetalleComponent } from './pages/admin/trabajo-detalle/trabajo-detalle.component';
import { InscripcionDetalleComponent } from './pages/admin/inscripcion-detalle/inscripcion-detalle.component';
import { PanelEvaluadorComponent } from './pages/evaluador/panel-evaluador.component';
import { DictamenEvaluadorComponent } from './pages/evaluador/dictamen/dictamen-evaluador.component';
import { TrabajosAutorComponent } from './pages/autor/trabajos/trabajos-autor.component';
import { PanelAutorComponent } from './pages/autor/panel-autor.component';
import { CronogramaParticipanteComponent } from './pages/participante/cronograma/cronograma-participante.component';
import { InscripcionParticipanteComponent } from './pages/participante/inscripcion/inscripcion-participante.component';
import { PagoParticipanteComponent } from './pages/participante/pago/pago-participante.component';
import { InscripcionesAdminComponent } from './pages/admin/inscripciones/inscripciones-admin.component';
import { PanelAsistenteComponent } from './pages/asistente/panel-asistente.component';
import { MesasTematicasAdminComponent } from './pages/admin/mesas-tematicas/mesas-tematicas-admin.component';
import { SesionPostersAdminComponent } from './pages/admin/sesion-posters/sesion-posters-admin.component';
import { ComiteOcComponent } from './pages/organizador/comite/comite-oc.component';
import { PanelOrganizadorComponent } from './pages/organizador/panel-organizador/panel-organizador.component';
import { PlazoEnvioOcComponent } from './pages/organizador/plazo-envio/plazo-envio-oc.component';
import { EvaluadoresEjeOcComponent } from './pages/organizador/evaluadores-eje/evaluadores-eje-oc.component';
import { ProponerTallerAsistenteComponent } from './pages/asistente/proponer-taller/proponer-taller-asistente.component';
import { CertificadoAsistenteComponent } from './pages/asistente/certificado-asistente.component';
import { MiInscripcionAsistenteComponent } from './pages/asistente/mi-inscripcion-asistente.component';
import { PanelAdminComponent } from './pages/admin/panel-admin/panel-admin.component';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';
import { AdminEstadisticasComponent } from './pages/admin/admin-estadisticas/admin-estadisticas.component';
import { CircularFormAdminComponent } from './pages/admin/circular-form/circular-form-admin.component';
import { CircularesPublicasComponent } from './pages/circulares/circulares-publicas.component';
import { ProgramaCongresoComponent } from './pages/programa/programa-congreso.component';
import { MesaRedondaAdminComponent } from './pages/admin/mesa-redonda/mesa-redonda-admin.component';
import { CrearTallerAdminComponent } from './pages/admin/crear-taller/crear-taller-admin.component';
import { CrearConferenciaAdminComponent } from './pages/admin/crear-conferencia/crear-conferencia-admin.component';
import { EmailsAdminComponent } from './pages/admin/emails/emails-admin.component';
import { NotificacionesAdminComponent } from './pages/admin/notificaciones-admin/notificaciones-admin.component';
import { CongresoAdminComponent } from './pages/admin/congreso-admin/congreso-admin.component';
import { CongresoDatosAdminComponent } from './pages/admin/congreso-admin/congreso-datos-admin.component';
import { CongresoAulasAdminComponent } from './pages/admin/congreso-admin/congreso-aulas-admin.component';
import { CongresoAulaFormAdminComponent } from './pages/admin/congreso-admin/congreso-aula-form-admin.component';
import { CongresoFranjasAdminComponent } from './pages/admin/congreso-admin/congreso-franjas-admin.component';
import { CongresoProgramaAdminComponent } from './pages/admin/congreso-admin/congreso-programa-admin.component';
import { CongresoCertificadosAdminComponent } from './pages/admin/congreso-admin/congreso-certificados-admin.component';
import { CongresoFechasAdminComponent } from './pages/admin/congreso-admin/congreso-fechas-admin.component';
import { CongresoArancelesAdminComponent } from './pages/admin/congreso-admin/congreso-aranceles-admin.component';
import { CongresoActividadesAdminComponent } from './pages/admin/congreso-admin/congreso-actividades-admin.component';
import { CircularesAdminComponent } from './pages/admin/circulares-admin/circulares-admin.component';
import { LimpiezaAdminComponent } from './pages/admin/limpieza-admin/limpieza-admin.component';
import { SolicitudesAutorAdminComponent } from './pages/admin/solicitudes-autor-admin/solicitudes-autor-admin.component';
import { NotificacionBroadcastAdminComponent } from './pages/admin/notificacion-broadcast-admin/notificacion-broadcast-admin.component';
import { HistoriaCongresoComponent } from './pages/historia/historia-congreso.component';
import { MiPerfilComponent } from './pages/mi-perfil/mi-perfil.component';
import { SolicitudEvaluadorComponent } from './pages/solicitud-evaluador/solicitud-evaluador.component';
import { SolicitudesEvaluadorOcComponent } from './pages/organizador/solicitudes-evaluador/solicitudes-evaluador-oc.component';

const admin = roleGuard(['ADMINISTRADOR']);
const organizador = roleGuard(['ORGANIZADOR_CIENTIFICO']);
const evaluador = roleGuard(['EVALUADOR']);
const autor = roleGuard(['AUTOR']);

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'programa', component: ProgramaCongresoComponent },
  { path: 'circulares', component: CircularesPublicasComponent },
  { path: 'historia', component: HistoriaCongresoComponent },
  { path: 'login', component: LoginComponent },
  { path: 'seleccion-rol', component: SeleccionRolComponent, canActivate: [authGuard, seleccionRolGuard] },
  { path: 'registro', component: RegistroComponent },
  { path: 'mi-perfil', component: MiPerfilComponent, canActivate: [authGuard] },
  { path: 'solicitud-evaluador', component: SolicitudEvaluadorComponent, canActivate: [authGuard] },

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
    data: { perfilParticipante: 'asistente' },
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
  {
    path: 'asistente/inscripcion',
    component: MiInscripcionAsistenteComponent,
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
  { path: 'admin/pagos/arqueo', component: ArqueoCajaComponent, canActivate: [admin] },
  { path: 'admin/pagos/:id', component: PagoDetalleComponent, canActivate: [admin] },
  { path: 'admin/inscripciones', component: InscripcionesAdminComponent, canActivate: [admin] },
  { path: 'admin/inscripciones/:id', component: InscripcionDetalleComponent, canActivate: [admin] },
  { path: 'admin/actividades', redirectTo: 'admin', pathMatch: 'full' },
  { path: 'admin/mesas-tematicas', component: MesasTematicasAdminComponent, canActivate: [admin] },
  { path: 'admin/mesas-redondas', component: MesaRedondaAdminComponent, canActivate: [admin] },
  { path: 'admin/sesion-posters', component: SesionPostersAdminComponent, canActivate: [admin] },
  { path: 'admin/crear-taller', component: CrearTallerAdminComponent, canActivate: [admin] },
  { path: 'admin/crear-conferencia', component: CrearConferenciaAdminComponent, canActivate: [admin] },
  { path: 'admin/trabajos', component: TrabajosAdminComponent, canActivate: [admin] },
  { path: 'admin/trabajos/:id', component: TrabajoDetalleComponent, canActivate: [admin] },
  { path: 'admin/estadisticas', component: AdminEstadisticasComponent, canActivate: [admin] },
  { path: 'admin/emails', component: EmailsAdminComponent, canActivate: [admin] },
  { path: 'admin/notificaciones', component: NotificacionesAdminComponent, canActivate: [admin] },
  {
    path: 'admin/congreso/datos',
    component: CongresoDatosAdminComponent,
    canActivate: [admin],
  },
  {
    path: 'admin/congreso/aulas/nueva',
    component: CongresoAulaFormAdminComponent,
    canActivate: [admin],
  },
  {
    path: 'admin/congreso/aulas/:id',
    component: CongresoAulaFormAdminComponent,
    canActivate: [admin],
  },
  { path: 'admin/congreso/aulas', component: CongresoAulasAdminComponent, canActivate: [admin] },
  {
    path: 'admin/congreso/franjas',
    component: CongresoFranjasAdminComponent,
    canActivate: [admin],
  },
  {
    path: 'admin/congreso/programa',
    component: CongresoProgramaAdminComponent,
    canActivate: [admin],
  },
  {
    path: 'admin/congreso/actividades',
    component: CongresoActividadesAdminComponent,
    canActivate: [admin],
  },
  {
    path: 'admin/congreso/certificados',
    component: CongresoCertificadosAdminComponent,
    canActivate: [admin],
  },
  { path: 'admin/congreso/fechas', component: CongresoFechasAdminComponent, canActivate: [admin] },
  {
    path: 'admin/congreso/aranceles',
    component: CongresoArancelesAdminComponent,
    canActivate: [admin],
  },
  { path: 'admin/congreso', component: CongresoAdminComponent, canActivate: [admin] },
  { path: 'admin/limpieza', component: LimpiezaAdminComponent, canActivate: [admin] },
  { path: 'admin/solicitudes-autor', component: SolicitudesAutorAdminComponent, canActivate: [admin] },
  { path: 'admin/notificaciones-broadcast', component: NotificacionBroadcastAdminComponent, canActivate: [admin] },
  { path: 'admin/circulares/nueva', component: CircularFormAdminComponent, canActivate: [admin] },
  { path: 'admin/circulares/editar/:id', component: CircularFormAdminComponent, canActivate: [admin] },
  { path: 'admin/circulares', component: CircularesAdminComponent, canActivate: [admin] },

  // --- Perfil Organizador científico ---
  {
    path: 'organizador',
    component: PanelOrganizadorComponent,
    canActivate: [organizador],
  },
  {
    path: 'organizador/comite',
    component: ComiteOcComponent,
    canActivate: [organizador],
  },
  {
    path: 'organizador/evaluadores',
    component: EvaluadoresEjeOcComponent,
    canActivate: [organizador],
  },
  {
    path: 'organizador/solicitudes-evaluador',
    component: SolicitudesEvaluadorOcComponent,
    canActivate: [organizador],
  },
  {
    path: 'organizador/plazo-envio',
    component: PlazoEnvioOcComponent,
    canActivate: [organizador],
  },
  {
    path: 'organizador/estadisticas',
    component: AdminEstadisticasComponent,
    canActivate: [organizador],
    data: { vistaComite: true },
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
    component: PanelEvaluadorComponent,
    canActivate: [evaluador],
  },
  {
    path: 'evaluador/dictamen/:asignacionId',
    component: DictamenEvaluadorComponent,
    canActivate: [evaluador],
  },
  {
    path: 'evaluador/asignaciones',
    redirectTo: 'evaluador',
    pathMatch: 'full',
  },
  {
    path: 'evaluador/certificado',
    component: CertificadoAsistenteComponent,
    canActivate: [evaluador],
  },

  // --- Perfil Autor ---
  {
    path: 'autor',
    component: PanelAutorComponent,
    canActivate: [autor],
  },
  {
    path: 'autor/cronograma',
    component: CronogramaParticipanteComponent,
    canActivate: [autor],
    data: { perfilParticipante: 'autor' },
  },
  { path: 'autor/trabajos', component: TrabajosAutorComponent, canActivate: [autor], data: { perfilTrabajos: 'autor' } },

  { path: '**', redirectTo: '' },
];
