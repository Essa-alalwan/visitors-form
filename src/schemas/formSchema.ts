import { z } from "zod";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "../utils/constants";
import { getExpiryStatus } from "../utils/expiryStatus";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const attachmentSchema = z.object({
  id: z.string(),
  // Set when this attachment references a file already uploaded on a past
  // submission (loaded via "My Requests" for editing) rather than a fresh
  // browser File — see getCrossFieldIssues for the "one of the two is
  // required" rule, kept out of zod for the same reason as other
  // cross-field checks in this file.
  existingPath: z.string().optional(),
  file: z
    .custom<File | undefined>((val) => val === undefined || val instanceof File, {
      message: "Please attach a file",
    })
    .refine(
      (f) => !(f instanceof File) || f.size <= MAX_FILE_SIZE_BYTES,
      `File must be smaller than ${MAX_FILE_SIZE_MB}MB`,
    )
    .refine(
      (f) =>
        !(f instanceof File) ||
        (ACCEPTED_FILE_TYPES as readonly string[]).includes(f.type),
      "Only PDF, JPG, or PNG files are allowed",
    )
    .optional(),
  description: z.string().min(1, "Please describe this document"),
  remarks: z.string().optional(),
  expiryDate: z.date().optional(),
  // Read-only status computed server-side for an existing attachment
  // (e.g. "Valid" / "Expiring Soon" / "Expired") — display-only, never
  // edited or submitted back.
  docValidity: z.string().optional(),
});

export const visitorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Please enter the visitor's name"),
  cprOrPassport: z
    .string()
    .min(1, "Please enter a CPR card or passport number"),
  jobTitle: z.string().min(1, "Please enter a job title"),
  cprExpiryDate: z.date().optional(),
  attachments: z
    .array(attachmentSchema)
    .min(1, "Please add at least one attachment"),
});

export const materialDetailsSchema = z.object({
  createdBy: z.string().min(1, "Please enter who created this request"),
  substanceDestination: z
    .string()
    .min(1, "Please enter the substance destination"),
  driverReceiverId: z
    .string()
    .min(1, "Please enter the driver / receiver ID"),
  companyAddress: z.string().min(1, "Please enter the company address"),
  vehiclePlateNo: z.string().min(1, "Please enter the vehicle plate number"),
});

export const materialItemSchema = z.object({
  id: z.string(),
  inOut: z.string().min(1, "Please choose In or Out"),
  returnable: z.string().min(1, "Please choose returnable or non-returnable"),
  description: z.string().min(1, "Please describe the material"),
  quantity: z.string().min(1, "Please enter a quantity"),
  uom: z.string().min(1, "Please enter a unit of measure"),
  pat: z.string().min(1, "Please choose a PAT option"),
  remarks: z.string().optional(),
  attachments: z
    .array(attachmentSchema)
    .min(1, "Please add at least one attachment"),
});

export const equipmentItemSchema = z.object({
  id: z.string(),
  typeModel: z.string().min(1, "Please enter the equipment type / model"),
  plateNo: z.string().min(1, "Please enter the plate number"),
  name: z.string().min(1, "Please enter the name of the equipment"),
  operatorLicenseNo: z
    .string()
    .min(1, "Please enter the operator license number"),
  remarks: z.string().optional(),
  attachments: z
    .array(attachmentSchema)
    .min(1, "Please add at least one attachment"),
});

export const equipmentDetailsSchema = z.object({
  createdBy: z.string().min(1, "Please enter who created this request"),
  cprExpiryDate: z.date().optional(),
});

const baseFormSchema = z.object({
  requestType: z.enum(["visitors", "material", "equipment"]).optional(),

  visitDateTime: z.date().optional(),
  visitDurationHours: z.coerce.number().min(0).max(999).optional(),
  visitDurationMinutes: z.coerce.number().min(0).max(59).optional(),
  companyName: z.string().min(1, "Please enter the company name"),
  // Required — guests now have to OTP-verify this email before continuing
  // past Step 2, so it can never legitimately be left blank.
  contactEmail: z
    .string()
    .min(1, "Please enter a contact email")
    .regex(EMAIL_REGEX, "Please enter a valid email address"),
  aldurContactPerson: z
    .string()
    .min(1, "Please enter the Aldur II contact person"),
  department: z.string().min(1, "Please choose a department"),

  visitPurpose: z.string().min(1, "Please describe the purpose of the visit"),
  requestRemarks: z.string().optional(),

  visitKind: z.string().optional(),
  visitors: z.array(visitorSchema).optional(),
  bringPPE: z.boolean().optional(),

  materialDetails: materialDetailsSchema.optional(),
  materials: z.array(materialItemSchema).optional(),

  equipmentDetails: equipmentDetailsSchema.optional(),
  equipment: z.array(equipmentItemSchema).optional(),

  agreeToTerms: z.boolean().optional(),
});

// Cross-field rules deliberately live OUTSIDE zod (as a plain function,
// not `.superRefine()`): zod only runs `.superRefine()` when the base
// schema itself parses with zero structural issues. Since a single missing
// attachment file (or any other nested field failure) anywhere in the form
// makes the base schema fail, chaining these checks via `.superRefine()`
// would silently skip ALL of them — e.g. leaving out a visitor's attachment
// would make "Please choose a visit kind" silently vanish even though
// visitKind was never filled in. Running this independently guarantees
// these checks always apply, regardless of what else is invalid.
function checkAttachmentFiles(
  attachments: { file?: File; existingPath?: string }[] | undefined,
  basePath: (string | number)[],
  issues: { path: string[]; message: string }[],
) {
  attachments?.forEach((att, index) => {
    if (!att.file && !att.existingPath) {
      issues.push({
        path: [...basePath, "attachments", String(index), "file"].map(String),
        message: "Please attach a file",
      });
    }
  });
}

// A request can't go through the approval chain for an ID or document
// that's already expired — no point having Department/HSSE/Security
// review someone who'd be turned away at the gate anyway.
function checkNotExpired(
  date: Date | undefined,
  path: (string | number)[],
  label: string,
  issues: { path: string[]; message: string }[],
) {
  if (!date) return;
  if (getExpiryStatus(date)?.tier === "expired") {
    issues.push({
      path: path.map(String),
      message: `${label} has expired — please update it before submitting`,
    });
  }
}

function checkAttachmentExpiry(
  attachments: { expiryDate?: Date }[] | undefined,
  basePath: (string | number)[],
  issues: { path: string[]; message: string }[],
) {
  attachments?.forEach((att, index) => {
    checkNotExpired(
      att.expiryDate,
      [...basePath, "attachments", index, "expiryDate"],
      "This document's expiry date",
      issues,
    );
  });
}

export function getCrossFieldIssues(
  data: Partial<FormValues>,
): { path: string[]; message: string }[] {
  const issues: { path: string[]; message: string }[] = [];

  if (!data.requestType) {
    issues.push({ path: ["requestType"], message: "Please choose a request type" });
  }
  if (!data.visitDateTime) {
    issues.push({ path: ["visitDateTime"], message: "Please choose a visit date and time" });
  }

  if (data.requestType === "visitors") {
    if (!data.visitKind) {
      issues.push({ path: ["visitKind"], message: "Please choose a visit kind" });
    }
    if (!data.visitors || data.visitors.length === 0) {
      issues.push({ path: ["visitors"], message: "Please add at least one visitor" });
    }
    data.visitors?.forEach((visitor, index) => {
      if (!visitor.cprExpiryDate) {
        issues.push({
          path: ["visitors", String(index), "cprExpiryDate"],
          message: "Please choose a CPR/Passport expiry date",
        });
      }
      checkNotExpired(
        visitor.cprExpiryDate,
        ["visitors", index, "cprExpiryDate"],
        "This visitor's CPR/Passport",
        issues,
      );
      checkAttachmentFiles(visitor.attachments, ["visitors", index], issues);
      checkAttachmentExpiry(visitor.attachments, ["visitors", index], issues);
    });
    if (
      (data.visitKind === "Field Work" || data.visitKind === "Both") &&
      !data.bringPPE
    ) {
      issues.push({
        path: ["bringPPE"],
        message: "Please confirm you will bring appropriate PPE",
      });
    }
  }

  if (data.requestType === "material") {
    if (!data.materials || data.materials.length === 0) {
      issues.push({ path: ["materials"], message: "Please add at least one material item" });
    }
    data.materials?.forEach((item, index) => {
      checkAttachmentFiles(item.attachments, ["materials", index], issues);
    });
  }

  if (data.requestType === "equipment") {
    if (!data.equipmentDetails?.cprExpiryDate) {
      issues.push({
        path: ["equipmentDetails", "cprExpiryDate"],
        message: "Please choose a CPR expiry date",
      });
    }
    checkNotExpired(
      data.equipmentDetails?.cprExpiryDate,
      ["equipmentDetails", "cprExpiryDate"],
      "The CPR expiry date",
      issues,
    );
    if (!data.equipment || data.equipment.length === 0) {
      issues.push({ path: ["equipment"], message: "Please add at least one equipment item" });
    }
    data.equipment?.forEach((item, index) => {
      checkAttachmentFiles(item.attachments, ["equipment", index], issues);
      checkAttachmentExpiry(item.attachments, ["equipment", index], issues);
    });
  }

  if (!data.agreeToTerms) {
    issues.push({
      path: ["agreeToTerms"],
      message: "Please agree to the Terms & Conditions to continue",
    });
  }

  return issues;
}

export const formSchema = baseFormSchema;

export type FormValues = z.infer<typeof baseFormSchema>;
export type VisitorEntry = z.infer<typeof visitorSchema>;
export type MaterialItemEntry = z.infer<typeof materialItemSchema>;
export type EquipmentItemEntry = z.infer<typeof equipmentItemSchema>;
export type AttachmentEntry = z.infer<typeof attachmentSchema>;

export const STEP_FIELD_NAMES: Record<number, (keyof FormValues)[]> = {
  1: ["requestType"],
  2: [
    "visitDateTime",
    "visitDurationHours",
    "visitDurationMinutes",
    "companyName",
    "contactEmail",
    "aldurContactPerson",
    "department",
  ],
  3: [
    "visitKind",
    "visitors",
    "bringPPE",
    "materialDetails",
    "materials",
    "equipmentDetails",
    "equipment",
  ],
  4: ["visitPurpose", "requestRemarks", "agreeToTerms"],
};
