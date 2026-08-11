import { nanoid } from "nanoid";
import { useFieldArray, useFormContext } from "react-hook-form";
import { RepeatableSection } from "./RepeatableSection";
import { RepeatableCard } from "./RepeatableCard";
import { AttachmentDropzone } from "../upload/AttachmentDropzone";
import { TextField } from "../fields/TextField";
import { DateTimeField } from "../fields/DateTimeField";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";

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
}: {
  parentName: string;
  showExpiryDate?: boolean;
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
          <TextField
            name={`${name}.${index}.description`}
            label="Document Description"
            required
            placeholder="CPR / Passport / ID"
          />
          <TextField
            name={`${name}.${index}.remarks`}
            label="Attachment Remarks"
            placeholder="Optional"
          />
          {showExpiryDate && (
            <DateTimeField
              name={`${name}.${index}.expiryDate`}
              label="Document Expiry Date"
              helperText="Optional"
              showTime={false}
            />
          )}
        </RepeatableCard>
      )}
    />
  );
}
