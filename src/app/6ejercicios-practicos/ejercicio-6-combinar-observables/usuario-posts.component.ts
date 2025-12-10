import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { Post } from '../../shared/post.model';
import { Usuario } from '../../shared/usuario.model';

interface Resultado {
  nombreUsuario: string;
  cantidadPosts: number;
  cargando: boolean;
  error: string | null;
}

@Component({
  selector: 'app-usuario-posts',
  templateUrl: './usuario-posts.component.html',
})
export class UsuarioPostsComponent implements OnInit {
  resultado = signal<Resultado>({ nombreUsuario: '', cantidadPosts: 0, cargando: true, error: null });
  private http = inject(HttpClient);

  ngOnInit() {
    this.http.get<Usuario>('http://localhost:3000/usuarios/1').pipe(
      switchMap((usuario) =>
        this.http.get<Post[]>(`http://localhost:3000/posts?userId=${usuario.id}`).pipe(
          map((posts) => ({
            nombreUsuario: usuario.nombre,
            cantidadPosts: posts.length,
            cargando: false,
            error: null,
          }))
        )
      ),
      catchError(() =>
        of({ nombreUsuario: '', cantidadPosts: 0, cargando: false, error: 'Error al cargar datos' })
      ),
      startWith({ nombreUsuario: '', cantidadPosts: 0, cargando: true, error: null })
    ).subscribe((res) => this.resultado.set(res));
  }
}
