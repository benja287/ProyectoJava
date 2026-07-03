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
import { ESTADOS_TRABAJO, TIPOS_TRABAJO } from '../../../models/enums';
import {
  EJES_TEMATICOS,
  MODALIDADES_PRESENTACION,
  MODALIDAD_LABELS,
} from '../../../constants/ejes-tematicos';
import { Trabajo } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';

@Component({
  selector: 'app-trabajos-autor',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent, FilterBarComponent],
  template: `
    <section class="card">
      <h1>{{ esPropuestaTaller ? 'Proponer taller' : 'Mis trabajos' }}</h1>
      @if (perfilAsistente && esPropuestaTaller) {
        <p>
          <strong>Rol asistente</strong> — enviá tu propuesta de taller para evaluación del comité.
        </p>
      } @else if (perfilAsistente) {
        <p>
          Completá el formulario, adjuntá el PDF y enviá tu trabajo. Después volvés al panel de
          asistente para ver el estado o reenviar correcciones si el comité lo solicita.
        </p>
      } @else {
        <p>Autor — <code>/api/trabajos</code></p>
      }

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      <h2>{{ perfilAsistente && !esPropuestaTaller ? 'Enviar trabajo' : 'Nuevo trabajo' }}</h2>
      @if (perfilAsistente && !esPropuestaTaller) {
        <form [formGroup]="form" (ngSubmit)="crearYEnviar()" class="form-grid trabajo-form-asistente">
          <label>
            Título
            <input formControlName="titulo" />
          </label>
          <label>
            Resumen
            <textarea formControlName="resumen" rows="3"></textarea>
          </label>
          <label>
            Eje temático
            <select formControlName="ejeTematico">
              <option value="">Seleccionar eje...</option>
              @for (eje of ejesTematicos; track eje) {
                <option [value]="eje">{{ eje }}</option>
              }
            </select>
          </label>
          <label>
            Modalidad de presentación
            <select formControlName="modalidad">
              @for (m of modalidades; track m) {
                <option [value]="m">{{ modalidadLabels[m] }}</option>
              }
            </select>
          </label>
          <label>
            Tipo
            <select formControlName="tipo">
              @for (t of tiposAsistente; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </label>
          <label>
            Coautores (separados por coma)
            <input formControlName="coautoresTexto" placeholder="Apellido Nombre, ..." />
          </label>
          <label class="upload-box">
            Archivo PDF (obligatorio)
            <input type="file" accept=".pdf" (change)="onPdfNuevo($event)" />
            @if (pdfNuevo) {
              <span class="ok">{{ pdfNuevo.name }}</span>
            }
          </label>
          <button type="submit" class="btn-primary-full" [disabled]="form.invalid || guardando || !pdfNuevo">
            {{ guardando ? 'Enviando...' : 'Enviar trabajo' }}
          </button>
        </form>
      } @else {
      <form [formGroup]="form" (ngSubmit)="crear()" class="form-grid">
        <label>
          Título
          <input formControlName="titulo" />
        </label>
        <label>
          Resumen
          <textarea formControlName="resumen" rows="3"></textarea>
        </label>
        <label>
          Eje temático
          <select formControlName="ejeTematico">
            <option value="">Seleccionar eje...</option>
            @for (eje of ejesTematicos; track eje) {
              <option [value]="eje">{{ eje }}</option>
            }
          </select>
        </label>
        <label>
          Modalidad de presentación
          <select formControlName="modalidad">
            @for (m of modalidades; track m) {
              <option [value]="m">{{ modalidadLabels[m] }}</option>
            }
          </select>
        </label>
        <label>
          Tipo
          <select formControlName="tipo">
            @for (t of tipos; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </label>
        <label>
          Coautores (separados por coma)
          <input formControlName="coautoresTexto" placeholder="Apellido Nombre, ..." />
        </label>
        <button type="submit" [disabled]="form.invalid || guardando">Crear borrador</button>
      </form>
      }

      <h2>Listado</h2>

      <app-filter-bar
        [fields]="filterFields"
        [values]="filtros"
        (filterApply)="onFiltrosAplicar($event)"
        (filterClear)="onFiltrosLimpiar()"
      />

      @if (cargando) {
        <p>Cargando...</p>
      } @else if (trabajos.length === 0) {
        <p>No tenés trabajos cargados.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Estado</th>
              <th>Documento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (t of trabajos; track t.id) {
              <tr>
                <td>{{ t.id }}</td>
                <td>{{ t.titulo }}</td>
                <td>{{ t.estado }}</td>
                <td>
                  @if (t.documentoUrl) {
                    <app-archivo-link [url]="t.documentoUrl" label="Ver" />
                  } @else {
                    —
                  }
                </td>
                <td class="acciones-celda">
                  @if (t.estado === 'BORRADOR') {
                    <label class="file-inline">
                      PDF
                      <input type="file" accept=".pdf" (change)="subirPdf(t, $event)" />
                    </label>
                    <button type="button" (click)="enviar(t)" [disabled]="!t.documentoUrl">Enviar</button>
                  }
                  @if (t.estado === 'APROBADO_CON_CORRECCIONES') {
                    <label class="file-inline">
                      PDF corregido
                      <input type="file" accept=".pdf" (change)="subirPdf(t, $event)" />
                    </label>
                    <button type="button" (click)="enviar(t)" [disabled]="!t.documentoUrl">
                      Reenviar correcciones
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      <p><a [routerLink]="menuVolver">← {{ etiquetaVolver }}</a></p>
    </section>
  `,
})
export class TrabajosAutorComponent implements OnInit {
  private fb = inject(FormBuilder);

  readonly filterFields: FilterFieldConfig[] = [
    { key: 'titulo', label: 'Título', placeholder: 'Buscar por título' },
    { key: 'resumen', label: 'Resumen', placeholder: 'Buscar en resumen' },
    { key: 'ejeTematico', label: 'Eje temático', placeholder: 'Buscar eje' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ESTADOS_TRABAJO.map((e) => ({ value: e, label: e })),
    },
  ];
  readonly filterKeys = ['titulo', 'resumen', 'ejeTematico', 'estado'] as const;

  trabajos: Trabajo[] = [];
  filtros: Record<string, string> = {};
  tipos = [...TIPOS_TRABAJO];
  tiposAsistente = TIPOS_TRABAJO.filter((t) => t !== 'PROPUESTA_TALLER');
  ejesTematicos = [...EJES_TEMATICOS];
  modalidades = [...MODALIDADES_PRESENTACION];
  modalidadLabels = MODALIDAD_LABELS;
  pdfNuevo?: File;
  cargando = true;
  guardando = false;
  error = '';
  mensaje = '';
  autorId?: number;
  perfilAsistente = false;
  esPropuestaTaller = false;
  menuVolver = '/autor';
  etiquetaVolver = 'Menú autor';

  form = this.fb.group({
    titulo: ['', Validators.required],
    resumen: [''],
    ejeTematico: ['', Validators.required],
    modalidad: ['ORAL', Validators.required],
    tipo: [this.tipos[0], Validators.required],
    coautoresTexto: [''],
  });

  constructor(
    private loginService: LoginService,
    private trabajoService: TrabajoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const perfil = this.route.snapshot.data['perfilTrabajos'];
    this.perfilAsistente = perfil === 'asistente' || perfil === 'participante';
    this.esPropuestaTaller = this.route.snapshot.data['tipoTaller'] === true;
    this.menuVolver = this.perfilAsistente ? '/asistente' : '/autor';
    this.etiquetaVolver = this.perfilAsistente ? 'Panel asistente' : 'Menú autor';

    if (this.esPropuestaTaller) {
      this.form.patchValue({ tipo: 'PROPUESTA_TALLER' });
      this.form.get('ejeTematico')?.clearValidators();
      this.form.get('modalidad')?.clearValidators();
      this.form.get('ejeTematico')?.updateValueAndValidity();
      this.form.get('modalidad')?.updateValueAndValidity();
    }

    this.autorId = this.loginService.getUser()?.id;
    if (!this.autorId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }

    this.route.queryParamMap.subscribe((params) => {
      this.filtros = filtroFromParams(params, this.filterKeys);
      this.cargar();
    });
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
    this.pdfNuevo = (event.target as HTMLInputElement).files?.[0];
  }

  crearYEnviar(): void {
    if (!this.autorId || this.form.invalid || !this.pdfNuevo) {
      return;
    }
    const raw = this.form.getRawValue();
    const coautores = raw.coautoresTexto
      ? raw.coautoresTexto.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const pdf = this.pdfNuevo;
    this.guardando = true;
    this.error = '';
    this.trabajoService
      .crear({
        autorId: this.autorId,
        trabajo: {
          titulo: raw.titulo!,
          resumen: raw.resumen || undefined,
          ejeTematico: raw.ejeTematico || undefined,
          modalidad: raw.modalidad || undefined,
          tipo: raw.tipo!,
          coautores,
        },
      })
      .pipe(
        switchMap((creado) => {
          if (!creado.id) {
            throw new Error('Trabajo sin id');
          }
          return this.trabajoService.adjuntarDocumento(creado.id, pdf);
        }),
        switchMap((conPdf) => {
          if (!conPdf.id) {
            throw new Error('Trabajo sin id');
          }
          return this.trabajoService.enviar(conPdf.id);
        })
      )
      .subscribe({
        next: () => {
          this.loginService.refreshUser().subscribe({
            next: () => {
              this.guardando = false;
              this.router.navigate(['/asistente'], { queryParams: { trabajoEnviado: '1' } });
            },
            error: () => {
              this.guardando = false;
              this.router.navigate(['/asistente'], { queryParams: { trabajoEnviado: '1' } });
            },
          });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar el trabajo.');
          this.guardando = false;
        },
      });
  }

  crear(): void {
    if (!this.autorId || this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const coautores = raw.coautoresTexto
      ? raw.coautoresTexto.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const rolesAntes = new Set(this.loginService.getUser()?.roles ?? []);
    this.guardando = true;
    this.error = '';
    this.trabajoService
      .crear({
        autorId: this.autorId,
        trabajo: {
          titulo: raw.titulo!,
          resumen: raw.resumen || undefined,
          ejeTematico: raw.ejeTematico || undefined,
          modalidad: raw.modalidad || undefined,
          tipo: raw.tipo!,
          coautores,
        },
      })
      .subscribe({
        next: () => {
          this.loginService.refreshUser().subscribe({
            next: (u) => {
              const rolesAhora = u.roles ?? [];
              if (
                this.perfilAsistente &&
                !rolesAntes.has('AUTOR') &&
                rolesAhora.includes('AUTOR')
              ) {
                this.mensaje =
                  'Trabajo creado. Se te asignó el rol Autor automáticamente. Podés cambiar de perfil desde el header.';
              } else {
                this.mensaje = 'Trabajo creado en borrador.';
              }
              this.guardando = false;
              this.form.reset({ tipo: this.tipos[0], modalidad: 'ORAL', ejeTematico: '' });
              this.cargar();
            },
            error: () => {
              this.mensaje = 'Trabajo creado en borrador.';
              this.guardando = false;
              this.form.reset({ tipo: this.tipos[0], modalidad: 'ORAL', ejeTematico: '' });
              this.cargar();
            },
          });
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo crear el trabajo.');
          this.guardando = false;
        },
      });
  }

  subirPdf(trabajo: Trabajo, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!trabajo.id || !file) {
      return;
    }
    this.trabajoService.adjuntarDocumento(trabajo.id, file).subscribe({
      next: (actualizado) => {
        this.mensaje = 'Documento adjuntado.';
        const idx = this.trabajos.findIndex((t) => t.id === trabajo.id);
        if (idx >= 0) {
          this.trabajos[idx] = actualizado;
        }
      },
      error: (err) => (this.error = mensajeErrorApi(err, 'No se pudo subir el PDF.')),
    });
  }

  enviar(trabajo: Trabajo): void {
    if (!trabajo.id) {
      return;
    }
    this.trabajoService.enviar(trabajo.id).subscribe({
      next: (actualizado) => {
        this.mensaje =
          trabajo.estado === 'APROBADO_CON_CORRECCIONES'
            ? 'Correcciones reenviadas.'
            : 'Trabajo enviado a evaluación.';
        const idx = this.trabajos.findIndex((t) => t.id === trabajo.id);
        if (idx >= 0) {
          this.trabajos[idx] = actualizado;
        }
        if (this.perfilAsistente && !this.esPropuestaTaller) {
          this.router.navigate(['/asistente'], { queryParams: { trabajoEnviado: '1' } });
        }
      },
      error: (err) => (this.error = mensajeErrorApi(err, 'No se pudo enviar el trabajo.')),
    });
  }

  private cargar(): void {
    if (!this.autorId) {
      return;
    }
    this.cargando = true;
    this.trabajoService.listar(1, 100, { ...this.filtros, autorId: this.autorId }).subscribe({
      next: (items) => {
        this.trabajos = items;
        this.cargando = false;
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cargar trabajos.');
        this.cargando = false;
      },
    });
  }
}
