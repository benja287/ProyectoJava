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
    <div class="panel-page congreso-hub">
      <div class="panel-hero panel-hero--admin congreso-hub-hero">
        <span class="panel-hero-icon" aria-hidden="true">📅</span>
        <div>
          <h1>Congreso</h1>
          <p>Seguí la guía para armar el programa, o gestioná el resto del evento</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin">← Volver al panel</a></p>

      <section class="panel-card congreso-hub-section">
        <h2>Crear programa</h2>
        <p class="muted congreso-hub-lead">
          Orden recomendado: primero datos y sede, después franjas, luego aulas, y al final las
          actividades. Lo que creés aparece en Programa.
        </p>
        <div class="panel-asistente-grid congreso-accion-grid congreso-accion-grid--programa">
          @for (p of pasosPrograma; track p.paso) {
            <a
              [routerLink]="p.ruta"
              class="accion-card accion-card--visual"
              [attr.data-card]="p.card"
            >
              <div class="accion-card-cover">
                <img
                  class="accion-card-media"
                  [src]="'/congreso-card-' + p.card + '.webp'"
                  alt=""
                />
                <h3>Paso {{ p.paso }} · {{ p.titulo }}</h3>
              </div>
              <div class="accion-card-foot">
                <p>{{ p.detalle }}</p>
              </div>
            </a>
          }
          <a
            routerLink="/admin/congreso/programa"
            class="accion-card accion-card--visual"
            data-card="programa"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/congreso-card-programa.webp" alt="" />
              <h3>Ver programa</h3>
            </div>
            <div class="accion-card-foot">
              <p>Publicación y cronograma: se refleja lo que vas creando</p>
            </div>
          </a>
        </div>
      </section>

      <section class="panel-card congreso-hub-section" style="margin-top: 1.25rem">
        <h2>Otras gestiones</h2>
        <div class="panel-asistente-grid congreso-accion-grid">
          <a
            routerLink="/admin/congreso/certificados"
            class="accion-card accion-card--visual"
            data-card="certificados"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/congreso-card-certificados.webp" alt="" />
              <h3>Certificados</h3>
            </div>
            <div class="accion-card-foot">
              <p>Fecha de descarga y finalización del congreso</p>
            </div>
          </a>
          <a
            routerLink="/admin/congreso/fechas"
            class="accion-card accion-card--visual"
            data-card="fechas"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/congreso-card-fechas.webp" alt="" />
              <h3>Ventanas de tiempo</h3>
            </div>
            <div class="accion-card-foot">
              <p>Fechas del evento, inscripción, envío y evaluación</p>
            </div>
          </a>
          <a
            routerLink="/admin/congreso/aranceles"
            class="accion-card accion-card--visual"
            data-card="aranceles"
          >
            <div class="accion-card-cover">
              <img class="accion-card-media" src="/congreso-card-aranceles.webp" alt="" />
              <h3>Aranceles y pago</h3>
            </div>
            <div class="accion-card-foot">
              <p>Precios por categoría, alias/QR y publicar para inscripción</p>
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
