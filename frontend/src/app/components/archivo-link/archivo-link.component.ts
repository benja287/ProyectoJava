import { Component, Input } from '@angular/core';
import { ArchivoService } from '../../servicios/archivo.service';

@Component({
  selector: 'app-archivo-link',
  standalone: true,
  template: `
    @if (url) {
      <a href="#" class="archivo-link" (click)="onClick($event)">{{ label }}</a>
    }
  `,
  styles: [
    `
      .archivo-link {
        cursor: pointer;
      }
    `,
  ],
})
export class ArchivoLinkComponent {
  @Input() url?: string | null;
  @Input() label = 'Ver';
  /** Si true, fuerza descarga (útil para Word). */
  @Input() download = false;
  @Input() downloadName?: string;

  constructor(private archivoService: ArchivoService) {}

  onClick(event: Event): void {
    event.preventDefault();
    this.archivoService.abrir(this.url, {
      forceDownload: this.download,
      filename: this.downloadName,
    });
  }
}
