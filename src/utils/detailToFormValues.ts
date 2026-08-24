import { nanoid } from "nanoid";
import type { RequestDetail, DetailAttachment } from "../data/profileApi";
import type { FormValues } from "../schemas/formSchema";

// Defensive against the backend (or a transitional deploy of it) sending a
// Sheets cell back as a raw number instead of a string — e.g. a CPR number,
// vehicle plate, or license number. Every text field loaded from a past
// request goes through this rather than trusting the wire type.
function str(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

function toAttachments(attachments: DetailAttachment[] | undefined) {
  return (attachments ?? []).map((a) => ({
    id: nanoid(),
    existingPath: str(a.existingPath),
    description: str(a.description),
    remarks: str(a.remarks),
    expiryDate: toDate(a.expiryDate),
    docValidity: str(a.docValidity),
  }));
}

function toDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

const REQUEST_TYPE_MAP: Record<string, FormValues["requestType"]> = {
  Visitors: "visitors",
  "Material Entry & Exit": "material",
  Equipment: "equipment",
};

export function detailToFormValues(detail: RequestDetail): Partial<FormValues> {
  const values: Partial<FormValues> = {
    requestType: REQUEST_TYPE_MAP[detail.requestType],
    visitDateTime: toDate(detail.visitDateTime),
    companyName: str(detail.companyName),
    contactEmail: str(detail.contactEmail),
    contactPhone: str(detail.contactPhone),
    aldurContactPerson: str(detail.contactPerson),
    department: str(detail.department),
    visitPurpose: str(detail.visitPurpose),
    requestRemarks: str(detail.requestRemarks),
  };

  if (detail.requestType === "Visitors") {
    values.visitKind = str(detail.visitKind);
    values.visitors = (detail.visitors ?? []).map((v) => {
      const cprOrPassport = str(v.cprPassport);
      return {
        id: nanoid(),
        name: str(v.visitorName),
        // Past submissions predate this toggle — infer it from the
        // existing value's shape rather than leaving it unset.
        cprType: (/^\d{9}$/.test(cprOrPassport)
          ? "National ID"
          : "Passport") as "National ID" | "Passport",
        cprOrPassport,
        jobTitle: str(v.jobTitle),
        cprExpiryDate: toDate(v.cprExpiryDate),
        attachments: toAttachments(v.attachments),
      };
    });
  }

  if (detail.requestType === "Material Entry & Exit") {
    values.materialDetails = {
      createdBy: str(detail.mrCreatedBy),
      substanceDestination: str(detail.substanceDestination),
      driverReceiverId: str(detail.driverId),
      companyAddress: str(detail.mrCompanyAddress),
      vehiclePlateNo: str(detail.vehiclePlateNo),
    };
    values.materials = (detail.materials ?? []).map((m) => ({
      id: nanoid(),
      inOut: str(m.inOut),
      returnable: str(m.returnable),
      description: str(m.description),
      quantity: str(m.quantity),
      uom: str(m.uom),
      pat: str(m.pat),
      remarks: str(m.remarks),
      attachments: toAttachments(m.attachments),
    }));
  }

  if (detail.requestType === "Equipment") {
    values.equipmentDetails = {
      createdBy: str(detail.epCreatedBy),
      cprExpiryDate: toDate(detail.epCprExpiryDate),
    };
    values.equipment = (detail.equipments ?? []).map((e) => ({
      id: nanoid(),
      typeModel: str(e.typeModel),
      plateNo: str(e.plateNo),
      name: str(e.name),
      operatorLicenseNo: str(e.operatorLicenseNo),
      remarks: str(e.remarks),
      attachments: toAttachments(e.attachments),
    }));
  }

  return values;
}
