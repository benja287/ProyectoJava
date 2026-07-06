import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { LoginService } from '../../../auth/login.service';
import { TIPOS_TRABAJO } from '../../../models/enums';
import {
  EJES_TEMATICOS,
  MODALIDADES_PRESENTACION,
  MODALIDAD_LABELS,
} from '../../../constants/ejes-tematicos';
import { Trabajo, TrabajoEnvioResumen } from '../../../models/trabajo.model';
import { TrabajoService } from '../../../servicios/trabajo.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { feedbackTextoTrabajo, etiquetaRolEnvio } from '../../../utils/trabajo-rol.util';

@Component({
  selector: 'app-trabajos-autor',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <section class="card panel-asistente-detalle">
      <h1>Mis trabajos</h1>
      @if (perfilAsistente) {
        <p>
          Completá el formulario, adjuntá el PDF y enviá tu trabajo. Después volvés al panel de
          asistente para ver el estado o reenviar correcciones si el comité lo solicita.
        </p>
      } @else {
        <p>
          Completá el formulario, adjuntá el PDF y enviá tu trabajo como autor. El comité académico
          dará el dictamen final tras la evaluación de los revisores.
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
      }
      @if (puedeEnviarFormulario) {
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
              @for (t of tiposFormulario; track t) {
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
            {{ guardando ? 'Enviando...' : trabajoReenvio ? 'Reenviar trabajo' : 'Enviar trabajo' }}
          </button>
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
                <span class="estado-badge">Enviado como {{ etiquetaRolEnvio(t) }}</span>
                <span class="estado-badge estado-badge--enviado">{{ etiquetaEstado(t) }}</span>
              </div>
            </div>
            <p class="trabajo-item-meta">
              {{ t.ejeTematico || 'Sin eje' }} • {{ etiquetaModalidad(t.modalidad) }}
              • Precheck {{ Math.min(t.precheckIntentos ?? 0, 3) }}/3 • Revisión
              {{ Math.min(t.revisionIntentos ?? 0, 2) }}/2
            </p>
            <p class="trabajo-feedback" [class]="feedbackClass(t)">{{ feedbackTexto(t) }}</p>
            @if (puedeReenviar(t)) {
              <a [routerLink]="menuVolver + '/trabajos'" [queryParams]="{ resubmit: t.id }" class="link-correccion">
                Editar y reenviar
              </a>
            }
          </article>
        }
      }

      <p><a [routerLink]="menuVolver">← {{ etiquetaVolver }}</a></p>
    </section>
  `,
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
  etiquetaVolver = 'Panel autor';

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
    return this.trabajoReenvio ? 'Reenviar trabajo' : 'Enviar trabajo';
  }

  get puedeEnviarFormulario(): boolean {
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
          switchMap((conPdf) => this.trabajoService.enviar(conPdf.id!, this.rolEnvio))
        )
        .subscribe({
          next: () => this.finalizarEnvio(),
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
          return this.trabajoService.enviar(conPdf.id, this.rolEnvio);
        })
      )
      .subscribe({
        next: () => this.finalizarEnvio(),
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo enviar el trabajo.');
          this.guardando = false;
        },
      });
  }

  private finalizarEnvio(): void {
    this.loginService.refreshUser().subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate([this.menuVolver], { queryParams: { trabajoEnviado: '1' } });
      },
      error: () => {
        this.guardando = false;
        this.router.navigate([this.menuVolver], { queryParams: { trabajoEnviado: '1' } });
      },
    });
  }

  etiquetaEstado(t: Trabajo): string {
    const map: Record<string, string> = {
      BORRADOR: 'Borrador',
      ENVIADO: 'Enviado',
      PRECHECK_OK: 'Precheck OK',
      PRECHECK_OBSERVADO: 'Observado (precheck)',
      EN_EVALUACION: 'En evaluación',
      PENDIENTE_APROBACION_COMITE: 'Pendiente comité',
      APROBADO: 'Aprobado',
      PROGRAMADO: 'Programado',
      NOTIFICADO: 'Notificado',
      OBSERVADO_EVALUACION: 'Rechazado (reenvío)',
      RECHAZADO: 'Rechazado',
    };
    return t.estado ? map[t.estado] ?? t.estado : '—';
  }

  feedbackTexto(t: Trabajo): string {
    return feedbackTextoTrabajo(t, this.perfilAsistente ? 'asistente' : 'autor');
  }

  feedbackClass(t: Trabajo): string {
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
