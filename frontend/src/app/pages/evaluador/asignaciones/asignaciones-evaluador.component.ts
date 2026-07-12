import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { LoginService } from '../../../auth/login.service';
import { AsignacionEvaluacion } from '../../../models/asignacion.model';
import { AsignacionService } from '../../../servicios/asignacion.service';
import { EvaluacionService } from '../../../servicios/evaluacion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-asignaciones-evaluador',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ArchivoLinkComponent, AppPaginatorComponent],
  template: `
    <section class="card">
      <h1>Mis asignaciones de evaluación</h1>
      <p>Aceptá la asignación, revisá el PDF y registrá tu evaluación.</p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (cargando) {
        <p>Cargando...</p>
      } @else if (asignaciones.length === 0) {
        <p>No tenés asignaciones pendientes.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>Trabajo</th>
              <th>Estado</th>
              <th>Documento</th>
              <th>Asignación</th>
              <th>Evaluación</th>
            </tr>
          </thead>
          <tbody>
            @for (a of asignaciones; track a.id) {
              <tr>
                <td>#{{ a.trabajoId }} — {{ a.trabajoTitulo }}</td>
                <td>{{ a.trabajoEstado }}</td>
                <td>
                  @if (a.trabajoDocumentoUrl) {
                    <app-archivo-link [url]="a.trabajoDocumentoUrl" label="PDF" />
                  } @else {
                    —
                  }
                </td>
                <td>
                  @if (!a.fechaRespuesta) {
                    <button type="button" class="btn-ok" (click)="responder(a.id, true)">
                      Aceptar
                    </button>
                    <button type="button" class="btn-warn" (click)="responder(a.id, false)">
                      Rechazar
                    </button>
                  } @else if (a.aceptada) {
                    Aceptada ({{ a.fechaRespuesta }})
                  } @else {
                    Rechazada
                  }
                </td>
                <td>
                  @if (a.evaluacionRecomendacion) {
                    {{ a.evaluacionRecomendacion }}
                    @if (a.evaluacionComentario) {
                      <br /><span class="muted">{{ a.evaluacionComentario }}</span>
                    }
                  } @else if (a.aceptada && a.fechaRespuesta) {
                    <select [(ngModel)]="decisiones[a.id]" class="eval-select">
                      <option value="">Decisión...</option>
                      <option value="APROBADO">Aprobar</option>
                      <option value="APROBADO_CON_CORRECCIONES">Aprobar con correcciones</option>
                      <option value="RECHAZADO">Rechazar</option>
                    </select>
                    <textarea
                      [(ngModel)]="comentarios[a.id]"
                      rows="2"
                      placeholder="Comentario (opcional)"
                    ></textarea>
                    <button
                      type="button"
                      (click)="evaluar(a.id)"
                      [disabled]="!decisiones[a.id] || procesando"
                    >
                      Enviar evaluación
                    </button>
                  } @else {
                    —
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        <app-paginator
          [currentPage]="page"
          [totalPages]="totalPages"
          [total]="total"
          [disabled]="cargando"
          (pageChange)="onPageChange($event)"
        />
      }

      <p><a routerLink="/evaluador">← Menú evaluador</a></p>
    </section>
  `,
})
export class AsignacionesEvaluadorComponent implements OnInit {
  asignaciones: AsignacionEvaluacion[] = [];
  decisiones: Record<number, string> = {};
  comentarios: Record<number, string> = {};
  page = 1;
  pageSize = 15;
  total = 0;
  totalPages = 0;
  cargando = true;
  procesando = false;
  error = '';
  mensaje = '';

  constructor(
    private loginService: LoginService,
    private asignacionService: AsignacionService,
    private evaluacionService: EvaluacionService
  ) {}

  ngOnInit(): void {
    this.recargar();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.recargar();
  }

  responder(id: number, aceptar: boolean): void {
    this.procesando = true;
    this.error = '';
    this.asignacionService.responder(id, aceptar).subscribe({
      next: () => {
        this.mensaje = aceptar ? 'Asignación aceptada.' : 'Asignación rechazada.';
        this.procesando = false;
        this.recargar();
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo responder.');
        this.procesando = false;
      },
    });
  }

  evaluar(asignacionId: number): void {
    const recomendacion = this.decisiones[asignacionId];
    if (!recomendacion) return;
    this.procesando = true;
    this.error = '';
    this.evaluacionService
      .registrar(asignacionId, recomendacion, this.comentarios[asignacionId])
      .subscribe({
        next: () => {
          this.mensaje = 'Evaluación registrada.';
          this.procesando = false;
          this.recargar();
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo registrar la evaluación.');
          this.procesando = false;
        },
      });
  }

  private recargar(): void {
    const uid = this.loginService.getUser()?.id;
    if (!uid) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }
    this.cargando = true;
    this.asignacionService.listarPorEvaluadorPagina(uid, this.page, this.pageSize, false).subscribe({
      next: (pagina) => {
        this.asignaciones = pagina.items;
        this.page = pagina.page;
        this.total = pagina.total;
        this.totalPages = pagina.totalPages;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudieron cargar asignaciones.');
        this.cargando = false;
      },
    });
  }
}
