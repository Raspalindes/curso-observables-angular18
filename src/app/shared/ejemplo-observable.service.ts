import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EjemploObservableService {
  getNumeros(): Observable<number> {
    return new Observable((subscriber) => {
      for (let i = 1; i <= 10; i++) {
        subscriber.next(i);
      }
      subscriber.complete();
    });
  }
}
