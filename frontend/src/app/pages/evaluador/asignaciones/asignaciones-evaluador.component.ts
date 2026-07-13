import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { AppPaginatorComponent } from '../../../components/paginator/app-paginator.component';
import { LoginService } from '../../../auth/login.service';
import { AsignacionEvaluacion } from '../../../models/asignacion.model';
import { etiquetaDecisionEvaluacion } from '../../../models/evaluacion.model';
import { etiquetaEstadoTrabajo } from '../../../models/trabajo-estado-labels';
import { AsignacionService } from '../../../servicios/asignacion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-asignaciones-evaluador',
  standalone: true,
  imports: [CommonModule, RouterLink, ArchivoLinkComponent, AppPaginatorComponent],
  template: `
    <section class="card">
      <h1>Mis asignaciones de evaluación</h1>
      <p>Aceptá la asignación, revisá el PDF y completá el dictamen con la rúbrica.</p>

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
                <td>{{ etiquetaEstado(a.trabajoEstado) }}</td>
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
                    {{ etiquetaDecision(a.evaluacionRecomendacion) }}
                    @if (a.evaluacionComentario) {
                      <br /><span class="muted">{{ a.evaluacionComentario }}</span>
                    }
                  } @else if (a.aceptada && a.fechaRespuesta) {
                    <a class="btn-ok" [routerLink]="['/evaluador/dictamen', a.id]">
                      Completar dictamen
                    </a>
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
    private asignacionService: AsignacionService
  ) {}

  ngOnInit(): void {
    this.recargar();
  }

  etiquetaEstado(estado?: string): string {
    return etiquetaEstadoTrabajo(estado);
  }

  etiquetaDecision(codigo?: string | null): string {
    return etiquetaDecisionEvaluacion(codigo);
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
