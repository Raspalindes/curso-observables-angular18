import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Post } from '../../shared/post.model';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private apiUrl = 'http://localhost:3000/posts';
  private http = inject(HttpClient);

  obtenerPostsDeUsuario(userId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}?userId=${userId}`);
  }
}
