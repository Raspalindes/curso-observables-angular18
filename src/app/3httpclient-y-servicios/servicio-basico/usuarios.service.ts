import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Usuario } from '../../shared/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private apiUrl = 'http://localhost:3000/usuarios';
  private http = inject(HttpClient);

  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      map(usuarios => usuarios.slice(0, 5)),
      catchError(() => of([]))
    );
  }

  obtenerUsuario(id: number): Observable<Usuario | null> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(null))
    );
  }
}
