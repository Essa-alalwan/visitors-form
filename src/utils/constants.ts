export const DEPARTMENTS = [
  "Chemistry",
  "Electrical",
  "Instrumentation",
  "Mechanical",
  "Operation",
  "HSSE",
  "Procurement",
  "HR",
  "Warehouse",
  "HAYA",
  "IT",
  "Plant Management",
] as const;

export const VISIT_KINDS = ["Field Work", "Office Work", "Both"] as const;

export const CPR_TYPES = ["National ID", "Passport"] as const;

// Fixed category list for a visitor's attachments beyond the first (which
// is always the National ID scan) — shown as a dropdown instead of free text.
export const VISITOR_ATTACHMENT_TYPES = [
  "Letter",
  "Visa (Work/Business/Visit)",
  "Licenses",
  "Certificates",
  "Card Reader",
  "Other Attachments",
] as const;

export const IN_OUT_OPTIONS = ["In", "Out"] as const;

export const RETURNABLE_OPTIONS = ["Returnable", "Non-Returnable"] as const;

export const YES_NO_OPTIONS = ["Yes", "No"] as const;

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
] as const;

export const ACCEPTED_FILE_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const TOTAL_STEPS = 4;

export const STEP_LABELS = [
  "Request Type",
  "Visit Details",
  "Details",
  "Review & Submit",
] as const;
