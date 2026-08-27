import type { FormValues } from "../schemas/formSchema";
import type { AttachmentPayload, SubmissionPayload } from "../data/payloadTypes";

// Keeps the same "HH:MM:SS" shape the Requests sheet already expects in
// this column — minutes are just always zero now that there's no more UI
// for them, rather than changing the wire format on the backend too.
function formatDuration(hours?: number): string | undefined {
  if (!hours) return undefined;
  const h = String(hours).padStart(2, "0");
  return `${h}:00:00`;
}

function formatDateOnly(date?: Date): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatAttachments(
  attachments: {
    id?: string;
    file?: File;
    existingPath?: string;
    description: string;
    remarks?: string;
    expiryDate?: Date;
  }[],
): AttachmentPayload[] {
  return attachments.map((a) => ({
    id: a.id,
    file: a.file,
    existingPath: a.existingPath,
    description: a.description,
    remarks: a.remarks,
    expiryDate: formatDateOnly(a.expiryDate) || undefined,
  }));
}

export function buildSubmissionPayload(
  values: FormValues,
  existingRequestId?: string | null,
): SubmissionPayload {
  const base = {
    visitDateTime: (values.visitDateTime as Date).toISOString(),
    visitEndDate: values.visitEndDate
  ? values.visitEndDate.toISOString()
  : undefined,
    visitDuration: formatDuration(values.visitDurationHours),
    companyName: values.companyName,
    contactEmail: values.contactEmail || undefined,
    contactPhone: values.contactPhone || undefined,
    aldurContactPerson: values.aldurContactPerson,
    department: values.department as string,
    visitPurpose: values.visitPurpose,
    requestRemarks: values.requestRemarks || undefined,
    existingRequestId: existingRequestId || undefined,
    bringPPE: values.bringPPE || false,
  };

  if (values.requestType === "visitors") {
    return {
      ...base,
      requestType: "visitors",
      visitKind: values.visitKind as string,
      visitors: (values.visitors ?? []).map((v) => ({
        id: v.id,
        name: v.name,
        cprOrPassport: v.cprOrPassport,
        jobTitle: v.jobTitle,
        cprExpiryDate: formatDateOnly(v.cprExpiryDate),
        attachments: formatAttachments(v.attachments),
      })),
    };
  }

  if (values.requestType === "material") {
    return {
      ...base,
      requestType: "material",
      material: {
        details: {
          createdBy: values.materialDetails?.createdBy ?? "",
          substanceDestination: values.materialDetails?.substanceDestination ?? "",
          driverReceiverId: values.materialDetails?.driverReceiverId ?? "",
          companyAddress: values.materialDetails?.companyAddress ?? "",
          vehiclePlateNo: values.materialDetails?.vehiclePlateNo ?? "",
        },
        items: (values.materials ?? []).map((m) => ({
          id: m.id,
          inOut: m.inOut as string,
          returnable: m.returnable as string,
          description: m.description,
          quantity: m.quantity,
          uom: m.uom,
          pat: m.pat as string,
          remarks: m.remarks,
          attachments: formatAttachments(m.attachments),
        })),
      },
    };
  }

  return {
    ...base,
    requestType: "equipment",
    equipmentDetails: {
      createdBy: values.equipmentDetails?.createdBy ?? "",
      cprExpiryDate: formatDateOnly(values.equipmentDetails?.cprExpiryDate),
    },
    equipment: (values.equipment ?? []).map((e) => ({
      id: e.id,
      typeModel: e.typeModel,
      plateNo: e.plateNo,
      name: e.name,
      operatorLicenseNo: e.operatorLicenseNo,
      remarks: e.remarks,
      attachments: formatAttachments(e.attachments),
    })),
  };
}
