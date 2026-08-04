/**
 * src/common/utils/invoice.util.ts
 *
 * TUJUAN: Generate nomor invoice yang unik dan terformat rapi.
 * Contoh output: "INV/2026/07/00001"
 *
 * Format: PREFIX/TAHUN/BULAN/NOMOR_URUT
 * - PREFIX  : "INV" (bisa diubah di constants.ts)
 * - TAHUN   : 4 digit (2026)
 * - BULAN   : 2 digit dengan leading zero (07, 12)
 * - URUT    : 5 digit dengan leading zero (00001, 00042)
 *
 * CARA PAKAI:
 *   const invoiceNo = generateInvoiceNumber(42)
 *   → "INV/2026/07/00042"
 *
 * Nomor urut (sequence) biasanya diambil dari total transaksi bulan ini + 1
 */

import { INVOICE } from '@config/constants';

/**
 * Generate nomor invoice berformat INV/YYYY/MM/XXXXX
 * @param sequence - Nomor urut transaksi (misal: jumlah transaksi bulan ini + 1)
 * @param date - Tanggal transaksi (default: sekarang)
 * @returns string - Nomor invoice terformat
 */
export const generateInvoiceNumber = (
  sequence: number,
  date: Date = new Date(),
): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(INVOICE.PADDING_LENGTH, '0');

  return `${INVOICE.PREFIX}/${year}/${month}/${seq}`;
};
