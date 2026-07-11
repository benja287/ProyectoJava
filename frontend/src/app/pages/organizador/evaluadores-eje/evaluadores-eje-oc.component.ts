import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EJES_TEMATICOS } from '../../../constants/ejes-tematicos';
import { Usuario } from '../../../models/usuario.model';
import { UsuarioService } from '../../../servicios/usuario.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { etiquetaCategoria } from '../../../models/inscripcion.model';

@Component({
  selector: 'app-evaluadores-eje-oc',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--indigo">
        <span class="panel-hero-icon" aria-hidden="true">👤</span>
        <div>
          <h1>Evaluadores por eje temático</h1>
          <p>Asignar y quitar evaluadores en cada eje</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <section class="panel-card">
        <div class="comite-section-header">
          <h2>Evaluadores por eje temático</h2>
          <span class="comite-counter">Evaluadores: {{ evaluadores.length }}</span>
        </div>
        <div class="evaluadores-grid">
          @if (cargandoUsuarios) {
            <p class="muted">Cargando usuarios...</p>
          } @else if (usuarios.length === 0) {
            <p class="error">
              No se pudieron cargar los usuarios. Verificá que estés logueado como Comité Académico.
            </p>
          } @else {
          @for (u of usuarios; track u.id) {
            <article class="evaluador-card">
              <div class="evaluador-card-top">
                <div>
                  <strong>{{ u.nombre }} {{ u.apellido }}</strong>
                  <p class="muted evaluador-email">{{ u.email }}</p>
                  <div class="rol-badges">
                    @for (r of u.roles ?? []; track r) {
                      <span class="rol-badge">{{ r.toLowerCase() }}</span>
                    }
                  </div>
                </div>
                <span
                  class="evaluador-estado"
                  [class.evaluador-estado--ok]="esEvaluadorConEje(u)"
                >
                  {{ esEvaluadorConEje(u) ? 'Evaluador' : 'No evaluador' }}
                </span>
              </div>
              <p class="muted categoria-inscripcion">
                Categoría de inscripción
                <span class="categoria-inscripcion-valor">{{ categoriaLabel(u.categoriaInscripcion) }}</span>
              </p>
              @if (!esEvaluadorConEje(u)) {
                <label class="eval-select-label">
                  Elegí eje temático para hacerlo evaluador
                  <select
                    [value]="ejeDraft[u.id!] || ''"
                    (change)="setEjeDraft(u.id!, $any($event.target).value)"
                  >
                    <option value="">Seleccionar eje...</option>
                    @for (eje of ejesTematicos; track eje) {
                      <option [value]="eje">{{ eje }}</option>
                    }
                  </select>
                </label>
                <button
                  type="button"
                  class="btn-primary-full"
                  (click)="hacerEvaluador(u)"
                  [disabled]="procesando"
                >
                  Hacer evaluador en este eje
                </button>
              } @else {
                <label class="eval-select-label">
                  Eje temático asignado
                  <select disabled>
                    <option>{{ u.ejeTematicoEvaluador || '(sin eje)' }}</option>
                  </select>
                </label>
                <button
                  type="button"
                  class="btn-quitar-eje"
                  (click)="quitarDelEje(u)"
                  [disabled]="procesando"
                >
                  Quitar del eje temático
                </button>
                <p class="form-hint">
                  Regla: máximo 3 evaluadores por eje. Si quitás a uno del eje, liberás cupo para asignar otro.
                </p>
              }
            </article>
          }
          }
        </div>
      </section>

      <p><a routerLink="/organizador">← Volver al panel del comité</a></p>
    </div>
  `,
})
export class EvaluadoresEjeOcComponent implements OnInit {
  readonly ejesTematicos = [...EJES_TEMATICOS];

  usuarios: Usuario[] = [];
  cargandoUsuarios = true;
  ejeDraft: Record<number, string> = {};
  procesando = false;
  error = '';
  mensaje = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  get evaluadores(): Usuario[] {
    return this.usuarios.filter((u) => !!u.ejeTematicoEvaluador?.trim());
  }

  esEvaluadorConEje(u: Usuario): boolean {
    return !!u.ejeTematicoEvaluador?.trim();
  }

  categoriaLabel(categoria?: string | null): string {
    return etiquetaCategoria(categoria ?? '') || 'Sin categoría';
  }

  setEjeDraft(userId: number, eje: string): void {
    this.ejeDraft = { ...this.ejeDraft, [userId]: eje };
  }

  hacerEvaluador(u: Usuario): void {
    if (!u.id) return;
    const eje = this.ejeDraft[u.id];
    if (!eje) {
      this.error = 'Elegí un eje temático del desplegable.';
      return;
    }
    this.procesando = true;
    this.error = '';
    this.usuarioService.asignarEvaluadorEje(u.id, eje).subscribe({
      next: () => {
        this.mensaje = `${u.nombre} ${u.apellido} quedó como evaluador en el eje seleccionado.`;
        this.procesando = false;
        this.ejeDraft = { ...this.ejeDraft, [u.id!]: '' };
        this.cargarUsuarios();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo asignar el evaluador.');
        this.procesando = false;
      },
    });
  }

  quitarDelEje(u: Usuario): void {
    if (!u.id || !confirm('¿Quitar a este usuario del eje temático?')) return;
    this.procesando = true;
    this.usuarioService.quitarEvaluadorEje(u.id).subscribe({
      next: () => {
        this.mensaje = 'Se quitó al evaluador del eje.';
        this.procesando = false;
        this.cargarUsuarios();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo quitar del eje.');
        this.procesando = false;
      },
    });
  }

  private cargarUsuarios(): void {
    this.cargandoUsuarios = true;
    this.usuarioService.listar(1, 500).subscribe({
      next: (items) => {
        this.usuarios = items.filter((u) => u.activo !== false);
        this.cargandoUsuarios = false;
      },
      error: (err) => {
        this.usuarios = [];
        this.cargandoUsuarios = false;
        this.error = mensajeErrorApi(err, 'No se pudieron cargar los usuarios para asignar evaluadores.');
      },
    });
  }
}
