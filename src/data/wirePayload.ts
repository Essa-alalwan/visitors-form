import type { AttachmentPayload, SubmissionPayload } from "./payloadTypes";

/**
 * The shape the real Apps Script `submitRequest()` expects on the wire —
 * reverse-engineered from the existing, working Index.html submit handler.
 * It differs from our UI-facing `SubmissionPayload` in several ways: exact
 * capitalized requestType strings, some renamed fields (e.g.
 * aldurContactPerson -> contactPerson), material details flattened to the
 * top level instead of nested, and "equipment" pluralized to "equipments".
 * Keeping this mapping isolated here means the rest of the app can keep
 * using clean, consistent internal field names.
 */
export interface WireAttachment {
  name?: string;
  mimeType?: string;
  data?: string; // base64, without the "data:...;base64," prefix
  // Set instead of name/mimeType/data when this attachment references a
  // file already stored on the server from a past submission — the
  // backend reuses it as-is instead of writing a new file.
  existingPath?: string;
  description: string;
  remarks?: string;
  expiryDate?: string;
}

interface WireVisitor {
  visitorName: string;
  cprPassport: string;
  jobTitle: string;
  cprExpiryDate: string;
  attachments: WireAttachment[];
}

interface WireMaterialItem {
  inOut: string;
  returnable: string;
  description: string;
  quantity: string;
  uom: string;
  pat: string;
  remarks?: string;
  attachments: WireAttachment[];
}

interface WireEquipmentItem {
  typeModel: string;
  plateNo: string;
  name: string;
  operatorLicenseNo: string;
  remarks?: string;
  attachments: WireAttachment[];
}

interface WireBase {
  visitDateTime: string;
  visitEndDate?: string;
  visitDuration?: string;
  companyName: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPerson: string;
  department: string;
  visitPurpose: string;
  requestRemarks?: string;
  existingRequestId?: string;
  bringPPE?: boolean;
}

export type WireSubmissionPayload = WireBase &
  (
    | {
        requestType: "Visitors";
        visitKind: string;
        visitors: WireVisitor[];
      }
    | {
        requestType: "Material Entry & Exit";
        mrCreatedBy: string;
        substanceDestination: string;
        driverId: string;
        mrCompanyAddress: string;
        vehiclePlateNo: string;
        materials: WireMaterialItem[];
      }
    | {
        requestType: "Equipment";
        epCreatedBy: string;
        epCprExpiryDate: string;
        equipments: WireEquipmentItem[];
      }
  );

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error(`Failed to read file "${file.name}"`));
    reader.onload = () => {
      const result = reader.result as string; // "data:<mime>;base64,AAAA..."
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}

async function toWireAttachment(a: AttachmentPayload): Promise<WireAttachment> {
  if (!a.file && a.existingPath) {
    return {
      existingPath: a.existingPath,
      description: a.description,
      remarks: a.remarks,
      expiryDate: a.expiryDate,
    };
  }

  const file = a.file as File;
  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    data: await fileToBase64(file),
    description: a.description,
    remarks: a.remarks,
    expiryDate: a.expiryDate,
  };
}

/**
 * The real backend's reference form reads `visitDateTime` straight off a
 * native `datetime-local` input, i.e. local time with no timezone suffix
 * ("YYYY-MM-DDTHH:mm"). Our SubmissionPayload carries a full UTC ISO string
 * (via Date.toISOString()) — sending that as-is would shift the recorded
 * time by the local timezone offset, so it's reformatted here to match.
 */
function toLocalDateTimeString(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day}T${h}:${mi}`;
}

export async function toWirePayload(
  payload: SubmissionPayload,
): Promise<WireSubmissionPayload> {
  const base: WireBase = {
    visitDateTime: toLocalDateTimeString(payload.visitDateTime),
    visitEndDate: payload.visitEndDate
  ? toLocalDateTimeString(payload.visitEndDate)
  : undefined,
    visitDuration: payload.visitDuration,
    companyName: payload.companyName,
    contactEmail: payload.contactEmail,
    contactPhone: payload.contactPhone,
    contactPerson: payload.aldurContactPerson,
    department: payload.department,
    visitPurpose: payload.visitPurpose,
    requestRemarks: payload.requestRemarks,
    existingRequestId: payload.existingRequestId,
    bringPPE: payload.bringPPE,
  };

  if (payload.requestType === "visitors") {
    return {
      ...base,
      requestType: "Visitors",
      visitKind: payload.visitKind,
      visitors: await Promise.all(
        payload.visitors.map(async (v) => ({
          visitorName: v.name,
          cprPassport: v.cprOrPassport,
          jobTitle: v.jobTitle,
          cprExpiryDate: v.cprExpiryDate,
          attachments: await Promise.all(v.attachments.map(toWireAttachment)),
        })),
      ),
    };
  }

  if (payload.requestType === "material") {
    return {
      ...base,
      requestType: "Material Entry & Exit",
      mrCreatedBy: payload.material.details.createdBy,
      substanceDestination: payload.material.details.substanceDestination,
      driverId: payload.material.details.driverReceiverId,
      mrCompanyAddress: payload.material.details.companyAddress,
      vehiclePlateNo: payload.material.details.vehiclePlateNo,
      materials: await Promise.all(
        payload.material.items.map(async (m) => ({
          inOut: m.inOut,
          returnable: m.returnable,
          description: m.description,
          quantity: m.quantity,
          uom: m.uom,
          pat: m.pat,
          remarks: m.remarks,
          attachments: await Promise.all(m.attachments.map(toWireAttachment)),
        })),
      ),
    };
  }

  return {
    ...base,
    requestType: "Equipment",
    epCreatedBy: payload.equipmentDetails.createdBy,
    epCprExpiryDate: payload.equipmentDetails.cprExpiryDate,
    equipments: await Promise.all(
      payload.equipment.map(async (e) => ({
        typeModel: e.typeModel,
        plateNo: e.plateNo,
        name: e.name,
        operatorLicenseNo: e.operatorLicenseNo,
        remarks: e.remarks,
        attachments: await Promise.all(e.attachments.map(toWireAttachment)),
      })),
    ),
  };
}
