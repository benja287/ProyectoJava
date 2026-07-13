import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import {
  FilterBarComponent,
  FilterFieldConfig,
} from '../../../components/filter-bar/filter-bar.component';
import { LoginService } from '../../../auth/login.service';
import { ESTADOS_TRABAJO } from '../../../models/enums';
import { etiquetaEstadoTrabajo, opcionesEstadoTrabajo } from '../../../models/trabajo-estado-labels';
import { Trabajo } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';

@Component({
  selector: 'app-proponer-taller-asistente',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent, FilterBarComponent],
  template: `
    <section class="card">
      <h1>Proponer Taller</h1>
      <p class="muted">
        Propuestas enviadas (tus registros): <strong>{{ propuestas.length }}</strong>
      </p>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <h2>Enviar propuesta</h2>
      @if (!puedeEnviar) {
        <p class="box-muted">
          Ya registraste una propuesta de taller pendiente o aprobada. No podés enviar otra hasta
          que la situación cambie.
        </p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="enviarPropuesta()" class="form-grid trabajo-form-asistente">
          <label>
            Título del taller
            <input formControlName="titulo" placeholder="Título del taller" />
          </label>
          <label>
            Descripción
            <textarea formControlName="descripcion" rows="4" placeholder="Descripción"></textarea>
          </label>
          <label>
            Metodología (cómo se desarrollará el taller)
            <textarea
              formControlName="metodologia"
              rows="4"
              placeholder="Metodología (cómo se desarrollará el taller)"
            ></textarea>
          </label>
          <label class="upload-box">
            Adjunto (PDF obligatorio)
            <input type="file" accept=".pdf,application/pdf" (change)="onPdfNuevo($event)" />
            @if (pdfNuevo) {
              <span class="ok">{{ pdfNuevo.name }}</span>
            } @else {
              <span class="muted">Sin archivos seleccionados</span>
            }
            <span class="form-hint muted">
              PDFs de hasta ~1,8 MB se guardan también en el registro para que el evaluador pueda
              descargarlos.
            </span>
          </label>
          <button
            type="submit"
            class="btn-primary-full"
            [disabled]="form.invalid || guardando || !pdfNuevo"
          >
            {{ guardando ? 'Enviando...' : 'Enviar propuesta de taller' }}
          </button>
        </form>
      }

      <h2>Listado de propuestas</h2>

      <app-filter-bar
        [fields]="filterFields"
        [values]="filtros"
        (filterApply)="onFiltrosAplicar($event)"
        (filterClear)="onFiltrosLimpiar()"
      />

      @if (cargando) {
        <p>Cargando...</p>
      } @else if (propuestas.length === 0) {
        <p class="muted">No tenés propuestas de taller cargadas.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Estado</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            @for (p of propuestas; track p.id) {
              <tr>
                <td>{{ p.id }}</td>
                <td>
                  <strong>{{ p.titulo }}</strong>
                  @if (p.resumen) {
                    <br /><span class="muted">{{ p.resumen }}</span>
                  }
                </td>
                <td>{{ etiquetaEstado(p.estado) }}</td>
                <td>
                  @if (p.documentoUrl) {
                    <app-archivo-link [url]="p.documentoUrl" label="Ver PDF" />
                  } @else {
                    —
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p><a routerLink="/asistente">← Panel asistente</a></p>
    </section>
  `,
})
export class ProponerTallerAsistenteComponent implements OnInit {
  private fb = inject(FormBuilder);

  readonly filterFields: FilterFieldConfig[] = [
    { key: 'titulo', label: 'Título', placeholder: 'Buscar por título' },
    { key: 'resumen', label: 'Descripción', placeholder: 'Buscar en descripción' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: opcionesEstadoTrabajo(ESTADOS_TRABAJO),
    },
  ];
  readonly filterKeys = ['titulo', 'resumen', 'estado'] as const;

  propuestas: Trabajo[] = [];
  filtros: Record<string, string> = {};
  pdfNuevo?: File;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';
  autorId?: number;

  form = this.fb.group({
    titulo: ['', Validators.required],
    descripcion: ['', Validators.required],
    metodologia: ['', Validators.required],
  });

  constructor(
    private loginService: LoginService,
    private trabajoService: TrabajoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  etiquetaEstado(estado?: string): string {
    return etiquetaEstadoTrabajo(estado);
  }

  ngOnInit(): void {
    this.autorId = this.loginService.getUser()?.id;
    if (!this.autorId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }

    if (this.route.snapshot.queryParamMap.get('tallerEnviado') === '1') {
      this.mensaje = 'Tu propuesta fue enviada correctamente y está siendo evaluada.';
    }

    this.route.queryParamMap.subscribe((params) => {
      this.filtros = filtroFromParams(params, this.filterKeys);
      this.cargar();
    });
  }

  get puedeEnviar(): boolean {
    return !this.propuestas.some((p) => p.estado !== 'RECHAZADO');
  }

  onFiltrosAplicar(values: Record<string, string>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsFromFiltro(values, this.filterKeys),
    });
  }

  onFiltrosLimpiar(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsFromFiltro({}, this.filterKeys),
    });
  }

  onPdfNuevo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      this.pdfNuevo = undefined;
      return;
    }
    const extOk = file.name.toLowerCase().endsWith('.pdf');
    const mimeOk = !file.type || file.type === 'application/pdf';
    if (!extOk || !mimeOk) {
      this.error = 'El archivo debe ser formato PDF (.pdf).';
      this.pdfNuevo = undefined;
      return;
    }
    this.error = '';
    this.pdfNuevo = file;
  }

  enviarPropuesta(): void {
    if (!this.autorId || this.form.invalid || !this.pdfNuevo || !this.puedeEnviar) {
      return;
    }
    const raw = this.form.getRawValue();
    const pdf = this.pdfNuevo;
    this.guardando = true;
    this.error = '';
    this.trabajoService
      .crear({
        autorId: this.autorId,
        trabajo: {
          titulo: raw.titulo!,
          resumen: raw.descripcion!,
          metodologia: raw.metodologia!,
          tipo: 'PROPUESTA_TALLER',
        },
      })
      .pipe(
        switchMap((creado) => {
          if (!creado.id) throw new Error('Propuesta sin id');
          return this.trabajoService.adjuntarDocumento(creado.id, pdf);
        }),
        switchMap((conPdf) => {
          if (!conPdf.id) throw new Error('Propuesta sin id');
          return this.trabajoService.enviar(conPdf.id);
        })
      )
      .subscribe({
        next: () => {
          this.guardando = false;
          this.form.reset();
          this.pdfNuevo = undefined;
          this.router.navigate(['/asistente/taller'], { queryParams: { tallerEnviado: '1' } });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar la propuesta de taller.');
          this.guardando = false;
        },
      });
  }

  private cargar(): void {
    if (!this.autorId) return;
    this.cargando = true;
    this.trabajoService
      .listar(1, 100, { ...this.filtros, autorId: this.autorId, tipo: 'PROPUESTA_TALLER' })
      .subscribe({
        next: (items) => {
          this.propuestas = items;
          this.cargando = false;
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'Error al cargar propuestas.');
          this.cargando = false;
        },
      });
  }
}
