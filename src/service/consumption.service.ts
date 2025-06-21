import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Consumption } from '../model/consumption';
import { AuthService } from '../app/auth/service/auth.services';

@Injectable({
  providedIn: 'root',
})
export class ConsumptionService {
  private baseUrl = 'https://vg-internal-consumption-eggs.onrender.com/consumption';

  constructor(private http: HttpClient, private authService: AuthService) {}

  listActiveConsumptions(): Observable<Consumption[]> {
    const url = `${this.baseUrl}/lista-activos`;
    return this.http
      .get<Consumption[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  listInactiveConsumptions(): Observable<Consumption[]> {
    const url = `${this.baseUrl}/lista-inactivos`;
    return this.http
      .get<Consumption[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  registerConsumption(consumptionData: any): Observable<any> {
    return this.http
      .post(this.baseUrl, consumptionData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  inactivateConsumption(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}/inactivar`;
    return this.http
      .put(url, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  restoreConsumption(id: number): Observable<any> {
    const url = `${this.baseUrl}/${id}/restore`;
    return this.http
      .put(url, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateConsumption(id: number, consumption: any): Observable<any> {
    delete consumption.names; // Seguridad
    return this.http
      .put(`${this.baseUrl}/${id}`, consumption, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getHomes(): Observable<any[]> {
    const url = 'https://vg-internal-consumption-eggs.onrender.com/homes';
    return this.http
      .get<any[]>(url, { headers: this.getAuthHeaders() })
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
    console.error('Error en la solicitud:', error);

    if (error.status === 0) {
      return throwError(() => new Error('No se puede conectar al servidor'));
    } else if (error.status === 401) {
      return throwError(() => new Error('Token de autenticación inválido o expirado'));
    } else if (error.status === 403) {
      return throwError(() => new Error('No tienes permisos para esta acción'));
    } else {
      return throwError(() =>
        new Error(error.error?.message || 'Error inesperado. Intenta de nuevo.')
      );
    }
  }
}
