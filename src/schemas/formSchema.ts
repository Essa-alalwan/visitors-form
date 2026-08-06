import { z } from "zod";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "../utils/constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const attachmentSchema = z.object({
  id: z.string(),
  file: z
    .custom<File>((val) => val instanceof File, {
      message: "Please attach a file",
    })
    .refine(
      (f) => f.size <= MAX_FILE_SIZE_BYTES,
      `File must be smaller than ${MAX_FILE_SIZE_MB}MB`,
    )
    .refine(
      (f) => (ACCEPTED_FILE_TYPES as readonly string[]).includes(f.type),
      "Only PDF, JPG, or PNG files are allowed",
    ),
  description: z.string().min(1, "Please describe this document"),
  remarks: z.string().optional(),
});

export const visitorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Please enter the visitor's name"),
  cprOrPassport: z
    .string()
    .min(1, "Please enter a CPR card or passport number"),
  jobTitle: z.string().min(1, "Please enter a job title"),
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

const baseFormSchema = z.object({
  requestType: z.enum(["visitors", "material", "equipment"]).optional(),

  visitDateTime: z.date().optional(),
  visitDurationHours: z.coerce.number().min(0).max(999).optional(),
  visitDurationMinutes: z.coerce.number().min(0).max(59).optional(),
  companyName: z.string().min(1, "Please enter the company name"),
  contactEmail: z.string().optional(),
  aldurContactPerson: z
    .string()
    .min(1, "Please enter the Aldur II contact person"),
  department: z.string().min(1, "Please choose a department"),

  visitPurpose: z.string().min(1, "Please describe the purpose of the visit"),
  requestRemarks: z.string().optional(),

  visitKind: z.string().optional(),
  visitors: z.array(visitorSchema).optional(),

  materialDetails: materialDetailsSchema.optional(),
  materials: z.array(materialItemSchema).optional(),

  equipment: z.array(equipmentItemSchema).optional(),
});

export const formSchema = baseFormSchema.superRefine((data, ctx) => {
  if (!data.requestType) {
    ctx.addIssue({
      code: "custom",
      path: ["requestType"],
      message: "Please choose a request type",
    });
  }
  if (!data.visitDateTime) {
    ctx.addIssue({
      code: "custom",
      path: ["visitDateTime"],
      message: "Please choose a visit date and time",
    });
  }
  if (data.contactEmail && !EMAIL_REGEX.test(data.contactEmail)) {
    ctx.addIssue({
      code: "custom",
      path: ["contactEmail"],
      message: "Please enter a valid email address",
    });
  }

  if (data.requestType === "visitors") {
    if (!data.visitKind) {
      ctx.addIssue({
        code: "custom",
        path: ["visitKind"],
        message: "Please choose a visit kind",
      });
    }
    if (!data.visitors || data.visitors.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["visitors"],
        message: "Please add at least one visitor",
      });
    }
  }

  if (data.requestType === "material") {
    if (!data.materials || data.materials.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["materials"],
        message: "Please add at least one material item",
      });
    }
  }

  if (data.requestType === "equipment") {
    if (!data.equipment || data.equipment.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["equipment"],
        message: "Please add at least one equipment item",
      });
    }
  }
});

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
  3: ["visitKind", "visitors", "materialDetails", "materials", "equipment"],
  4: ["visitPurpose", "requestRemarks"],
};
