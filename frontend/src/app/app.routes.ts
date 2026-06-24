import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { PerfilHomeComponent } from './pages/perfil-home/perfil-home.component';
import { UsuariosListaComponent } from './pages/admin/usuarios-lista/usuarios-lista.component';
import { UsuarioDetalleComponent } from './pages/admin/usuario-detalle/usuario-detalle.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'registro', component: RegistroComponent },
  {
    path: 'admin',
    component: PerfilHomeComponent,
    data: {
      titulo: 'Home — Administrador',
      descripcion: 'Gestión de usuarios, pagos y actividades (Entrega 5).',
      menu: [
        { label: 'Listado de usuarios', route: '/admin/usuarios' },
        { label: 'Nuevo usuario', route: '/registro' },
        {
          label: 'Validar pagos pendientes',
          route: '/admin',
          nota: 'Entrega 5 — pendiente',
        },
        {
          label: 'ABM actividades',
          route: '/admin',
          nota: 'Entrega 5 — pendiente',
        },
      ],
    },
  },
  { path: 'admin/usuarios', component: UsuariosListaComponent },
  { path: 'admin/usuarios/:id', component: UsuarioDetalleComponent },
  {
    path: 'organizador',
    component: PerfilHomeComponent,
    data: {
      titulo: 'Home — Organizador científico',
      descripcion: 'Asignación de trabajos a evaluadores y promoción de evaluadores.',
      menu: [
        { label: 'Asignar trabajos a evaluadores', route: '/organizador', nota: 'Entrega 5' },
        { label: 'Promover evaluadores', route: '/organizador', nota: 'Entrega 5' },
      ],
    },
  },
  {
    path: 'evaluador',
    component: PerfilHomeComponent,
    data: {
      titulo: 'Home — Evaluador',
      descripcion: 'Aceptar o rechazar asignaciones de trabajos.',
      menu: [
        { label: 'Mis asignaciones', route: '/evaluador', nota: 'Entrega 5' },
      ],
    },
  },
  {
    path: 'autor',
    component: PerfilHomeComponent,
    data: {
      titulo: 'Home — Autor',
      descripcion: 'Crear y enviar trabajos científicos.',
      menu: [
        { label: 'Mis trabajos', route: '/autor', nota: 'Entrega 5' },
        { label: 'Nuevo trabajo', route: '/autor', nota: 'Entrega 5' },
      ],
    },
  },
  {
    path: 'participante',
    component: PerfilHomeComponent,
    data: {
      titulo: 'Home — Participante',
      descripcion: 'Inscripción, cronograma personal y pagos.',
      menu: [
        { label: 'Mi cronograma', route: '/participante', nota: 'Entrega 5' },
        { label: 'Estado de pago', route: '/participante', nota: 'Entrega 5' },
        { label: 'Registrarme en el congreso', route: '/registro' },
      ],
    },
  },
  { path: '**', redirectTo: '' },
];
