import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay, map, retryWhen, take, tap } from 'rxjs/operators';
import { Producto } from '../../shared/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductosRetryService {
  private apiUrl = 'http://localhost:3000/productos';
  private http = inject(HttpClient);

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      map(productos => productos.slice(0, 5)),
      retryWhen(errors =>
        errors.pipe(
          tap((_, i) => console.log(`Reintento ${i + 1} de 3...`)),
          delay(1000),
          take(3),
          tap({ complete: () => console.log('Se agotaron los reintentos') })
        )
      ),
      catchError(() => of([]))
    );
  }
}
