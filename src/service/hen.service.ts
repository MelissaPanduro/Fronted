import { AuthService } from '../app/auth/service/auth.services';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Hen } from '../model/Hen';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class HenService {
  private urlEndPoint = 'https://vg-ms-hen.onrender.com/hen';

  constructor(private http: HttpClient, private authService: AuthService) {}

  update(hen: Hen): Observable<Hen> {
    const url = `${this.urlEndPoint}/update/${hen.id}`;
    return this.http
      .put<Hen>(url, hen, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  getHenById(id: number): Observable<any> {
    return this.http.get<any>(`${this.urlEndPoint}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
  getHens(): Observable<Hen[]> {
    return this.http
      .get<Hen[]>(this.urlEndPoint, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getInactiveHens(): Observable<Hen[]> {
    const url = `${this.urlEndPoint}/inactivos`;
    return this.http
      .get<Hen[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  create(hen: Hen): Observable<Hen> {
    return this.http
      .post<Hen>(`${this.urlEndPoint}`, hen, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  // Método para buscar gallinas por fecha
  getHensByDate(arrivalDate: string): Observable<Hen[]> {
    return this.http.get<Hen[]>(`${this.urlEndPoint}/buscar/${arrivalDate}`, {
      headers: this.getAuthHeaders(),
    });
  }
  getHen(id: number): Observable<Hen> {
    return this.http
      .get<Hen>(`${this.urlEndPoint}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  activate(id: number): Observable<Hen> {
    const url = `${this.urlEndPoint}/activar/${id}`;
    return this.http
      .put<Hen>(url, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  delete(id: number | null): Observable<void> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }

    // Crear el objeto de datos necesario para el PUT, en caso de que sea necesario
    const data = { status: 'I' }; // Esto depende de la estructura que espera tu backend

    return this.http
      .put<void>(`${this.urlEndPoint}/inactivar/${id}`, data, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  deletePhysically(id: number | null): Observable<Hen> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }
    return this.http
      .delete<Hen>(`${this.urlEndPoint}/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  private getAuthHeaders(): { [header: string]: string } {
    const token = this.authService.getCurrentToken();
    const headers: { [header: string]: string } = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private handleError(error: any) {
    console.error('Error al hacer la solicitud', error);

    if (error.status === 0) {
      return throwError('No se puede conectar al servidor');
    } else if (error.status === 401) {
      return throwError('Token de autenticación inválido o expirado');
    } else if (error.status === 403) {
      return throwError('No tienes permisos para realizar esta acción');
    } else {
      return throwError(
        error.error?.message || 'Ocurrió un error, por favor intente de nuevo'
      );
    }
  }
}
