import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TIPOS_ACTIVIDAD } from '../../../models/enums';
import { Actividad } from '../../../models/actividad.model';
import { ActividadService } from '../../../servicios/actividad.service';

@Component({
  selector: 'app-actividades-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <section class="card">
      <h1>ABM de actividades</h1>
      <p>Admin — <code>/api/actividades</code></p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <h2>{{ editando ? 'Modificar actividad #' + editando.id : 'Nueva actividad' }}</h2>
      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid">
        <label>
          Título
          <input formControlName="titulo" />
        </label>
        <label>
          Sala
          <input formControlName="sala" />
        </label>
        <label>
          Inicio
          <input formControlName="inicio" type="datetime-local" />
        </label>
        <label>
          Fin
          <input formControlName="fin" type="datetime-local" />
        </label>
        <label>
          Tipo
          <select formControlName="tipoActividad">
            @for (t of tipos; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </label>
        <label>
          Código
          <input formControlName="codigo" />
        </label>
        <div class="actions">
          <button type="submit" [disabled]="form.invalid || guardando">
            {{ editando ? 'Actualizar' : 'Crear' }}
          </button>
          @if (editando) {
            <button type="button" (click)="cancelarEdicion()">Cancelar edición</button>
          }
        </div>
      </form>

      <h2>Listado</h2>
      @if (cargando) {
        <p>Cargando...</p>
      } @else if (actividades.length === 0) {
        <p>Sin actividades.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Sala</th>
              <th>Inicio</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (a of actividades; track a.id) {
              <tr>
                <td>{{ a.id }}</td>
                <td>{{ a.titulo }}</td>
                <td>{{ a.sala || '—' }}</td>
                <td>{{ a.inicio || '—' }}</td>
                <td>{{ a.tipoActividad }}</td>
                <td>
                  <button type="button" class="btn-link" (click)="editar(a)">Editar</button>
                  <button type="button" class="btn-link" (click)="eliminar(a)">Baja</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p><a routerLink="/admin">← Menú admin</a></p>
    </section>
  `,
})
export class ActividadesAdminComponent implements OnInit {
  private fb = inject(FormBuilder);

  actividades: Actividad[] = [];
  tipos = [...TIPOS_ACTIVIDAD];
  editando?: Actividad;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';

  form = this.fb.group({
    titulo: ['', Validators.required],
    sala: [''],
    inicio: [''],
    fin: [''],
    tipoActividad: [this.tipos[0] as string, Validators.required],
    codigo: [''],
  });

  constructor(private actividadService: ActividadService) {}

  ngOnInit(): void {
    this.cargar();
  }

  editar(a: Actividad): void {
    this.editando = a;
    this.form.patchValue({
      titulo: a.titulo,
      sala: a.sala ?? '',
      inicio: this.toLocalInput(a.inicio),
      fin: this.toLocalInput(a.fin),
      tipoActividad: a.tipoActividad as string,
      codigo: a.codigo ?? '',
    });
  }

  cancelarEdicion(): void {
    this.editando = undefined;
    this.form.reset({ tipoActividad: this.tipos[0] });
  }

  guardar(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const body: Actividad = {
      titulo: raw.titulo ?? '',
      sala: raw.sala || undefined,
      inicio: raw.inicio ? this.fromLocalInput(raw.inicio) : undefined,
      fin: raw.fin ? this.fromLocalInput(raw.fin) : undefined,
      tipoActividad: raw.tipoActividad ?? this.tipos[0],
      codigo: raw.codigo || undefined,
    };
    this.guardando = true;
    this.error = '';
    this.mensaje = '';
    const op = this.editando?.id
      ? this.actividadService.modificar(this.editando.id, { ...body, id: this.editando.id })
      : this.actividadService.alta(body);
    op.subscribe({
      next: () => {
        this.mensaje = this.editando ? 'Actividad actualizada.' : 'Actividad creada.';
        this.guardando = false;
        this.cancelarEdicion();
        this.cargar();
      },
      error: () => {
        this.error = 'No se pudo guardar la actividad.';
        this.guardando = false;
      },
    });
  }

  eliminar(a: Actividad): void {
    if (!a.id || !confirm(`¿Eliminar actividad "${a.titulo}"?`)) {
      return;
    }
    this.actividadService.baja(a.id).subscribe({
      next: () => {
        this.mensaje = 'Actividad eliminada.';
        this.cargar();
      },
      error: () => {
        this.error = 'No se pudo eliminar.';
      },
    });
  }

  private cargar(): void {
    this.cargando = true;
    this.actividadService.listar().subscribe({
      next: (items) => {
        this.actividades = items;
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar actividades.';
        this.cargando = false;
      },
    });
  }

  private toLocalInput(iso?: string): string {
    if (!iso) {
      return '';
    }
    return iso.length >= 16 ? iso.slice(0, 16) : iso;
  }

  private fromLocalInput(local: string): string {
    return local.length === 16 ? `${local}:00` : local;
  }
}
