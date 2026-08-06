import { nanoid } from "nanoid";
import { useFieldArray, useFormContext } from "react-hook-form";
import { SelectField } from "../../components/fields/SelectField";
import { TextField } from "../../components/fields/TextField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import { VISIT_KINDS } from "../../utils/constants";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";

function blankVisitor() {
  return { id: nanoid(), name: "", cprOrPassport: "", jobTitle: "", attachments: [] };
}

export function VisitorsSection() {
  const {
    control,
    formState: { errors },
    clearErrors,
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "visitors",
  });
  const arrayError = getFieldError(errors, "visitors");

  useEnsureOneEntry(fields, append, blankVisitor);

  return (
    <div className="space-y-6">
      <SelectField
        name="visitKind"
        label="Visit Kind"
        options={VISIT_KINDS}
        required
      />

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
            onRemove={() => remove(index)}
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
            <TextField
              name={`visitors.${index}.jobTitle`}
              label="Job Title"
              required
            />
            <AttachmentList parentName={`visitors.${index}`} />
          </RepeatableCard>
        )}
      />
    </div>
  );
}
