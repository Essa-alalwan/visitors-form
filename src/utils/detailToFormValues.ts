import { nanoid } from "nanoid";
import type { RequestDetail, DetailAttachment } from "../data/profileApi";
import type { FormValues } from "../schemas/formSchema";

function toAttachments(attachments: DetailAttachment[] | undefined) {
  return (attachments ?? []).map((a) => ({
    id: nanoid(),
    existingPath: a.existingPath,
    description: a.description,
    remarks: a.remarks,
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
    companyName: detail.companyName || "",
    contactEmail: detail.contactEmail || "",
    aldurContactPerson: detail.contactPerson || "",
    department: detail.department || "",
    visitPurpose: detail.visitPurpose || "",
    requestRemarks: detail.requestRemarks || "",
  };

  if (detail.requestType === "Visitors") {
    values.visitKind = detail.visitKind || "";
    values.visitors = (detail.visitors ?? []).map((v) => ({
      id: nanoid(),
      name: v.visitorName,
      cprOrPassport: v.cprPassport,
      jobTitle: v.jobTitle,
      cprExpiryDate: toDate(v.cprExpiryDate),
      attachments: toAttachments(v.attachments),
    }));
  }

  if (detail.requestType === "Material Entry & Exit") {
    values.materialDetails = {
      createdBy: detail.mrCreatedBy || "",
      substanceDestination: detail.substanceDestination || "",
      driverReceiverId: detail.driverId || "",
      companyAddress: detail.mrCompanyAddress || "",
      vehiclePlateNo: detail.vehiclePlateNo || "",
    };
    values.materials = (detail.materials ?? []).map((m) => ({
      id: nanoid(),
      inOut: m.inOut,
      returnable: m.returnable,
      description: m.description,
      quantity: m.quantity,
      uom: m.uom,
      pat: m.pat,
      remarks: m.remarks,
      attachments: toAttachments(m.attachments),
    }));
  }

  if (detail.requestType === "Equipment") {
    values.equipmentDetails = {
      createdBy: detail.epCreatedBy || "",
      cprExpiryDate: toDate(detail.epCprExpiryDate),
    };
    values.equipment = (detail.equipments ?? []).map((e) => ({
      id: nanoid(),
      typeModel: e.typeModel,
      plateNo: e.plateNo,
      name: e.name,
      operatorLicenseNo: e.operatorLicenseNo,
      remarks: e.remarks,
      attachments: toAttachments(e.attachments),
    }));
  }

  return values;
}
