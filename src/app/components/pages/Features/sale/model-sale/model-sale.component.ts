import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Sale } from '../../../../../../model/Sale';
import { SaleService } from '../../../../../../service/sale.service';
import { ProductService } from '../../../../../../service/product.service';
import { Product } from '../../../../../../model/Product';
import { forkJoin, Observable, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-model-sale',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './model-sale.component.html',
  styleUrls: ['./model-sale.component.css']
})
export class ModelSaleComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Input() saleData: Sale | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saleCreated = new EventEmitter<Sale>();
  @Output() saleUpdated = new EventEmitter<Sale>();

  saleForm: FormGroup;
  products: Product[] = [];
  availableProductsForType: Product[] = [];
  selectedProducts: Product[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  originalSaleData: Sale | null = null;
  isSearchingDocument: boolean = false;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService
  ) {
    this.saleForm = this.createForm();
    this.loadProducts();
    this.setupDocumentSearchListener();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.errorMessage = '';
      this.selectedProducts = [];
      this.availableProductsForType = [];

      if (this.mode === 'view') {
        this.saleForm.disable();
      } else {
        this.saleForm.enable();
        this.saleForm.get('totalPrice')?.disable();
      }

      this.loadProducts(this.mode !== 'view');

      if ((this.mode === 'edit' || this.mode === 'view') && this.saleData) {
        this.originalSaleData = { ...this.saleData };
        this.saleForm.patchValue({
          id: this.saleData.id,
          saleDate: this.formatDateForInput(this.saleData.saleDate),
          name: this.saleData.name,
          ruc: this.saleData.ruc,
          address: this.saleData.address,
          pricePerKg: this.saleData.pricePerKg,
          totalPrice: this.saleData.totalPrice
        });
        
        this.loadSelectedProductsForEdit();
      } else if (this.mode === 'create') {
        this.saleForm = this.createForm();
        this.saleForm.get('id')?.setValue(null);
        this.originalSaleData = null;
        this.setupDocumentSearchListener();
      }

      if (this.mode !== 'create') {
        this.calculateTotals();
      }
    }
  }

  // Validadores personalizados
  private nameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s]+$/;
    if (!nameRegex.test(control.value)) {
      return { invalidName: true };
    }
    return null;
  }

  private documentValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const value = control.value.toString();
    const isDni = /^\d{8}$/.test(value);
    const isRuc = /^\d{11}$/.test(value);
    
    if (!isDni && !isRuc) {
      return { invalidDocument: true };
    }
    return null;
  }

  createForm(): FormGroup {
    return this.fb.group({
      id: [null],
      saleDate: [this.getCurrentDate(), Validators.required],
      name: ['', [Validators.required, this.nameValidator]],
      ruc: ['', [Validators.required, this.documentValidator]],
      address: ['', Validators.required],
      typeProduct: ['', Validators.required],
      pricePerKg: [{ value: 0, disabled: false }, [Validators.required, Validators.min(0.01)]],
      totalPrice: [{ value: 0, disabled: true }]
    });
  }

  private setupDocumentSearchListener(): void {
    const rucControl = this.saleForm.get('ruc');
    if (rucControl) {
      rucControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged()
      ).subscribe(value => {
        if (value && this.isValidDocument(value)) {
          this.searchByDocument(value);
        }
      });
    }
  }

  private isValidDocument(document: string): boolean {
    const isDni = /^\d{8}$/.test(document);
    const isRuc = /^\d{11}$/.test(document);
    return isDni || isRuc;
  }

  private searchByDocument(document: string): void {
    this.isSearchingDocument = true;
    
    this.saleService.getSaleByDocument(document).subscribe({
      next: (existingSale: Sale) => {
        if (existingSale) {
          this.saleForm.patchValue({
            name: existingSale.name,
            address: existingSale.address
          });
        }
        this.isSearchingDocument = false;
      },
      error: (error: any) => {
        console.log('No se encontró venta con ese documento, se puede crear nueva');
        this.isSearchingDocument = false;
      }
    });
  }

  // Métodos para manejo de productos
  loadProducts(filterPTOnly: boolean = false): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        if (filterPTOnly) {
          this.products = products.filter(
            product =>
              product.typeProduct === 'PT' &&
              product.status === 'A' &&
              product.stock > 0
          );
        } else {
          this.products = products;
        }
      },
      error: (error: any) => {
        console.error('Error al cargar productos:', error);
        this.errorMessage = 'No se pudieron cargar los productos. Por favor, intente nuevamente.';
      }
    });
  }

  get allProductsInStock(): Product[] {
  return this.products.filter(
    p => p.typeProduct === 'PT' && p.status === 'A' && p.stock > 0
  );
}

  getUniqueProductTypes(): string[] {
    const types = [...new Set(this.products.map(p => p.type))];
    return types.sort();
  }

  onProductTypeChange(event: any): void {
    const selectedType = event.target.value;
    this.selectedProducts = [];
    
    if (selectedType) {
      this.availableProductsForType = this.products
        .filter(p => p.type === selectedType && p.stock > 0)
        .sort((a, b) => a.packageWeight - b.packageWeight);
    } else {
      this.availableProductsForType = [];
    }
    
    this.calculateTotals();
  }

  onProductSelection(product: Product, event: any): void {
    if (event.target.checked) {
      if (!this.isProductSelected(product.id)) {
        this.selectedProducts.push(product);
        this.saleForm.patchValue({ typeProduct: product.typeProduct });
      }
    } else {
      this.selectedProducts = this.selectedProducts.filter(p => p.id !== product.id);
    }
    
    // Ordenar productos seleccionados por peso
    this.selectedProducts.sort((a, b) => a.packageWeight - b.packageWeight);
    this.calculateTotals();
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProducts.some(p => p.id === productId);
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  getSelectedWeightsList(): string {
    return this.selectedProducts
      .map(p => p.packageWeight.toString())
      .join(', ');
  }

  getTotalSelectedWeight(): number {
    const total = this.selectedProducts.reduce((sum, product) => sum + product.packageWeight, 0);
    return Math.round(total * 100) / 100;
  }

  getTotalStock(): number {
    return this.products?.reduce((total, product) => total + (product.stock || 0), 0) || 0;
  }

  // Método para cargar productos seleccionados en modo edición
  private loadSelectedProductsForEdit(): void {
    if (this.saleData && this.mode !== 'create') {
      if (this.saleData.productId) {
        const selectedProduct = this.products.find(p => p.id === this.saleData!.productId);
        if (selectedProduct) {
          this.selectedProducts = [selectedProduct];
          
          this.saleForm.patchValue({
            typeProduct: selectedProduct.type
          });
          
          this.availableProductsForType = this.products
            .filter(p => p.type === selectedProduct.type && p.stock > 0)
            .sort((a, b) => a.packageWeight - b.packageWeight);
        }
      }
    }
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return this.getCurrentDate();
    return dateString.split('T')[0];
  }

  calculateTotals(): void {
    const pricePerKg = parseFloat(this.saleForm.get('pricePerKg')?.value) || 0;
    const totalWeight = this.getTotalSelectedWeight();
    const totalPrice = totalWeight * pricePerKg;

    this.saleForm.patchValue({
      totalPrice: totalPrice.toFixed(2)
    });
  }

  // Métodos para obtener mensajes de error específicos
  getFieldError(fieldName: string): string {
    const field = this.saleForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors?.['invalidName']) {
        return 'El nombre solo puede contener letras, espacios y ñ';
      }
      if (field.errors?.['invalidDocument']) {
        return 'Ingrese un DNI (8 dígitos) o RUC (11 dígitos) válido';
      }
      if (field.errors?.['min']) {
        return `${this.getFieldDisplayName(fieldName)} debe ser mayor a 0`;
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      'name': 'Nombre',
      'ruc': 'Documento',
      'address': 'Dirección',
      'typeProduct': 'Tipo de Producto',
      'pricePerKg': 'Precio por Kg',
      'saleDate': 'Fecha de venta'
    };
    return displayNames[fieldName] || fieldName;
  }

  onSubmit(): void {
    if (this.saleForm.invalid) {
      Object.keys(this.saleForm.controls).forEach(key => {
        this.saleForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.selectedProducts.length === 0) {
      this.errorMessage = 'Debe seleccionar al menos un producto.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formData = this.prepareFormData();

    if (this.mode === 'create') {
      this.createSaleWithStockUpdate(formData);
    } else if (this.mode === 'edit') {
      this.updateSaleWithStockUpdate(formData);
    }
  }

// Reemplaza el método createSaleWithStockUpdate con esta versión corregida:

private createSaleWithStockUpdate(sale: Sale): void {
  this.saleService.createSale(sale).subscribe({
    next: (createdSale: Sale) => {
      const stockUpdates: Observable<any>[] = this.selectedProducts.map(product => {
        const newStock = product.stock - product.packageWeight;

        // Ejemplo: si el nuevo stock es 0, lo marcamos como "Agotado", si no, "Disponible"
        const newStatus = newStock <= 0 ? 'I' : 'A';

        return this.productService.updateStock(product.id, newStock, newStatus);
      });

      forkJoin(stockUpdates).subscribe({
        next: () => {
          this.saleCreated.emit(createdSale);
          this.isLoading = false;
          this.closeModal.emit();
        },
        error: (err) => {
          this.errorMessage = 'Error al actualizar el stock de los productos.';
          console.error(err);
          this.isLoading = false;
        }
      });
    },
    error: (err) => {
      this.errorMessage = 'Error al crear la venta.';
      console.error(err);
      this.isLoading = false;
    }
  });
}


// También actualiza el método para edición si necesitas la misma lógica:
private updateSaleWithStockUpdate(saleData: Sale): void {
  // Si es una edición y quieres actualizar el stock de los productos seleccionados
  const stockOperations = this.selectedProducts.map(product => 
    this.updateProductStockAndStatus(product)
  );
  
  const updateSale$ = this.saleService.updateSale(saleData.id, saleData);
  
  // Si quieres actualizar stock también en edición, usa forkJoin
  forkJoin([updateSale$, ...stockOperations]).subscribe({
    next: ([updatedSale, ...stockResults]) => {
      console.log('Venta actualizada y stock actualizado:', { 
        updatedSale, 
        productosActualizados: stockResults.length 
      });
      this.saleUpdated.emit(updatedSale);
      this.handleClose();
      this.isLoading = false;
    },
    error: (error: any) => {
      console.error('Error al actualizar venta o stock:', error);
      this.errorMessage = 'No se pudo actualizar la venta. Por favor, intente nuevamente.';
      this.isLoading = false;
    }
  });
}

// El método updateProductStockAndStatus ya está correcto:
/**
 * Actualiza el stock del producto a 0 y cambia su estado a 'I' (inactivo)
 */
private updateProductStockAndStatus(product: Product): Observable<any> {
  return this.productService.updateStock(product.id, 0, 'I');
}


  prepareFormData(): Sale {
    const formValue = this.saleForm.getRawValue();
    const totalWeight = this.getTotalSelectedWeight();

    const primaryProduct = this.selectedProducts[0];

    const saleData: Sale = {
      id: this.mode === 'edit' ? formValue.id : 0,
      saleDate: formValue.saleDate,
      name: formValue.name,
      ruc: formValue.ruc,
      address: formValue.address,
      productId: primaryProduct.id,
      weight: primaryProduct.packageWeight,
      packages: this.selectedProducts.length,
      totalWeight: totalWeight,
      pricePerKg: parseFloat(formValue.pricePerKg),
      totalPrice: parseFloat(formValue.totalPrice)
    };

    return saleData;
  }

  handleClose(): void {
    this.isLoading = false;
    this.errorMessage = '';
    this.selectedProducts = [];
    this.availableProductsForType = [];
    this.closeModal.emit();
    this.saleForm.reset();
  }
}
