import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-contador',
  templateUrl: './contador.component.html',
})
export class ContadorComponent implements OnInit, OnDestroy {
  contador = signal(0);
  private suscripcion?: Subscription;

  ngOnInit() {
    this.suscripcion = interval(1000).subscribe({
      next: () => this.contador.set(this.contador() + 1),
    });
  }

  ngOnDestroy() {
    this.suscripcion?.unsubscribe();
  }
}
