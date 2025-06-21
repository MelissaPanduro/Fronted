import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UtilityDiary } from '../model/UtilityDiary';  // <-- aquí importas

@Injectable({
  providedIn: 'root'
})
export class UtilityDiaryService {

  private baseUrl = 'https://8086-vallegrande-msadditiona-cz5sxqkuy01.ws-us118.gitpod.io/api/utilitydiary';

  constructor(private http: HttpClient) { }

  getAll(): Observable<UtilityDiary[]> {
    return this.http.get<UtilityDiary[]>(this.baseUrl);
  }

  getById(id: number): Observable<UtilityDiary> {
    return this.http.get<UtilityDiary>(`${this.baseUrl}/${id}`);
  }

  create(diary: UtilityDiary): Observable<UtilityDiary> {
    return this.http.post<UtilityDiary>(this.baseUrl, diary);
  }

  update(id: number, diary: UtilityDiary): Observable<UtilityDiary> {
    return this.http.put<UtilityDiary>(`${this.baseUrl}/${id}`, diary);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
