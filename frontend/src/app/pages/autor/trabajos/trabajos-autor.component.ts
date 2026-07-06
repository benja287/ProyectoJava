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
import { Trabajo, TrabajoEnvioResumen } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { filtroFromParams, queryParamsFromFiltro } from '../../../utils/filtro-params.util';

@Component({
  selector: 'app-trabajos-autor',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ArchivoLinkComponent, FilterBarComponent],
  template: `
    <section class="card">
      <h1>Mis trabajos</h1>
      @if (perfilAsistente) {
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

      @if (perfilAsistente && resumen) {
        <p class="muted">
          Trabajos enviados (asistente): {{ resumen.trabajosEnviadosRol }} | Total histórico:
          {{ resumen.totalHistorico }}
        </p>
        <div
          class="limite-envio-box"
          [class.limite-envio-box--ok]="!resumen.fechaLimitePasada"
          [class.limite-envio-box--error]="resumen.fechaLimitePasada"
        >
          <strong>Límite de envíos</strong>
          <p>
            {{
              resumen.envioTrabajosHasta
                ? 'Fecha límite para enviar trabajos nuevos: ' + resumen.envioTrabajosHasta
                : 'El Comité Académico aún no definió fecha límite de entrega: por ahora se permiten envíos nuevos.'
            }}
          </p>
        </div>
        @if (!puedeEnviarFormulario) {
          <div class="limite-envio-box limite-envio-box--warn">
            <p><strong>No podés enviar un nuevo trabajo en este momento.</strong></p>
            @if (resumen.mensajeBloqueo) {
              <p>{{ resumen.mensajeBloqueo }}</p>
            }
            <p class="muted">
              Trabajos activos (asistente): {{ resumen.trabajosActivos }} | Reenvíos disponibles:
              {{ resumen.reenviosDisponibles }}
            </p>
          </div>
        }
      }

      <h2>{{ tituloFormulario }}</h2>
      @if (perfilAsistente && trabajoReenvio) {
        <div class="limite-envio-box limite-envio-box--ok">
          Estás corrigiendo y reenviando: <strong>{{ trabajoReenvio.titulo }}</strong>. Al enviar se
          actualiza el mismo trabajo.
        </div>
      }
      @if (perfilAsistente && puedeEnviarFormulario) {
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
      } @else if (!perfilAsistente) {
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

      @if (perfilAsistente) {
        <h2>Mis trabajos (rol asistente)</h2>
        @if (trabajos.length === 0) {
          <p>No tenés trabajos cargados.</p>
        } @else {
          @for (t of trabajos; track t.id) {
            <article class="trabajo-item-detalle">
              <div class="trabajo-item-detalle-header">
                <strong>{{ t.titulo }}</strong>
                <span class="estado-badge estado-badge--enviado">{{ t.estado }}</span>
              </div>
              <p class="trabajo-item-meta">
                {{ t.ejeTematico }} • Precheck {{ Math.min(t.precheckIntentos ?? 0, 3) }}/3 • Revisión
                {{ Math.min(t.revisionIntentos ?? 0, 2) }}/2
              </p>
            </article>
          }
        }
      } @else {
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
      }

      <p><a [routerLink]="menuVolver">← {{ etiquetaVolver }}</a></p>
    </section>
  `,
})
export class TrabajosAutorComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly Math = Math;

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
  resumen?: TrabajoEnvioResumen;
  trabajoReenvio?: Trabajo;
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
    this.menuVolver = this.perfilAsistente ? '/asistente' : '/autor';
    this.etiquetaVolver = this.perfilAsistente ? 'Panel asistente' : 'Menú autor';

    this.autorId = this.loginService.getUser()?.id;
    if (!this.autorId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }

    this.route.queryParamMap.subscribe((params) => {
      this.filtros = filtroFromParams(params, this.filterKeys);
      const resubmitId = Number(params.get('resubmit'));
      if (resubmitId) {
        this.trabajoService.buscar(resubmitId).subscribe({
          next: (t) => {
            this.trabajoReenvio = t;
            this.cargarFormularioReenvio(t);
          },
        });
      } else {
        this.trabajoReenvio = undefined;
      }
      this.cargar();
    });

    if (this.perfilAsistente && this.autorId) {
      this.trabajoService.resumenEnvio(this.autorId, 'ASISTENTE').subscribe({
        next: (r) => (this.resumen = r),
      });
    }
  }

  get tituloFormulario(): string {
    if (!this.perfilAsistente) return 'Nuevo trabajo';
    return this.trabajoReenvio ? 'Reenviar trabajo' : 'Enviar trabajo';
  }

  get puedeEnviarFormulario(): boolean {
    if (!this.perfilAsistente) return true;
    if (this.trabajoReenvio) return true;
    return this.resumen?.puedeEnviarNuevo ?? true;
  }

  private cargarFormularioReenvio(t: Trabajo): void {
    this.form.patchValue({
      titulo: t.titulo,
      resumen: t.resumen || '',
      ejeTematico: t.ejeTematico || '',
      modalidad: (t.modalidad || 'ORAL') as 'ORAL' | 'POSTER',
      tipo: t.tipo as (typeof TIPOS_TRABAJO)[number],
      coautoresTexto: (t.coautores || []).join(', '),
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

    if (this.trabajoReenvio?.id) {
      this.trabajoService
        .modificar(this.trabajoReenvio.id, {
          titulo: raw.titulo!,
          resumen: raw.resumen || undefined,
          ejeTematico: raw.ejeTematico || undefined,
          modalidad: raw.modalidad || undefined,
          tipo: raw.tipo!,
          coautores,
        })
        .pipe(
          switchMap(() => this.trabajoService.adjuntarDocumento(this.trabajoReenvio!.id!, pdf)),
          switchMap((conPdf) => this.trabajoService.enviar(conPdf.id!, 'ASISTENTE'))
        )
        .subscribe({
          next: () => this.finalizarEnvioAsistente(),
          error: (err) => {
            this.error = mensajeErrorApi(err, 'No se pudo reenviar el trabajo.');
            this.guardando = false;
          },
        });
      return;
    }

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
          return this.trabajoService.enviar(conPdf.id, 'ASISTENTE');
        })
      )
      .subscribe({
        next: () => this.finalizarEnvioAsistente(),
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar el trabajo.');
          this.guardando = false;
        },
      });
  }

  private finalizarEnvioAsistente(): void {
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
    this.trabajoService.enviar(trabajo.id, this.perfilAsistente ? 'ASISTENTE' : 'AUTOR').subscribe({
      next: (actualizado) => {
        this.mensaje =
          trabajo.estado === 'APROBADO_CON_CORRECCIONES'
            ? 'Correcciones reenviadas.'
            : 'Trabajo enviado a evaluación.';
        const idx = this.trabajos.findIndex((t) => t.id === trabajo.id);
        if (idx >= 0) {
          this.trabajos[idx] = actualizado;
        }
        if (this.perfilAsistente) {
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
    this.trabajoService
      .listar(1, 100, { ...this.filtros, autorId: this.autorId })
      .subscribe({
        next: (items) => {
          this.trabajos = items.filter((t) => {
            if (t.tipo === 'PROPUESTA_TALLER') return false;
            if (this.perfilAsistente) {
              return t.rolEnvio === 'ASISTENTE' || !t.rolEnvio;
            }
            return true;
          });
          this.cargando = false;
        },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'Error al cargar trabajos.');
        this.cargando = false;
      },
    });
  }
}
