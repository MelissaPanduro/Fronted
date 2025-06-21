import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { EggProductionService } from '../../../../../service/egg-production.service';
import { EggProduction } from '../../../../../model/EggProduction';
import { EggProductionFormComponent } from './egg-production-form/egg-production-form.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-egg-production',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    HttpClientModule, 
    RouterModule,
    EggProductionFormComponent
  ],
  templateUrl: './egg-production.component.html',
  styleUrl: './egg-production.component.css'
})
export class EggProductionComponent implements OnInit {
  eggProductions: EggProduction[] = [];
  filteredProductions: EggProduction[] = [];
  loading: boolean = false;
  showModal = false;
  showSummaryModal = false;
  selectedProduction: EggProduction | null = null;
  Math = Math; // Para usar Math en el template
  
  // Filtro único
  filterDate: string = '';
  
  // Paginación (ahora desde 5 elementos)
  itemsPerPage: number = 5;
  currentPage: number = 1;
  totalPages: number = 1;
  
  // Resumen de producción
  productionSummary = {
    totalEggs: 0,
    totalWeight: 0,
    totalValue: 0
  };
  
  constructor(private eggProductionService: EggProductionService) {}
  
  ngOnInit(): void {
    this.loadEggProductions();
  }
  
  loadEggProductions(): void {
    this.loading = true;
    this.eggProductionService.getAll().subscribe({
      next: (data) => {
        this.eggProductions = data;
        this.filteredProductions = [...this.eggProductions];
        this.calculateTotalPages();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading egg productions:', error);
        this.loading = false;
        Swal.fire({
          title: 'Error!',
          text: 'No se pudieron cargar los datos de producción de huevos',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }
  
  applyFilters(): void {
    if (!this.filterDate) {
      this.filteredProductions = [...this.eggProductions];
    } else {
      // Filtrar por la fecha única
      const searchDate = new Date(this.filterDate);
      searchDate.setHours(0, 0, 0, 0);
      
      this.filteredProductions = this.eggProductions.filter(item => {
        const itemDate = new Date(item.registrationDate);
        itemDate.setHours(0, 0, 0, 0);
        return itemDate.getTime() === searchDate.getTime();
      });
    }
    
    this.calculateTotalPages();
    this.currentPage = 1; // Reset to first page after applying filters
  }
  
  resetFilters(): void {
    this.filterDate = '';
    this.filteredProductions = [...this.eggProductions];
    this.calculateTotalPages();
    this.currentPage = 1;
  }
  
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredProductions.length / this.itemsPerPage);
  }
  
  get paginatedItems(): EggProduction[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProductions.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  getPaginationRange(): (number | string)[] {
    const range: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if there are few pages
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, this.currentPage - 1);
      let end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      // Adjust range to ensure we show the right number of pages
      if (start === 2) {
        end = Math.min(this.totalPages - 1, start + 2);
      }
      if (end === this.totalPages - 1) {
        start = Math.max(2, end - 2);
      }
      
      // Add ellipsis if necessary
      if (start > 2) {
        range.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      
      // Add ellipsis if necessary
      if (end < this.totalPages - 1) {
        range.push('...');
      }
      
      // Always show last page
      range.push(this.totalPages);
    }
    
    return range;
  }
  
  openModal(production?: EggProduction): void {
    this.selectedProduction = production || null;
    this.showModal = true;
  }
  
  closeModal(): void {
    this.showModal = false;
    this.selectedProduction = null;
  }
  
  onFormSubmitSuccess(): void {
    this.closeModal();
    this.loadEggProductions();
  }
  
  deleteEggProduction(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede revertir',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eggProductionService.delete(id).subscribe({
          next: () => {
            this.eggProductions = this.eggProductions.filter(item => item.id !== id);
            this.filteredProductions = this.filteredProductions.filter(item => item.id !== id);
            this.calculateTotalPages();
            
            // If current page is now empty due to deletion, go to previous page
            if (this.currentPage > this.totalPages && this.totalPages > 0) {
              this.currentPage = this.totalPages;
            }
            
            Swal.fire(
              '¡Eliminado!',
              'El registro ha sido eliminado.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error deleting egg production:', error);
            Swal.fire({
              title: 'Error!',
              text: 'No se pudo eliminar el registro',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        });
      }
    });
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  
  viewProductionSummary(item: EggProduction): void {
    // Calcular resumen solo para este registro específico
    this.productionSummary = {
      totalEggs: item.quantityEggs,
      totalWeight: item.quantityEggs * item.eggsKilo, // Peso total = cantidad * peso por kilo
      totalValue: item.priceKilo * (item.quantityEggs * item.eggsKilo) // Valor total = precio * peso total
    };
    
    this.showSummaryModal = true;
  }
  closeSummaryModal(): void {
    this.showSummaryModal = false;
  }
}