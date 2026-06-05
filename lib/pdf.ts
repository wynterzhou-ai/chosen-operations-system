"use client";

import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "@/lib/format";

type DocumentClient = {
  name?: string | null;
  email?: string | null;
  address?: string | null;
};

type DocumentRecord = {
  quote_number?: string | null;
  quotation_no?: string | null;
  invoice_number?: string;
  issue_date: string;
  valid_until?: string | null;
  due_date?: string | null;
  subtotal: number;
  tax?: number | null;
  gst?: number | null;
  total: number;
  notes?: string | null;
  clients?: DocumentClient | null;
};

type DocumentItem = {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

export function downloadBusinessPdf(kind: "Quotation" | "Invoice", record: DocumentRecord, items: DocumentItem[]) {
  const doc = new jsPDF();
  const number = kind === "Quotation" ? record.quote_number ?? record.quotation_no : record.invoice_number;
  const tax = Number(record.tax ?? record.gst ?? 0);

  doc.setFontSize(18);
  doc.text("Chosen Operations System", 14, 20);
  doc.setFontSize(14);
  doc.text(kind, 14, 31);

  doc.setFontSize(10);
  doc.text(`${kind} No: ${number}`, 140, 20);
  doc.text(`Issue Date: ${formatDate(record.issue_date)}`, 140, 27);
  const secondaryDate = kind === "Quotation" ? record.valid_until : record.due_date;
  doc.text(`${kind === "Quotation" ? "Valid Until" : "Due Date"}: ${formatDate(secondaryDate)}`, 140, 34);

  doc.setFontSize(11);
  doc.text("Bill To", 14, 50);
  doc.setFontSize(10);
  doc.text(record.clients?.name ?? "-", 14, 58);
  if (record.clients?.email) doc.text(record.clients.email, 14, 65);
  if (record.clients?.address) doc.text(record.clients.address, 14, 72, { maxWidth: 85 });

  let y = 92;
  doc.setFontSize(10);
  doc.text("Description", 14, y);
  doc.text("Qty", 116, y);
  doc.text("Unit", 135, y);
  doc.text("Amount", 166, y);
  doc.line(14, y + 3, 196, y + 3);
  y += 11;

  items.forEach((item) => {
    doc.text(item.description, 14, y, { maxWidth: 92 });
    doc.text(String(item.quantity), 118, y);
    doc.text(formatCurrency(item.unit_price), 132, y);
    doc.text(formatCurrency(item.amount), 166, y);
    y += 10;
  });

  y += 8;
  doc.line(130, y - 5, 196, y - 5);
  doc.text("Subtotal", 135, y);
  doc.text(formatCurrency(record.subtotal), 166, y);
  y += 8;
  doc.text("Tax", 135, y);
  doc.text(formatCurrency(tax), 166, y);
  y += 8;
  doc.setFontSize(12);
  doc.text("Total", 135, y);
  doc.text(formatCurrency(record.total), 166, y);

  if (record.notes) {
    doc.setFontSize(10);
    doc.text("Notes", 14, y + 18);
    doc.text(record.notes, 14, y + 26, { maxWidth: 160 });
  }

  doc.save(`${kind.toLowerCase()}-${number}.pdf`);
}
