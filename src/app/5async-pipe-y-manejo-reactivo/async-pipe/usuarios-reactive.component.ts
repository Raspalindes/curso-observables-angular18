import { Component, inject, OnInit, signal } from '@angular/core';
import { UsuariosService } from '../../3httpclient-y-servicios/servicio-basico/usuarios.service';
import { Usuario } from '../../shared/usuario.model';

interface Estado {
  usuarios: Usuario[];
  cargando: boolean;
  error: string | null;
}

@Component({
  selector: 'app-usuarios-reactive',
  templateUrl: './usuarios-reactive.component.html',
})
export class UsuariosReactiveComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  estado = signal<Estado>({ usuarios: [], cargando: true, error: null });

  ngOnInit() {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (usuarios) => this.estado.set({ usuarios, cargando: false, error: null }),
      error: () => this.estado.set({ usuarios: [], cargando: false, error: 'Error al cargar usuarios' })
    });
  }
}
