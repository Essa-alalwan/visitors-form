import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { SelectField } from "../../components/fields/SelectField";
import { TextField } from "../../components/fields/TextField";
import { DateTimeField } from "../../components/fields/DateTimeField";
import { CheckboxField } from "../../components/fields/CheckboxField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import { Trash2 } from "lucide-react";
import { ExpiryBadge } from "../../components/feedback/ExpiryBadge";
import { worstExpiryStatus, expiryBadgeClasses } from "../../utils/expiryStatus";
import { SearchInput } from "../../components/fields/SearchInput";
import { ConfirmModal } from "../../components/ConfirmModal";
import { VISIT_KINDS } from "../../utils/constants";
import { getFieldError, hasItemErrors } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";
import { useListSearch } from "../../hooks/useListSearch";
import { useProfile } from "../../context/ProfileContext";

function VisitorCprExpiryBadge({ index }: { index: number }) {
  const { control } = useFormContext();
  const value = useWatch({ control, name: `visitors.${index}.cprExpiryDate` });
  return <ExpiryBadge date={value} />;
}

// Defaults the visitor's first attachment's Document Expiry Date to match
// their CPR/Passport Expiry Date, since that attachment is very often a
// scan of the same document — avoids retyping the same date twice. Only
// fills it in while it's still blank; never overwrites a value the user
// already set (e.g. because the attachment turned out to be something
// else with its own expiry).
function VisitorAttachmentExpiryAutofill({ index }: { index: number }) {
  const { control, setValue, getValues } = useFormContext();
  const cprExpiryDate = useWatch({
    control,
    name: `visitors.${index}.cprExpiryDate`,
  });

  useEffect(() => {
    if (!cprExpiryDate) return;
    const current = getValues(`visitors.${index}.attachments.0.expiryDate`);
    if (!current) {
      setValue(`visitors.${index}.attachments.0.expiryDate`, cprExpiryDate);
    }
  }, [cprExpiryDate, index, setValue, getValues]);

  return null;
}

function blankVisitor() {
  return {
    id: nanoid(),
    name: "",
    cprOrPassport: "",
    jobTitle: "",
    cprExpiryDate: undefined,
    attachments: [],
  };
}

export function VisitorsSection() {
  const {
    control,
    setValue,
    formState: { errors },
    clearErrors,
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "visitors",
  });
  const arrayError = getFieldError(errors, "visitors");
  const visitKind = useWatch({ control, name: "visitKind" });
  const requiresPPE = visitKind === "Field Work" || visitKind === "Both";
  const { profile, isVerified } = useProfile();
  const prefillApplied = useRef(false);

  const { query, setQuery, matches, hasQuery } = useListSearch<{
    name?: string;
    cprOrPassport?: string;
  }>(control, "visitors", ["name", "cprOrPassport"]);
  const noResults =
    hasQuery && fields.length > 0 && fields.every((_field, index) => !matches(index));
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClearAll() {
    remove();
    append(blankVisitor());
    setQuery("");
    setConfirmClear(false);
  }

  // Only one visitor card is ever expanded (editable) at a time — everything
  // else collapses into a one-line summary. `null` genuinely means "nothing
  // expanded," not a fallback signal, so collapsing the last card actually
  // stays collapsed instead of immediately re-expanding.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prevLengthRef = useRef(0);
  const watchedVisitors = useWatch({ control, name: "visitors" }) as
    | {
        name?: string;
        jobTitle?: string;
        cprOrPassport?: string;
        cprExpiryDate?: Date;
        attachments?: { expiryDate?: Date }[];
      }[]
    | undefined;

  function visitorSummary(index: number): string {
    const v = watchedVisitors?.[index];
    if (!v) return "";
    const details = [v.jobTitle, v.cprOrPassport].filter(Boolean).join(" · ");
    return details ? `${v.name || "(unnamed)"} — ${details}` : v.name || "(unnamed)";
  }

  function visitorStatusBadge(index: number) {
    const v = watchedVisitors?.[index];
    if (!v) return null;
    const status = worstExpiryStatus([
      v.cprExpiryDate,
      ...(v.attachments ?? []).map((a) => a.expiryDate),
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

  useEnsureOneEntry(fields, append, blankVisitor);

  // Whenever the list grows — first populated (fresh blank entry, a past
  // request loaded via Edit, a restored draft) or a new item appended —
  // expand the newest one and let everything else collapse. Sourced only
  // from `fields` (react-hook-form's own tracking ids), never from a
  // locally-constructed object: useFieldArray overwrites `.id` on append
  // with its own generated id, so a freshly-built blank item's `id` would
  // never match what actually ends up in `fields`.
  useEffect(() => {
    if (fields.length > prevLengthRef.current) {
      setExpandedId(fields[fields.length - 1].id);
    }
    prevLengthRef.current = fields.length;
  }, [fields]);

  // If a search narrows the list to exactly one visitor, jump straight to
  // editing it instead of leaving it collapsed and requiring an extra click.
  useEffect(() => {
    if (!hasQuery) return;
    const matching = fields.filter((_f, i) => matches(i));
    if (matching.length === 1) setExpandedId(matching[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!isVerified || !profile || prefillApplied.current || fields.length === 0) {
      return;
    }
    prefillApplied.current = true;

    if (profile.visitorName) setValue("visitors.0.name", String(profile.visitorName));
    if (profile.cprOrPassport) {
      setValue("visitors.0.cprOrPassport", String(profile.cprOrPassport));
    }
    if (profile.jobTitle) setValue("visitors.0.jobTitle", String(profile.jobTitle));
    if (profile.cprExpiryDate) {
      setValue("visitors.0.cprExpiryDate", new Date(profile.cprExpiryDate));
    }
    if (profile.ppeConfirmed === "Yes") {
      setValue("bringPPE", true);
    }
  }, [isVerified, profile, fields.length, setValue]);

  return (
    <div className="space-y-6">
      <SelectField
        name="visitKind"
        label="Visit Kind"
        options={VISIT_KINDS}
        optionLabels={{ Both: "Field Work and Office Work" }}
        required
      />

      {requiresPPE && (
        <CheckboxField
          name="bringPPE"
          label="I confirm I will bring appropriate PPE (Personal Protective Equipment) for this visit"
          required
        />
      )}

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Search visitors by name or CPR/passport..."
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear All Visitors
        </button>
      </div>

      {noResults ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No visitors match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <RepeatableSection
          title="Visitors"
          items={fields}
          addLabel="+ Add Another Visitor"
          emptyMessage="No visitors added yet. Add at least one visitor to continue."
          error={arrayError}
          onAdd={() => {
            append(blankVisitor());
            clearErrors("visitors");
          }}
          renderItem={(field, index) => {
            if (!matches(index)) return null;
            // An item with an unresolved error can't stay collapsed — it
            // must be visible (and in the DOM) for the invalid field to be
            // reachable and scrollable-to.
            const expanded =
              expandedId === field.id || hasItemErrors(errors, "visitors", index);
            return (
              <RepeatableCard
                title={`Visitor ${index + 1}`}
                removeLabel="Remove Visitor"
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
                summary={visitorSummary(index)}
                statusBadge={visitorStatusBadge(index)}
                hasError={hasItemErrors(errors, "visitors", index)}
              >
                <TextField
                  name={`visitors.${index}.name`}
                  label="Visitor Name"
                  required
                />
                <TextField
                  name={`visitors.${index}.cprOrPassport`}
                  label="CPR Card or Passport No"
                  required
                />
                <DateTimeField
                  name={`visitors.${index}.cprExpiryDate`}
                  label="CPR/Passport Expiry Date"
                  required
                  showTime={false}
                />
                <div className="-mt-3 flex justify-end">
                  <VisitorCprExpiryBadge index={index} />
                </div>
                <VisitorAttachmentExpiryAutofill index={index} />
                <TextField
                  name={`visitors.${index}.jobTitle`}
                  label="Job Title"
                  required
                />
                <AttachmentList parentName={`visitors.${index}`} showExpiryDate />
              </RepeatableCard>
            );
          }}
        />
      )}

      <ConfirmModal
        open={confirmClear}
        title="Clear all visitors?"
        message="This will remove every visitor you've added and start the list over with one blank entry."
        confirmLabel="Clear All"
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
