import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductosService } from '../../ejercicio-2-servicio-productos/productos.service';
import { Producto } from '../../shared/producto.model';

interface Estado {
  productos: Producto[];
  cargando: boolean;
  error: string | null;
}

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
})
export class ProductosComponent implements OnInit {
  private productosService = inject(ProductosService);
  estado = signal<Estado>({ productos: [], cargando: true, error: null });

  ngOnInit() {
    this.productosService.obtenerProductos().subscribe({
      next: (productos) => this.estado.set({ productos, cargando: false, error: null }),
      error: () => this.estado.set({ productos: [], cargando: false, error: 'Error al cargar productos' })
    });
  }
}
