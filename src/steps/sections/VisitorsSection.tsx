import { nanoid } from "nanoid";
import { useEffect, useRef } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { SelectField } from "../../components/fields/SelectField";
import { TextField } from "../../components/fields/TextField";
import { DateTimeField } from "../../components/fields/DateTimeField";
import { CheckboxField } from "../../components/fields/CheckboxField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import { ExpiryBadge } from "../../components/feedback/ExpiryBadge";
import { VISIT_KINDS } from "../../utils/constants";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";
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

  useEnsureOneEntry(fields, append, blankVisitor);

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
        renderItem={(_field, index) => (
          <RepeatableCard
            title={`Visitor ${index + 1}`}
            removeLabel="Remove Visitor"
            onRemove={index === 0 ? undefined : () => remove(index)}
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
        )}
      />
    </div>
  );
}
