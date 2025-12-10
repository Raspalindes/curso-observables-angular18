import { Component, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { UsuariosService } from '../../ejercicio-2-servicio-productos/usuarios.service';
import { Usuario } from '../../shared/usuario.model';

@Component({
  selector: 'app-buscador',
  templateUrl: './buscador.component.html',
})
export class BuscadorComponent {
  busqueda = new FormControl('');
  resultados$: Observable<Usuario[]>;
  private usuariosService = inject(UsuariosService);

  constructor() {
    this.resultados$ = this.busqueda.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((termino) =>
        termino
          ? this.usuariosService.obtenerUsuarios().pipe(
              map((usuarios) => usuarios.filter((u) => u.nombre.toLowerCase().includes(termino.toLowerCase())))
            )
          : of([])
      )
    );
  }
}
