# Curso Básico: Observables en Angular 18

## 📚 Módulo 1: Fundamentos de Observables

### ¿Qué es un Observable?

Un **Observable** es un flujo de datos que emite valores a lo largo del tiempo. Es como una tubería por la que pasan datos que puedes observar y procesar.

**Características principales:**

- **Lazy**: No se ejecuta hasta que alguien se suscribe
- **Asíncrono**: Maneja operaciones que toman tiempo (HTTP, eventos, timers)
- **Múltiples valores**: Puede emitir 0, 1 o múltiples valores
- **Cancelable**: Puedes desuscribirte en cualquier momento

### Anatomía básica

```typescript
import { Observable } from "rxjs";

// Crear un Observable simple
const miObservable$ = new Observable((subscriber) => {
  subscriber.next("Primer valor");
  subscriber.next("Segundo valor");
  subscriber.complete();
});

// Suscribirse (forma moderna)
miObservable$.subscribe({
  next: (valor) => console.log("Recibido:", valor),
  error: (error) => console.error("Error:", error),
  complete: () => console.log("Completado"),
});
```

**Convención**: Los Observables se nombran con `$` al final (ej: `datos$`, `usuarios$`)

---

## 📚 Módulo 2: Operadores con `pipe`

Los operadores transforman los datos que fluyen por el Observable. Se encadenan usando `pipe()`.

### `map` - Transformar valores

```typescript
import { of } from "rxjs";
import { map } from "rxjs/operators";

// Transformar cada valor
const numeros$ = of(1, 2, 3, 4, 5);

numeros$.pipe(map((num) => num * 2)).subscribe({
  next: (valor) => console.log(valor), // 2, 4, 6, 8, 10
});
```

### `filter` - Filtrar valores

```typescript
import { filter } from "rxjs/operators";

numeros$.pipe(filter((num) => num > 2)).subscribe({
  next: (valor) => console.log(valor), // 3, 4, 5
});
```

### Combinar operadores

```typescript
numeros$
  .pipe(
    filter((num) => num > 2),
    map((num) => num * 2)
  )
  .subscribe({
    next: (valor) => console.log(valor), // 6, 8, 10
  });
```

---

## 📚 Módulo 3: HttpClient y Servicios

Angular usa Observables para todas las peticiones HTTP.

### Servicio básico

```typescript
// usuarios.service.ts
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { of } from "rxjs";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

@Injectable({
  providedIn: "root",
})
export class UsuariosService {
  private apiUrl = "https://jsonplaceholder.typicode.com/users";

  constructor(private http: HttpClient) {}

  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      map((usuarios) => usuarios.slice(0, 5)), // Solo 5 usuarios
      catchError((error) => {
        console.error("Error al obtener usuarios:", error);
        return of([]); // Retorna array vacío en caso de error
      })
    );
  }

  obtenerUsuario(id: number): Observable<Usuario | null> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error("Error:", error);
        return of(null);
      })
    );
  }
}
```

### `switchMap` - Cambiar entre Observables

Útil cuando un Observable depende de otro (ej: buscar detalles después de obtener un ID).

```typescript
import { switchMap } from "rxjs/operators";

// Obtener primer usuario y luego sus posts
this.usuariosService
  .obtenerUsuarios()
  .pipe(
    map((usuarios) => usuarios[0]?.id),
    switchMap((id) => this.postsService.obtenerPostsDeUsuario(id))
  )
  .subscribe({
    next: (posts) => console.log("Posts:", posts),
  });
```

**Diferencia clave**: `switchMap` cancela la petición anterior si llega una nueva (ideal para búsquedas).

---

## 📚 Módulo 4: Uso en Componentes

### Componente con suscripción manual

```typescript
// usuarios.component.ts
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { UsuariosService, Usuario } from "./usuarios.service";

@Component({
  selector: "app-usuarios",
  templateUrl: "./usuarios.component.html",
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  cargando = true;
  error: string | null = null;

  private suscripcion?: Subscription;

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit() {
    this.suscripcion = this.usuariosService.obtenerUsuarios().subscribe({
      next: (datos) => {
        this.usuarios = datos;
        this.cargando = false;
      },
      error: (err) => {
        this.error = "Error al cargar usuarios";
        this.cargando = false;
      },
    });
  }

  ngOnDestroy() {
    // ¡MUY IMPORTANTE! Evita fugas de memoria
    this.suscripcion?.unsubscribe();
  }
}
```

### Plantilla tradicional

```html
<!-- usuarios.component.html -->
<div class="container">
  @if (cargando) {
  <p>Cargando usuarios...</p>
  } @else if (error) {
  <p class="error">{{ error }}</p>
  } @else {
  <ul>
    @for (usuario of usuarios; track usuario.id) {
    <li>{{ usuario.nombre }} - {{ usuario.email }}</li>
    }
  </ul>
  }
</div>
```

---

## 📚 Módulo 5: `async pipe` y manejo reactivo

El **`async pipe`** se suscribe automáticamente y se desuscribe cuando el componente se destruye. ¡No más fugas de memoria!

### Componente reactivo (mejor práctica)

```typescript
// usuarios-reactive.component.ts
import { Component, OnInit } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map, startWith } from "rxjs/operators";
import { UsuariosService, Usuario } from "./usuarios.service";

interface Estado {
  usuarios: Usuario[];
  cargando: boolean;
  error: string | null;
}

@Component({
  selector: "app-usuarios-reactive",
  templateUrl: "./usuarios-reactive.component.html",
})
export class UsuariosReactiveComponent implements OnInit {
  estado$!: Observable<Estado>;

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit() {
    this.estado$ = this.usuariosService.obtenerUsuarios().pipe(
      map((usuarios) => ({
        usuarios,
        cargando: false,
        error: null,
      })),
      catchError((error) =>
        of({
          usuarios: [],
          cargando: false,
          error: "Error al cargar usuarios",
        })
      ),
      startWith({
        usuarios: [],
        cargando: true,
        error: null,
      })
    );
  }
}
```

### Plantilla con `async pipe`

```html
<!-- usuarios-reactive.component.html -->
@if (estado$ | async; as estado) {
<div class="container">
  @if (estado.cargando) {
  <p>Cargando usuarios...</p>
  } @else if (estado.error) {
  <p class="error">{{ estado.error }}</p>
  } @else {
  <ul>
    @for (usuario of estado.usuarios; track usuario.id) {
    <li>{{ usuario.nombre }} - {{ usuario.email }}</li>
    } @empty {
    <li>No hay usuarios disponibles</li>
    } }
  </ul>
  } }
</div>
```

**Ventajas del `async pipe`:**

- ✅ Desuscripción automática
- ✅ Menos código boilerplate
- ✅ Detección de cambios optimizada
- ✅ Código más reactivo y funcional

---

## 📚 Módulo 6: Directivas Angular 18 y buenas prácticas

### Nuevas directivas de control de flujo

Angular 18 introduce sintaxis simplificada para condiciones y bucles:

#### `@if` / `@else`

```html
@if (usuario$ | async; as usuario) {
<h2>Bienvenido, {{ usuario.nombre }}</h2>
} @else {
<p>No hay usuario</p>
}
```

#### `@for` con `track`

```html
<!-- track es OBLIGATORIO para optimización -->
@for (item of items$ | async; track item.id) {
<div>{{ item.nombre }}</div>
} @empty {
<p>Lista vacía</p>
}
```

#### `@defer` - Carga diferida

```html
<!-- Carga el componente solo cuando sea visible -->
@defer (on viewport) {
<app-comentarios [postId]="postId"></app-comentarios>
} @placeholder {
<p>Cargando comentarios...</p>
} @loading (minimum 500ms) {
<div class="spinner"></div>
} @error {
<p>Error al cargar comentarios</p>
}
```

### Ejemplo completo: Buscador reactivo

```typescript
// buscador.component.ts
import { Component } from "@angular/core";
import { FormControl } from "@angular/forms";
import { Observable } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap, map } from "rxjs/operators";
import { UsuariosService, Usuario } from "./usuarios.service";

@Component({
  selector: "app-buscador",
  templateUrl: "./buscador.component.html",
})
export class BuscadorComponent {
  busqueda = new FormControl("");
  resultados$: Observable<Usuario[]>;

  constructor(private usuariosService: UsuariosService) {
    this.resultados$ = this.busqueda.valueChanges.pipe(
      debounceTime(300), // Espera 300ms después de que el usuario deje de escribir
      distinctUntilChanged(), // Solo si el valor cambió
      switchMap((termino) => (termino ? this.usuariosService.obtenerUsuarios().pipe(map((usuarios) => usuarios.filter((u) => u.nombre.toLowerCase().includes(termino.toLowerCase())))) : []))
    );
  }
}
```

```html
<!-- buscador.component.html -->
<div class="buscador">
  <input type="text" [formControl]="busqueda" placeholder="Buscar usuarios..." />

  @if (resultados$ | async; as resultados) { @if (resultados.length > 0) {
  <ul>
    @for (usuario of resultados; track usuario.id) {
    <li>{{ usuario.nombre }}</li>
    }
  </ul>
  } @else if (busqueda.value) {
  <p>No se encontraron resultados</p>
  } }
</div>
```

### ✅ Checklist de buenas prácticas

1. **Usa `async pipe`** siempre que sea posible (evita fugas de memoria)
2. **Desuscríbete manualmente** solo si no usas `async pipe`
3. **Nombra Observables con `$`** al final
4. **Usa `catchError`** para manejar errores gracefully
5. **Prefiere `switchMap`** para búsquedas y peticiones dependientes
6. **Usa `track` en `@for`** para optimizar renderizado
7. **Combina operadores** en un solo `pipe()` para claridad
8. **Inicializa con `startWith`** para estados de carga
9. **Usa `@defer`** para componentes pesados que no se necesitan inmediatamente

---

## 🎯 Resumen final

**Observables** son la base de la programación reactiva en Angular. Te permiten:

- Manejar datos asíncronos elegantemente
- Transformar flujos de datos con operadores
- Evitar callback hell
- Cancelar operaciones fácilmente

**Patrón recomendado:**

1. Crea servicios que retornen `Observable<T>`
2. Usa `pipe` con operadores para transformar datos
3. Maneja errores con `catchError`
4. En componentes, usa `async pipe` para suscribirte
5. Aprovecha las nuevas directivas `@if`, `@for`, `@defer` de Angular 18

¡Con esto tienes todo lo esencial para trabajar con Observables en Angular 18! 🚀

---

## 💪 Ejercicios Prácticos

### Ejercicio 1: Transformar datos básicos

**Nivel: Principiante**

Tienes un Observable que emite números del 1 al 10. Usa `pipe` y `map` para:

1. Multiplicar cada número por 3
2. Sumarle 5 al resultado
3. Mostrar solo los resultados mayores a 20

<details>
<summary>👁️ Ver solución</summary>
```typescript
import { of } from 'rxjs';
import { map, filter } from 'rxjs/operators';

const numeros$ = of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

numeros$.pipe(
map(num => num \* 3),
map(num => num + 5),
filter(num => num > 20)
).subscribe({
next: (valor) => console.log(valor) // 23, 26, 29, 32, 35
});

````
</details>

---

### Ejercicio 2: Servicio de productos
**Nivel: Principiante**

Crea un servicio `ProductosService` que:
- Tenga un método `obtenerProductos()` que retorne un `Observable<Producto[]>`
- Use HttpClient para consumir: `https://fakestoreapi.com/products`
- Limite los resultados a 5 productos usando `map`
- Maneje errores con `catchError` retornando un array vacío

Interfaz sugerida:
```typescript
interface Producto {
  id: number;
  title: string;
  price: number;
  image: string;
}
````

<details>
<summary>👁️ Ver solución</summary>
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Producto {
id: number;
title: string;
price: number;
image: string;
}

@Injectable({
providedIn: 'root'
})
export class ProductosService {
private apiUrl = 'https://fakestoreapi.com/products';

constructor(private http: HttpClient) {}

obtenerProductos(): Observable<Producto[]> {
return this.http.get<Producto[]>(this.apiUrl).pipe(
map(productos => productos.slice(0, 5)),
catchError(error => {
console.error('Error al obtener productos:', error);
return of([]);
})
);
}
}

````
</details>

---

### Ejercicio 3: Componente con async pipe
**Nivel: Intermedio**

Crea un componente `ProductosComponent` que:
- Use el servicio del ejercicio anterior
- Muestre los productos usando `async pipe`
- Use las directivas `@if` y `@for` de Angular 18
- Muestre estados de: cargando, error y sin resultados
- NO uses suscripciones manuales (solo `async pipe`)

<details>
<summary>👁️ Ver solución</summary>
```typescript
// productos.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { ProductosService, Producto } from './productos.service';

interface Estado {
  productos: Producto[];
  cargando: boolean;
  error: string | null;
}

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html'
})
export class ProductosComponent implements OnInit {
  estado$!: Observable<Estado>;

  constructor(private productosService: ProductosService) {}

  ngOnInit() {
    this.estado$ = this.productosService.obtenerProductos().pipe(
      map(productos => ({
        productos,
        cargando: false,
        error: null
      })),
      catchError(() => of({
        productos: [],
        cargando: false,
        error: 'Error al cargar productos'
      })),
      startWith({
        productos: [],
        cargando: true,
        error: null
      })
    );
  }
}
````

```html
<!-- productos.component.html -->
@if (estado$ | async; as estado) {
<div class="productos-container">
  @if (estado.cargando) {
  <p>Cargando productos...</p>
  } @else if (estado.error) {
  <p class="error">{{ estado.error }}</p>
  } @else {
  <div class="productos-grid">
    @for (producto of estado.productos; track producto.id) {
    <div class="producto-card">
      <img [src]="producto.image" [alt]="producto.title" />
      <h3>{{ producto.title }}</h3>
      <p class="precio">${{ producto.price }}</p>
    </div>
    } @empty {
    <p>No hay productos disponibles</p>
    }
  </div>
  }
</div>
}
```

</details>

---

### Ejercicio 4: Buscador con debounce

**Nivel: Intermedio**

Crea un buscador de usuarios que:

- Use un `FormControl` para el input de búsqueda
- Espere 400ms después de que el usuario deje de escribir (`debounceTime`)
- No haga peticiones si el valor no cambió (`distinctUntilChanged`)
- Filtre usuarios cuyo nombre contenga el término de búsqueda (case-insensitive)
- Use `switchMap` para cancelar búsquedas anteriores
- Muestre "Escribe para buscar..." cuando el input esté vacío

API: `https://jsonplaceholder.typicode.com/users`

<details>
<summary>👁️ Ver solución</summary>
```typescript
// buscador-usuarios.component.ts
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';

interface Usuario {
id: number;
name: string;
email: string;
}

@Component({
selector: 'app-buscador-usuarios',
templateUrl: './buscador-usuarios.component.html'
})
export class BuscadorUsuariosComponent {
busqueda = new FormControl('');
resultados$: Observable<Usuario[]>;

constructor(private http: HttpClient) {
this.resultados$ = this.busqueda.valueChanges.pipe(
debounceTime(400),
distinctUntilChanged(),
switchMap(termino => {
if (!termino || termino.trim() === '') {
return of([]);
}
return this.http.get<Usuario[]>('https://jsonplaceholder.typicode.com/users').pipe(
map(usuarios => usuarios.filter(u =>
u.name.toLowerCase().includes(termino.toLowerCase())
))
);
})
);
}
}

````
```html
<!-- buscador-usuarios.component.html -->
<div class="buscador">
  <input
    type="text"
    [formControl]="busqueda"
    placeholder="Buscar usuarios por nombre..."
  >

  @if (resultados$ | async; as resultados) {
    @if (busqueda.value && busqueda.value.trim() !== '') {
      @if (resultados.length > 0) {
        <ul class="resultados">
          @for (usuario of resultados; track usuario.id) {
            <li>
              <strong>{{ usuario.name }}</strong>
              <span>{{ usuario.email }}</span>
            </li>
          }
        </ul>
      } @else {
        <p class="sin-resultados">No se encontraron usuarios</p>
      }
    } @else {
      <p class="placeholder">Escribe para buscar...</p>
    }
  }
</div>
````

</details>

---

### Ejercicio 5: Evitar fugas de memoria

**Nivel: Intermedio**

Identifica y corrige los problemas de memoria en este código:

```typescript
import { Component, OnInit } from "@angular/core";
import { interval } from "rxjs";

@Component({
  selector: "app-contador",
  template: `<h2>Contador: {{ contador }}</h2>`,
})
export class ContadorComponent implements OnInit {
  contador = 0;

  ngOnInit() {
    interval(1000).subscribe({
      next: () => this.contador++,
    });
  }
}
```

**Preguntas:**

1. ¿Qué problema tiene este código?
2. ¿Qué pasará si navegas a otra ruta y vuelves varias veces?
3. Proporciona 2 soluciones diferentes

<details>
<summary>👁️ Ver solución</summary>

**Problema:** El Observable `interval` nunca se desuscribe, por lo que sigue emitiendo valores incluso después de que el componente se destruya. Cada vez que vuelvas al componente, se creará una nueva suscripción sin limpiar la anterior (fuga de memoria).

**Solución 1: Desuscripción manual**

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { interval, Subscription } from "rxjs";

@Component({
  selector: "app-contador",
  template: `<h2>Contador: {{ contador }}</h2>`,
})
export class ContadorComponent implements OnInit, OnDestroy {
  contador = 0;
  private suscripcion?: Subscription;

  ngOnInit() {
    this.suscripcion = interval(1000).subscribe({
      next: () => this.contador++,
    });
  }

  ngOnDestroy() {
    this.suscripcion?.unsubscribe();
  }
}
```

**Solución 2: Usando async pipe (mejor práctica)**

```typescript
import { Component } from "@angular/core";
import { interval, Observable } from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector: "app-contador",
  template: `<h2>Contador: {{ contador$ | async }}</h2>`,
})
export class ContadorComponent {
  contador$: Observable<number> = interval(1000).pipe(map((_, index) => index + 1));
}
```

</details>

---

### Ejercicio 6: Combinar Observables

**Nivel: Avanzado**

Tienes dos endpoints:

- `https://jsonplaceholder.typicode.com/users/1` (usuario)
- `https://jsonplaceholder.typicode.com/posts?userId=1` (posts del usuario)

Crea un componente que:

1. Obtenga el usuario con ID 1
2. Con ese usuario, obtenga todos sus posts usando `switchMap`
3. Transforme los datos para mostrar: nombre del usuario + cantidad de posts
4. Use `async pipe` y manejo de errores
5. Muestre: "Usuario X tiene Y posts"

<details>
<summary>👁️ Ver solución</summary>
```typescript
// usuario-posts.component.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, map, catchError, startWith } from 'rxjs/operators';

interface Usuario {
id: number;
name: string;
}

interface Post {
id: number;
userId: number;
title: string;
}

interface Resultado {
nombreUsuario: string;
cantidadPosts: number;
cargando: boolean;
error: string | null;
}

@Component({
selector: 'app-usuario-posts',
templateUrl: './usuario-posts.component.html'
})
export class UsuarioPostsComponent implements OnInit {
resultado$!: Observable<Resultado>;

constructor(private http: HttpClient) {}

ngOnInit() {
this.resultado$ = this.http.get<Usuario>('https://jsonplaceholder.typicode.com/users/1').pipe(
switchMap(usuario =>
this.http.get<Post[]>(`https://jsonplaceholder.typicode.com/posts?userId=${usuario.id}`).pipe(
map(posts => ({
nombreUsuario: usuario.name,
cantidadPosts: posts.length,
cargando: false,
error: null
}))
)
),
catchError(() => of({
nombreUsuario: '',
cantidadPosts: 0,
cargando: false,
error: 'Error al cargar datos'
})),
startWith({
nombreUsuario: '',
cantidadPosts: 0,
cargando: true,
error: null
})
);
}
}

````
```html
<!-- usuario-posts.component.html -->
@if (resultado$ | async; as resultado) {
  <div class="resultado">
    @if (resultado.cargando) {
      <p>Cargando información...</p>
    } @else if (resultado.error) {
      <p class="error">{{ resultado.error }}</p>
    } @else {
      <h2>Usuario {{ resultado.nombreUsuario }} tiene {{ resultado.cantidadPosts }} posts</h2>
    }
  </div>
}
````

</details>

---

### Ejercicio 7: Implementar retry

**Nivel: Avanzado**

Modifica el servicio de productos para que:

- Si falla la petición, reintente automáticamente 3 veces
- Espere 1 segundo entre cada reintento
- Use los operadores `retry` y `retryWhen`
- Muestre en consola cada intento de reintento

<details>
<summary>👁️ Ver solución</summary>
```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, retry, retryWhen, delay, tap, take } from 'rxjs/operators';

export interface Producto {
id: number;
title: string;
price: number;
}

@Injectable({
providedIn: 'root'
})
export class ProductosService {
private apiUrl = 'https://fakestoreapi.com/products';

constructor(private http: HttpClient) {}

obtenerProductos(): Observable<Producto[]> {
return this.http.get<Producto[]>(this.apiUrl).pipe(
map(productos => productos.slice(0, 5)),
retryWhen(errors =>
errors.pipe(
tap((error, index) => console.log(`Reintento ${index + 1} de 3...`)),
delay(1000),
take(3),
// Si agota los 3 intentos, propaga el error
tap({
complete: () => console.log('Se agotaron los reintentos')
})
)
),
catchError(error => {
console.error('Error definitivo:', error);
return of([]);
})
);
}

// Alternativa más simple con retry básico
obtenerProductosSimple(): Observable<Producto[]> {
return this.http.get<Producto[]>(this.apiUrl).pipe(
retry(3), // Reintenta hasta 3 veces
map(productos => productos.slice(0, 5)),
catchError(error => {
console.error('Error después de 3 intentos:', error);
return of([]);
})
);
}
}

````
</details>

---

## 🎓 Desafío Final

Crea una aplicación completa de "Lista de Tareas" con estas características:

**Requisitos funcionales:**
- Agregar nuevas tareas
- Marcar tareas como completadas
- Filtrar tareas (todas/completadas/pendientes)
- Eliminar tareas
- Buscador con debounce
- Todo debe ser reactivo (usar Observables)

**Requisitos técnicos:**
- Usar `BehaviorSubject` para el estado de las tareas
- Usar `async pipe` en toda la plantilla
- Usar operadores: `map`, `filter`, `debounceTime`, `distinctUntilChanged`
- Usar directivas `@if`, `@for` de Angular 18
- Sin fugas de memoria
- Código limpio y bien estructurado

<details>
<summary>👁️ Ver solución completa</summary>
```typescript
// tareas.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Tarea {
  id: number;
  texto: string;
  completada: boolean;
}

export type Filtro = 'todas' | 'completadas' | 'pendientes';

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private tareasSubject = new BehaviorSubject<Tarea[]>([]);
  private filtroSubject = new BehaviorSubject<Filtro>('todas');
  private busquedaSubject = new BehaviorSubject<string>('');

  private contadorId = 1;

  tareas$ = this.tareasSubject.asObservable();
  filtro$ = this.filtroSubject.asObservable();
  busqueda$ = this.busquedaSubject.asObservable();

  tareasFiltradas$: Observable<Tarea[]> = combineLatest([
    this.tareas$,
    this.filtro$,
    this.busqueda$
  ]).pipe(
    map(([tareas, filtro, busqueda]) => {
      // Aplicar filtro
      let resultado = tareas;

      if (filtro === 'completadas') {
        resultado = resultado.filter(t => t.completada);
      } else if (filtro === 'pendientes') {
        resultado = resultado.filter(t => !t.completada);
      }

      // Aplicar búsqueda
      if (busqueda.trim() !== '') {
        resultado = resultado.filter(t =>
          t.texto.toLowerCase().includes(busqueda.toLowerCase())
        );
      }

      return resultado;
    })
  );

  agregarTarea(texto: string) {
    const tareas = this.tareasSubject.value;
    const nuevaTarea: Tarea = {
      id: this.contadorId++,
      texto,
      completada: false
    };
    this.tareasSubject.next([...tareas, nuevaTarea]);
  }

  toggleCompletada(id: number) {
    const tareas = this.tareasSubject.value.map(t =>
      t.id === id ? { ...t, completada: !t.completada } : t
    );
    this.tareasSubject.next(tareas);
  }

  eliminarTarea(id: number) {
    const tareas = this.tareasSubject.value.filter(t => t.id !== id);
    this.tareasSubject.next(tareas);
  }

  cambiarFiltro(filtro: Filtro) {
    this.filtroSubject.next(filtro);
  }

  actualizarBusqueda(termino: string) {
    this.busquedaSubject.next(termino);
  }
}
````

```typescript
// tareas.component.ts
import { Component } from "@angular/core";
import { FormControl } from "@angular/forms";
import { TareasService, Filtro } from "./tareas.service";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

@Component({
  selector: "app-tareas",
  templateUrl: "./tareas.component.html",
  styleUrls: ["./tareas.component.css"],
})
export class TareasComponent {
  nuevaTareaControl = new FormControl("");
  busquedaControl = new FormControl("");

  tareas$ = this.tareasService.tareasFiltradas$;
  filtroActual$ = this.tareasService.filtro$;

  constructor(public tareasService: TareasService) {
    // Configurar búsqueda con debounce
    this.busquedaControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((termino) => {
      this.tareasService.actualizarBusqueda(termino || "");
    });
  }

  agregarTarea() {
    const texto = this.nuevaTareaControl.value?.trim();
    if (texto) {
      this.tareasService.agregarTarea(texto);
      this.nuevaTareaControl.reset();
    }
  }

  cambiarFiltro(filtro: Filtro) {
    this.tareasService.cambiarFiltro(filtro);
  }
}
```

```html
<!-- tareas.component.html -->
<div class="tareas-app">
  <h1>Lista de Tareas Reactiva</h1>

  <!-- Agregar nueva tarea -->
  <div class="agregar-tarea">
    <input type="text" [formControl]="nuevaTareaControl" placeholder="Escribe una nueva tarea..." (keyup.enter)="agregarTarea()" />
    <button (click)="agregarTarea()">Agregar</button>
  </div>

  <!-- Buscador -->
  <div class="buscador">
    <input type="text" [formControl]="busquedaControl" placeholder="Buscar tareas..." />
  </div>

  <!-- Filtros -->
  @if (filtroActual$ | async; as filtroActual) {
  <div class="filtros">
    <button (click)="cambiarFiltro('todas')" [class.activo]="filtroActual === 'todas'">Todas</button>
    <button (click)="cambiarFiltro('pendientes')" [class.activo]="filtroActual === 'pendientes'">Pendientes</button>
    <button (click)="cambiarFiltro('completadas')" [class.activo]="filtroActual === 'completadas'">Completadas</button>
  </div>
  }

  <!-- Lista de tareas -->
  @if (tareas$ | async; as tareas) {
  <ul class="lista-tareas">
    @for (tarea of tareas; track tarea.id) {
    <li [class.completada]="tarea.completada">
      <input type="checkbox" [checked]="tarea.completada" (change)="tareasService.toggleCompletada(tarea.id)" />
      <span>{{ tarea.texto }}</span>
      <button class="eliminar" (click)="tareasService.eliminarTarea(tarea.id)">✕</button>
    </li>
    } @empty {
    <li class="vacio">No hay tareas para mostrar</li>
    }
  </ul>
  }
</div>
```

```css
/* tareas.component.css */
.tareas-app {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
}

.agregar-tarea {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.agregar-tarea input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.agregar-tarea button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.buscador {
  margin-bottom: 1rem;
}

.buscador input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filtros {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.filtros button {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.filtros button.activo {
  background: #007bff;
  color: white;
}

.lista-tareas {
  list-style: none;
  padding: 0;
}

.lista-tareas li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.lista-tareas li.completada span {
  text-decoration: line-through;
  color: #999;
}

.lista-tareas li span {
  flex: 1;
}

.lista-tareas li button.eliminar {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.lista-tareas li.vacio {
  text-align: center;
  color: #999;
}
```

</details>

---

¡Practica estos ejercicios y dominarás los Observables en Angular 18! 💪🚀
