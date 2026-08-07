import { nanoid } from "nanoid";
import { useFieldArray, useFormContext } from "react-hook-form";
import { TextField } from "../../components/fields/TextField";
import { TextAreaField } from "../../components/fields/TextAreaField";
import { RepeatableSection } from "../../components/repeatable/RepeatableSection";
import { RepeatableCard } from "../../components/repeatable/RepeatableCard";
import { AttachmentList } from "../../components/repeatable/AttachmentList";
import { getFieldError } from "../../utils/getFieldError";
import { useEnsureOneEntry } from "../../hooks/useEnsureOneEntry";

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
    formState: { errors },
    clearErrors,
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "equipment",
  });
  const arrayError = getFieldError(errors, "equipment");

  useEnsureOneEntry(fields, append, blankEquipment);

  return (
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
      renderItem={(_field, index) => (
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
          <AttachmentList parentName={`equipment.${index}`} />
        </RepeatableCard>
      )}
    />
  );
}
