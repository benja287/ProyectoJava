import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CircularService } from '../../../servicios/circular.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-circular-form-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="card panel-card">
      <h1>{{ editando ? 'Editar circular' : 'Nueva circular' }}</h1>
      <p class="muted">
        Las circulares publicadas se muestran en la sección pública y notifican a todos los usuarios.
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid form-grid-wide">
        <label>
          Título
          <input formControlName="titulo" placeholder="Título de la circular" />
        </label>
        <label>
          Fecha de publicación
          <input type="date" formControlName="fechaPublicacion" />
        </label>
        <label class="span-full">
          Contenido
          <textarea formControlName="contenido" rows="8" placeholder="Texto de la circular"></textarea>
        </label>
        <label class="checkbox-row">
          <input type="checkbox" formControlName="publicada" />
          Publicar al guardar
        </label>
        <div class="form-actions span-full">
          <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
          <a routerLink="/admin" class="btn-secundario">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class CircularFormAdminComponent implements OnInit {
  private fb = inject(FormBuilder);

  editando = false;
  circularId?: number;
  guardando = false;
  error = '';
  mensaje = '';

  form = this.fb.group({
    titulo: ['', Validators.required],
    contenido: ['', Validators.required],
    fechaPublicacion: [''],
    publicada: [false],
  });

  constructor(
    private circularService: CircularService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editando = true;
      this.circularId = Number(idParam);
      this.circularService.obtener(this.circularId).subscribe({
        next: (c) => {
          this.form.patchValue({
            titulo: c.titulo,
            contenido: c.contenido,
            fechaPublicacion: c.fechaPublicacion ?? '',
            publicada: c.publicada,
          });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se encontró la circular.');
        },
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const body = {
      titulo: raw.titulo!,
      contenido: raw.contenido!,
      fechaPublicacion: raw.fechaPublicacion || undefined,
      publicada: !!raw.publicada,
    };
    this.guardando = true;
    this.error = '';
    const req =
      this.editando && this.circularId
        ? this.circularService.modificar(this.circularId, body)
        : this.circularService.crear(body);
    req.subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/admin'], {
          state: {
            circularesFeedback: raw.publicada
              ? 'La circular fue publicada correctamente.'
              : 'La circular fue guardada como borrador.',
          },
        });
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo guardar la circular.');
        this.guardando = false;
      },
    });
  }
}
