import { Controller, useFormContext } from "react-hook-form";
import { Users, Package, Truck } from "lucide-react";
import clsx from "clsx";
import { FieldError } from "../feedback/FieldError";
import { getFieldError } from "../../utils/getFieldError";

const REQUEST_TYPES = [
  {
    value: "visitors",
    title: "Visitors",
    description: "Bring people on site for a field or office visit",
    icon: Users,
  },
  {
    value: "material",
    title: "Material Entry & Exit",
    description: "Deliver or remove materials or substances",
    icon: Package,
  },
  {
    value: "equipment",
    title: "Equipment",
    description: "Bring vehicles or equipment on site",
    icon: Truck,
  },
] as const;

export function RequestTypeSelector() {
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const error = getFieldError(errors, "requestType");

  return (
    <div>
      <Controller
        name="requestType"
        control={control}
        render={({ field }) => (
          <div className="grid gap-3 sm:grid-cols-3">
            {REQUEST_TYPES.map(({ value, title, description, icon: Icon }) => {
              const selected = field.value === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  aria-pressed={selected}
                  className={clsx(
                    "flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all",
                    selected
                      ? "border-primary-600 bg-primary-50 shadow-sm shadow-primary-600/10"
                      : "border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      selected
                        ? "bg-primary-600 text-white"
                        : "bg-primary-100 text-primary-700",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-900">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-500">
                      {description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      />
      <FieldError message={error} />
    </div>
  );
}
