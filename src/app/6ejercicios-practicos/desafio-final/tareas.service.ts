import { computed, Injectable, signal } from '@angular/core';

export interface Tarea {
  id: number;
  texto: string;
  completada: boolean;
}

export type Filtro = 'todas' | 'completadas' | 'pendientes';

@Injectable({ providedIn: 'root' })
export class TareasService {
  private tareas = signal<Tarea[]>([]);
  private filtro = signal<Filtro>('todas');
  private busqueda = signal<string>('');
  private contadorId = 1;

  tareasFiltradas = computed(() => {
    let resultado = this.tareas();
    const filtro = this.filtro();
    const busqueda = this.busqueda().trim().toLowerCase();
    if (filtro === 'completadas') {
      resultado = resultado.filter(t => t.completada);
    } else if (filtro === 'pendientes') {
      resultado = resultado.filter(t => !t.completada);
    }
    if (busqueda !== '') {
      resultado = resultado.filter(t => t.texto.toLowerCase().includes(busqueda));
    }
    return resultado;
  });

  agregarTarea(texto: string) {
    const nuevaTarea: Tarea = {
      id: this.contadorId++,
      texto,
      completada: false,
    };
    this.tareas.update(tareas => [...tareas, nuevaTarea]);
  }

  toggleCompletada(id: number) {
    this.tareas.update(tareas => tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
  }

  eliminarTarea(id: number) {
    this.tareas.update(tareas => tareas.filter(t => t.id !== id));
  }

  cambiarFiltro(filtro: Filtro) {
    this.filtro.set(filtro);
  }

  actualizarBusqueda(termino: string) {
    this.busqueda.set(termino);
  }
}
