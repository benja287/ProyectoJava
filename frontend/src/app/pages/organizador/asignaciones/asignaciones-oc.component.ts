import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AsignacionEvaluacion } from '../../../models/asignacion.model';
import { Trabajo } from '../../../models/trabajo.model';
import { Usuario } from '../../../models/usuario.model';
import { AsignacionService } from '../../../servicios/asignacion.service';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { UsuarioService } from '../../../servicios/usuario.service';

@Component({
  selector: 'app-asignaciones-oc',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <section class="card">
      <h1>Asignar trabajos a evaluadores</h1>
      <p>Organizador científico — POST <code>/api/asignaciones-evaluacion</code></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="asignar()" class="form-grid">
        <label>
          Trabajo
          <select formControlName="trabajoId">
            <option value="">Seleccionar...</option>
            @for (t of trabajos; track t.id) {
              <option [value]="t.id">#{{ t.id }} — {{ t.titulo }} ({{ t.estado }})</option>
            }
          </select>
        </label>
        <label>
          Evaluador
          <select formControlName="evaluadorId">
            <option value="">Seleccionar...</option>
            @for (e of evaluadores; track e.id) {
              <option [value]="e.id">{{ e.apellido }}, {{ e.nombre }} ({{ e.email }})</option>
            }
          </select>
        </label>
        <button type="submit" [disabled]="form.invalid || procesando">Asignar</button>
      </form>

      @if (trabajoSeleccionado) {
        <h2>Asignaciones del trabajo #{{ trabajoSeleccionado }}</h2>
        @if (asignacionesTrabajo.length === 0) {
          <p>Sin asignaciones.</p>
        } @else {
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Evaluador</th>
                <th>Aceptada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (a of asignacionesTrabajo; track a.id) {
                <tr>
                  <td>{{ a.id }}</td>
                  <td>{{ a.evaluadorApellido }}, {{ a.evaluadorNombre }}</td>
                  <td>{{ a.aceptada ? 'Sí' : 'No' }}</td>
                  <td>
                    <button type="button" class="btn-warn" (click)="desasignar(a.id)">Desasignar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      }

      <p><a routerLink="/organizador">← Menú organizador</a></p>
    </section>
  `,
})
export class AsignacionesOcComponent implements OnInit {
  private fb = inject(FormBuilder);

  trabajos: Trabajo[] = [];
  evaluadores: Usuario[] = [];
  asignacionesTrabajo: AsignacionEvaluacion[] = [];
  trabajoSeleccionado?: number;
  procesando = false;
  error = '';
  mensaje = '';

  form = this.fb.group({
    trabajoId: ['', Validators.required],
    evaluadorId: ['', Validators.required],
  });

  constructor(
    private trabajoService: TrabajoService,
    private usuarioService: UsuarioService,
    private asignacionService: AsignacionService
  ) {}

  ngOnInit(): void {
    this.trabajoService.listar(1, 100).subscribe({
      next: (items) => (this.trabajos = items),
      error: () => (this.error = 'No se pudieron cargar trabajos.'),
    });
    this.usuarioService.listar(1, 200).subscribe({
      next: (items) =>
        (this.evaluadores = items.filter((u) => u.roles?.includes('EVALUADOR'))),
      error: () => (this.error = 'No se pudieron cargar evaluadores.'),
    });
    this.form.get('trabajoId')?.valueChanges.subscribe((v) => {
      const id = Number(v);
      if (id) {
        this.trabajoSeleccionado = id;
        this.cargarAsignaciones(id);
      }
    });
  }

  asignar(): void {
    if (this.form.invalid) {
      return;
    }
    const trabajoId = Number(this.form.value.trabajoId);
    const evaluadorId = Number(this.form.value.evaluadorId);
    this.procesando = true;
    this.error = '';
    this.mensaje = '';
    this.asignacionService.asignar({ trabajoId, evaluadorId }).subscribe({
      next: () => {
        this.mensaje = 'Evaluador asignado.';
        this.procesando = false;
        this.cargarAsignaciones(trabajoId);
        this.trabajoService.listar(1, 100).subscribe((items) => (this.trabajos = items));
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'No se pudo asignar.';
        this.procesando = false;
      },
    });
  }

  desasignar(id: number): void {
    if (!confirm('¿Desasignar evaluador?')) {
      return;
    }
    this.asignacionService.desasignar(id).subscribe({
      next: () => {
        this.mensaje = 'Asignación eliminada.';
        if (this.trabajoSeleccionado) {
          this.cargarAsignaciones(this.trabajoSeleccionado);
        }
      },
      error: () => (this.error = 'No se pudo desasignar.'),
    });
  }

  private cargarAsignaciones(trabajoId: number): void {
    this.asignacionService.listarPorTrabajo(trabajoId).subscribe({
      next: (items) => (this.asignacionesTrabajo = items),
      error: () => (this.asignacionesTrabajo = []),
    });
  }
}
