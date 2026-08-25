import { nanoid } from "nanoid";
import { useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { RepeatableSection } from "./RepeatableSection";
import { RepeatableCard } from "./RepeatableCard";
import { AttachmentDropzone } from "../upload/AttachmentDropzone";
import { TextField } from "../fields/TextField";
import { SelectField } from "../fields/SelectField";
import { DateTimeField } from "../fields/DateTimeField";
import { ExpiryBadge } from "../feedback/ExpiryBadge";
import { FieldShell, inputBaseClass, inputBorderClass } from "../fields/FieldShell";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";

function AttachmentExpiryBadge({ name }: { name: string }) {
  const { control } = useFormContext();
  const value = useWatch({ control, name: `${name}.expiryDate` });
  return <ExpiryBadge date={value} />;
}

// Attachment #1 is always the National ID scan when `fixedValue` is set
// (visitors only) — not user-editable, and forced back to `fixedValue` on
// mount so a past request loaded for edit/duplicate (which may still carry
// old free-text here) gets normalized too.
function FixedAttachmentDescription({
  name,
  fixedValue,
}: {
  name: string;
  fixedValue: string;
}) {
  const { setValue, getValues } = useFormContext();

  useEffect(() => {
    if (getValues(name) !== fixedValue) {
      setValue(name, fixedValue, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FieldShell label="Document Description" htmlFor={name} required>
      <div className={`${inputBaseClass} ${inputBorderClass(false)} bg-slate-100 text-slate-500`}>
        {fixedValue}
      </div>
    </FieldShell>
  );
}

function blankAttachment() {
  return {
    id: nanoid(),
    file: undefined,
    description: "",
    remarks: "",
    expiryDate: undefined,
  };
}

export function AttachmentList({
  parentName,
  showExpiryDate = false,
  firstItemDescription,
  descriptionOptions,
}: {
  parentName: string;
  showExpiryDate?: boolean;
  /** When set, attachment #1's description is locked to this value instead
   * of being free text (e.g. "National ID" for visitors). */
  firstItemDescription?: string;
  /** When set, attachments after the first use this dropdown instead of
   * free text for their description. */
  descriptionOptions?: readonly string[];
}) {
  const {
    control,
    formState: { errors },
    clearErrors,
  } = useFormContext();
  const name = `${parentName}.attachments`;
  const { fields, append, remove } = useFieldArray({ control, name });
  const arrayError = getFieldError(errors, name);

  useEnsureOneEntry(fields, append, blankAttachment);

  return (
    <RepeatableSection
      title="Attachments"
      items={fields}
      addLabel="+ Add Attachment"
      emptyMessage="No attachments added yet."
      error={arrayError}
      onAdd={() => {
        append(blankAttachment());
        clearErrors(name);
      }}
      renderItem={(_field, index) => (
        <RepeatableCard
          title={`Attachment ${index + 1}`}
          removeLabel="Remove Attachment"
          onRemove={index === 0 ? undefined : () => remove(index)}
        >
          <AttachmentDropzone name={`${name}.${index}.file`} />
          {index === 0 && firstItemDescription ? (
            <FixedAttachmentDescription
              name={`${name}.${index}.description`}
              fixedValue={firstItemDescription}
            />
          ) : index > 0 && descriptionOptions ? (
            <SelectField
              name={`${name}.${index}.description`}
              label="Attachment Type"
              options={descriptionOptions}
              required
            />
          ) : (
            <TextField
              name={`${name}.${index}.description`}
              label="Document Description"
              required
              placeholder="CPR / Passport / ID"
            />
          )}
          <TextField
            name={`${name}.${index}.remarks`}
            label="Attachment Remarks"
            placeholder="Optional"
          />
          {showExpiryDate && (
            index === 0 && firstItemDescription ? (
              // This attachment's expiry is the same real-world fact as
              // the visitor's own CPR/Passport Expiry Date field above —
              // no separate input here, VisitorAttachmentExpiryAutofill
              // keeps this attachment's expiryDate mirrored to it. Still
              // show the status badge so the expiry status stays visible.
              <div className="flex justify-end">
                <AttachmentExpiryBadge name={`${name}.${index}`} />
              </div>
            ) : (
              <>
                <DateTimeField
                  name={`${name}.${index}.expiryDate`}
                  label="Document Expiry Date"
                  required
                  showTime={false}
                />
                <div className="-mt-3 flex justify-end">
                  <AttachmentExpiryBadge name={`${name}.${index}`} />
                </div>
              </>
            )
          )}
        </RepeatableCard>
      )}
    />
  );
}
