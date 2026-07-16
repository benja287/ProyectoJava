import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { SolicitudEvaluador } from '../../../models/solicitud-evaluador.model';
import { SolicitudEvaluadorService } from '../../../servicios/solicitud-evaluador.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-solicitudes-evaluador-oc',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppPaginatorComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--indigo">
        <span class="panel-hero-icon" aria-hidden="true">📋</span>
        <div>
          <h1>Solicitudes de evaluadores</h1>
          <p>Revisá postulaciones, perfil y capacidad por eje. Aprobá o rechazá con motivo.</p>
        </div>
      </div>

      <p class="panel-volver">
        <a routerLink="/organizador">← Comité</a> ·
        <a routerLink="/organizador/evaluadores">Evaluadores por eje</a>
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <label class="inline-label">
        Estado
        <select [(ngModel)]="filtroEstado" (ngModelChange)="pagina = 1; cargar()">
          <option value="PENDIENTE">Pendientes</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="RECHAZADA">Rechazadas</option>
          <option value="REVOCADA">Revocadas</option>
          <option value="">Todas</option>
        </select>
      </label>

      @if (cargando) {
        <p class="muted">Cargando...</p>
      } @else if (items.length === 0) {
        <p class="muted dashed-box">No hay solicitudes con ese filtro.</p>
      } @else {
        <div class="solicitud-lista">
          @for (s of items; track s.id) {
            <article class="panel-card">
              <header class="solicitud-header">
                <div>
                  <h2>{{ s.nombreCompleto }}</h2>
                  <p class="muted">{{ s.email }} · {{ s.nacionalidad }} · {{ s.tipoIdentificacion }} {{ s.numeroIdentificacion }}</p>
                  @if (s.institucion) {
                    <p class="muted small">Institución: {{ s.institucion }}</p>
                  }
                </div>
                <span class="estado-badge">{{ s.estado }}</span>
              </header>

              <dl class="detalle">
                <dt>Formación</dt>
                <dd>{{ s.formacionAgroecologia }}</dd>
                <dt>Experiencia</dt>
                <dd>
                  Ediciones del congreso: {{ s.evaluoEdicionesCongreso ? 'Sí' : 'No' }} ·
                  Otros: {{ s.evaluoOtrosCongresos ? 'Sí' : 'No' }}
                </dd>
                <dt>Áreas</dt>
                <dd>{{ (s.areasConocimiento || []).join(', ') || '—' }}</dd>
                <dt>Sub-áreas</dt>
                <dd>{{ (s.subareas || []).join(', ') || '—' }}</dd>
                <dt>Capacidad declarada (solicitud)</dt>
                <dd>
                  <ul>
                    @for (c of s.capacidades; track c.ejeTematico) {
                      @if (c.capacidad > 0) {
                        <li>
                          <strong>{{ c.capacidad }}</strong> — {{ c.ejeTematico }}
                        </li>
                      }
                    }
                  </ul>
                </dd>
                @if (s.estado === 'APROBADA' && (s.cuposAsignados?.length ?? 0) > 0) {
                  <dt>Cupos asignados (restantes)</dt>
                  <dd>
                    <ul>
                      @for (c of s.cuposAsignados!; track c.ejeTematico) {
                        <li>
                          <strong>{{ c.restantes }}</strong> / {{ c.capacidadMax }} —
                          {{ c.ejeTematico }}
                        </li>
                      }
                    </ul>
                  </dd>
                }
                @if (s.observaciones) {
                  <dt>Observaciones</dt>
                  <dd>{{ s.observaciones }}</dd>
                }
                @if (s.revisadoPorNombre) {
                  <dt>Revisó</dt>
                  <dd>{{ s.revisadoPorNombre }} · {{ formatFecha(s.fechaRevision) }}</dd>
                }
                @if (s.estado === 'REVOCADA' && s.motivoRechazo) {
                  <dt>Revocación</dt>
                  <dd>{{ s.motivoRechazo }}</dd>
                }
                @if (s.ejeAsignado) {
                  <dt>Resumen asignación</dt>
                  <dd>{{ s.ejeAsignado }}</dd>
                }
              </dl>

              <div class="acciones-celda">
                <button type="button" class="btn-secundario" (click)="invitar(s)" [disabled]="procesandoId != null">
                  {{ s.invitacionTallerEnviada ? 'Reenviar invitación taller' : 'Invitar al taller' }}
                </button>
                @if (s.estado === 'PENDIENTE') {
                  <p class="form-hint">
                    Al aprobar se asignan <strong>todos</strong> los ejes con capacidad &gt; 0 (cupos
                    = capacidad declarada).
                  </p>
                  <button type="button" class="btn-ok" (click)="aprobar(s)" [disabled]="procesandoId != null">
                    Aprobar y asignar ejes con cupo
                  </button>
                  <button type="button" class="btn-warn" (click)="rechazar(s)" [disabled]="procesandoId != null">
                    Rechazar
                  </button>
                }
              </div>
            </article>
          }
        </div>
        <app-paginator
          [currentPage]="pagina"
          [totalPages]="totalPaginas"
          [total]="total"
          [disabled]="cargando"
          (pageChange)="irPagina($event)"
        />
      }
    </div>
  `,
  styles: [
    `
      .solicitud-lista {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
      }
      .solicitud-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .solicitud-header h2 {
        margin: 0;
        font-size: 1.15rem;
      }
    `,
  ],
})
export class SolicitudesEvaluadorOcComponent implements OnInit {
  private readonly service = inject(SolicitudEvaluadorService);

  items: SolicitudEvaluador[] = [];
  filtroEstado = 'PENDIENTE';
  pagina = 1;
  total = 0;
  totalPaginas = 0;
  cargando = false;
  error = '';
  mensaje = '';
  procesandoId: number | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.service.listar(this.pagina, 10, this.filtroEstado || undefined).subscribe({
      next: (p) => {
        this.items = p.items;
        this.total = p.total;
        this.totalPaginas = p.totalPages;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar las solicitudes.');
        this.cargando = false;
      },
    });
  }

  irPagina(n: number): void {
    this.pagina = n;
    this.cargar();
  }

  aprobar(s: SolicitudEvaluador): void {
    if (!s.id) return;
    const ejes =
      (s.capacidades || [])
        .filter((c) => c.capacidad > 0)
        .map((c) => `• ${c.ejeTematico} (cupo ${c.capacidad})`)
        .join('\n') || '(sin ejes con capacidad)';
    if (
      !confirm(
        `¿Aprobar a ${s.nombreCompleto} como EVALUADOR y asignar estos ejes?\n\n${ejes}\n\nTambién se envía invitación al taller.`
      )
    ) {
      return;
    }
    this.procesandoId = s.id;
    this.service
      .validar(s.id, {
        aprobar: true,
        enviarInvitacionTaller: true,
      })
      .subscribe({
        next: () => {
          this.mensaje =
            'Solicitud aprobada. Rol EVALUADOR y cupos por eje asignados.';
          this.procesandoId = null;
          this.cargar();
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo aprobar.');
          this.procesandoId = null;
        },
      });
  }

  rechazar(s: SolicitudEvaluador): void {
    if (!s.id) return;
    const motivo = prompt('Motivo del rechazo:')?.trim();
    if (!motivo) return;
    this.procesandoId = s.id;
    this.service.validar(s.id, { aprobar: false, motivoRechazo: motivo }).subscribe({
      next: () => {
        this.mensaje = 'Solicitud rechazada.';
        this.procesandoId = null;
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo rechazar.');
        this.procesandoId = null;
      },
    });
  }

  invitar(s: SolicitudEvaluador): void {
    if (!s.id) return;
    this.procesandoId = s.id;
    this.service.invitarTaller(s.id).subscribe({
      next: () => {
        this.mensaje = 'Invitación al taller enviada.';
        this.procesandoId = null;
        this.cargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo enviar la invitación.');
        this.procesandoId = null;
      },
    });
  }

  formatFecha(raw?: string | null): string {
    if (!raw) return '—';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleString('es-AR');
  }
}
