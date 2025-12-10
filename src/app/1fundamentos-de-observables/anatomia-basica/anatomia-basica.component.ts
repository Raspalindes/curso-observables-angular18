import { Component } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-anatomia-basica',
  templateUrl: './anatomia-basica.component.html',
})
export class AnatomiaBasicaComponent {
  miObservable$: Observable<string> = new Observable((subscriber) => {
    subscriber.next('Primer valor');
    subscriber.next('Segundo valor');
    subscriber.complete();
  });
}
