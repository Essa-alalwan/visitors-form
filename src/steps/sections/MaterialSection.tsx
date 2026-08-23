import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { TextField } from "../../components/fields/TextField";
import { TextAreaField } from "../../components/fields/TextAreaField";
import { SelectField } from "../../components/fields/SelectField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import { SearchInput } from "../../components/fields/SearchInput";
import { SortSelect } from "../../components/fields/SortSelect";
import { ConfirmModal } from "../../components/ConfirmModal";
import {
  IN_OUT_OPTIONS,
  RETURNABLE_OPTIONS,
  YES_NO_OPTIONS,
} from "../../utils/constants";
import { getFieldError, hasItemErrors } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";
import { useListSearch } from "../../hooks/useListSearch";
import { useListSort } from "../../hooks/useListSort";

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

  // Materials have no expiry-dated field at all, so this only ever offers
  // "Name (A-Z)" (sorted by description, the closest thing materials have
  // to a name) and "Original order" — no "Expiry status" option.
  const { sortBy, setSortBy, sortedIndexes, availableOptions } = useListSort<{
    description?: string;
  }>(control, "materials", {
    getName: (m) => m.description,
  });
  // See VisitorsSection.tsx: `sortedIndexes` (from a separate `useWatch`
  // subscription) can briefly lag one render behind `fields` right after a
  // remove() — filter out undefined to avoid crashing on a stale index.
  const orderedFields = sortedIndexes.map((i) => fields[i]).filter(Boolean);

  function handleClearAll() {
    remove();
    append(blankMaterial());
    setQuery("");
    setConfirmClear(false);
  }

  // Only one material card is ever expanded (editable) at a time — see
  // VisitorsSection.tsx for the full rationale of this pattern.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevLengthRef = useRef(0);
  const watchedMaterials = useWatch({ control, name: "materials" }) as
    | {
        description?: string;
        inOut?: string;
        returnable?: string;
        quantity?: string;
        uom?: string;
        pat?: string;
      }[]
    | undefined;

  function materialSummary(index: number): string {
    const m = watchedMaterials?.[index];
    if (!m) return "";
    const details = [
      m.inOut,
      m.returnable,
      [m.quantity, m.uom].filter(Boolean).join(" "),
      m.pat ? `PAT: ${m.pat}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const description = m.description || "(no description)";
    return details ? `${description} — ${details}` : description;
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
          items={orderedFields}
          addLabel="+ Add Material Item"
          emptyMessage="No materials added yet. Add at least one item to continue."
          error={arrayError}
          onAdd={() => {
            append(blankMaterial());
            clearErrors("materials");
          }}
          renderItem={(field) => {
            const index = fields.findIndex((f) => f.id === field.id);
            if (!matches(index)) return null;
            // An item with an unresolved error can't stay collapsed — it
            // must be visible (and in the DOM) for the invalid field to be
            // reachable and scrollable-to.
            const expanded =
              expandedId === field.id || hasItemErrors(errors, "materials", index);
            return (
              <RepeatableCard
                title={`Material ${index + 1}`}
                removeLabel="Remove Material"
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
                summary={materialSummary(index)}
                hasError={hasItemErrors(errors, "materials", index)}
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
