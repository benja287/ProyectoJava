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
import { PerfilHomeComponent } from './pages/perfil-home/perfil-home.component';
import { UsuariosListaComponent } from './pages/admin/usuarios-lista/usuarios-lista.component';
import { UsuarioDetalleComponent } from './pages/admin/usuario-detalle/usuario-detalle.component';
import { UsuarioAltaComponent } from './pages/admin/usuario-alta/usuario-alta.component';
import { PagosPendientesComponent } from './pages/admin/pagos-pendientes/pagos-pendientes.component';
import { PagosListaComponent } from './pages/admin/pagos-lista/pagos-lista.component';
import { ActividadesAdminComponent } from './pages/admin/actividades/actividades-admin.component';
import { TrabajosAdminComponent } from './pages/admin/trabajos/trabajos-admin.component';
import { AsignacionesOcComponent } from './pages/organizador/asignaciones/asignaciones-oc.component';
import { PromoverEvaluadorComponent } from './pages/organizador/promover-evaluador/promover-evaluador.component';
import { AsignacionesEvaluadorComponent } from './pages/evaluador/asignaciones/asignaciones-evaluador.component';
import { TrabajosAutorComponent } from './pages/autor/trabajos/trabajos-autor.component';
import { CronogramaParticipanteComponent } from './pages/participante/cronograma/cronograma-participante.component';
import { InscripcionParticipanteComponent } from './pages/participante/inscripcion/inscripcion-participante.component';
import { PagoParticipanteComponent } from './pages/participante/pago/pago-participante.component';
import { InscripcionesAdminComponent } from './pages/admin/inscripciones/inscripciones-admin.component';
import { SeleccionRolComponent } from './pages/seleccion-rol/seleccion-rol.component';
import { PanelAsistenteComponent } from './pages/asistente/panel-asistente.component';
import { CertificadoAsistenteComponent } from './pages/asistente/certificado-asistente.component';

const admin = roleGuard(['ADMINISTRADOR']);
const organizador = roleGuard(['ORGANIZADOR_CIENTIFICO']);
const evaluador = roleGuard(['EVALUADOR']);
const autor = roleGuard(['AUTOR']);

export const routes: Routes = [
  { path: '', component: InicioComponent },
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
    component: TrabajosAutorComponent,
    canActivate: [asistenteGuard],
    data: { perfilTrabajos: 'asistente', tipoTaller: true },
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

  // --- Perfil Administrador ---
  {
    path: 'admin',
    component: PerfilHomeComponent,
    canActivate: [admin],
    data: {
      titulo: 'Home — Administrador',
      descripcion: 'Gestión de usuarios, pagos y actividades.',
      menu: [
        { label: 'Listado de usuarios', route: '/admin/usuarios' },
        { label: 'Nuevo usuario', route: '/admin/usuarios/nuevo' },
        { label: 'Validar pagos pendientes', route: '/admin/pagos' },
        { label: 'Inscripciones al congreso', route: '/admin/inscripciones' },
        { label: 'Listado de pagos (limpieza)', route: '/admin/pagos/todos' },
        { label: 'ABM actividades', route: '/admin/actividades' },
        { label: 'Listado de trabajos (limpieza)', route: '/admin/trabajos' },
      ],
    },
  },
  { path: 'admin/usuarios', component: UsuariosListaComponent, canActivate: [admin] },
  { path: 'admin/usuarios/nuevo', component: UsuarioAltaComponent, canActivate: [admin] },
  { path: 'admin/usuarios/:id', component: UsuarioDetalleComponent, canActivate: [admin] },
  { path: 'admin/pagos', component: PagosPendientesComponent, canActivate: [admin] },
  { path: 'admin/pagos/todos', component: PagosListaComponent, canActivate: [admin] },
  { path: 'admin/inscripciones', component: InscripcionesAdminComponent, canActivate: [admin] },
  { path: 'admin/actividades', component: ActividadesAdminComponent, canActivate: [admin] },
  { path: 'admin/trabajos', component: TrabajosAdminComponent, canActivate: [admin] },

  // --- Perfil Organizador científico ---
  {
    path: 'organizador',
    component: PerfilHomeComponent,
    canActivate: [organizador],
    data: {
      titulo: 'Home — Organizador científico',
      descripcion: 'Asignación de trabajos a evaluadores y promoción de evaluadores.',
      menu: [
        { label: 'Asignar trabajos a evaluadores', route: '/organizador/asignaciones' },
        { label: 'Promover evaluadores', route: '/organizador/promover' },
      ],
    },
  },
  {
    path: 'organizador/asignaciones',
    component: AsignacionesOcComponent,
    canActivate: [organizador],
  },
  {
    path: 'organizador/promover',
    component: PromoverEvaluadorComponent,
    canActivate: [organizador],
  },

  // --- Perfil Evaluador ---
  {
    path: 'evaluador',
    component: PerfilHomeComponent,
    canActivate: [evaluador],
    data: {
      titulo: 'Home — Evaluador',
      descripcion: 'Aceptar o rechazar asignaciones de trabajos.',
      menu: [{ label: 'Mis asignaciones', route: '/evaluador/asignaciones' }],
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
    component: PerfilHomeComponent,
    canActivate: [autor],
    data: {
      titulo: 'Home — Autor',
      descripcion: 'Crear y enviar trabajos científicos.',
      menu: [{ label: 'Mis trabajos', route: '/autor/trabajos' }],
    },
  },
  { path: 'autor/trabajos', component: TrabajosAutorComponent, canActivate: [autor], data: { perfilTrabajos: 'autor' } },

  { path: '**', redirectTo: '' },
];
