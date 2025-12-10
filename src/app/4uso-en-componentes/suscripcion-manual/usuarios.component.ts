import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { UsuariosService } from '../../3httpclient-y-servicios/servicio-basico/usuarios.service';
import { Usuario } from '../../shared/usuario.model';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios = signal<Usuario[]>([]);
  cargando = signal<boolean>(true);
  error = signal<string | null>(null);
  private suscripcion?: Subscription;
  private usuariosService = inject(UsuariosService);

  ngOnInit() {
    this.suscripcion = this.usuariosService.obtenerUsuarios().subscribe({
      next: (datos) => {
        this.usuarios.set(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar usuarios');
        this.cargando.set(false);
      },
    });
  }

  ngOnDestroy() {
    this.suscripcion?.unsubscribe();
  }
}
