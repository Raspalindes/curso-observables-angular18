import { Component } from '@angular/core';
import { of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-transformar-datos',
  templateUrl: './transformar-datos.component.html',
})
export class TransformarDatosComponent {
  resultados: number[] = [];

  ejecutar() {
    of(1,2,3,4,5,6,7,8,9,10)
      .pipe(
        map(num => num * 3),
        map(num => num + 5),
        filter(num => num > 20)
      )
      .subscribe({ next: valor => this.resultados.push(valor) });
  }
}
