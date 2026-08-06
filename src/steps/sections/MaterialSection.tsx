import { nanoid } from "nanoid";
import { useFieldArray, useFormContext } from "react-hook-form";
import { TextField } from "../../components/fields/TextField";
import { TextAreaField } from "../../components/fields/TextAreaField";
import { SelectField } from "../../components/fields/SelectField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import {
  IN_OUT_OPTIONS,
  RETURNABLE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../utils/constants";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";

function blankMaterial() {
  return {
    id: nanoid(),
    inOut: "",
    returnable: "",
    description: "",
    quantity: "",
    uom: "",
    pat: "",
    remarks: "",
    attachments: [],
  };
}

export function MaterialSection() {
  const {
    control,
    formState: { errors },
    clearErrors,
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "materials",
  });
  const arrayError = getFieldError(errors, "materials");

  useEnsureOneEntry(fields, append, blankMaterial);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Material Request Details
        </h3>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <TextField
            name="materialDetails.createdBy"
            label="Created By"
            required
          />
          <TextField
            name="materialDetails.substanceDestination"
            label="Substance Destination"
            required
          />
          <TextField
            name="materialDetails.driverReceiverId"
            label="ID of Driver / Receiver"
            required
          />
          <TextField
            name="materialDetails.companyAddress"
            label="Company Address"
            required
          />
          <TextField
            name="materialDetails.vehiclePlateNo"
            label="Vehicle Plate No."
            required
          />
        </div>
      </div>

      <RepeatableSection
        title="Materials"
        items={fields}
        addLabel="+ Add Material Item"
        emptyMessage="No materials added yet. Add at least one item to continue."
        error={arrayError}
        onAdd={() => {
          append(blankMaterial());
          clearErrors("materials");
        }}
        renderItem={(_field, index) => (
          <RepeatableCard
            title={`Material ${index + 1}`}
            removeLabel="Remove Material"
            onRemove={() => remove(index)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                name={`materials.${index}.inOut`}
                label="In / Out"
                options={IN_OUT_OPTIONS}
                required
              />
              <SelectField
                name={`materials.${index}.returnable`}
                label="Returnable"
                options={RETURNABLE_OPTIONS}
                required
              />
            </div>
            <TextField
              name={`materials.${index}.description`}
              label="Material Description"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name={`materials.${index}.quantity`}
                label="Quantity"
                required
              />
              <TextField
                name={`materials.${index}.uom`}
                label="UOM"
                required
                helperText="Unit of measure"
              />
            </div>
            <SelectField
              name={`materials.${index}.pat`}
              label="PAT"
              options={YES_NO_OPTIONS}
              required
            />
            <TextAreaField
              name={`materials.${index}.remarks`}
              label="Remarks"
              placeholder="Optional"
              rows={2}
            />
            <AttachmentList parentName={`materials.${index}`} />
          </RepeatableCard>
        )}
      />
    </div>
  );
}
