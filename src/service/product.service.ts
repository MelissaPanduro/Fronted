import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../model/Product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private baseUrl = 'https://ms-product-ix0t.onrender.com/NPH/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product);
  }

  update(id: number, product: Product): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  softDelete(id: number): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/logic/${id}`, {});
  }

  restore(id: number): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/restore/${id}`, {});
  }

  // Método específico para actualizar stock
  updateStock(id: number, newStock: number, newStatus: string): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/${id}/stock`, {
      stock: newStock,
      status: newStatus
    });
  }

  reduceStock(productId: number, quantity: number): Observable<Product> {
  return this.http.put<Product>(
    `${this.baseUrl}/reduce-stock/${productId}?quantity=${quantity}`,
    {}
  );
}

  increaseStock(productId: number, quantity: number): Observable<Product> {
    return this.http.put<Product>(
      `${this.baseUrl}/increase-stock/${productId}?quantity=${quantity}`,
      {}
    );
  }

  adjustStock(productId: number, quantityChange: number): Observable<Product> {
    return this.http.put<Product>(
      `${this.baseUrl}/adjust-stock/${productId}?quantityChange=${quantityChange}`,
      {}
    );
  }

}
