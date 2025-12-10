import { Component } from '@angular/core';
import { Filtro, TareasService } from './tareas.service';

@Component({
  selector: 'app-tareas',
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.css'],
})
export class TareasComponent {
  nuevaTarea = '';
  busqueda = '';

  constructor(public tareasService: TareasService) {}

  agregarTarea() {
    const texto = this.nuevaTarea.trim();
    if (texto) {
      this.tareasService.agregarTarea(texto);
      this.nuevaTarea = '';
    }
  }

  cambiarFiltro(filtro: Filtro) {
    this.tareasService.cambiarFiltro(filtro);
  }

  actualizarBusqueda(termino: string) {
    this.tareasService.actualizarBusqueda(termino);
    this.busqueda = termino;
  }
}
