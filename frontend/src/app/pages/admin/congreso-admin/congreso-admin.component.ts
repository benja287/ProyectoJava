import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

/**
 * Hub de Congreso: misma grilla que el panel admin, una card por operación.
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
          <p>Elegí qué querés gestionar</p>
        </div>
      </div>

      <p class="panel-volver"><a routerLink="/admin">← Volver al panel</a></p>

      <div class="panel-asistente-grid">
        <a routerLink="/admin/congreso/datos" class="accion-card">
          <span class="accion-icono accion-icono--indigo" aria-hidden="true">🏛</span>
          <div>
            <h3>Datos del congreso</h3>
            <p>Nombre, edición, sede y ubicación en el mapa</p>
          </div>
        </a>
        <a routerLink="/admin/congreso/aulas" class="accion-card">
          <span class="accion-icono accion-icono--teal" aria-hidden="true">📍</span>
          <div>
            <h3>Aulas</h3>
            <p>Alta, capacidad y punto en el mapa de la sede</p>
          </div>
        </a>
        <a routerLink="/admin/congreso/franjas" class="accion-card">
          <span class="accion-icono accion-icono--naranja" aria-hidden="true">⏱</span>
          <div>
            <h3>Franjas horarias</h3>
            <p>Jornada del evento y bloques libres por día (arrastrá para crear)</p>
          </div>
        </a>
        <a routerLink="/admin/congreso/actividades" class="accion-card">
          <span class="accion-icono accion-icono--azul" aria-hidden="true">🎯</span>
          <div>
            <h3>Crear actividades</h3>
            <p>Mesas, pósters, taller y conferencia</p>
          </div>
        </a>
        <a routerLink="/admin/congreso/programa" class="accion-card">
          <span class="accion-icono accion-icono--violeta" aria-hidden="true">🗓</span>
          <div>
            <h3>Programa</h3>
            <p>Publicación y cronograma de actividades</p>
          </div>
        </a>
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
    </div>
  `,
})
export class CongresoAdminComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    // Compat: ?editarAula=id → formulario de esa aula
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
