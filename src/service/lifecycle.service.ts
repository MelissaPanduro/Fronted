import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { CicloVida } from '../model/Lifecycle';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../app/auth/service/auth.services';

@Injectable({
  providedIn: 'root',
})
export class CicloVidaService {
  private urlEndPoint: string = 'https://vg-ms-lifecycle.onrender.com/cicloVida';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Método para obtener ciclos por typeIto (Vacunas, Alimentos, etc.)
  getCiclosByTypeIto(typeIto: string): Observable<CicloVida[]> {
    const url = `${this.urlEndPoint}/type/${typeIto}`;
    return this.http
      .get<CicloVida[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  update(cicloVida: CicloVida): Observable<CicloVida> {
    const url = `${this.urlEndPoint}/update/${cicloVida.id}`;
    return this.http
      .put<CicloVida>(url, cicloVida, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getCycles(): Observable<CicloVida[]> {
    return this.http
      .get<CicloVida[]>(this.urlEndPoint, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getInactiveCycles(): Observable<CicloVida[]> {
    const url = `${this.urlEndPoint}/inactivos`;
    return this.http
      .get<CicloVida[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  create(cicloVida: CicloVida): Observable<CicloVida> {
    console.log('Datos enviados al crear ciclo:', cicloVida);
    console.log('Headers enviados:', this.getAuthHeaders());
    
    return this.http
      .post<CicloVida>(`${this.urlEndPoint}`, cicloVida, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getCycle(id: number): Observable<CicloVida> {
    return this.http
      .get<CicloVida>(`${this.urlEndPoint}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  activate(id: number): Observable<CicloVida> {
    const url = `${this.urlEndPoint}/activar/${id}`;
    return this.http
      .put<CicloVida>(url, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  delete(id: number | null): Observable<void> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }

    // Crear el objeto de datos necesario para el PUT, en caso de que sea necesario
    const data = { status: 'I' }; // Esto depende de la estructura que espera el backend

    return this.http
      .put<void>(`${this.urlEndPoint}/inactivar/${id}`, data, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deletePhysically(id: number | null): Observable<CicloVida> {
    if (id === null) {
      return throwError('El ID no puede ser null');
    }
    return this.http
      .delete<CicloVida>(`${this.urlEndPoint}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  private getAuthHeaders(): { [header: string]: string } {
    const token = this.authService.getCurrentToken();
    const headers: { [header: string]: string } = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Algunos servidores son sensibles a esto
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'application/json';

    return headers;
  }

  private handleError(error: any) {
    console.error('Error al hacer la solicitud', error);
    console.error('Error completo:', error.error);
    console.error('Status:', error.status);
    console.error('Headers de respuesta:', error.headers);
    
    if (error.status === 0) {
      return throwError('No se puede conectar al servidor');
    } else if (error.status === 401) {
      return throwError('Token de autenticación inválido o expirado');
    } else if (error.status === 403) {
      return throwError('No tienes permisos para realizar esta acción');
    } else if (error.status === 500) {
      return throwError('Error interno del servidor. Verifica los datos enviados.');
    } else {
      return throwError(
        error.error?.message || 'Ocurrió un error, por favor intente de nuevo'
      );
    }
  }
}