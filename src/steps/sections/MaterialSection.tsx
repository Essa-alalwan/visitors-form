import { nanoid } from "nanoid";
import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { TextField } from "../../components/fields/TextField";
import { TextAreaField } from "../../components/fields/TextAreaField";
import { SelectField } from "../../components/fields/SelectField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import { SearchInput } from "../../components/fields/SearchInput";
import { ConfirmModal } from "../../components/ConfirmModal";
import {
  IN_OUT_OPTIONS,
  RETURNABLE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../utils/constants";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";
import { useListSearch } from "../../hooks/useListSearch";

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

  const { query, setQuery, matches, hasQuery } = useListSearch<{
    description?: string;
  }>(control, "materials", ["description"]);
  const noResults =
    hasQuery && fields.length > 0 && fields.every((_field, index) => !matches(index));
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClearAll() {
    remove();
    append(blankMaterial());
    setQuery("");
    setConfirmClear(false);
  }

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

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search materials by description..."
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All Materials
        </button>
      </div>

      {noResults ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No materials match &ldquo;{query}&rdquo;.
        </p>
      ) : (
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
          renderItem={(_field, index) => {
            if (!matches(index)) return null;
            return (
              <RepeatableCard
                title={`Material ${index + 1}`}
                removeLabel="Remove Material"
                onRemove={index === 0 ? undefined : () => remove(index)}
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
            );
          }}
        />
      )}

      <ConfirmModal
        open={confirmClear}
        title="Clear all materials?"
        message="This will remove every material item you've added and start the list over with one blank entry."
        confirmLabel="Clear All"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
