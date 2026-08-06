import type { FormValues } from "../schemas/formSchema";
import type { SubmissionPayload } from "../data/payloadTypes";

function formatDuration(hours?: number, minutes?: number): string | undefined {
  if (!hours && !minutes) return undefined;
  const h = String(hours ?? 0).padStart(2, "0");
  const m = String(minutes ?? 0).padStart(2, "0");
  return `${h}:${m}:00`;
}

export function buildSubmissionPayload(values: FormValues): SubmissionPayload {
  const base = {
    visitDateTime: (values.visitDateTime as Date).toISOString(),
    visitDuration: formatDuration(
      values.visitDurationHours,
      values.visitDurationMinutes,
    ),
    companyName: values.companyName,
    contactEmail: values.contactEmail || undefined,
    aldurContactPerson: values.aldurContactPerson,
    department: values.department as string,
    visitPurpose: values.visitPurpose,
    requestRemarks: values.requestRemarks || undefined,
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
        attachments: v.attachments,
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
          attachments: m.attachments,
        })),
      },
    };
  }

  return {
    ...base,
    requestType: "equipment",
    equipment: (values.equipment ?? []).map((e) => ({
      id: e.id,
      typeModel: e.typeModel,
      plateNo: e.plateNo,
      name: e.name,
      operatorLicenseNo: e.operatorLicenseNo,
      remarks: e.remarks,
      attachments: e.attachments,
    })),
  };
}
