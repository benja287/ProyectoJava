import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { Subject, Subscription, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from 'rxjs/operators';
import {
  MapaPunto,
  SEDE_MAPA,
  boundsDesdeCentro,
  puntoEnRango,
} from '../../constants/sede-mapa';
import { Aula } from '../../models/aula.model';
import {
  GeocodeResultado,
  GeocodingService,
} from '../../servicios/geocoding.service';

export type AulaMapaPunto = MapaPunto;

function mismoPunto(a: MapaPunto | null | undefined, b: MapaPunto | null | undefined): boolean {
  if (a == null && b == null) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return a.lat === b.lat && a.lng === b.lng;
}

@Component({
  selector: 'app-sede-mapa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sede-mapa-wrap">
      @if (mostrarBusqueda) {
        <div class="sede-mapa-search" #searchWrap>
          <label class="sede-mapa-search-label" for="sede-mapa-q">
            Buscar dirección
            <span class="muted small"> — escribí y elegí del listado</span>
          </label>
          <div class="sede-mapa-search-box">
            <input
              id="sede-mapa-q"
              type="search"
              autocomplete="off"
              [(ngModel)]="consultaBusqueda"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Ej: Avenida 60, La Plata · o 60 y 118"
              (ngModelChange)="onConsultaChange($event)"
              (keydown)="onSearchKeydown($event)"
              (focus)="onSearchFocus()"
              role="combobox"
              [attr.aria-expanded]="mostrarDesplegable"
              aria-autocomplete="list"
              aria-controls="sede-mapa-sugerencias"
            />
            @if (buscando) {
              <span class="sede-mapa-search-status" aria-live="polite">{{
                buscandoCruce ? 'Buscando cruce…' : 'Buscando…'
              }}</span>
            }
            @if (mostrarDesplegable) {
              <ul id="sede-mapa-sugerencias" class="sede-mapa-resultados" role="listbox">
                @for (r of resultadosBusqueda; track r.etiqueta + r.lat + r.lng; let i = $index) {
                  <li role="option" [attr.aria-selected]="i === indiceActivo">
                    <button
                      type="button"
                      class="sede-mapa-resultado"
                      [class.sede-mapa-resultado--activo]="i === indiceActivo"
                      (mousedown)="$event.preventDefault()"
                      (click)="elegirResultado(r)"
                    >
                      <span class="sede-mapa-resultado-titulo">{{ r.etiqueta }}</span>
                      @if (r.detalle) {
                        <span class="sede-mapa-resultado-detalle">{{ r.detalle }}</span>
                      }
                    </button>
                  </li>
                }
              </ul>
            } @else if (sinResultados && consultaBusqueda.trim().length >= 2 && !buscando) {
              <p class="muted small sede-mapa-vacio">
                @if (esConsultaCruce) {
                  No encontré ese cruce. Probá «60 y 118» o «calle 120 y calle 60».
                } @else {
                  Sin sugerencias. Probá con ciudad (ej. Avenida 60, La Plata) o un cruce.
                }
              </p>
            }
          </div>
          @if (errorBusqueda) {
            <p class="error small" style="margin-top: 0.35rem">{{ errorBusqueda }}</p>
          }
        </div>
      }
      <div #mapEl class="sede-mapa" role="application" [attr.aria-label]="ariaLabel"></div>
      @if (hint) {
        <p class="muted small sede-mapa-hint">{{ hint }}</p>
      }
    </div>
  `,
  styles: [
    `
      .sede-mapa-wrap {
        margin-top: 0.75rem;
      }
      .sede-mapa {
        height: 320px;
        width: 100%;
        border-radius: 8px;
        border: 1px solid #c5d0c0;
        z-index: 0;
        background: #e8eee6;
      }
      .sede-mapa-hint {
        margin-top: 0.4rem;
      }
      .sede-mapa-search {
        margin-bottom: 0.65rem;
      }
      .sede-mapa-search-label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.35rem;
      }
      .sede-mapa-search-box {
        position: relative;
      }
      .sede-mapa-search-box input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.55rem 0.75rem;
        border: 1px solid #c5d0c0;
        border-radius: 8px;
        font: inherit;
      }
      .sede-mapa-search-box input:focus {
        outline: 2px solid #6a9b6a;
        outline-offset: 1px;
        border-color: #6a9b6a;
      }
      .sede-mapa-search-status {
        position: absolute;
        right: 0.75rem;
        top: 0.6rem;
        font-size: 0.8rem;
        color: #5a6b5a;
        pointer-events: none;
      }
      .sede-mapa-resultados {
        list-style: none;
        margin: 0.25rem 0 0;
        padding: 0;
        border: 1px solid #c5d0c0;
        border-radius: 8px;
        max-height: 220px;
        overflow: auto;
        background: #fff;
        box-shadow: 0 6px 18px rgba(30, 50, 30, 0.12);
        position: absolute;
        left: 0;
        right: 0;
        z-index: 20;
      }
      .sede-mapa-resultados li + li {
        border-top: 1px solid #e4ebe2;
      }
      .sede-mapa-resultado {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        width: 100%;
        text-align: left;
        padding: 0.6rem 0.75rem;
        border: 0;
        background: transparent;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }
      .sede-mapa-resultado-titulo {
        font-weight: 600;
      }
      .sede-mapa-resultado-detalle {
        font-size: 0.85rem;
        color: #5a6b5a;
      }
      .sede-mapa-resultado:hover,
      .sede-mapa-resultado--activo {
        background: #eef4ec;
        outline: none;
      }
      .sede-mapa-vacio {
        margin: 0.4rem 0 0;
      }
    `,
  ],
})
export class SedeMapaComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @ViewChild('searchWrap') searchWrap?: ElementRef<HTMLDivElement>;

  @Input() modo: 'libre' | 'acotado' = 'acotado';
  @Input() centro: MapaPunto | null = null;
  @Input() aulas: Aula[] = [];
  @Input() excluirAulaId: number | null = null;
  @Input() seleccion: MapaPunto | null = null;
  @Input() editable = true;
  @Input() hint = '';
  @Input() ariaLabel = 'Mapa de la sede del congreso';
  @Input() mostrarMiUbicacion = false;
  @Input() mostrarBusqueda = false;

  @Output() posicionElegida = new EventEmitter<MapaPunto>();

  consultaBusqueda = '';
  resultadosBusqueda: GeocodeResultado[] = [];
  buscando = false;
  buscandoCruce = false;
  esConsultaCruce = false;
  errorBusqueda = '';
  sinResultados = false;
  indiceActivo = -1;
  panelAbierto = false;

  private readonly geocoding = inject(GeocodingService);
  private readonly consulta$ = new Subject<string>();
  private searchSub?: Subscription;
  private map?: L.Map;
  private seleccionMarker?: L.Marker;
  private miUbicacionMarker?: L.CircleMarker;
  private otrosLayer = L.layerGroup();
  private ready = false;
  private clickHandler?: (e: L.LeafletMouseEvent) => void;
  private invalidateTimer?: ReturnType<typeof setTimeout>;
  private ignorarProximaConsulta = false;

  private readonly iconSeleccionado = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  private readonly iconOtro = L.divIcon({
    className: 'aula-mapa-pin-otro',
    html: '<span class="aula-mapa-pin-otro-dot"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  get mostrarDesplegable(): boolean {
    return this.panelAbierto && this.resultadosBusqueda.length > 0;
  }

  ngAfterViewInit(): void {
    this.searchSub = this.consulta$
      .pipe(
        debounceTime(450),
        distinctUntilChanged(),
        switchMap((q) => {
          const texto = q.trim();
          if (texto.length < 2) {
            this.buscando = false;
            this.buscandoCruce = false;
            this.esConsultaCruce = false;
            this.resultadosBusqueda = [];
            this.sinResultados = false;
            this.indiceActivo = -1;
            return of([] as GeocodeResultado[]);
          }
          this.esConsultaCruce = this.geocoding.esCruce(texto);
          this.buscandoCruce = this.esConsultaCruce;
          this.buscando = true;
          this.errorBusqueda = '';
          this.sinResultados = false;
          // Cruce: limpia resultados viejos (Calle 120 suelta) mientras busca el cruce real.
          if (this.esConsultaCruce) {
            this.resultadosBusqueda = [];
            this.panelAbierto = false;
          }
          return this.geocoding.autocompletar(texto, { bias: this.biasActual(), limit: 6 }).pipe(
            tap(() => {
              this.buscando = false;
              this.buscandoCruce = false;
            }),
            catchError(() => {
              this.buscando = false;
              this.buscandoCruce = false;
              this.errorBusqueda = this.esConsultaCruce
                ? 'No se pudo calcular el cruce. Reintentá en unos segundos.'
                : 'No se pudieron cargar sugerencias. Reintentá.';
              return of([] as GeocodeResultado[]);
            })
          );
        })
      )
      .subscribe((items) => {
        this.resultadosBusqueda = items;
        this.sinResultados = items.length === 0 && this.consultaBusqueda.trim().length >= 2;
        this.indiceActivo = items.length ? 0 : -1;
        this.panelAbierto = items.length > 0;
      });

    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready || !this.map) {
      return;
    }

    const modoCambio =
      !!changes['modo'] &&
      changes['modo'].previousValue !== changes['modo'].currentValue;
    const centroCambio =
      !!changes['centro'] &&
      !mismoPunto(
        changes['centro'].previousValue as MapaPunto | null,
        changes['centro'].currentValue as MapaPunto | null
      );

    if (modoCambio || centroCambio) {
      this.recrearMapa();
      return;
    }

    if (
      changes['aulas'] ||
      changes['excluirAulaId'] ||
      changes['seleccion'] ||
      changes['editable']
    ) {
      this.redibujar();
      if (
        changes['seleccion'] &&
        this.modo === 'libre' &&
        this.seleccion &&
        !mismoPunto(
          changes['seleccion'].previousValue as MapaPunto | null,
          changes['seleccion'].currentValue as MapaPunto | null
        )
      ) {
        this.map.setView([this.seleccion.lat, this.seleccion.lng], Math.max(this.map.getZoom(), 16), {
          animate: false,
        });
      }
    }
    if (changes['mostrarMiUbicacion'] && this.mostrarMiUbicacion) {
      this.intentarMiUbicacion();
    }
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.consulta$.complete();
    this.destroyMap();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const wrap = this.searchWrap?.nativeElement;
    if (!wrap) {
      return;
    }
    if (!wrap.contains(ev.target as Node)) {
      this.panelAbierto = false;
    }
  }

  onConsultaChange(valor: string): void {
    if (this.ignorarProximaConsulta) {
      this.ignorarProximaConsulta = false;
      return;
    }
    this.consultaBusqueda = valor;
    this.panelAbierto = true;
    this.consulta$.next(valor);
  }

  onSearchFocus(): void {
    if (this.resultadosBusqueda.length) {
      this.panelAbierto = true;
    }
  }

  onSearchKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowDown') {
      if (!this.resultadosBusqueda.length) {
        return;
      }
      ev.preventDefault();
      this.panelAbierto = true;
      this.indiceActivo = (this.indiceActivo + 1) % this.resultadosBusqueda.length;
      return;
    }
    if (ev.key === 'ArrowUp') {
      if (!this.resultadosBusqueda.length) {
        return;
      }
      ev.preventDefault();
      this.panelAbierto = true;
      this.indiceActivo =
        (this.indiceActivo - 1 + this.resultadosBusqueda.length) % this.resultadosBusqueda.length;
      return;
    }
    if (ev.key === 'Enter') {
      if (this.mostrarDesplegable && this.indiceActivo >= 0) {
        ev.preventDefault();
        this.elegirResultado(this.resultadosBusqueda[this.indiceActivo]);
      }
      return;
    }
    if (ev.key === 'Escape') {
      this.panelAbierto = false;
    }
  }

  elegirResultado(r: GeocodeResultado): void {
    this.ignorarProximaConsulta = true;
    this.consultaBusqueda = r.detalle ? `${r.etiqueta}, ${r.detalle}` : r.etiqueta;
    this.resultadosBusqueda = [];
    this.panelAbierto = false;
    this.sinResultados = false;
    this.errorBusqueda = '';
    this.indiceActivo = -1;
    this.posicionElegida.emit({ lat: r.lat, lng: r.lng });
    // Actualización inmediata del pin (no esperar al input del padre).
    this.aplicarSeleccionLocal({ lat: r.lat, lng: r.lng });
  }

  private aplicarSeleccionLocal(p: MapaPunto): void {
    if (!this.map) {
      return;
    }
    this.map.setView([p.lat, p.lng], 17, { animate: false });
    if (this.seleccionMarker) {
      this.seleccionMarker.setLatLng([p.lat, p.lng]);
    } else {
      this.seleccionMarker = L.marker([p.lat, p.lng], {
        icon: this.iconSeleccionado,
        draggable: this.editable,
        title: 'Ubicación seleccionada',
      }).addTo(this.map);
      if (this.editable) {
        this.seleccionMarker.on('dragend', () => {
          const ll = this.seleccionMarker!.getLatLng();
          this.posicionElegida.emit({ lat: ll.lat, lng: ll.lng });
        });
      }
    }
  }

  private biasActual(): MapaPunto | null {
    if (this.map) {
      const c = this.map.getCenter();
      return { lat: c.lat, lng: c.lng };
    }
    return this.seleccion ?? this.centro;
  }

  private recrearMapa(): void {
    this.destroyMap();
    this.initMap();
  }

  private destroyMap(): void {
    if (this.invalidateTimer != null) {
      clearTimeout(this.invalidateTimer);
      this.invalidateTimer = undefined;
    }
    if (this.map) {
      try {
        this.map.stop();
        if (this.clickHandler) {
          this.map.off('click', this.clickHandler);
        }
        this.map.off();
        this.map.remove();
      } catch {
        /* mapa ya inconsistente */
      }
    }
    this.clickHandler = undefined;
    this.seleccionMarker = undefined;
    this.miUbicacionMarker = undefined;
    this.map = undefined;
    this.ready = false;

    const el = this.mapEl?.nativeElement;
    if (el) {
      el.innerHTML = '';
      el.className = 'sede-mapa';
    }
  }

  private initMap(): void {
    const el = this.mapEl.nativeElement;
    if (!el || el.clientWidth === 0) {
      this.invalidateTimer = setTimeout(() => this.initMap(), 50);
      return;
    }

    const centroVista = this.seleccion ?? this.centro ?? SEDE_MAPA.defaultCenter;
    const opts: L.MapOptions = {
      maxZoom: SEDE_MAPA.maxZoom,
      zoomControl: true,
    };

    if (this.modo === 'acotado') {
      const centro = this.centro ?? SEDE_MAPA.defaultCenter;
      const b = boundsDesdeCentro(centro);
      const bounds = L.latLngBounds([b.sw.lat, b.sw.lng], [b.ne.lat, b.ne.lng]);
      opts.maxBounds = bounds.pad(0.02);
      opts.maxBoundsViscosity = 1;
      opts.minZoom = SEDE_MAPA.minZoomAcotado;
      this.map = L.map(el, opts);
      this.map.fitBounds(bounds, { padding: [12, 12], animate: false });
    } else {
      opts.minZoom = SEDE_MAPA.minZoomLibre;
      this.map = L.map(el, opts);
      this.map.setView(
        [centroVista.lat, centroVista.lng],
        this.seleccion || this.centro ? SEDE_MAPA.defaultZoom : SEDE_MAPA.defaultZoomLibre,
        { animate: false }
      );
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: SEDE_MAPA.maxZoom,
    }).addTo(this.map);

    this.otrosLayer = L.layerGroup().addTo(this.map);

    if (this.editable) {
      this.clickHandler = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (this.modo === 'acotado') {
          const c = this.centro ?? SEDE_MAPA.defaultCenter;
          if (!puntoEnRango(lat, lng, c)) {
            return;
          }
        }
        this.posicionElegida.emit({ lat, lng });
      };
      this.map.on('click', this.clickHandler);
    }

    this.ready = true;
    this.redibujar();
    if (this.mostrarMiUbicacion) {
      this.intentarMiUbicacion();
    }
    this.invalidateTimer = setTimeout(() => {
      this.map?.invalidateSize({ animate: false });
    }, 100);
  }

  private intentarMiUbicacion(): void {
    if (!this.map || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!this.map) {
          return;
        }
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (this.miUbicacionMarker) {
          this.miUbicacionMarker.setLatLng([lat, lng]);
        } else {
          this.miUbicacionMarker = L.circleMarker([lat, lng], {
            radius: 8,
            color: '#1a5fb4',
            fillColor: '#3584e4',
            fillOpacity: 0.9,
            weight: 2,
          })
            .bindPopup('Tu ubicación')
            .addTo(this.map);
        }
        if (this.modo === 'libre' && !this.seleccion && !this.centro) {
          this.map.setView([lat, lng], 14, { animate: false });
        }
      },
      () => {
        /* sin permiso */
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }

  private redibujar(): void {
    if (!this.map) {
      return;
    }
    this.otrosLayer.clearLayers();
    for (const a of this.aulas) {
      if (a.id != null && a.id === this.excluirAulaId && this.seleccion != null) {
        continue;
      }
      if (a.latitud == null || a.longitud == null) {
        continue;
      }
      L.marker([a.latitud, a.longitud], { icon: this.iconOtro, title: a.nombre })
        .bindPopup(a.nombre)
        .addTo(this.otrosLayer);
    }

    if (this.seleccionMarker) {
      this.seleccionMarker.remove();
      this.seleccionMarker = undefined;
    }
    if (this.seleccion) {
      this.seleccionMarker = L.marker([this.seleccion.lat, this.seleccion.lng], {
        icon: this.iconSeleccionado,
        draggable: this.editable,
        title: 'Ubicación seleccionada',
      }).addTo(this.map);
      if (this.editable) {
        this.seleccionMarker.on('dragend', () => {
          const p = this.seleccionMarker!.getLatLng();
          if (this.modo === 'acotado') {
            const c = this.centro ?? SEDE_MAPA.defaultCenter;
            if (!puntoEnRango(p.lat, p.lng, c)) {
              this.seleccionMarker!.setLatLng([this.seleccion!.lat, this.seleccion!.lng]);
              return;
            }
          }
          this.posicionElegida.emit({ lat: p.lat, lng: p.lng });
        });
      }
    }
  }
}
