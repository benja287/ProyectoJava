import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

export type FilterFieldType = 'text' | 'select' | 'number';

export interface FilterFieldConfig {
  key: string;
  label: string;
  type?: FilterFieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="filter-bar" [formGroup]="form" (ngSubmit)="submitFilters()">
      @for (field of fields; track field.key) {
        <label>
          {{ field.label }}
          @if (field.type === 'select') {
            <select [formControlName]="field.key">
              <option value="">— Todos —</option>
              @for (opt of field.options ?? []; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select>
          } @else if (field.type === 'number') {
            <input
              type="number"
              [formControlName]="field.key"
              [placeholder]="field.placeholder ?? ''"
              step="0.01"
            />
          } @else {
            <input
              type="text"
              [formControlName]="field.key"
              [placeholder]="field.placeholder ?? ''"
            />
          }
        </label>
      }
      <div class="filter-bar-actions">
        <button type="submit">Buscar</button>
        <button type="button" class="btn-secondary" (click)="clearFilters()">Limpiar</button>
      </div>
    </form>
  `,
})
export class FilterBarComponent implements OnChanges {
  private fb = inject(FormBuilder);

  @Input({ required: true }) fields!: FilterFieldConfig[];
  @Input() values: Record<string, string> = {};
  @Output() filterApply = new EventEmitter<Record<string, string>>();
  @Output() filterClear = new EventEmitter<void>();

  form: FormGroup = this.fb.group({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['values']) {
      this.buildForm();
    }
  }

  submitFilters(): void {
    const raw = this.form.getRawValue() as Record<string, string>;
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (String(value ?? '').trim() !== '') {
        cleaned[key] = String(value).trim();
      }
    }
    this.filterApply.emit(cleaned);
  }

  clearFilters(): void {
    const empty = Object.fromEntries(this.fields.map((f) => [f.key, '']));
    this.form.reset(empty);
    this.filterClear.emit();
  }

  private buildForm(): void {
    const controls: Record<string, FormControl<string>> = {};
    for (const field of this.fields ?? []) {
      controls[field.key] = this.fb.nonNullable.control(this.values[field.key] ?? '');
    }
    this.form = this.fb.group(controls);
  }
}
