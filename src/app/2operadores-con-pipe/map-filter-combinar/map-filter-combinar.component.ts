import { Component, inject } from '@angular/core';
import { filter, map } from 'rxjs/operators';
import { EjemploObservableService } from '../../shared/ejemplo-observable.service';

@Component({
  selector: 'app-map-filter-combinar',
  templateUrl: './map-filter-combinar.component.html',
})
export class MapFilterCombinarComponent {
  private ejemploService = inject(EjemploObservableService);
  resultados: number[] = [];

  ejecutar() {
    this.ejemploService.getNumeros()
      .pipe(
        map((num) => num * 3),
        map((num) => num + 5),
        filter((num) => num > 20)
      )
      .subscribe({
        next: (valor) => this.resultados.push(valor)
      });
  }
}
