import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { TextField } from "../../components/fields/TextField";
import { TextAreaField } from "../../components/fields/TextAreaField";
import { DateTimeField } from "../../components/fields/DateTimeField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import { Trash2 } from "lucide-react";
import { ExpiryBadge } from "../../components/feedback/ExpiryBadge";
import { SearchInput } from "../../components/fields/SearchInput";
import { ConfirmModal } from "../../components/ConfirmModal";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";
import { useListSearch } from "../../hooks/useListSearch";

function blankEquipment() {
  return {
    id: nanoid(),
    typeModel: "",
    plateNo: "",
    name: "",
    operatorLicenseNo: "",
    remarks: "",
    attachments: [],
  };
}

export function EquipmentSection() {
  const {
    control,
    setValue,
    getValues,
    formState: { errors },
    clearErrors,
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "equipment",
  });
  const arrayError = getFieldError(errors, "equipment");
  const cprExpiryDate = useWatch({ control, name: "equipmentDetails.cprExpiryDate" });

  useEnsureOneEntry(fields, append, blankEquipment);

  const { query, setQuery, matches, hasQuery } = useListSearch<{
    name?: string;
    typeModel?: string;
    plateNo?: string;
    operatorLicenseNo?: string;
  }>(control, "equipment", ["name", "typeModel", "plateNo", "operatorLicenseNo"]);
  const noResults =
    hasQuery && fields.length > 0 && fields.every((_field, index) => !matches(index));
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClearAll() {
    remove();
    append(blankEquipment());
    setQuery("");
    setConfirmClear(false);
  }

  // Defaults each equipment item's first attachment's Document Expiry Date
  // to match the CPR Expiry Date above, same rationale as the visitor
  // version — avoids retyping the same date, only fills in while blank.
  useEffect(() => {
    if (!cprExpiryDate) return;
    fields.forEach((_field, index) => {
      const current = getValues(`equipment.${index}.attachments.0.expiryDate`);
      if (!current) {
        setValue(`equipment.${index}.attachments.0.expiryDate`, cprExpiryDate);
      }
    });
  }, [cprExpiryDate, fields, setValue, getValues]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Equipment Request Details
        </h3>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <TextField
            name="equipmentDetails.createdBy"
            label="Created By"
            required
          />
          <DateTimeField
            name="equipmentDetails.cprExpiryDate"
            label="CPR Expiry Date"
            required
            showTime={false}
          />
          <div className="-mt-2 flex justify-end">
            <ExpiryBadge date={cprExpiryDate} />
          </div>
        </div>
      </div>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search equipment by name, type, plate, or license no..."
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All Equipment
        </button>
      </div>

      {noResults ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No equipment matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <RepeatableSection
          title="Equipment List"
          items={fields}
          addLabel="+ Add Equipment Item"
          emptyMessage="No equipment added yet. Add at least one item to continue."
          error={arrayError}
          onAdd={() => {
            append(blankEquipment());
            clearErrors("equipment");
          }}
          renderItem={(_field, index) => {
            if (!matches(index)) return null;
            return (
              <RepeatableCard
                title={`Equipment ${index + 1}`}
                removeLabel="Remove Equipment"
                onRemove={index === 0 ? undefined : () => remove(index)}
              >
                <TextField
                  name={`equipment.${index}.typeModel`}
                  label="Equipment Type / Model"
                  required
                />
                <TextField
                  name={`equipment.${index}.plateNo`}
                  label="Plate No"
                  required
                />
                <TextField
                  name={`equipment.${index}.name`}
                  label="Name of Equipment"
                  required
                />
                <TextField
                  name={`equipment.${index}.operatorLicenseNo`}
                  label="Operator License No"
                  required
                />
                <TextAreaField
                  name={`equipment.${index}.remarks`}
                  label="Remarks"
                  placeholder="Optional"
                  rows={2}
                />
                <AttachmentList parentName={`equipment.${index}`} showExpiryDate />
              </RepeatableCard>
            );
          }}
        />
      )}

      <ConfirmModal
        open={confirmClear}
        title="Clear all equipment?"
        message="This will remove every equipment item you've added and start the list over with one blank entry."
        confirmLabel="Clear All"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
