import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { TextField } from "../../components/fields/TextField";
import { TextAreaField } from "../../components/fields/TextAreaField";
import { DateTimeField } from "../../components/fields/DateTimeField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import { Trash2 } from "lucide-react";
import { ExpiryBadge } from "../../components/feedback/ExpiryBadge";
import { worstExpiryStatus, expiryBadgeClasses } from "../../utils/expiryStatus";
import { SearchInput } from "../../components/fields/SearchInput";
import { SortSelect } from "../../components/fields/SortSelect";
import { ConfirmModal } from "../../components/ConfirmModal";
import { getFieldError, hasItemErrors } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";
import { useListSearch } from "../../hooks/useListSearch";
import { useListSort } from "../../hooks/useListSort";

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

  const { sortBy, setSortBy, sortedIndexes, availableOptions } = useListSort<{
    name?: string;
    attachments?: { expiryDate?: Date }[];
  }>(control, "equipment", {
    getName: (e) => e.name,
    // Combines the shared CPR Expiry Date with this item's own attachment
    // expiry, same as equipmentStatusBadge below — "worst first" should
    // agree with what the badge itself shows.
    getExpiryDates: (e) => [cprExpiryDate, ...(e.attachments ?? []).map((a) => a.expiryDate)],
  });
  // See VisitorsSection.tsx: `sortedIndexes` (from a separate `useWatch`
  // subscription) can briefly lag one render behind `fields` right after a
  // remove() — filter out undefined to avoid crashing on a stale index.
  const orderedFields = sortedIndexes.map((i) => fields[i]).filter(Boolean);

  function handleClearAll() {
    remove();
    append(blankEquipment());
    setQuery("");
    setConfirmClear(false);
  }

  // Only one equipment card is ever expanded (editable) at a time — see
  // VisitorsSection.tsx for the full rationale of this pattern.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevLengthRef = useRef(0);
  const watchedEquipment = useWatch({ control, name: "equipment" }) as
    | {
        name?: string;
        typeModel?: string;
        plateNo?: string;
        operatorLicenseNo?: string;
        attachments?: { expiryDate?: Date }[];
      }[]
    | undefined;

  function equipmentSummary(index: number): string {
    const e = watchedEquipment?.[index];
    if (!e) return "";
    const details = [
      e.typeModel,
      e.plateNo ? `Plate ${e.plateNo}` : "",
      e.operatorLicenseNo ? `License ${e.operatorLicenseNo}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const name = e.name || "(unnamed)";
    return details ? `${name} — ${details}` : name;
  }

  // Combines the shared "CPR Expiry Date" (the person responsible, same
  // field for every item in this request) with this item's own attachment
  // expiry into one worst-case badge for the collapsed row.
  function equipmentStatusBadge(index: number) {
    const e = watchedEquipment?.[index];
    if (!e) return null;
    const status = worstExpiryStatus([
      cprExpiryDate,
      ...(e.attachments ?? []).map((a) => a.expiryDate),
    ]);
    if (!status) return null;
    return (
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${expiryBadgeClasses(status.tier)}`}
      >
        {status.label}
      </span>
    );
  }

  // See VisitorsSection.tsx for why this reads ids only from `fields`
  // (react-hook-form's own tracking ids), never from a locally-constructed
  // blank item — useFieldArray overwrites `.id` on append.
  useEffect(() => {
    if (fields.length > prevLengthRef.current) {
      setExpandedId(fields[fields.length - 1].id);
    }
    prevLengthRef.current = fields.length;
  }, [fields]);

  useEffect(() => {
    if (!hasQuery) return;
    const matching = fields.filter((_f, i) => matches(i));
    if (matching.length === 1) setExpandedId(matching[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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

      <div className="max-w-xs">
        <SortSelect value={sortBy} onChange={setSortBy} options={availableOptions} />
      </div>

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
          items={orderedFields}
          addLabel="+ Add Equipment Item"
          emptyMessage="No equipment added yet. Add at least one item to continue."
          error={arrayError}
          onAdd={() => {
            append(blankEquipment());
            clearErrors("equipment");
          }}
          renderItem={(field) => {
            const index = fields.findIndex((f) => f.id === field.id);
            if (!matches(index)) return null;
            // An item with an unresolved error can't stay collapsed — it
            // must be visible (and in the DOM) for the invalid field to be
            // reachable and scrollable-to.
            const expanded =
              expandedId === field.id || hasItemErrors(errors, "equipment", index);
            return (
              <RepeatableCard
                title={`Equipment ${index + 1}`}
                removeLabel="Remove Equipment"
                onRemove={
                  index === 0
                    ? undefined
                    : () => {
                        if (expandedId === field.id) setExpandedId(null);
                        remove(index);
                      }
                }
                collapsed={!expanded}
                onToggle={() => setExpandedId(expanded ? null : field.id)}
                summary={equipmentSummary(index)}
                statusBadge={equipmentStatusBadge(index)}
                hasError={hasItemErrors(errors, "equipment", index)}
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
