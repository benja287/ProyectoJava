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
} from '@angular/core';
import * as L from 'leaflet';
import {
  MapaPunto,
  SEDE_MAPA,
  boundsDesdeCentro,
  puntoEnRango,
} from '../../constants/sede-mapa';
import { Aula } from '../../models/aula.model';

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
  template: `
    <div class="sede-mapa-wrap">
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

  @Output() posicionElegida = new EventEmitter<MapaPunto>();

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

    // Solo recrear si cambió el modo o las coords reales (no una nueva referencia del mismo punto).
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
    }
    if (changes['mostrarMiUbicacion'] && this.mostrarMiUbicacion) {
      this.intentarMiUbicacion();
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
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
      // Contenedor aún sin tamaño: reintentar en el próximo frame.
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
