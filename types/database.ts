export type Status = "active" | "inactive";
export type EmployeeRole = "cleaner" | "supervisor" | "operations_manager" | "admin";
export type CitizenshipType = "singapore_citizen" | "spr_year_1" | "spr_year_2" | "spr_year_3_plus";

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

export type ClientUserRole = "client_viewer" | "client_admin";
export type ClientUserStatus = "active" | "inactive";

export type ClientUser = {
  id: string;
  client_id: string;
  auth_user_id: string;
  email: string;
  role: ClientUserRole | string;
  status: ClientUserStatus | string;
  created_at: string;
  updated_at: string;
  clients?: Client | null;
};


export type Employee = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: EmployeeRole | string;
  basic_salary?: number | null;
  hourly_rate?: number | null;
  cpf_applicable?: boolean | null;
  sdl_applicable?: boolean | null;
  bank_name?: string | null;
  bank_account?: string | null;
  nric_fin?: string | null;
  payment_method?: string | null;
  bank_branch?: string | null;
  pwm_grade?: string | null;
  date_of_birth?: string | null;
  citizenship_type?: CitizenshipType | string | null;
  cpf_auto_calculation?: boolean | null;
  work_permit_expiry?: string | null;
  passport_expiry?: string | null;
  medical_expiry?: string | null;
  wsq_expiry?: string | null;
  first_aid_expiry?: string | null;
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

export type AttendanceStatus = "checked_in" | "checked_out" | "issue";

export type AttendanceRecord = {
  id: string;
  employee_id: string;
  client_id: string;
  roster_id: string | null;
  check_in_time: string;
  check_out_time: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  check_in_photo_url: string | null;
  check_out_photo_url: string | null;
  remarks: string | null;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "name"> | null;
  employees?: Pick<Employee, "name"> | null;
  rosters?: Pick<Roster, "shift_date" | "start_time" | "end_time"> | null;
};

export type ChecklistTemplate = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  id: string;
  template_id: string;
  item_text: string;
  sort_order: number;
  is_required: boolean;
  created_at: string;
};

export type ChecklistSubmissionStatus = "completed" | "issue";
export type ChecklistItemResult = "pass" | "fail";

export type ChecklistSubmission = {
  id: string;
  template_id: string;
  client_id: string;
  site_name: string | null;
  supervisor_name: string | null;
  submission_date: string;
  before_photo_url: string | null;
  after_photo_url: string | null;
  remarks: string | null;
  status: ChecklistSubmissionStatus;
  created_at: string;
  updated_at: string;
  clients?: Pick<Client, "name"> | null;
  checklist_templates?: Pick<ChecklistTemplate, "name"> | null;
  checklist_submission_items?: ChecklistSubmissionItem[];
};

export type ChecklistSubmissionItem = {
  id: string;
  submission_id: string;
  checklist_item_id: string;
  result: ChecklistItemResult;
  remarks: string | null;
  created_at: string;
  checklist_items?: Pick<ChecklistItem, "item_text" | "sort_order"> | null;
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

export type CpfRateRule = {
  id: string;
  effective_from: string;
  effective_to: string | null;
  citizenship_type: CitizenshipType | string;
  age_min: number;
  age_max: number | null;
  wage_min: number;
  wage_max: number | null;
  employer_rate: number;
  employee_rate: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

