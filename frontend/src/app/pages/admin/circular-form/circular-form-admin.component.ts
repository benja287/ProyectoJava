import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { CircularService } from '../../../servicios/circular.service';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { mensajeErrorApi } from '../../../utils/api-error.util';

@Component({
  selector: 'app-circular-form-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ArchivoLinkComponent],
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
          Resumen
          <textarea
            formControlName="resumen"
            rows="3"
            placeholder="Resumen breve para la lista pública"
          ></textarea>
        </label>
        <label class="span-full">
          Contenido
          <textarea formControlName="contenido" rows="8" placeholder="Texto de la circular"></textarea>
        </label>
        <label>
          Estado
          <select formControlName="estado">
            <option value="borrador">Borrador</option>
            <option value="publicar">Publicar</option>
          </select>
        </label>
        <label class="span-full upload-box">
          PDF (obligatorio al publicar)
          <input type="file" accept=".pdf,application/pdf" (change)="onPdfChange($event)" />
          @if (pdfNuevo) {
            <span class="ok">PDF seleccionado: {{ pdfNuevo.name }}</span>
          } @else if (documentoNombre) {
            <span class="muted">PDF actual: {{ documentoNombre }}</span>
            @if (documentoUrl) {
              <app-archivo-link [url]="documentoUrl" label="Ver PDF actual" />
            }
          }
        </label>
        <div class="form-actions span-full">
          <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando">
            {{ guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar' }}
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
  pdfNuevo?: File;
  documentoUrl?: string | null;
  documentoNombre?: string | null;

  form = this.fb.group({
    titulo: ['', Validators.required],
    resumen: [''],
    contenido: ['', Validators.required],
    fechaPublicacion: [''],
    estado: ['borrador' as 'borrador' | 'publicar', Validators.required],
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
            resumen: c.resumen ?? '',
            contenido: c.contenido,
            fechaPublicacion: c.fechaPublicacion ?? '',
            estado: c.publicada ? 'publicar' : 'borrador',
          });
          this.documentoUrl = c.documentoUrl;
          this.documentoNombre = c.documentoNombre;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se encontró la circular.');
        },
      });
    }
  }

  onPdfChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const ok = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!ok) {
      this.error = 'El archivo debe estar en formato PDF.';
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.error = '';
    this.pdfNuevo = file;
  }

  guardar(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const quierePublicar = raw.estado === 'publicar';
    const tienePdf = !!this.pdfNuevo || !!this.documentoUrl;

    if (quierePublicar && !tienePdf) {
      this.error = 'Para publicar, debés adjuntar un PDF.';
      return;
    }

    const body = {
      titulo: raw.titulo!,
      resumen: raw.resumen?.trim() || undefined,
      contenido: raw.contenido!,
      fechaPublicacion: raw.fechaPublicacion || undefined,
      publicada: quierePublicar && !this.pdfNuevo,
    };

    this.guardando = true;
    this.error = '';

    const guardarCircular =
      this.editando && this.circularId
        ? this.circularService.modificar(this.circularId, body)
        : this.circularService.crear(body);

    guardarCircular
      .pipe(
        switchMap((circular) => {
          if (this.pdfNuevo) {
            return this.circularService.adjuntarDocumento(circular.id, this.pdfNuevo).pipe(
              switchMap((conPdf) =>
                quierePublicar
                  ? this.circularService.modificar(conPdf.id, {
                      titulo: body.titulo,
                      resumen: body.resumen,
                      contenido: body.contenido,
                      fechaPublicacion: body.fechaPublicacion,
                      publicada: true,
                    })
                  : of(conPdf)
              )
            );
          }
          return of(circular);
        })
      )
      .subscribe({
        next: () => {
          this.guardando = false;
          this.router.navigate(['/admin'], {
            state: {
              circularesFeedback: quierePublicar
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
