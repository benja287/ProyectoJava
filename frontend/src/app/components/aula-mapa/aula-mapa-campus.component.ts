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
import { CAMPUS_MAP, puntoEnCampus } from '../../constants/campus-map';
import { Aula } from '../../models/aula.model';

export type AulaMapaPunto = { lat: number; lng: number };

@Component({
  selector: 'app-aula-mapa-campus',
  standalone: true,
  template: `
    <div class="aula-mapa-wrap">
      <div #mapEl class="aula-mapa" role="application" aria-label="Mapa del campus FCAyF"></div>
      <p class="muted small aula-mapa-hint">
        Mapa acotado al campus de la FCAyF (La Plata). Hacé clic para ubicar el aula que estás
        editando. Los pines grises son otras aulas ya ubicadas.
      </p>
    </div>
  `,
  styles: [
    `
      .aula-mapa-wrap {
        margin-top: 0.75rem;
      }
      .aula-mapa {
        height: 320px;
        width: 100%;
        border-radius: 8px;
        border: 1px solid #c5d0c0;
        z-index: 0;
      }
      .aula-mapa-hint {
        margin-top: 0.4rem;
      }
    `,
  ],
})
export class AulaMapaCampusComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  /** Otras aulas (pins de contexto). */
  @Input() aulas: Aula[] = [];
  /** Id del aula en edición (no se dibuja como pin gris). */
  @Input() excluirAulaId: number | null = null;
  @Input() seleccion: AulaMapaPunto | null = null;
  @Input() editable = true;

  @Output() posicionElegida = new EventEmitter<AulaMapaPunto>();

  private map?: L.Map;
  private seleccionMarker?: L.Marker;
  private otrosLayer = L.layerGroup();
  private ready = false;

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
    const bounds = L.latLngBounds(
      [CAMPUS_MAP.sw.lat, CAMPUS_MAP.sw.lng],
      [CAMPUS_MAP.ne.lat, CAMPUS_MAP.ne.lng]
    );
    this.map = L.map(this.mapEl.nativeElement, {
      maxBounds: bounds.pad(0.02),
      maxBoundsViscosity: 1,
      minZoom: CAMPUS_MAP.minZoom,
      maxZoom: CAMPUS_MAP.maxZoom,
    }).setView([CAMPUS_MAP.center.lat, CAMPUS_MAP.center.lng], CAMPUS_MAP.defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: CAMPUS_MAP.maxZoom,
    }).addTo(this.map);

    this.otrosLayer.addTo(this.map);

    if (this.editable) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (!puntoEnCampus(lat, lng)) {
          return;
        }
        this.posicionElegida.emit({ lat, lng });
      });
    }

    this.ready = true;
    this.redibujar();
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) {
      return;
    }
    if (changes['aulas'] || changes['excluirAulaId'] || changes['seleccion']) {
      this.redibujar();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = undefined;
  }

  private redibujar(): void {
    if (!this.map) {
      return;
    }
    this.otrosLayer.clearLayers();
    for (const a of this.aulas) {
      if (
        a.id != null &&
        a.id === this.excluirAulaId &&
        this.seleccion != null
      ) {
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
        title: 'Aula en edición',
      }).addTo(this.map);
      if (this.editable) {
        this.seleccionMarker.on('dragend', () => {
          const p = this.seleccionMarker!.getLatLng();
          if (!puntoEnCampus(p.lat, p.lng)) {
            this.seleccionMarker!.setLatLng([this.seleccion!.lat, this.seleccion!.lng]);
            return;
          }
          this.posicionElegida.emit({ lat: p.lat, lng: p.lng });
        });
      }
    }
  }
}
