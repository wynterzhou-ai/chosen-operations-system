export type Status = "active" | "inactive";
export type EmployeeRole = "cleaner" | "supervisor" | "operations_manager" | "admin";

export type Client = {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: Status;
  created_at: string;
};

export type Employee = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: EmployeeRole | string;
  status: Status;
  created_at: string;
};

export type Roster = {
  id: string;
  client_id: string;
  employee_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
  clients?: Pick<Client, "name"> | null;
  employees?: Pick<Employee, "name"> | null;
};

export type InspectionReport = {
  id: string;
  client_id: string;
  inspected_by: string | null;
  inspection_date: string;
  score: number;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  clients?: Pick<Client, "name"> | null;
};

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected";

export type Quotation = {
  id: string;
  quote_number?: string | null;
  quotation_no?: string | null;
  client_id: string;
  issue_date: string;
  valid_until: string | null;
  status: QuotationStatus;
  subtotal: number;
  tax?: number | null;
  gst?: number | null;
  total: number;
  service_description?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  notes: string | null;
  created_at: string;
  clients?: Pick<Client, "name" | "email" | "address"> | null;
};

export type QuotationItem = {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

export type PaymentStatus = "unpaid" | "partial" | "paid" | "overdue";

export type Invoice = {
  id: string;
  invoice_number: string;
  quotation_id: string | null;
  client_id: string;
  issue_date: string;
  due_date: string | null;
  payment_status: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  clients?: Pick<Client, "name" | "email" | "address"> | null;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};
