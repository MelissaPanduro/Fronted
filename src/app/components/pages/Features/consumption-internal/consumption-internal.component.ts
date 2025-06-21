import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from "sweetalert2";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Consumption } from '../../../../../model/consumption';
import { Product } from '../../../../../model/Product';
import { ConsumptionService } from "../../../../../service/consumption.service";
import { ProductService } from '../../../../../service/product.service';
import { FormConsumptionComponent } from "./form-consumption/form-consumption.component";

@Component({
  selector: 'app-consumption-internal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    FormConsumptionComponent
  ],
  templateUrl: './consumption-internal.component.html',
  styleUrls: ['./consumption-internal.component.css']
})
export class ConsumptionInternalComponent implements OnInit {
  consumption: Consumption[] = [];
  filteredConsumption: Consumption[] = [];
  showingActive: boolean = true;
  searchTerm: string = '';
  selectedHome: string = '';
  homesList: string[] = [];
  products: Product[] = [];

  // Variables para paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Variables para totales
  totalQuantity: number = 0;
  totalWeight: number = 0;
  totalPrice: number = 0;
  totalSaleValue: number = 0;

  // Control de diálogo
  showDialog: boolean = false;
  selectedConsumption: Consumption | null = null;

  // Control de dropdown de exportación
  showExportDropdown: boolean = false;

  constructor(
    private consumptionService: ConsumptionService,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadConsumption();
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (data: Product[]) => {
        this.products = data;
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
      }
    });
  }

  getProductType(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.type : 'N/A';
  }

  loadConsumption(): void {
    const service = this.showingActive
      ? this.consumptionService.listActiveConsumptions()
      : this.consumptionService.listInactiveConsumptions();

    service.subscribe({
      next: (data: Consumption[]) => {
        this.consumption = data.map(item => ({
          ...item,
          productType: this.getProductType(item.productId)
        }));
        this.filteredConsumption = [...this.consumption];
        this.calculateTotals();
        this.loadHomesList();
      },
      error: (err) => {
        console.error('Error cargando consumos:', err);
        Swal.fire('Error', 'No se pudo cargar los registros de consumo', 'error');
      }
    });
  }

  loadHomesList(): void {
    this.homesList = [...new Set(this.consumption.map(item => item.names))];
  }

  calculateTotals(): void {
    this.totalQuantity = this.filteredConsumption.reduce((sum, item) => sum + (item.quantity || 0), 0);
    this.totalWeight = this.filteredConsumption.reduce((sum, item) => sum + (item.weight || 0), 0);
    this.totalPrice = this.filteredConsumption.reduce((sum, item) => sum + (item.price || 0), 0);
    this.totalSaleValue = this.filteredConsumption.reduce((sum, item) => sum + (item.salevalue || 0), 0);
  }

  applyFilter(): void {
    if (!this.searchTerm) {
      this.filteredConsumption = [...this.consumption];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredConsumption = this.consumption.filter(c =>
        c.names.toLowerCase().includes(term) ||
        c.id_consumption.toString().includes(term) ||
        this.formatDate(c.date).includes(term) ||
        (c.productType && c.productType.toLowerCase().includes(term))
      );
    }
    this.calculateTotals();
  }

  toggleConsumption(): void {
    this.showingActive = !this.showingActive;
    this.loadConsumption();
  }

  openFormConsumption(consumption?: Consumption): void {
    this.selectedConsumption = consumption || null;
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.selectedConsumption = null;
  }

  handleDialogResult(result: boolean): void {
    this.closeDialog();
    if (result) {
      this.loadConsumption();
      Swal.fire(
        'Éxito',
        this.selectedConsumption ? 'Consumo actualizado correctamente' : 'Consumo registrado correctamente',
        'success'
      );
    }
  }

  toggleConsumptionState(id: number, status: string): void {
    const isActive = status === 'A';
    const action = isActive ? 'inactivateConsumption' : 'restoreConsumption';
    const actionText = isActive ? 'desactivar' : 'activar';

    Swal.fire({
      title: `¿${isActive ? 'Desactivar' : 'Activar'} consumo?`,
      text: `¿Está seguro que desea ${actionText} este registro?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#d33' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consumptionService[action](id).subscribe({
          next: () => {
            Swal.fire(
              'Éxito',
              `Consumo ${isActive ? 'desactivado' : 'activado'} correctamente`,
              'success'
            );
            this.loadConsumption();
          },
          error: (err) => {
            console.error(err);
            Swal.fire(
              'Error',
              `No se pudo ${actionText} el consumo`,
              'error'
            );
          }
        });
      }
    });
  }

  downloadPDF(): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const tableStartY = 40;

    // Encabezado del reporte
    doc.setFontSize(20);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE CONSUMO INTERNO', pageWidth / 2, 15, { align: 'center' });

    // Información adicional
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, margin, 25);
    doc.text(`Filtro: ${this.showingActive ? 'Activos' : 'Inactivos'}`, margin, 30);
    doc.text(`Total registros: ${this.filteredConsumption.length}`, pageWidth - margin, 25, { align: 'right' });

    // Tabla de datos
    autoTable(doc, {
      head: [['ID', 'Fecha', 'Hogar', 'Tipo Producto', 'Cantidad', 'Peso (kg)', 'Precio Unit.', 'Valor Venta', 'Estado']],
      body: this.filteredConsumption.map(c => [
        c.id_consumption.toString(),
        this.formatDate(c.date),
        c.names,
        c.productType || '',
        c.quantity.toString(),
        c.weight.toFixed(2),
        `S/. ${c.price.toFixed(2)}`,
        `S/. ${c.salevalue.toFixed(2)}`,
        c.status === 'A' ? 'Activo' : 'Inactivo'
      ]),
      startY: tableStartY,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [33, 82, 177],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Página ${data.pageNumber}`,
          pageWidth - margin,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'right' }
        );
      }
    });

    // Sección de totales
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DE TOTALES', margin, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      body: [
        ['Cantidad Total:', this.totalQuantity.toString()],
        ['Peso Total:', `${this.totalWeight.toFixed(2)} kg`],
        ['Precio Promedio:', `S/. ${(this.totalPrice / this.filteredConsumption.length).toFixed(2)}`],
        ['Valor Total:', `S/. ${this.totalSaleValue.toFixed(2)}`]
      ],
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        1: { textColor: 0 }
      }
    });

    doc.save(`Reporte_Consumo_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  downloadHomeReport(): void {
    if (!this.selectedHome) {
      Swal.fire('Advertencia', 'Por favor seleccione un hogar para generar el reporte', 'warning');
      return;
    }

    const homeData = this.filteredConsumption.filter(c => c.names === this.selectedHome);

    if (homeData.length === 0) {
      Swal.fire('Información', 'No hay datos de consumo para el hogar seleccionado', 'info');
      return;
    }

    this.generateHomeReportPDF(homeData);
  }

  private generateHomeReportPDF(data: Consumption[]): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm'
    });

    const homeName = data[0].names;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado con nombre del hogar
    doc.setFontSize(18);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text(`REPORTE DE CONSUMO - ${homeName.toUpperCase()}`, pageWidth / 2, 20, { align: 'center' });

    // Información del reporte
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, margin, 30);
    doc.text(`Total registros: ${data.length}`, pageWidth - margin, 30, { align: 'right' });

    // Cálculo de totales para el hogar
    const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalWeight = data.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalValue = data.reduce((sum, item) => sum + (item.salevalue || 0), 0);
    const averagePrice = totalValue / data.length;

    // Tabla de datos del hogar
    autoTable(doc, {
      head: [['Fecha', 'Tipo Producto', 'Cantidad', 'Peso (kg)', 'Precio Unit.', 'Valor Venta']],
      body: data.map(c => [
        this.formatDate(c.date),
        c.productType || 'N/A',
        c.quantity.toString(),
        c.weight.toFixed(2),
        `S/. ${c.price.toFixed(2)}`,
        `S/. ${c.salevalue.toFixed(2)}`
      ]),
      startY: 40,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [58, 123, 213],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Página ${data.pageNumber}`,
          pageWidth - margin,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      }
    });

    // Sección de totales para el hogar
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(33, 82, 177);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTALES PARA ${homeName.toUpperCase()}`, margin, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      body: [
        ['Cantidad Total:', totalQuantity.toString()],
        ['Peso Total:', `${totalWeight.toFixed(2)} kg`],
        ['Precio Promedio:', `S/. ${averagePrice.toFixed(2)}`],
        ['Valor Total:', `S/. ${totalValue.toFixed(2)}`]
      ],
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', cellWidth: 50 },
        1: { textColor: 0, cellWidth: 40 }
      }
    });

    doc.save(`Reporte_Consumo_${homeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  downloadExcel(): void {
    // Crear un nuevo libro de trabajo con ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Consumos');

    // Definir estilos para encabezados
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '2152B1' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    // Estilo para la fila de totales
    const totalStyle = {
      font: { bold: true },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'E0E0E0' } },
      alignment: { horizontal: 'right' as const },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'double' as const },
        right: { style: 'thin' as const }
      }
    };

    // Configurar columnas con anchos específicos
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Hogar', key: 'hogar', width: 20 },
      { header: 'Tipo Producto', key: 'tipoProducto', width: 18 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Peso (kg)', key: 'peso', width: 10 },
      { header: 'Precio Unitario', key: 'precioUnitario', width: 14 },
      { header: 'Valor Venta', key: 'valorVenta', width: 14 },
      { header: 'Estado', key: 'estado', width: 10 }
    ];

    // Aplicar estilo a los encabezados
    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Agregar datos
    this.filteredConsumption.forEach((c, index) => {
      const row = worksheet.addRow({
        id: c.id_consumption,
        fecha: this.formatDate(c.date),
        hogar: c.names,
        tipoProducto: c.productType || 'N/A',
        cantidad: c.quantity,
        peso: c.weight,
        precioUnitario: c.price,
        valorVenta: c.salevalue,
        estado: c.status === 'A' ? 'Activo' : 'Inactivo'
      });

      // Aplicar formato a las celdas numéricas
      row.getCell('peso').numFmt = '0.00';
      row.getCell('precioUnitario').numFmt = '#,##0.00';
      row.getCell('valorVenta').numFmt = '#,##0.00';

      // Aplicar estilos alternos a las filas
      const fillColor = index % 2 === 0 ? 'FFFFFF' : 'F0F0F0';

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const }
        };

        cell.fill = {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: fillColor }
        };
      });
    });

    // Agregar fila de totales
    const totalRow = worksheet.addRow({
      id: 'TOTALES',
      fecha: '',
      hogar: '',
      tipoProducto: '',
      cantidad: this.totalQuantity,
      peso: this.totalWeight,
      precioUnitario: this.filteredConsumption.length > 0 ? this.totalPrice / this.filteredConsumption.length : 0,
      valorVenta: this.totalSaleValue,
      estado: ''
    });

    // Aplicar formato a las celdas de totales
    totalRow.getCell('peso').numFmt = '0.00';
    totalRow.getCell('precioUnitario').numFmt = '#,##0.00';
    totalRow.getCell('valorVenta').numFmt = '#,##0.00';

    // Aplicar estilo a la fila de totales
    totalRow.eachCell((cell, colNumber) => {
      cell.style = totalStyle;
      if (colNumber >= 5) { // Solo aplicar negrita a las columnas numéricas
        cell.font = { bold: true };
      }
    });

    // Generar el archivo
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Reporte_Consumo_${new Date().toISOString().slice(0, 10)}.xlsx`);
    });
  }

  downloadCSV(): void {
    let csv = 'ID;Fecha;Hogar;Tipo Producto;Cantidad;Peso (kg);Precio Unitario;Valor Venta;Estado\n';

    this.filteredConsumption.forEach(c => {
      csv += `${c.id_consumption};`;
      csv += `${this.formatDate(c.date)};`;
      csv += `${c.names.replace(/;/g, ',')};`;
      csv += `${c.productType?.replace(/;/g, ',') || 'N/A'};`;
      csv += `${c.quantity};`;
      csv += `${c.weight.toFixed(2)};`;
      csv += `${c.price.toFixed(2)};`;
      csv += `${c.salevalue.toFixed(2)};`;
      csv += `${c.status === 'A' ? 'Activo' : 'Inactivo'}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Consumo_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Lima'
    });
  }
}
