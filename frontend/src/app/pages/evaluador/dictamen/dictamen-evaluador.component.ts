import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArchivoLinkComponent } from '../../../components/archivo-link/archivo-link.component';
import { LoginService } from '../../../auth/login.service';
import { AsignacionEvaluacion } from '../../../models/asignacion.model';
import { CatalogoItem } from '../../../models/congreso-config.model';
import {
  DECISIONES_EVALUACION,
  MODALIDAD_INDECISO,
  RubricaEvaluacion,
  esTipoCientificoRubrica,
  permiteArchivoCorreccionEvaluacion,
  rubricaVacia,
} from '../../../models/evaluacion.model';
import { AsignacionService } from '../../../servicios/asignacion.service';
import { CatalogosCongresoService } from '../../../servicios/catalogos-congreso.service';
import { EvaluacionService } from '../../../servicios/evaluacion.service';
import { mensajeErrorApi } from '../../../utils/api-error.util';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dictamen-evaluador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ArchivoLinkComponent],
  template: `
    <div class="panel-page">
      <div class="panel-hero panel-hero--admin evaluador-hero">
        <span class="panel-hero-icon" aria-hidden="true">📝</span>
        <div>
          <h1>Dictamen de evaluación</h1>
          <p>Completá la rúbrica del trabajo y emití la decisión final.</p>
        </div>
      </div>

      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (cargando) {
        <p class="muted">Cargando asignación...</p>
      } @else if (asignacion) {
        <nav class="wizard-pasos" aria-label="Pasos del dictamen">
          @for (p of pasos; track p.id; let i = $index) {
            <button
              type="button"
              class="wizard-paso"
              [class.wizard-paso--activo]="paso === i"
              [class.wizard-paso--hecho]="i < paso"
              (click)="irAPaso(i)"
              [disabled]="enviando"
            >
              <span class="wizard-paso-num">{{ i + 1 }}</span>
              <span class="wizard-paso-label">{{ p.label }}</span>
            </button>
          }
        </nav>

        <section class="panel-card">
          <form [formGroup]="form" (ngSubmit)="enviar()">
            @if (paso === 0) {
              <h2>1. Identificación y evaluación general</h2>
              <dl class="detalle">
                <dt>Evaluador/a</dt>
                <dd>{{ nombreEvaluador }}</dd>
                <dt>Correo</dt>
                <dd>{{ emailEvaluador }}</dd>
                <dt>Nº trabajo</dt>
                <dd>#{{ asignacion.trabajoId }}</dd>
                <dt>Título</dt>
                <dd>{{ asignacion.trabajoTitulo }}</dd>
                <dt>Eje temático</dt>
                <dd>{{ asignacion.trabajoEjeTematico || '—' }}</dd>
                <dt>Documento</dt>
                <dd>
                  @if (asignacion.trabajoDocumentoUrl) {
                    <app-archivo-link
                      [url]="asignacion.trabajoDocumentoUrl"
                      label="Ver / descargar PDF"
                    />
                  } @else {
                    Sin archivo
                  }
                  @if (asignacion.trabajoDocumentoDocxUrl) {
                    ·
                    <app-archivo-link
                      [url]="asignacion.trabajoDocumentoDocxUrl"
                      label="Word (.docx)"
                      [download]="true"
                      downloadName="trabajo.docx"
                    />
                  }
                </dd>
              </dl>

              <fieldset class="wizard-fieldset">
                <legend>Evaluación general</legend>
                <label>
                  ¿El trabajo es pertinente para un congreso de agroecología?
                  <select formControlName="pertinencia">
                    <option value="">Seleccioná...</option>
                    <option value="SI">Sí</option>
                    <option value="SI_CORRECCIONES">Sí, con correcciones</option>
                    <option value="NO">No</option>
                  </select>
                </label>
                <label>
                  ¿Supiste la identidad de autorxs?
                  <select formControlName="identidadAutor">
                    <option value="">Seleccioná...</option>
                    <option value="DESCONOZCO">Desconozco / anonimato OK</option>
                    <option value="IDENTIFICADO">Pude identificar autorxs</option>
                    <option value="CONFLICTO_INTERESES">Hay conflicto de intereses</option>
                  </select>
                </label>
                <label>
                  ¿Está ubicado en el eje temático correcto?
                  <select formControlName="ejeCorrecto">
                    <option value="">Seleccioná...</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>
                </label>
              </fieldset>
            }

            @if (paso === 1) {
              <h2>2. Forma (lenguaje, título, resumen, palabras clave)</h2>
              @for (c of criteriosForma; track c.key) {
                <fieldset class="wizard-fieldset">
                  <legend>{{ c.label }}</legend>
                  <label>
                    Cumple
                    <select [formControlName]="c.key + 'Valor'">
                      <option value="">Seleccioná...</option>
                      <option value="SI">Sí</option>
                      <option value="NO">No</option>
                    </select>
                  </label>
                  <label>
                    Sugerencias
                    <textarea [formControlName]="c.key + 'Sug'" rows="2"></textarea>
                  </label>
                </fieldset>
              }
            }

            @if (paso === 2) {
              <h2>3. Bibliografía y tipo de trabajo</h2>
              <fieldset class="wizard-fieldset">
                <legend>Bibliografía en formato APA</legend>
                <label>
                  Cumple
                  <select formControlName="apaValor">
                    <option value="">Seleccioná...</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                    <option value="RELATO_SIN_BIBLIOGRAFIA">Es relato sin bibliografía</option>
                  </select>
                </label>
                <label>
                  Sugerencias
                  <textarea formControlName="apaSug" rows="2"></textarea>
                </label>
              </fieldset>
              <fieldset class="wizard-fieldset">
                <legend>Coherencia entre citas y referencias</legend>
                <label>
                  Cumple
                  <select formControlName="citasValor">
                    <option value="">Seleccioná...</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                    <option value="RELATO_SIN_BIBLIOGRAFIA">Relato sin bibliografía</option>
                  </select>
                </label>
                <label>
                  Sugerencias
                  <textarea formControlName="citasSug" rows="2"></textarea>
                </label>
              </fieldset>
              <label>
                Tipo de trabajo según el/la evaluador/a
                <span class="form-hint">
                  El envío del participante:
                  {{ etiquetaTipoEnvio(asignacion.trabajoTipo) }}.
                  Podés confirmarlo o corregirlo.
                </span>
                <select formControlName="tipoSegunEvaluador">
                  <option value="">Seleccioná...</option>
                  @for (t of tiposEnvio; track t.codigo) {
                    <option [value]="t.codigo">{{ t.etiqueta }}</option>
                  }
                </select>
              </label>
            }

            @if (paso === 3) {
              <h2>4. Contenido científico</h2>
              @if (!esContenidoCientifico) {
                <p class="muted">
                  Marcaste un tipo que no es trabajo científico (o aún no elegiste tipo). Podés
                  omitir esta sección o volver al paso anterior si corresponde contenido científico.
                </p>
              } @else {
                @for (c of criteriosCientificos; track c.key) {
                  <fieldset class="wizard-fieldset">
                    <legend>{{ c.label }}</legend>
                    <label>
                      Cumple
                      <select [formControlName]="c.key + 'Valor'">
                        <option value="">Seleccioná...</option>
                        <option value="SI">Sí</option>
                        <option value="NO">No</option>
                      </select>
                    </label>
                    <label>
                      Sugerencias
                      <textarea [formControlName]="c.key + 'Sug'" rows="2"></textarea>
                    </label>
                  </fieldset>
                }
              }
            }

            @if (paso === 4) {
              <h2>5. Dictamen final</h2>
              <label>
                Decisión final
                <select formControlName="recomendacion">
                  <option value="">Seleccioná...</option>
                  @for (d of decisiones; track d.value) {
                    <option [value]="d.value">{{ d.label }}</option>
                  }
                </select>
              </label>
              <label>
                Modalidad recomendada para el congreso
                <span class="form-hint">
                  Modalidad del envío:
                  {{ etiquetaModalidadEnvio(asignacion.trabajoModalidad) }}.
                  Podés confirmarla o sugerir otra.
                </span>
                <select formControlName="modalidadRecomendada">
                  <option value="">Seleccioná...</option>
                  @for (m of modalidades; track m.value) {
                    <option [value]="m.value">{{ m.label }}</option>
                  }
                </select>
              </label>
              <label>
                Comentarios a lxs autorxs
                <span class="form-hint">Se comunicarán al participante. Sé concreto/a y amable.</span>
                <textarea formControlName="comentarioAutor" rows="5"></textarea>
              </label>
              <label>
                Comentarios a la comisión científica
                <span class="form-hint">Solo lo ve el comité; no se muestra a autorxs.</span>
                <textarea formControlName="comentarioComite" rows="4"></textarea>
              </label>
              @if (permiteArchivoCorreccion) {
                <label>
                  Archivo con correcciones / recomendaciones (opcional)
                  <span class="form-hint">
                    Para autorxs: Word con control de cambios, PDF marcado, etc.
                  </span>
                  <input type="file" (change)="onFileSelected($event)" />
                </label>
                @if (archivoSeleccionado) {
                  <p class="muted">Seleccionado: {{ archivoSeleccionado.name }}</p>
                }
              } @else if (form.value.recomendacion === 'APROBADO') {
                <p class="muted">
                  Con “aceptado sin modificaciones” no hace falta adjuntar archivo de correcciones.
                </p>
              }
            }

            <div class="wizard-acciones">
              @if (paso > 0) {
                <button type="button" class="btn-secundario" (click)="anterior()" [disabled]="enviando">
                  Anterior
                </button>
              }
              @if (paso < pasos.length - 1) {
                <button type="button" class="btn-primary" (click)="siguiente()" [disabled]="enviando">
                  Siguiente
                </button>
              } @else {
                <button
                  type="submit"
                  class="btn-ok"
                  [disabled]="
                    enviando ||
                    form.controls.recomendacion.invalid ||
                    form.controls.modalidadRecomendada.invalid
                  "
                >
                  {{ enviando ? 'Enviando...' : 'Enviar dictamen' }}
                </button>
              }
              <a routerLink="/evaluador" class="btn-link">Cancelar</a>
            </div>
          </form>
        </section>
      }
    </div>
  `,
  styles: [
    `
      .wizard-pasos {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0;
      }
      .wizard-paso {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        border: 1.5px solid rgba(104, 176, 113, 0.5);
        background: rgba(255, 255, 255, 0.94) !important;
        color: #174e2a !important;
        border-radius: 999px;
        padding: 0.4rem 0.85rem;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.2;
      }
      .wizard-paso:hover:not(:disabled) {
        border-color: #2d6a3e;
        background: #e8f6e4 !important;
      }
      .wizard-paso--activo {
        border-color: #2d6a3e;
        background: #2d6a3e !important;
        color: #fff !important;
        font-weight: 700;
      }
      .wizard-paso--hecho:not(.wizard-paso--activo) {
        border-color: rgba(72, 156, 90, 0.7);
        background: #e8f6e4 !important;
        color: #174e2a !important;
      }
      .wizard-paso-num {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: #2d6a3e;
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        flex-shrink: 0;
      }
      .wizard-paso--activo .wizard-paso-num {
        background: #fff;
        color: #2d6a3e;
      }
      .wizard-paso--hecho:not(.wizard-paso--activo) .wizard-paso-num {
        background: #3d8b52;
        color: #fff;
      }
      .wizard-paso-label {
        white-space: nowrap;
      }
      .wizard-fieldset {
        border: 2px solid rgba(104, 176, 113, 0.4);
        border-radius: 14px;
        padding: 0.85rem 1rem;
        margin: 0.75rem 0;
        background: rgba(255, 255, 255, 0.55);
      }
      .wizard-acciones {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.25rem;
        align-items: center;
      }
      .wizard-acciones .btn-secundario {
        background: #4b6354;
        color: #fff;
      }
      .wizard-acciones .btn-primary {
        background: #2d6a3e;
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 0.55rem 1.1rem;
        font-weight: 700;
      }
      .wizard-acciones .btn-link {
        color: #174e2a;
        text-decoration: none;
        font-weight: 650;
        background: transparent;
        border: none;
        padding: 0.5rem;
      }
      .form-hint {
        display: block;
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.25rem;
      }
    `,
  ],
})
export class DictamenEvaluadorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly login = inject(LoginService);
  private readonly asignacionService = inject(AsignacionService);
  private readonly evaluacionService = inject(EvaluacionService);
  private readonly catalogos = inject(CatalogosCongresoService);

  readonly decisiones = DECISIONES_EVALUACION;
  tiposEnvio: CatalogoItem[] = [];
  modalidades: { value: string; label: string }[] = [];
  readonly pasos = [
    { id: 'general', label: 'General' },
    { id: 'forma', label: 'Forma' },
    { id: 'biblio', label: 'Bibliografía' },
    { id: 'contenido', label: 'Contenido' },
    { id: 'dictamen', label: 'Dictamen' },
  ];
  readonly criteriosForma = [
    { key: 'lenguaje', label: 'Lenguaje / gramática / escritura' },
    { key: 'titulo', label: 'El título sintetiza el contenido' },
    { key: 'resumen', label: 'El resumen recoge bien el trabajo' },
    { key: 'palabrasClave', label: 'Palabras clave adecuadas' },
  ] as const;
  readonly criteriosCientificos = [
    { key: 'introduccion', label: 'Introducción' },
    { key: 'objetivos', label: 'Objetivos' },
    { key: 'metodologia', label: 'Metodología' },
    { key: 'resultadosDiscusion', label: 'Resultados y discusión' },
    { key: 'tablasFiguras', label: 'Tablas / figuras' },
    { key: 'conclusiones', label: 'Conclusiones' },
  ] as const;

  asignacion?: AsignacionEvaluacion;
  paso = 0;
  cargando = true;
  enviando = false;
  error = '';
  archivoSeleccionado: File | null = null;

  form = this.fb.nonNullable.group({
    pertinencia: ['', Validators.required],
    identidadAutor: ['', Validators.required],
    ejeCorrecto: ['', Validators.required],
    lenguajeValor: [''],
    lenguajeSug: [''],
    tituloValor: [''],
    tituloSug: [''],
    resumenValor: [''],
    resumenSug: [''],
    palabrasClaveValor: [''],
    palabrasClaveSug: [''],
    apaValor: [''],
    apaSug: [''],
    citasValor: [''],
    citasSug: [''],
    tipoSegunEvaluador: [''],
    introduccionValor: [''],
    introduccionSug: [''],
    objetivosValor: [''],
    objetivosSug: [''],
    metodologiaValor: [''],
    metodologiaSug: [''],
    resultadosDiscusionValor: [''],
    resultadosDiscusionSug: [''],
    tablasFigurasValor: [''],
    tablasFigurasSug: [''],
    conclusionesValor: [''],
    conclusionesSug: [''],
    recomendacion: ['', Validators.required],
    modalidadRecomendada: ['', Validators.required],
    comentarioAutor: [''],
    comentarioComite: [''],
  });

  get nombreEvaluador(): string {
    const u = this.login.getUser();
    return u ? `${u.nombre} ${u.apellido}`.trim() : '—';
  }

  get emailEvaluador(): string {
    return this.login.getUser()?.email ?? '—';
  }

  get permiteArchivoCorreccion(): boolean {
    return permiteArchivoCorreccionEvaluacion(this.form.value.recomendacion);
  }

  get esContenidoCientifico(): boolean {
    return esTipoCientificoRubrica(this.form.value.tipoSegunEvaluador);
  }

  ngOnInit(): void {
    this.form.controls.recomendacion.valueChanges.subscribe((rec) => {
      if (!permiteArchivoCorreccionEvaluacion(rec)) {
        this.archivoSeleccionado = null;
      }
    });
    const id = Number(this.route.snapshot.paramMap.get('asignacionId'));
    const uid = this.login.getUser()?.id;
    if (!id || !uid) {
      this.error = 'Sesión o asignación inválida.';
      this.cargando = false;
      return;
    }
    forkJoin({
      tipos: this.catalogos.tiposEnvioPaperActivos(),
      modalidades: this.catalogos.modalidadesActivas(),
      asignaciones: this.asignacionService.listarPorEvaluador(uid, 1, 200, false),
    }).subscribe({
      next: ({ tipos, modalidades, asignaciones }) => {
        this.asignacion = asignaciones.find((a) => a.id === id);
        this.tiposEnvio = this.asegurarOpcionTipo(tipos, this.asignacion?.trabajoTipo);
        this.modalidades = this.armarModalidades(modalidades, this.asignacion?.trabajoModalidad);
        this.cargando = false;
        if (!this.asignacion) {
          this.error = 'No se encontró la asignación.';
          return;
        }
        if (!this.asignacion.aceptada || !this.asignacion.fechaRespuesta) {
          this.error = 'Primero debés aceptar la asignación.';
          return;
        }
        if (this.asignacion.evaluacionRecomendacion) {
          this.error = 'Ya registraste un dictamen para este trabajo.';
          return;
        }
        this.preseleccionarDesdeEnvio(this.asignacion);
      },
      error: (err) => {
        this.error = mensajeErrorApi(err, 'No se pudo cargar la asignación.');
        this.cargando = false;
      },
    });
  }

  etiquetaTipoEnvio(codigo?: string | null): string {
    if (!codigo) return '—';
    const found = this.tiposEnvio.find((t) => t.codigo === codigo);
    return found?.etiqueta ?? codigo.replaceAll('_', ' ');
  }

  etiquetaModalidadEnvio(codigo?: string | null): string {
    if (!codigo) return '—';
    const found = this.modalidades.find((m) => m.value === codigo);
    return found?.label ?? this.catalogos.etiquetaModalidad(codigo);
  }

  private preseleccionarDesdeEnvio(a: AsignacionEvaluacion): void {
    const tipo = this.mapTipoRubrica(a.trabajoTipo);
    const tipoItem = this.tiposEnvio.find((t) => t.codigo.toUpperCase() === tipo);
    if (tipoItem) {
      this.form.controls.tipoSegunEvaluador.setValue(tipoItem.codigo);
    }
    const modalidad = a.trabajoModalidad?.trim().toUpperCase() || '';
    if (modalidad && this.modalidades.some((m) => m.value === modalidad)) {
      this.form.controls.modalidadRecomendada.setValue(modalidad);
    }
  }

  /** Códigos de catálogo; acepta legado CIENTIFICO/RELATO de rúbricas viejas. */
  private mapTipoRubrica(trabajoTipo?: string | null): string {
    if (!trabajoTipo) return '';
    const t = trabajoTipo.trim().toUpperCase();
    if (t === 'CIENTIFICO') return 'TRABAJO_CIENTIFICO';
    if (t === 'RELATO') return 'RELATO_DE_EXPERIENCIA';
    return t;
  }

  private asegurarOpcionTipo(tipos: CatalogoItem[], trabajoTipo?: string | null): CatalogoItem[] {
    const out = [...tipos];
    const codigo = this.mapTipoRubrica(trabajoTipo);
    if (codigo && !out.some((t) => t.codigo.toUpperCase() === codigo)) {
      out.push({
        codigo,
        etiqueta: codigo.replaceAll('_', ' '),
        activo: true,
        orden: out.length + 1,
        sistema: false,
      });
    }
    return out;
  }

  private armarModalidades(
    items: CatalogoItem[],
    trabajoModalidad?: string | null
  ): { value: string; label: string }[] {
    const out = items.map((m) => ({
      value: m.codigo.toUpperCase(),
      label: m.etiqueta || m.codigo,
    }));
    const codigo = trabajoModalidad?.trim().toUpperCase() || '';
    if (codigo && !out.some((m) => m.value === codigo)) {
      out.push({
        value: codigo,
        label: this.catalogos.etiquetaModalidad(codigo),
      });
    }
    if (!out.some((m) => m.value === MODALIDAD_INDECISO.value)) {
      out.push({ value: MODALIDAD_INDECISO.value, label: MODALIDAD_INDECISO.label });
    }
    return out;
  }

  irAPaso(i: number): void {
    if (i >= 0 && i < this.pasos.length && i <= this.paso + 1) {
      this.paso = i;
    }
  }

  siguiente(): void {
    if (!this.validarPasoActual()) {
      return;
    }
    if (this.paso < this.pasos.length - 1) {
      this.paso++;
    }
  }

  anterior(): void {
    if (this.paso > 0) {
      this.paso--;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] ?? null;
  }

  enviar(): void {
    if (!this.asignacion?.id || this.enviando) {
      return;
    }
    if (
      !this.validarPasoActual() ||
      this.form.controls.recomendacion.invalid ||
      this.form.controls.modalidadRecomendada.invalid
    ) {
      this.error = 'Completá la decisión final y la modalidad recomendada.';
      return;
    }
    this.enviando = true;
    this.error = '';
    const v = this.form.getRawValue();
    const rubrica = this.buildRubrica();
    this.evaluacionService
      .registrarDictamen({
        asignacionId: this.asignacion.id,
        recomendacion: v.recomendacion,
        comentario: v.comentarioAutor || null,
        comentarioComite: v.comentarioComite || null,
        modalidadRecomendada: v.modalidadRecomendada || null,
        rubricaJson: JSON.stringify(rubrica),
      })
      .subscribe({
        next: (eva) => {
          if (
            this.archivoSeleccionado &&
            eva.id &&
            permiteArchivoCorreccionEvaluacion(v.recomendacion)
          ) {
            this.evaluacionService.adjuntarArchivoCorreccion(eva.id, this.archivoSeleccionado).subscribe({
              next: () => this.router.navigateByUrl('/evaluador'),
              error: (err) => {
                this.error =
                  mensajeErrorApi(err, 'Dictamen guardado, pero falló el archivo de correcciones.');
                this.enviando = false;
              },
            });
          } else {
            this.router.navigateByUrl('/evaluador');
          }
        },
        error: (err) => {
          this.error = mensajeErrorApi(err, 'No se pudo registrar el dictamen.');
          this.enviando = false;
        },
      });
  }

  private validarPasoActual(): boolean {
    this.error = '';
    const v = this.form.getRawValue();
    if (this.paso === 0) {
      if (!v.pertinencia || !v.identidadAutor || !v.ejeCorrecto) {
        this.error = 'Completá la evaluación general (pertinencia, identidad y eje).';
        return false;
      }
    }
    if (this.paso === 4 && (!v.recomendacion || !v.modalidadRecomendada)) {
      this.error = 'Elegí la decisión final y la modalidad recomendada.';
      return false;
    }
    return true;
  }

  private buildRubrica(): RubricaEvaluacion {
    const v = this.form.getRawValue();
    const r = rubricaVacia();
    r.general.pertinencia = v.pertinencia as RubricaEvaluacion['general']['pertinencia'];
    r.general.identidadAutor = v.identidadAutor as RubricaEvaluacion['general']['identidadAutor'];
    r.general.ejeCorrecto = v.ejeCorrecto as RubricaEvaluacion['general']['ejeCorrecto'];
    r.forma.lenguaje = { valor: v.lenguajeValor, sugerencia: v.lenguajeSug };
    r.forma.titulo = { valor: v.tituloValor, sugerencia: v.tituloSug };
    r.forma.resumen = { valor: v.resumenValor, sugerencia: v.resumenSug };
    r.forma.palabrasClave = { valor: v.palabrasClaveValor, sugerencia: v.palabrasClaveSug };
    r.bibliografia.formatoApa = { valor: v.apaValor, sugerencia: v.apaSug };
    r.bibliografia.coherenciaCitas = { valor: v.citasValor, sugerencia: v.citasSug };
    r.tipoSegunEvaluador = v.tipoSegunEvaluador as RubricaEvaluacion['tipoSegunEvaluador'];
    r.contenidoCientifico.introduccion = {
      valor: v.introduccionValor,
      sugerencia: v.introduccionSug,
    };
    r.contenidoCientifico.objetivos = { valor: v.objetivosValor, sugerencia: v.objetivosSug };
    r.contenidoCientifico.metodologia = {
      valor: v.metodologiaValor,
      sugerencia: v.metodologiaSug,
    };
    r.contenidoCientifico.resultadosDiscusion = {
      valor: v.resultadosDiscusionValor,
      sugerencia: v.resultadosDiscusionSug,
    };
    r.contenidoCientifico.tablasFiguras = {
      valor: v.tablasFigurasValor,
      sugerencia: v.tablasFigurasSug,
    };
    r.contenidoCientifico.conclusiones = {
      valor: v.conclusionesValor,
      sugerencia: v.conclusionesSug,
    };
    return r;
  }
}
