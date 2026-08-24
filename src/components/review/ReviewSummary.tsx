import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { SummarySection, SummaryRow } from "./SummarySection";
import type { FormValues } from "../../schemas/formSchema";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  visitors: "Visitors",
  material: "Material Entry & Exit",
  equipment: "Equipment",
};

function attachmentNames(attachments?: { file?: File; description: string }[]) {
  if (!attachments || attachments.length === 0) return "No attachments";
  return attachments
    .map((a) => a.file?.name || "(no file)")
    .join(", ");
}

export function ReviewSummary() {
  const { watch } = useFormContext<FormValues>();
  const values = watch();

  const duration = values.visitDurationHours
    ? `${String(values.visitDurationHours).padStart(2, "0")}h`
    : null;

  return (
    <div className="space-y-4">
      <SummarySection title="Request Overview">
        <SummaryRow
          label="Request Type"
          value={values.requestType ? REQUEST_TYPE_LABELS[values.requestType] : null}
        />
        <SummaryRow
          label="Visit Date & Time"
          value={
            values.visitDateTime instanceof Date
              ? format(values.visitDateTime, "d MMM yyyy, h:mm a")
              : null
          }
        />
        <SummaryRow label="Visit Duration" value={duration} />
        <SummaryRow label="Company Name" value={values.companyName} />
        <SummaryRow label="Contact Email" value={values.contactEmail} />
        <SummaryRow
          label="Aldur II Contact Person"
          value={values.aldurContactPerson}
        />
        <SummaryRow label="Department" value={values.department} />
      </SummarySection>

      {values.requestType === "visitors" && (
        <SummarySection title={`Visitors (${values.visitors?.length ?? 0})`}>
          <SummaryRow label="Visit Type" value={values.visitKind} />
          {(values.visitKind === "Field Work" || values.visitKind === "Both") && (
            <SummaryRow
              label="PPE Confirmed"
              value={values.bringPPE ? "Yes" : null}
            />
          )}
          {(values.visitors ?? []).map((visitor, index) => (
            <div
              key={visitor.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="text-sm font-semibold text-slate-800">
                Visitor {index + 1}: {visitor.name || "(unnamed)"}
              </p>
              <p className="text-xs text-slate-500">
                {visitor.jobTitle} &middot; {visitor.cprOrPassport}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                CPR/Passport Expiry:{" "}
                {visitor.cprExpiryDate instanceof Date
                  ? format(visitor.cprExpiryDate, "d MMM yyyy")
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Attachments: {attachmentNames(visitor.attachments)}
              </p>
            </div>
          ))}
        </SummarySection>
      )}

      {values.requestType === "material" && (
        <>
          <SummarySection title="Material Request Details">
            <SummaryRow
              label="Created By"
              value={values.materialDetails?.createdBy}
            />
            <SummaryRow
              label="Substance Destination"
              value={values.materialDetails?.substanceDestination}
            />
            <SummaryRow
              label="ID of Driver / Receiver"
              value={values.materialDetails?.driverReceiverId}
            />
            <SummaryRow
              label="Company Address"
              value={values.materialDetails?.companyAddress}
            />
            <SummaryRow
              label="Vehicle Plate No."
              value={values.materialDetails?.vehiclePlateNo}
            />
          </SummarySection>
          <SummarySection title={`Materials (${values.materials?.length ?? 0})`}>
            {(values.materials ?? []).map((item, index) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <p className="text-sm font-semibold text-slate-800">
                  Item {index + 1}: {item.description || "(no description)"}
                </p>
                <p className="text-xs text-slate-500">
                  {item.inOut} &middot; {item.returnable} &middot; {item.quantity}{" "}
                  {item.uom} &middot; PAT: {item.pat}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Attachments: {attachmentNames(item.attachments)}
                </p>
              </div>
            ))}
          </SummarySection>
        </>
      )}

      {values.requestType === "equipment" && (
        <>
          <SummarySection title="Equipment Request Details">
            <SummaryRow
              label="Created By"
              value={values.equipmentDetails?.createdBy}
            />
            <SummaryRow
              label="CPR Expiry Date"
              value={
                values.equipmentDetails?.cprExpiryDate instanceof Date
                  ? format(values.equipmentDetails.cprExpiryDate, "d MMM yyyy")
                  : null
              }
            />
          </SummarySection>
          <SummarySection title={`Equipment (${values.equipment?.length ?? 0})`}>
          {(values.equipment ?? []).map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="text-sm font-semibold text-slate-800">
                Item {index + 1}: {item.name || "(unnamed)"}
              </p>
              <p className="text-xs text-slate-500">
                {item.typeModel} &middot; Plate {item.plateNo} &middot; License{" "}
                {item.operatorLicenseNo}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Attachments: {attachmentNames(item.attachments)}
              </p>
            </div>
          ))}
          </SummarySection>
        </>
      )}
    </div>
  );
}
