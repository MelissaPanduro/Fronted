import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EggProduction } from '../model/EggProduction';

@Injectable({
  providedIn: 'root'
})
export class EggProductionService {
  // URL integrada directamente (hardcoded)
  private readonly apiUrl = 'https://8086-vallegrande-mseggproduc-9bmr0rmlf6p.ws-us118.gitpod.io/egg-production';

  constructor(private http: HttpClient) {}

  getAll(): Observable<EggProduction[]> {
    return this.http.get<EggProduction[]>(this.apiUrl);
  }

  getById(id: number): Observable<EggProduction> {
    return this.http.get<EggProduction>(`${this.apiUrl}/${id}`);
  }

  create(data: EggProduction): Observable<EggProduction> {
    return this.http.post<EggProduction>(this.apiUrl, data);
  }

  update(id: number, data: EggProduction): Observable<EggProduction> {
    return this.http.put<EggProduction>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
