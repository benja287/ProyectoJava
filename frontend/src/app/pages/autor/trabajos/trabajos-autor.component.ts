import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { DevolucionEvaluacionComponent } from '../../../components/devolucion-evaluacion/devolucion-evaluacion.component';
import { LoginService } from '../../../auth/login.service';
import { TIPOS_TRABAJO } from '../../../models/enums';
import {
  EJES_TEMATICOS,
  MODALIDADES_PRESENTACION,
  MODALIDAD_LABELS,
} from '../../../constants/ejes-tematicos';
import { Trabajo, TrabajoEnvioResumen } from '../../../models/trabajo.model';
import { etiquetaEstadoTrabajo } from '../../../models/trabajo-estado-labels';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { feedbackTextoTrabajo, etiquetaRolEnvio } from '../../../utils/trabajo-rol.util';

@Component({
  selector: 'app-trabajos-autor',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    DevolucionEvaluacionComponent,
    ArchivoLinkComponent,
  ],
  template: `
    <section class="card panel-asistente-detalle">
      <h1>Mis trabajos</h1>
      @if (perfilAsistente) {
        <p>
          Completá los datos del trabajo (como en el instructivo de envío), agregá coautores si
          corresponde, adjuntá el PDF y opcionalmente el Word, y guardá borrador o enviá. Después
          volvés al panel de asistente para ver el estado o reenviar correcciones.
        </p>
      } @else {
        <p>
          Completá los datos del trabajo (eje, modalidad, tipo, resumen y coautores), adjuntá el PDF
          y opcionalmente el Word (.docx), y guardá borrador o enviá. El comité dará el dictamen
          final tras la evaluación.
        </p>
      }

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (mensaje) {
        <p class="ok">{{ mensaje }}</p>
      }

      @if (resumen) {
        <p class="muted">
          Trabajos enviados ({{ etiquetaPerfil }}): {{ resumen.trabajosEnviadosRol }} | Total histórico:
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
              Trabajos activos ({{ etiquetaPerfil }}): {{ resumen.trabajosActivos }} | Reenvíos disponibles:
              {{ resumen.reenviosDisponibles }}
            </p>
          </div>
        }
      }

      <h2>{{ tituloFormulario }}</h2>
      @if (trabajoReenvio) {
        <div class="limite-envio-box limite-envio-box--ok">
          Estás corrigiendo y reenviando: <strong>{{ trabajoReenvio.titulo }}</strong>. Al enviar se
          actualiza el mismo trabajo.
        </div>
        @if (trabajoReenvio.id) {
          <app-devolucion-evaluacion
            [trabajoId]="trabajoReenvio.id"
            [estado]="trabajoReenvio.estado"
          />
        }
      }
      @if (trabajoBorrador && !trabajoReenvio) {
        <div class="limite-envio-box limite-envio-box--ok">
          Continuás el borrador: <strong>{{ trabajoBorrador.titulo }}</strong> (ID
          {{ trabajoBorrador.id }}).
        </div>
      }
      @if (puedeEnviarFormulario) {
        <form [formGroup]="form" class="form-grid trabajo-form-asistente" (ngSubmit)="enviar()">
          <label>
            Título
            <input formControlName="titulo" />
          </label>
          <label>
            Resumen
            <textarea formControlName="resumen" rows="4" placeholder="Incluí el resumen del trabajo"></textarea>
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
            Modalidad de presentación (Oral o Póster)
            <select formControlName="modalidad">
              @for (m of modalidades; track m) {
                <option [value]="m">{{ modalidadLabels[m] }}</option>
              }
            </select>
            <span class="form-hint">La decisión final la toma la comisión académica.</span>
          </label>
          <label>
            Tipo de envío
            <select formControlName="tipo">
              @for (t of tiposFormulario; track t) {
                <option [value]="t">{{ etiquetaTipo(t) }}</option>
              }
            </select>
          </label>

          <div class="coautores-bloque">
            <p class="eval-select-label">Coautores</p>
            <p class="form-hint">
              El autor/a de la cuenta ya figura como responsable. Agregá coautores/as si corresponde
              (ilimitados).
            </p>
            @for (nombre of coautores; track $index; let i = $index) {
              <div class="coautor-fila">
                <input
                  type="text"
                  [value]="nombre"
                  (input)="onCoautorInput(i, $event)"
                  placeholder="Apellido Nombre"
                />
                <button
                  type="button"
                  class="btn-quitar-eje"
                  (click)="quitarCoautor(i)"
                  [disabled]="coautores.length <= 1 && !nombre.trim()"
                >
                  Quitar
                </button>
              </div>
            }
            <button type="button" class="btn-secundario" (click)="agregarCoautor()">
              Agregar autor
            </button>
          </div>

          <label class="upload-box">
            Archivo PDF (obligatorio para enviar)
            <input type="file" accept=".pdf,application/pdf" (change)="onPdfNuevo($event)" />
            @if (pdfNuevo) {
              <span class="ok">Nuevo: {{ pdfNuevo.name }}</span>
            } @else if (documentoUrlActual) {
              <span class="muted">
                Ya hay un PDF cargado —
                <app-archivo-link [url]="documentoUrlActual" label="ver actual" />
              </span>
            }
          </label>
          <label class="upload-box">
            Archivo Word .docx (opcional, p. ej. para control de cambios)
            <input
              type="file"
              accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              (change)="onDocxNuevo($event)"
            />
            @if (docxNuevo) {
              <span class="ok">Nuevo: {{ docxNuevo.name }}</span>
            } @else if (documentoDocxUrlActual) {
              <span class="muted">
                Ya hay un Word cargado —
                <app-archivo-link
                  [url]="documentoDocxUrlActual"
                  label="descargar actual"
                  [download]="true"
                  downloadName="trabajo.docx"
                />
              </span>
            }
          </label>

          <div class="form-acciones-trabajo">
            @if (!trabajoReenvio) {
              <button
                type="button"
                class="btn-secundario"
                (click)="guardarBorrador()"
                [disabled]="form.invalid || guardando"
              >
                {{ guardando && modoGuardado === 'borrador' ? 'Guardando...' : 'Guardar borrador' }}
              </button>
            }
            <button
              type="submit"
              class="btn-primary-full"
              [disabled]="form.invalid || guardando || !tienePdfParaEnviar"
            >
              {{
                guardando && modoGuardado === 'enviar'
                  ? 'Enviando...'
                  : trabajoReenvio
                    ? 'Reenviar trabajo'
                    : 'Enviar trabajo'
              }}
            </button>
          </div>
        </form>
      }

      <h2>Mis trabajos (rol {{ etiquetaPerfil }})</h2>
      @if (cargando) {
        <p>Cargando...</p>
      } @else if (trabajos.length === 0) {
        <p>No tenés trabajos cargados.</p>
      } @else {
        @for (t of trabajos; track t.id) {
          <article class="trabajo-item-detalle">
            <div class="trabajo-item-detalle-header">
              <strong>{{ t.titulo }}</strong>
              <div>
                @if (t.estado === 'BORRADOR') {
                  <span class="estado-badge">Borrador · ID {{ t.id }}</span>
                } @else {
                  <span class="estado-badge">Enviado como {{ etiquetaRolEnvio(t) }}</span>
                }
                <span class="estado-badge estado-badge--enviado">{{ etiquetaEstado(t) }}</span>
              </div>
            </div>
            <p class="trabajo-item-meta">
              {{ t.ejeTematico || 'Sin eje' }} • {{ etiquetaModalidad(t.modalidad) }} •
              {{ etiquetaTipo(t.tipo) }}
              • Precheck {{ Math.min(t.precheckIntentos ?? 0, 3) }}/3 • Revisión
              {{ Math.min(t.revisionIntentos ?? 0, 2) }}/2
            </p>
            @if (t.coautores?.length) {
              <p class="muted">Coautores: {{ t.coautores!.join(', ') }}</p>
            }
            <p class="trabajo-archivos-links">
              @if (t.documentoUrl) {
                <app-archivo-link [url]="t.documentoUrl" label="PDF" />
              }
              @if (t.documentoDocxUrl) {
                <app-archivo-link
                  [url]="t.documentoDocxUrl"
                  label="Word (.docx)"
                  [download]="true"
                  downloadName="trabajo.docx"
                />
              }
            </p>
            <p class="trabajo-feedback" [class]="feedbackClass(t)">{{ feedbackTexto(t) }}</p>
            @if (t.id) {
              <app-devolucion-evaluacion [trabajoId]="t.id" [estado]="t.estado" />
            }
            @if (t.estado === 'BORRADOR' && t.id) {
              <a
                [routerLink]="menuVolver + '/trabajos'"
                [queryParams]="{ editar: t.id }"
                class="link-correccion"
              >
                Continuar borrador
              </a>
            }
            @if (puedeReenviar(t)) {
              <a
                [routerLink]="menuVolver + '/trabajos'"
                [queryParams]="{ resubmit: t.id }"
                class="link-correccion"
              >
                Editar y reenviar
              </a>
            }
          </article>
        }
      }

      <p><a [routerLink]="menuVolver">← {{ etiquetaVolver }}</a></p>
    </section>
  `,
  styles: [
    `
      .coautores-bloque {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .coautor-fila {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .coautor-fila input {
        flex: 1;
      }
      .form-acciones-trabajo {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
      .form-acciones-trabajo .btn-primary-full {
        flex: 1;
        min-width: 12rem;
      }
      .form-hint {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.82rem;
        color: #64748b;
      }
      .trabajo-archivos-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1.25rem;
        margin: 0.35rem 0;
      }
    `,
  ],
})
export class TrabajosAutorComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly Math = Math;

  trabajos: Trabajo[] = [];
  tipos = [...TIPOS_TRABAJO];
  tiposAsistente = TIPOS_TRABAJO.filter((t) => t !== 'PROPUESTA_TALLER');
  ejesTematicos = [...EJES_TEMATICOS];
  modalidades = [...MODALIDADES_PRESENTACION];
  modalidadLabels = MODALIDAD_LABELS;
  coautores: string[] = [''];
  pdfNuevo?: File;
  docxNuevo?: File;
  documentoUrlActual?: string | null;
  documentoDocxUrlActual?: string | null;
  cargando = true;
  guardando = false;
  modoGuardado: 'borrador' | 'enviar' | null = null;
  error = '';
  mensaje = '';
  autorId?: number;
  perfilAsistente = false;
  resumen?: TrabajoEnvioResumen;
  trabajoReenvio?: Trabajo;
  trabajoBorrador?: Trabajo;
  menuVolver = '/autor';
  etiquetaVolver = 'Panel autor';

  form = this.fb.group({
    titulo: ['', Validators.required],
    resumen: ['', Validators.required],
    ejeTematico: ['', Validators.required],
    modalidad: ['ORAL', Validators.required],
    tipo: [this.tipos[0], Validators.required],
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
    this.etiquetaVolver = this.perfilAsistente ? 'Panel asistente' : 'Panel autor';
    this.form.patchValue({ tipo: this.tiposFormulario[0] as (typeof TIPOS_TRABAJO)[number] });

    this.autorId = this.loginService.getUser()?.id;
    if (!this.autorId) {
      this.error = 'Sesión inválida.';
      this.cargando = false;
      return;
    }

    this.route.queryParamMap.subscribe((params) => {
      const resubmitId = Number(params.get('resubmit'));
      const editarId = Number(params.get('editar'));
      if (resubmitId) {
        this.trabajoService.buscar(resubmitId).subscribe({
          next: (t) => {
            this.trabajoReenvio = t;
            this.trabajoBorrador = undefined;
            this.cargarFormularioEdicion(t);
          },
        });
      } else if (editarId) {
        this.trabajoService.buscar(editarId).subscribe({
          next: (t) => {
            if (t.estado !== 'BORRADOR') {
              this.error = 'Solo se pueden continuar borradores.';
              this.trabajoBorrador = undefined;
              return;
            }
            this.trabajoBorrador = t;
            this.trabajoReenvio = undefined;
            this.cargarFormularioEdicion(t);
          },
        });
      } else {
        this.trabajoReenvio = undefined;
        this.trabajoBorrador = undefined;
        this.resetArchivosForm();
      }
      this.cargar();
    });

    const rolEnvio = this.perfilAsistente ? 'ASISTENTE' : 'AUTOR';
    this.trabajoService.resumenEnvio(this.autorId, rolEnvio).subscribe({
      next: (r) => (this.resumen = r),
    });
  }

  get tiposFormulario(): string[] {
    return this.perfilAsistente ? this.tiposAsistente : this.tipos;
  }

  get etiquetaPerfil(): string {
    return this.perfilAsistente ? 'asistente' : 'autor';
  }

  get rolEnvio(): 'ASISTENTE' | 'AUTOR' {
    return this.perfilAsistente ? 'ASISTENTE' : 'AUTOR';
  }

  get tituloFormulario(): string {
    if (this.trabajoReenvio) return 'Reenviar trabajo';
    if (this.trabajoBorrador) return 'Continuar borrador';
    return 'Nuevo trabajo';
  }

  get puedeEnviarFormulario(): boolean {
    if (this.trabajoReenvio || this.trabajoBorrador) return true;
    return this.resumen?.puedeEnviarNuevo ?? true;
  }

  get tienePdfParaEnviar(): boolean {
    return !!this.pdfNuevo || !!this.documentoUrlActual;
  }

  private cargarFormularioEdicion(t: Trabajo): void {
    this.form.patchValue({
      titulo: t.titulo,
      resumen: t.resumen || '',
      ejeTematico: t.ejeTematico || '',
      modalidad: (t.modalidad || 'ORAL') as 'ORAL' | 'POSTER',
      tipo: t.tipo as (typeof TIPOS_TRABAJO)[number],
    });
    this.coautores = t.coautores?.length ? [...t.coautores] : [''];
    this.documentoUrlActual = t.documentoUrl;
    this.documentoDocxUrlActual = t.documentoDocxUrl;
    this.pdfNuevo = undefined;
    this.docxNuevo = undefined;
  }

  private resetArchivosForm(): void {
    this.documentoUrlActual = null;
    this.documentoDocxUrlActual = null;
    this.pdfNuevo = undefined;
    this.docxNuevo = undefined;
    this.coautores = [''];
  }

  agregarCoautor(): void {
    this.coautores = [...this.coautores, ''];
  }

  quitarCoautor(index: number): void {
    if (this.coautores.length === 1) {
      this.coautores = [''];
      return;
    }
    this.coautores = this.coautores.filter((_, i) => i !== index);
  }

  onCoautorInput(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.coautores = this.coautores.map((c, i) => (i === index ? value : c));
  }

  onPdfNuevo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      this.error = 'El documento principal debe ser un PDF (.pdf).';
      this.pdfNuevo = undefined;
      return;
    }
    this.error = '';
    this.pdfNuevo = file;
  }

  onDocxNuevo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith('.docx') && !lower.endsWith('.doc')) {
        this.error = 'El Word debe ser .docx (o .doc).';
        this.docxNuevo = undefined;
        return;
      }
    }
    this.error = '';
    this.docxNuevo = file;
  }

  guardarBorrador(): void {
    this.persistir('borrador');
  }

  enviar(): void {
    if (!this.tienePdfParaEnviar) {
      this.error = 'Adjuntá el PDF antes de enviar el trabajo.';
      return;
    }
    this.persistir('enviar');
  }

  private persistir(modo: 'borrador' | 'enviar'): void {
    if (!this.autorId || this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const coautores = this.coautores.map((s) => s.trim()).filter(Boolean);
    const pdf = this.pdfNuevo;
    const docx = this.docxNuevo;
    this.guardando = true;
    this.modoGuardado = modo;
    this.error = '';
    this.mensaje = '';

    const trabajoIdExistente = this.trabajoReenvio?.id ?? this.trabajoBorrador?.id;

    const datos = {
      titulo: raw.titulo!,
      resumen: raw.resumen || undefined,
      ejeTematico: raw.ejeTematico || undefined,
      modalidad: raw.modalidad || undefined,
      tipo: raw.tipo!,
      coautores,
    };

    const guardado$: Observable<Trabajo> = trabajoIdExistente
      ? this.trabajoService.modificar(trabajoIdExistente, datos)
      : this.trabajoService.crear({
          autorId: this.autorId,
          trabajo: datos,
        });

    guardado$
      .pipe(
        switchMap((t) => {
          if (!t.id) throw new Error('Trabajo sin id');
          if (pdf) {
            return this.trabajoService.adjuntarDocumento(t.id, pdf);
          }
          return of(t);
        }),
        switchMap((t) => {
          if (!t.id) throw new Error('Trabajo sin id');
          if (docx) {
            return this.trabajoService.adjuntarDocumentoDocx(t.id, docx);
          }
          return of(t);
        }),
        switchMap((t) => {
          if (modo === 'enviar') {
            if (!t.id) throw new Error('Trabajo sin id');
            return this.trabajoService.enviar(t.id, this.rolEnvio);
          }
          return of(t);
        })
      )
      .subscribe({
        next: (t) => {
          if (modo === 'enviar') {
            this.finalizarEnvio();
            return;
          }
          this.guardando = false;
          this.modoGuardado = null;
          this.mensaje = `Borrador guardado (ID ${t.id}). Podés seguir editándolo o enviarlo cuando esté listo.`;
          this.trabajoBorrador = t;
          this.documentoUrlActual = t.documentoUrl;
          this.documentoDocxUrlActual = t.documentoDocxUrl;
          this.pdfNuevo = undefined;
          this.docxNuevo = undefined;
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { editar: t.id },
            replaceUrl: true,
          });
          this.cargar();
          this.refrescarResumen();
        },
        error: (err) => {
          this.error = mensajeErrorApi(
            err,
            modo === 'enviar' ? 'No se pudo enviar el trabajo.' : 'No se pudo guardar el borrador.'
          );
          this.guardando = false;
          this.modoGuardado = null;
        },
      });
  }

  private finalizarEnvio(): void {
    this.loginService.refreshUser().subscribe({
      next: () => {
        this.guardando = false;
        this.modoGuardado = null;
        this.router.navigate([this.menuVolver], { queryParams: { trabajoEnviado: '1' } });
      },
      error: () => {
        this.guardando = false;
        this.modoGuardado = null;
        this.router.navigate([this.menuVolver], { queryParams: { trabajoEnviado: '1' } });
      },
    });
  }

  private refrescarResumen(): void {
    if (!this.autorId) return;
    this.trabajoService.resumenEnvio(this.autorId, this.rolEnvio).subscribe({
      next: (r) => (this.resumen = r),
    });
  }

  etiquetaEstado(t: Trabajo): string {
    return etiquetaEstadoTrabajo(t.estado);
  }

  etiquetaTipo(tipo?: string): string {
    const map: Record<string, string> = {
      TRABAJO_CIENTIFICO: 'Trabajo científico',
      RELATO_DE_EXPERIENCIA: 'Relato de experiencia',
      PROPUESTA_TALLER: 'Propuesta de taller',
    };
    return (tipo && map[tipo]) || tipo || '—';
  }

  feedbackTexto(t: Trabajo): string {
    if (t.estado === 'BORRADOR') {
      return 'Borrador: aún no fue enviado al comité. Completá datos, adjuntá el PDF y enviá.';
    }
    return feedbackTextoTrabajo(t, this.perfilAsistente ? 'asistente' : 'autor');
  }

  feedbackClass(t: Trabajo): string {
    if (t.estado === 'BORRADOR') return 'trabajo-feedback--info';
    if (t.estado === 'APROBADO' || t.estado === 'PROGRAMADO' || t.estado === 'NOTIFICADO') {
      return 'trabajo-feedback--ok';
    }
    if (t.estado === 'OBSERVADO_EVALUACION' || t.estado === 'PRECHECK_OBSERVADO') {
      return 'trabajo-feedback--warn';
    }
    if (t.estado === 'RECHAZADO') return 'trabajo-feedback--error';
    return 'trabajo-feedback--info';
  }

  puedeReenviar(t: Trabajo): boolean {
    if (
      t.estado === 'PRECHECK_OBSERVADO' &&
      (t.precheckIntentos ?? 0) > 0 &&
      (t.precheckIntentos ?? 0) < 3
    ) {
      return true;
    }
    return t.estado === 'OBSERVADO_EVALUACION' && (t.revisionIntentos ?? 0) < 2;
  }

  etiquetaModalidad(modalidad?: string): string {
    if (modalidad === 'ORAL' || modalidad === 'POSTER') {
      return this.modalidadLabels[modalidad];
    }
    return modalidad || '—';
  }

  readonly etiquetaRolEnvio = etiquetaRolEnvio;

  private cargar(): void {
    if (!this.autorId) {
      return;
    }
    this.cargando = true;
    this.trabajoService.listar(1, 100, { autorId: this.autorId }).subscribe({
      next: (items) => {
        this.trabajos = items.filter((t) => {
          if (t.tipo === 'PROPUESTA_TALLER') return false;
          if (t.estado === 'BORRADOR') {
            return true;
          }
          if (this.perfilAsistente) {
            return t.rolEnvio === 'ASISTENTE' || !t.rolEnvio;
          }
          return t.rolEnvio === 'AUTOR';
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
