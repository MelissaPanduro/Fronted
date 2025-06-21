import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import Swal from 'sweetalert2';
import { UtilityDiaryService } from '../../../../../service/utility-diary.service';
import { UtilityDiary } from '../../../../../model/UtilityDiary';
import { AdditionalCostFormModalComponent } from './additional-cost-form-modal/additional-cost-form-modal.component';
import { SaleService } from '../../../../../service/sale.service';
import { Sale } from '../../../../../model/Sale';
import { FoodCost } from '../../../../../model/cost';
import { CostFoodService } from '../../../../../service/cost-food.service';
import { forkJoin, catchError, of, map } from 'rxjs';

@Component({
  selector: 'app-additional-cost',
  standalone: true,
  imports: [CommonModule, HttpClientModule, AdditionalCostFormModalComponent],
  templateUrl: './additional-cost.component.html',
  styleUrl: './additional-cost.component.css'
})
export class AdditionalCostComponent implements OnInit {
  utilityDiaries: UtilityDiary[] = [];
  hasError: boolean = false;
  
  // Lookup data
  salesData: Map<number, Sale> = new Map();
  foodCostsData: Map<number, FoodCost> = new Map();
  
  // Modal control variables
  isModalOpen: boolean = false;
  selectedDiary?: UtilityDiary;
  isLoading: boolean = true;

  constructor(
    private utilityDiaryService: UtilityDiaryService,
    private saleService: SaleService,
    private costFoodService: CostFoodService
  ) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    this.hasError = false;
    
    // Load utility diaries and reference data in parallel
    forkJoin({
      diaries: this.utilityDiaryService.getAll(),
      sales: this.saleService.getAllSales().pipe(catchError(() => of([]))),
      foodCosts: this.costFoodService.getACost().pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        this.utilityDiaries = results.diaries;
        
        // Create lookup maps for sales and food costs
        results.sales.forEach(sale => {
          this.salesData.set(sale.id, sale);
        });
        
        results.foodCosts.forEach(cost => {
          this.foodCostsData.set(cost.idFoodCosts, cost);
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching data', error);
        this.hasError = true;
        this.isLoading = false;
        this.showErrorMessage('No se pudo conectar con la base de datos');
      }
    });
  }

  loadUtilityDiaries(): void {
    this.hasError = false;
    
    this.utilityDiaryService.getAll().subscribe({
      next: (data) => {
        this.utilityDiaries = data;
      },
      error: (error) => {
        console.error('Error fetching utility diaries', error);
        this.hasError = true;
        this.showErrorMessage('No se pudo conectar con la base de datos');
      }
    });
  }

  getSaleDetails(saleId: number): string {
    const sale = this.salesData.get(saleId);
    return sale ? `Fecha: ${sale.saleDate} - Precio: S/. ${sale.totalPrice}` : `ID: ${saleId}`;
  }
  
  getFoodCostDetails(foodCostId: number): string {
    const foodCost = this.foodCostsData.get(foodCostId);
    return foodCost ? `${foodCost.foodType} - S/. ${foodCost.totalCost}` : `ID: ${foodCostId}`;
  }

  deleteUtilityDiary(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.utilityDiaryService.delete(id).subscribe({
          next: () => {
            this.utilityDiaries = this.utilityDiaries.filter(diary => diary.id !== id);
            Swal.fire({
              title: '¡Eliminado!',
              text: 'El registro ha sido eliminado correctamente.',
              icon: 'success',
              confirmButtonColor: '#3085d6'
            });
          },
          error: (error) => {
            console.error('Error deleting utility diary', error);
            this.showErrorMessage('Error al eliminar el registro');
          }
        });
      }
    });
  }

  editUtilityDiary(id: number): void {
    // Find the diary to edit
    const diaryToEdit = this.utilityDiaries.find(diary => diary.id === id);
    
    if (diaryToEdit) {
      this.selectedDiary = diaryToEdit;
      this.openModal();
    } else {
      this.showErrorMessage('No se encontró el registro a editar');
    }
  }

  addUtilityDiary(): void {
    // Reset selected diary and open modal for adding
    this.selectedDiary = undefined;
    this.openModal();
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    // Reset the selected diary when closing modal
    this.selectedDiary = undefined;
  }

  handleFormSubmitted(diary: UtilityDiary): void {
    // Refresh data after form submission
    this.loadAllData();
    
    // Show success message
    Swal.fire({
      title: '¡Éxito!',
      text: `El registro ha sido ${this.selectedDiary ? 'actualizado' : 'creado'} correctamente.`,
      icon: 'success',
      confirmButtonColor: '#3085d6'
    });
  }

  private showErrorMessage(message: string): void {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    });
  }
}