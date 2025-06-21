import { Component, OnInit } from '@angular/core';
import { Sale } from '../../../../../model/Sale';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../../../../service/sale.service';
import { ProductService } from '../../../../../service/product.service';
import { Product } from '../../../../../model/Product';
import Swal from 'sweetalert2';
import { ModelSaleComponent } from './model-sale/model-sale.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [CommonModule, FormsModule, ModelSaleComponent],
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.css']
})
export class SaleComponent implements OnInit {
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  paginatedSales: Sale[] = [];
  products: Product[] = [];

  searchTerm: string = '';
  searchDate: string = '';
  selectedProduct: string = '';

  currentPage: number = 1;
  salesPerPage: number = 10;
  totalPages: number = 1;

  // Propiedades para el modal
  isModalOpen = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  selectedSale: Sale | null = null;

  constructor(
    private saleService: SaleService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.getAllSales();
    this.getAllProducts();
  }

  getAllSales(): void {
    this.saleService.getAllSales().subscribe({
      next: (sales) => {
        this.sales = sales;
        this.filteredSales = sales;
        this.resetPagination();
      },
      error: (error) => {
        console.error('Error al obtener las ventas:', error);
      }
    });
  }

  getAllProducts(): void {
    this.productService.getAll().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error al obtener los productos:', error);
      }
    });
  }

  updatePaginatedSales(): void {
    const startIndex = (this.currentPage - 1) * this.salesPerPage;
    const endIndex = startIndex + this.salesPerPage;
    this.paginatedSales = this.filteredSales.slice(startIndex, endIndex);
  }

  resetPagination(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.filteredSales.length / this.salesPerPage);
    this.updatePaginatedSales();
  }

  filterSales(): void {
    this.filteredSales = this.sales.filter(sale =>
      sale.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.resetPagination();
  }

  filterByDate(): void {
    this.filteredSales = this.searchDate
      ? this.sales.filter(sale => sale.saleDate.startsWith(this.searchDate))
      : [...this.sales];
    this.resetPagination();
  }

  filterByProduct(): void {
    this.filteredSales = this.selectedProduct
      ? this.sales.filter(sale => sale.productId.toString() === this.selectedProduct)
      : [...this.sales];
    this.resetPagination();
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedSales();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedSales();
    }
  }

  deleteSale(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.saleService.deleteSale(id).subscribe({
          next: () => {
            this.sales = this.sales.filter(s => s.id !== id);
            this.filteredSales = [...this.sales];
            this.resetPagination();
            Swal.fire('Eliminado', 'La venta ha sido eliminada.', 'success');
          },
          error: (error) => {
            console.error('Error al eliminar la venta:', error);
            Swal.fire('Error', 'No se pudo eliminar la venta.', 'error');
          }
        });
      }
    });
  }

  viewSaleDetails(saleId: number): void {
    const sale = this.sales.find(s => s.id === saleId);
    if (sale) {
      this.modalMode = 'view';
      this.selectedSale = {...sale};
      this.isModalOpen = true;
    }
  }

  getProductNameById(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.type : 'Producto no encontrado';
  }

  // Funciones para manejar el modal
  openCreateModal(): void {
    this.modalMode = 'create';
    this.selectedSale = null;
    this.isModalOpen = true;
  }

  openEditModal(sale: Sale): void {
    this.modalMode = 'edit';
    this.selectedSale = {...sale};
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  handleSaleCreated(sale: Sale): void {
    this.getAllSales();
    Swal.fire('Éxito', 'Venta registrada correctamente', 'success');
  }

  handleSaleUpdated(sale: Sale): void {
    this.getAllSales();
    Swal.fire('Éxito', 'Venta actualizada correctamente', 'success');
  }
// ============ FUNCIONES PARA GENERAR PDF OPTIMIZADOS ============

/**
 * Genera un PDF de boleta optimizado para impresión con diseño profesional
 */
generateSalePDF(sale: Sale): void {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Márgenes optimizados
    const marginLeft = 15;
    const marginRight = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    const productName = this.getProductNameById(sale.productId);
    const currentDate = new Date().toLocaleDateString('es-PE');
    const saleDate = new Date(sale.saleDate).toLocaleDateString('es-PE');

    let yPos = 20;

    // ============ ENCABEZADO PRINCIPAL CON LOGO ============
    // Fondo azul principal
    doc.setFillColor(52, 152, 219);
    doc.rect(marginLeft, yPos, contentWidth, 45, 'F');

    // Logo circular
    doc.setFillColor(255, 255, 255);
    doc.circle(marginLeft + 20, yPos + 22, 15, 'F');
    doc.setFillColor(52, 152, 219);
    doc.circle(marginLeft + 20, yPos + 22, 12, 'F');
    
    // Texto del logo
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('NPH', marginLeft + 20, yPos + 25, { align: 'center' });

    // Información de la empresa
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('NUESTROS PEQUEÑOS HERMANOS', marginLeft + 45, yPos + 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 20123456789 | San Vicente Cañete', marginLeft + 45, yPos + 25);
    doc.text('Tel: 956211045 | www.nuestrospequenoshermanos.com', marginLeft + 45, yPos + 32);
    
    // Línea separadora
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(marginLeft + 45, yPos + 37, marginLeft + contentWidth - 5, yPos + 37);

    yPos += 55;

    // ============ TÍTULO DE LA BOLETA ============
    doc.setFillColor(41, 98, 255);
    doc.rect(marginLeft, yPos, contentWidth, 25, 'F');
    
    // Borde blanco interno
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.rect(marginLeft + 3, yPos + 3, contentWidth - 6, 19);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('BOLETA ELECTRÓNICA', pageWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setFontSize(12);
    const boletaNumber = `B001-${sale.id.toString().padStart(6, '0')}`;
    doc.text(`N° ${boletaNumber}`, pageWidth / 2, yPos + 18, { align: 'center' });

    yPos += 35;

    // ============ DATOS DEL CLIENTE ============
    // Encabezado de sección
    doc.setFillColor(240, 240, 240);
    doc.rect(marginLeft, yPos, contentWidth, 12, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(marginLeft, yPos, contentWidth, 12);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DATOS DEL CLIENTE', marginLeft + 5, yPos + 8);

    yPos += 15;

    // Contenido del cliente
    doc.setFillColor(255, 255, 255);
    doc.rect(marginLeft, yPos, contentWidth, 35, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, yPos, contentWidth, 35);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    const clientX = marginLeft + 8;
    const clientX2 = marginLeft + (contentWidth / 2) + 10;
    
    doc.text(`Nombre: ${sale.name}`, clientX, yPos + 10);
    doc.text(`Fecha: ${saleDate}`, clientX2, yPos + 10);
    doc.text(`DNI/RUC: ${sale.ruc}`, clientX, yPos + 20);
    doc.text(`Dirección: ${sale.address}`, clientX, yPos + 28);

    yPos += 45;

    // ============ TABLA DE PRODUCTOS ============
    // Encabezado de tabla
    doc.setFillColor(70, 70, 70);
    doc.rect(marginLeft, yPos, contentWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('DESCRIPCIÓN', marginLeft + 5, yPos + 8);
    doc.text('PESO/UNIT', marginLeft + 75, yPos + 8);
    doc.text('CANT.', marginLeft + 105, yPos + 8);
    doc.text('PRECIO POR Kg.', marginLeft + 123, yPos + 8);
    doc.text('TOTAL', marginLeft + 155, yPos + 8);

    // Líneas separadoras verticales
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(marginLeft + 70, yPos, marginLeft + 70, yPos + 12);
    doc.line(marginLeft + 100, yPos, marginLeft + 100, yPos + 12);
    doc.line(marginLeft + 120, yPos, marginLeft + 120, yPos + 12);
    doc.line(marginLeft + 150, yPos, marginLeft + 150, yPos + 12);

    yPos += 12;

    // Fila de producto
    doc.setFillColor(250, 250, 250);
    doc.rect(marginLeft, yPos, contentWidth, 18, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, yPos, contentWidth, 18);

    // Líneas separadoras verticales en la fila
    doc.line(marginLeft + 70, yPos, marginLeft + 70, yPos + 18);
    doc.line(marginLeft + 100, yPos, marginLeft + 100, yPos + 18);
    doc.line(marginLeft + 120, yPos, marginLeft + 120, yPos + 18);
    doc.line(marginLeft + 150, yPos, marginLeft + 150, yPos + 18);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Producto con texto ajustado
    const maxDescWidth = 60;
    const splitDesc = doc.splitTextToSize(productName, maxDescWidth);
    doc.text(splitDesc[0], marginLeft + 3, yPos + 7);
    if (splitDesc.length > 1) {
      doc.text(splitDesc[1], marginLeft + 3, yPos + 13);
    }
    
    doc.text(`${sale.weight} Kg`, marginLeft + 75, yPos + 10, { align: 'center' });
    doc.text(`${sale.packages}`, marginLeft + 105, yPos + 10, { align: 'center' });
    doc.text(`S/ ${sale.pricePerKg.toFixed(2)}`, marginLeft + 130, yPos + 10, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(`S/ ${sale.totalPrice.toFixed(2)}`, marginLeft + 161, yPos + 10, { align: 'center' });

    yPos += 25;

    // ============ RESUMEN DE TOTALES ============
    const summaryX = marginLeft + contentWidth - 70;
    const summaryWidth = 65;

    // Total
    doc.setFillColor(76, 175, 80);
    doc.rect(summaryX, yPos, summaryWidth, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', summaryX + 3, yPos + 8);
    doc.text(`S/ ${sale.totalPrice.toFixed(2)}`, summaryX + summaryWidth - 3, yPos + 8, { align: 'right' });

    yPos += 25;

    // ============ INFORMACIÓN LEGAL ============
    doc.setFillColor(245, 245, 245);
    doc.rect(marginLeft, yPos, contentWidth, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(marginLeft, yPos, contentWidth, 20);

    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Representación impresa de la boleta electrónica', marginLeft + 5, yPos + 6);
    doc.text(`Consulte en línea: www.nuestrospequenoshermanos.com`, marginLeft + 5, yPos + 11);
    doc.text(`Fecha de emisión: ${currentDate}`, marginLeft + 5, yPos + 16);

    yPos += 30;

    // ============ PIE DE PÁGINA ============
    doc.setFillColor(60, 60, 60);
    doc.rect(marginLeft, yPos, contentWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('¡Gracias por su compra!', pageWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Su apoyo hace la diferencia', pageWidth / 2, yPos + 18, { align: 'center' });

    // Línea decorativa
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(marginLeft + 20, yPos + 21, marginLeft + contentWidth - 20, yPos + 21);

    // Guardar PDF
    const fileName = `Boleta_NPH_${sale.name.replace(/\s+/g, '_')}_${sale.id}.pdf`;
    doc.save(fileName);

    // Mensaje de éxito
    Swal.fire({
      title: '¡Boleta Generada!',
      html: `
        <div style="text-align: left; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 24px; margin-right: 10px;">📄</span>
            <strong style="color: #2c3e50;">Boleta Electrónica Generada</strong>
          </div>
          <hr style="margin: 10px 0; border: 0; border-top: 1px solid #dee2e6;">
          <p style="margin: 8px 0;"><strong>Número:</strong> ${boletaNumber}</p>
          <p style="margin: 8px 0;"><strong>Cliente:</strong> ${sale.name}</p>
          <p style="margin: 8px 0;"><strong>Producto:</strong> ${productName}</p>
          <p style="margin: 8px 0;"><strong>Cantidad:</strong> ${sale.packages} unidades (${sale.totalWeight} Kg)</p>
          <p style="margin: 8px 0; color: #28a745;"><strong>Total:</strong> S/ ${sale.totalPrice.toFixed(2)}</p>
          <hr style="margin: 10px 0; border: 0; border-top: 1px solid #dee2e6;">
          <p style="margin: 8px 0; font-size: 12px; color: #6c757d;">
            <strong>Archivo:</strong> ${fileName}
          </p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#28a745',
      width: '500px',
      timer: 6000,
      timerProgressBar: true
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    
    // Manejo seguro del error
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    Swal.fire({
      title: '❌ Error al Generar Boleta',
      html: `
        <div style="text-align: center; padding: 15px;">
          <p style="color: #dc3545; font-size: 16px; margin-bottom: 10px;">
            No se pudo generar la boleta PDF
          </p>
          <div style="background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; font-size: 12px;">
            <strong>Detalle del error:</strong><br>
            ${errorMessage}
          </div>
          <p style="margin-top: 15px; font-size: 14px; color: #6c757d;">
            Por favor, inténtelo nuevamente o contacte al soporte técnico.
          </p>
        </div>
      `,
      icon: 'error',
      confirmButtonText: '🔄 Reintentar',
      confirmButtonColor: '#dc3545',
      width: '450px'
    });
  }
}

  /**
   * Genera un PDF de reporte de ventas optimizado para impresión A4
   */
  generateSalesReportPDF(): void {
    try {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const currentDate = new Date().toLocaleDateString('es-PE');

      // Márgenes optimizados para impresión
      const marginLeft = 15;
      const marginRight = 15;
      const contentWidth = pageWidth - marginLeft - marginRight;
      
      let yPos = 20;

      // ============ ENCABEZADO DEL REPORTE ============
      
      doc.setFillColor(41, 128, 185);
      doc.rect(marginLeft, yPos, contentWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('NUESTROS PEQUEÑOS HERMANOS', pageWidth / 2, yPos + 12, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('REPORTE DE VENTAS', pageWidth / 2, yPos + 22, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el: ${currentDate}`, pageWidth / 2, yPos + 30, { align: 'center' });
      doc.text(`Total de registros: ${this.filteredSales.length}`, pageWidth / 2, yPos + 35, { align: 'center' });

      yPos += 50;

      // ============ ESTADÍSTICAS RÁPIDAS ============
      const totalGeneral = this.filteredSales.reduce((sum, sale) => sum + sale.totalPrice, 0);
      const totalKg = this.filteredSales.reduce((sum, sale) => sum + sale.totalWeight, 0);
      

      // Solo 3 cajas estadísticas centradas y más pequeñas
      const boxWidth = 50; // Cajas más pequeñas
      const boxHeight = 22;
      const spacing = 15;
      const totalBoxesWidth = (boxWidth * 3) + (spacing * 2);
      const boxStartX = (pageWidth - totalBoxesWidth) / 2; // Centrar perfectamente
      
      // Total ventas
      doc.setFillColor(46, 204, 113);
      doc.rect(boxStartX, yPos, boxWidth, boxHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL VENTAS', boxStartX + boxWidth/2, yPos + 8, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`S/ ${totalGeneral.toFixed(2)}`, boxStartX + boxWidth/2, yPos + 16, { align: 'center' });
      
      // Total kilogramos
      doc.setFillColor(52, 152, 219);
      doc.rect(boxStartX + boxWidth + spacing, yPos, boxWidth, boxHeight, 'F');
      doc.setFontSize(9);
      doc.text('TOTAL KG', boxStartX + boxWidth + spacing + boxWidth/2, yPos + 8, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`${totalKg.toFixed(2)}`, boxStartX + boxWidth + spacing + boxWidth/2, yPos + 16, { align: 'center' });
      
      // Número de ventas
      doc.setFillColor(155, 89, 182);
      doc.rect(boxStartX + (boxWidth + spacing) * 2, yPos, boxWidth, boxHeight, 'F');
      doc.setFontSize(9);
      doc.text('N° VENTAS', boxStartX + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 8, { align: 'center' });
      doc.setFontSize(12);
      doc.text(this.filteredSales.length.toString(), boxStartX + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 16, { align: 'center' });

      yPos += 35;

      // ============ TABLA DE VENTAS ============
      const tableData = this.filteredSales.map(sale => [
        new Date(sale.saleDate).toLocaleDateString('es-PE'),
        `B001-${sale.id.toString().padStart(6, '0')}`,
        sale.name.length > 20 ? sale.name.substring(0, 20) + '...' : sale.name,
        sale.ruc,
        this.getProductNameById(sale.productId).length > 15 ? 
          this.getProductNameById(sale.productId).substring(0, 15) + '...' : 
          this.getProductNameById(sale.productId),
        `${sale.totalWeight} Kg`,
        `S/ ${sale.pricePerKg.toFixed(2)}`,
        `S/ ${sale.totalPrice.toFixed(2)}`
      ]);

      // Calcular altura disponible para la tabla
      const availableHeight = 280 - yPos - 40; // Dejar espacio para totales y pie
      
      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'N° Boleta', 'Cliente', 'RUC/DNI', 'Producto', 'Total Kg', 'Precio/Kg', 'Total S/']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [52, 73, 94],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 30, halign: 'left' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 25, halign: 'left' },
          5: { cellWidth: 18, halign: 'center' },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: marginLeft, right: marginRight },
        tableWidth: 'auto',
        showHead: 'everyPage',
        pageBreak: 'auto'
      });

      // ============ TOTAL FINAL ============
      const finalY = Math.max((doc as any).lastAutoTable.finalY + 15, 240);
      
      // Asegurar que el total esté en la página actual
      if (finalY > 260) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos = finalY;
      }
      
      // Fondo para el total centrado
      const totalBoxWidth = 80;
      const totalBoxX = (pageWidth - totalBoxWidth) / 2;
      

      doc.setFillColor(231, 76, 60);
      doc.rect(totalBoxX, yPos, totalBoxWidth, 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TOTAL GENERAL', pageWidth / 2, yPos + 8, { align: 'center' });
      doc.setFontSize(16);
      doc.text(`S/ ${totalGeneral.toFixed(2)}`, pageWidth / 2, yPos + 16, { align: 'center' });

      // ============ PIE DE PÁGINA ============
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Nuestros Pequeños Hermanos | Reporte generado automáticamente', pageWidth / 2, 280, { align: 'center' });
      doc.text('www.nuestrospequenoshermanos.com | Haciendo la diferencia juntos', pageWidth / 2, 285, { align: 'center' });

      // Guardar PDF
      const fileName = `Reporte_Ventas_NPH_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      Swal.fire({
        title: '¡Reporte Generado!',
        html: `
          <p>El reporte de ventas se ha descargado correctamente</p>
          <p><strong>Período:</strong> ${currentDate}</p>
          <p><strong>Total registros:</strong> ${this.filteredSales.length}</p>
          <p><strong>Monto total:</strong> S/ ${totalGeneral.toFixed(2)}</p>
        `,
        icon: 'success',
        timer: 3000,
        showConfirmButton: true
      });

    } catch (error) {
      console.error('Error al generar reporte PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo generar el reporte PDF',
        icon: 'error'
      });
    }
  }
}