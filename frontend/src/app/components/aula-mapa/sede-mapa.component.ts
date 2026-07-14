import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
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
        <div class="sede-mapa-search">
          <label class="sede-mapa-search-label">
            Buscar dirección
            <span class="muted small"> (calle, intersección, ciudad, provincia)</span>
          </label>
          <div class="sede-mapa-search-row">
            <input
              type="search"
              [(ngModel)]="consultaBusqueda"
              [ngModelOptions]="{ standalone: true }"
              placeholder="Ej: calle 60 y 121, La Plata"
              (keyup.enter)="buscarDireccion()"
              [disabled]="buscando"
            />
            <button type="button" class="btn-primary" [disabled]="buscando" (click)="buscarDireccion()">
              {{ buscando ? 'Buscando…' : 'Buscar' }}
            </button>
          </div>
          @if (errorBusqueda) {
            <p class="error small" style="margin-top: 0.35rem">{{ errorBusqueda }}</p>
          }
          @if (resultadosBusqueda.length) {
            <ul class="sede-mapa-resultados" role="listbox">
              @for (r of resultadosBusqueda; track r.etiqueta + r.lat + r.lng) {
                <li>
                  <button type="button" class="sede-mapa-resultado" (click)="elegirResultado(r)">
                    {{ r.etiqueta }}
                  </button>
                </li>
              }
            </ul>
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
      .sede-mapa-search-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        align-items: stretch;
      }
      .sede-mapa-search-row input {
        flex: 1 1 220px;
        min-width: 0;
      }
      .sede-mapa-resultados {
        list-style: none;
        margin: 0.4rem 0 0;
        padding: 0;
        border: 1px solid #c5d0c0;
        border-radius: 8px;
        max-height: 180px;
        overflow: auto;
        background: #fff;
      }
      .sede-mapa-resultados li + li {
        border-top: 1px solid #e4ebe2;
      }
      .sede-mapa-resultado {
        display: block;
        width: 100%;
        text-align: left;
        padding: 0.55rem 0.75rem;
        border: 0;
        background: transparent;
        cursor: pointer;
        font: inherit;
        color: inherit;
      }
      .sede-mapa-resultado:hover,
      .sede-mapa-resultado:focus {
        background: #eef4ec;
        outline: none;
      }
    `,
  ],
})
export class SedeMapaComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  /**
   * libre: navegar el país/mundo y elegir sede (sin maxBounds).
   * acotado: rango alrededor de {@link centro} (ver sede / ubicar aulas).
   */
  @Input() modo: 'libre' | 'acotado' = 'acotado';
  /** Centro del congreso: obligatorio en acotado; en libre es el pin / vista inicial. */
  @Input() centro: MapaPunto | null = null;
  @Input() aulas: Aula[] = [];
  @Input() excluirAulaId: number | null = null;
  @Input() seleccion: MapaPunto | null = null;
  @Input() editable = true;
  @Input() hint = '';
  @Input() ariaLabel = 'Mapa de la sede del congreso';
  /** Punto azul con la geolocalización del navegador (si el usuario autoriza). */
  @Input() mostrarMiUbicacion = false;
  /** Solo editar ubicación del congreso: caja de búsqueda Nominatim. */
  @Input() mostrarBusqueda = false;

  @Output() posicionElegida = new EventEmitter<MapaPunto>();

  consultaBusqueda = '';
  resultadosBusqueda: GeocodeResultado[] = [];
  buscando = false;
  errorBusqueda = '';

  private readonly geocoding = inject(GeocodingService);
  private map?: L.Map;
  private seleccionMarker?: L.Marker;
  private miUbicacionMarker?: L.CircleMarker;
  private otrosLayer = L.layerGroup();
  private ready = false;
  private clickHandler?: (e: L.LeafletMouseEvent) => void;
  private invalidateTimer?: ReturnType<typeof setTimeout>;

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

  ngAfterViewInit(): void {
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
    this.destroyMap();
  }

  buscarDireccion(): void {
    if (!this.mostrarBusqueda || this.buscando) {
      return;
    }
    const q = this.consultaBusqueda.trim();
    this.errorBusqueda = '';
    this.resultadosBusqueda = [];
    if (q.length < 3) {
      this.errorBusqueda = 'Escribí al menos 3 caracteres (ej: calle 60 y 121, La Plata).';
      return;
    }
    this.buscando = true;
    this.geocoding.buscar(q).subscribe({
      next: (items) => {
        this.buscando = false;
        this.resultadosBusqueda = items;
        if (!items.length) {
          this.errorBusqueda = 'No se encontró esa dirección. Probá con más detalle o otra provincia.';
        }
      },
      error: () => {
        this.buscando = false;
        this.errorBusqueda = 'No se pudo buscar la dirección. Reintentá en unos segundos.';
      },
    });
  }

  elegirResultado(r: GeocodeResultado): void {
    this.resultadosBusqueda = [];
    this.errorBusqueda = '';
    this.consultaBusqueda = r.etiqueta;
    this.posicionElegida.emit({ lat: r.lat, lng: r.lng });
    if (this.map) {
      this.map.setView([r.lat, r.lng], 17, { animate: false });
    }
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
        /* sin permiso: se permanece en vista por defecto */
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
