"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { CreateInvoiceInput } from "@/lib/types/invoice.types";
import { PAYMENT_DETAILS } from "@/lib/constants/paymentDetails";

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SHH-${year}${month}-${random}`;
}

function getDefaultDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + PAYMENT_DETAILS.invoiceDueDays);
  return due.toISOString();
}

export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const invoice_number = generateInvoiceNumber();
    const due_date = input.due_date || getDefaultDueDate();

    const { data, error } = await supabaseAdmin
      .from("subscription_invoices")
      .insert({ ...input, invoice_number, due_date })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("createInvoice failed:", err);
    return { success: false, error: err };
  }
}
