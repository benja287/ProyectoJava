import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PASOS_CREAR_PROGRAMA } from './congreso-programa-guia.component';

/**
 * Hub de Congreso: guía para crear el programa + gestión extra.
 */
@Component({
  selector: 'app-congreso-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin">
        <span class="panel-hero-icon" aria-hidden="true">📅</span>
        <div>
          <h1>Congreso</h1>
          <p>Seguí la guía para armar el programa, o gestioná el resto del evento</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin">← Volver al panel</a></p>

      <section class="panel-card panel-card--indigo">
        <h2>Crear programa</h2>
        <p class="muted">
          Orden recomendado para el admin: primero datos y sede, después franjas, luego aulas, y al
          final las actividades (con aulas y franjas en el desplegable). Lo que creés aparece en
          Programa.
        </p>
        <div class="panel-asistente-grid">
          @for (p of pasosPrograma; track p.paso) {
            <a [routerLink]="p.ruta" class="accion-card">
              <span class="accion-icono accion-icono--indigo" aria-hidden="true">{{ p.paso }}</span>
              <div>
                <h3>Paso {{ p.paso }} · {{ p.titulo }}</h3>
                <p>{{ p.detalle }}</p>
              </div>
            </a>
          }
          <a routerLink="/admin/congreso/programa" class="accion-card">
            <span class="accion-icono accion-icono--violeta" aria-hidden="true">🗓</span>
            <div>
              <h3>Ver programa</h3>
              <p>Publicación y cronograma: se refleja lo que vas creando</p>
            </div>
          </a>
        </div>
      </section>

      <section class="panel-card" style="margin-top: 1.25rem">
        <h2>Otras gestiones</h2>
        <div class="panel-asistente-grid">
          <a routerLink="/admin/congreso/certificados" class="accion-card">
            <span class="accion-icono accion-icono--verde" aria-hidden="true">📜</span>
            <div>
              <h3>Certificados</h3>
              <p>Fecha de descarga y finalización del congreso</p>
            </div>
          </a>
          <a routerLink="/admin/congreso/fechas" class="accion-card">
            <span class="accion-icono accion-icono--naranja" aria-hidden="true">⏱</span>
            <div>
              <h3>Ventanas de tiempo</h3>
              <p>Fechas del evento, inscripción, envío y evaluación</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  `,
})
export class CongresoAdminComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly pasosPrograma = PASOS_CREAR_PROGRAMA;

  ngOnInit(): void {
    const editarAula = this.route.snapshot.queryParamMap.get('editarAula');
    if (editarAula) {
      const id = Number(editarAula);
      void this.router.navigate(
        Number.isFinite(id) ? ['/admin/congreso/aulas', id] : ['/admin/congreso/aulas'],
        { replaceUrl: true }
      );
    }
  }
}
