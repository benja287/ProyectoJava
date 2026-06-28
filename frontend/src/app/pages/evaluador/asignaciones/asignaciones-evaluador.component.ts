import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoginService } from '../../../auth/login.service';
import { AsignacionEvaluacion } from '../../../models/asignacion.model';
import { AsignacionService } from '../../../servicios/asignacion.service';

@Component({
  selector: 'app-asignaciones-evaluador',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="card">
      <h1>Mis asignaciones de evaluación</h1>
      <p>Evaluador — GET <code>/api/asignaciones-evaluacion?evaluadorId=...</code></p>

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
              <th>ID</th>
              <th>Trabajo</th>
              <th>Estado trabajo</th>
              <th>Aceptada</th>
              <th>Documento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (a of asignaciones; track a.id) {
              <tr>
                <td>{{ a.id }}</td>
                <td>#{{ a.trabajoId }} — {{ a.trabajoTitulo }}</td>
                <td>{{ a.trabajoEstado }}</td>
                <td>{{ a.aceptada ? 'Sí' : 'Pendiente' }}</td>
                <td>
                  @if (a.trabajoDocumentoUrl) {
                    <a [href]="a.trabajoDocumentoUrl" target="_blank" rel="noopener">PDF</a>
                  } @else {
                    —
                  }
                </td>
                <td>
                  @if (!a.fechaRespuesta) {
                    <button type="button" class="btn-ok" (click)="responder(a.id, true)">Aceptar</button>
                    <button type="button" class="btn-warn" (click)="responder(a.id, false)">Rechazar</button>
                  } @else {
                    Respondida ({{ a.fechaRespuesta }})
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p><a routerLink="/evaluador">← Menú evaluador</a></p>
    </section>
  `,
})
export class AsignacionesEvaluadorComponent implements OnInit {
  asignaciones: AsignacionEvaluacion[] = [];
  cargando = true;
  error = '';
  mensaje = '';

  constructor(
    private loginService: LoginService,
    private asignacionService: AsignacionService
  ) {}

  ngOnInit(): void {
    const user = this.loginService.getUser();
    if (!user?.id) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }
    this.asignacionService.listarPorEvaluador(user.id).subscribe({
      next: (items) => {
        this.asignaciones = items;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar asignaciones.';
        this.cargando = false;
      },
    });
  }

  responder(id: number, aceptar: boolean): void {
    this.asignacionService.responder(id, aceptar).subscribe({
      next: (actualizada) => {
        this.mensaje = aceptar ? 'Asignación aceptada.' : 'Asignación rechazada.';
        const idx = this.asignaciones.findIndex((a) => a.id === id);
        if (idx >= 0) {
          this.asignaciones[idx] = actualizada;
        }
      },
      error: () => (this.error = 'No se pudo registrar la respuesta.'),
    });
  }
}
