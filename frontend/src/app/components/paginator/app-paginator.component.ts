import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Paginador reutilizable (páginas 1-based, igual que el API).
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 0 || (total ?? 0) > 0) {
      <div class="app-paginator">
        <p class="muted small app-paginator-meta">
          Página {{ currentPage }} de {{ totalPages || 1 }}
          @if (total != null) {
            — {{ total }} registro(s)
          }
        </p>
        <div class="app-paginator-actions">
          <button
            type="button"
            class="btn-secundario"
            [disabled]="currentPage <= 1 || disabled"
            (click)="ir(currentPage - 1)"
          >
            Anterior
          </button>
          <button
            type="button"
            class="btn-secundario"
            [disabled]="currentPage >= totalPages || disabled"
            (click)="ir(currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    }
  `,
})
export class AppPaginatorComponent {
  @Input({ required: true }) currentPage = 1;
  @Input({ required: true }) totalPages = 0;
  @Input() total?: number;
  @Input() disabled = false;

  @Output() readonly pageChange = new EventEmitter<number>();

  ir(page: number): void {
    if (page < 1 || (this.totalPages > 0 && page > this.totalPages) || page === this.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }
}
