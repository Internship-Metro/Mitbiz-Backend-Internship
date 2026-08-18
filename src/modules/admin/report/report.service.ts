import { reportRepository } from './report.repository';
import ExcelJS from 'exceljs';
const PdfPrinter = require('pdfmake');

export const reportService = {
  async getSalesData(user: any, filters: { startDate: Date; endDate: Date; branchId?: string; businessId?: string }) {
    if (user.role === 'SUPER_ADMIN') {
      return reportRepository.getGlobalSalesData(filters.startDate, filters.endDate, filters.branchId, filters.businessId);
    }
    if (user.businessId) {
      return reportRepository.getSalesData(user.businessId, filters.startDate, filters.endDate, filters.branchId);
    }
    throw new Error('User tidak memiliki akses ke laporan bisnis');
  },

  async getTopProducts(user: any, filters: { startDate: Date; endDate: Date; branchId?: string; businessId?: string }) {
    if (user.role === 'SUPER_ADMIN') {
      return reportRepository.getTopProductsData(filters.startDate, filters.endDate, filters.branchId, filters.businessId);
    }
    if (user.businessId) {
      return reportRepository.getTopProductsData(filters.startDate, filters.endDate, filters.branchId, user.businessId);
    }
    throw new Error('User tidak memiliki akses ke laporan bisnis');
  },

  async getStocks(user: any, filters: { branchId?: string; businessId?: string }) {
    if (user.role === 'SUPER_ADMIN') {
      return reportRepository.getStockReportData(filters.branchId, filters.businessId);
    }
    if (user.businessId) {
      return reportRepository.getStockReportData(filters.branchId, user.businessId);
    }
    throw new Error('User tidak memiliki akses ke laporan bisnis');
  },

  async generateExcelReport(data: any[], startDate: string, endDate: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Penjualan');

    worksheet.mergeCells('A1', 'G1');
    worksheet.getCell('A1').value = `LAPORAN PENJUALAN (${startDate} - ${endDate})`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]); // empty row

    const headerRow = worksheet.addRow([
      'Tanggal', 'No Invoice', 'Cabang', 'Kasir', 'Metode Bayar', 'Subtotal', 'Total'
    ]);

    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0A5CB3' } // Blue primary color
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    let totalPenjualan = 0;

    data.forEach(trx => {
      totalPenjualan += trx.totalAmount;
      const row = worksheet.addRow([
        trx.createdAt.toISOString().split('T')[0],
        trx.invoiceNumber,
        trx.outlet?.business?.name ? `${trx.outlet.business.name} - ${trx.outlet.name}` : (trx.outlet?.name || '-'),
        trx.kasir?.name || '-',
        trx.paymentMethod?.name || trx.orderType,
        trx.subtotal,
        trx.totalAmount
      ]);

      row.getCell(6).numFmt = 'Rp #,##0';
      row.getCell(7).numFmt = 'Rp #,##0';

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['', '', '', '', '', 'TOTAL PENJUALAN', totalPenjualan]);
    summaryRow.font = { bold: true };
    summaryRow.getCell(7).numFmt = 'Rp #,##0';

    worksheet.columns = [
      { width: 15 }, { width: 20 }, { width: 25 }, { width: 20 },
      { width: 15 }, { width: 15 }, { width: 20 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  },

  async generatePdfReport(data: any[], startDate: string, endDate: string): Promise<Buffer> {
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    const printer = new PdfPrinter(fonts);

    const tableBody = [
      [
        { text: 'Tanggal', style: 'tableHeader' },
        { text: 'No Invoice', style: 'tableHeader' },
        { text: 'Cabang', style: 'tableHeader' },
        { text: 'Kasir', style: 'tableHeader' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' }
      ]
    ];

    let totalPenjualan = 0;

    data.forEach(trx => {
      totalPenjualan += trx.totalAmount;
      tableBody.push([
        trx.createdAt.toISOString().split('T')[0],
        trx.invoiceNumber,
        trx.outlet?.business?.name ? `${trx.outlet.business.name} - ${trx.outlet.name}` : (trx.outlet?.name || '-'),
        trx.kasir?.name || '-',
        { text: `Rp ${trx.totalAmount.toLocaleString('id-ID')}`, alignment: 'right' }
      ]);
    });

    tableBody.push([
      { text: 'TOTAL PENJUALAN', colSpan: 4, bold: true, alignment: 'right' } as any,
      {}, {}, {},
      { text: `Rp ${totalPenjualan.toLocaleString('id-ID')}`, bold: true, alignment: 'right' } as any
    ]);

    const docDefinition: any = {
      defaultStyle: { font: 'Helvetica', fontSize: 10 },
      content: [
        { text: 'Mitbiz POS - Laporan Penjualan', style: 'header' },
        { text: `Periode: ${startDate} s/d ${endDate}`, margin: [0, 0, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', '*', '*', 'auto'],
            body: tableBody
          }
        }
      ],
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 5] },
        tableHeader: { bold: true, fillColor: '#0a5cb3', color: 'white' }
      }
    };

    return new Promise((resolve, reject) => {
      try {
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: any[] = [];
        pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err: any) => reject(err));
        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
};
