import { nanoid } from "nanoid";
import { useFieldArray, useFormContext } from "react-hook-form";
import { RepeatableSection } from "./RepeatableSection";
import { RepeatableCard } from "./RepeatableCard";
import { AttachmentDropzone } from "../upload/AttachmentDropzone";
import { TextField } from "../fields/TextField";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";

function blankAttachment() {
  return { id: nanoid(), file: undefined, description: "", remarks: "" };
}

export function AttachmentList({ parentName }: { parentName: string }) {
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
          onRemove={() => remove(index)}
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
        </RepeatableCard>
      )}
    />
  );
}
