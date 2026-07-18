import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

type SelectOption = { readonly label: string; readonly value: string };

interface BaseFieldProps<TFormValues extends FieldValues> {
  name: FieldPath<TFormValues>;
  control: Control<TFormValues>;
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

interface TextFieldProps<TFormValues extends FieldValues> extends BaseFieldProps<TFormValues> {
  type: 'text' | 'email' | 'number' | 'date' | 'tel';
  min?: number | string;
  max?: number | string;
  step?: number | string;
}

interface SelectFieldProps<TFormValues extends FieldValues> extends BaseFieldProps<TFormValues> {
  type: 'select';
  options: readonly SelectOption[];
  valueAsNumber?: boolean;
}

type FormFieldProps<TFormValues extends FieldValues> =
  | TextFieldProps<TFormValues>
  | SelectFieldProps<TFormValues>;

// ─── FormField ─────────────────────────────────────────────────────────────────
// Generic field wrapper using RHF Controller.
// Handles both input and select field types.
// Keeps all RHF wiring out of step components.

export function FormField<TFormValues extends FieldValues>({
  name,
  control,
  label,
  description,
  required,
  placeholder,
  className,
  ...rest
}: FormFieldProps<TFormValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;

        if (rest.type === 'select') {
          const { options, valueAsNumber } = rest as SelectFieldProps<TFormValues>;
          return (
            <Select
              {...field}
              label={label}
              error={errorMessage}
              description={description}
              options={options}
              placeholder={placeholder ?? `Select ${label.toLowerCase()}...`}
              required={required}
              className={className}
              value={field.value ?? ''}
              onChange={(e) => {
                if (valueAsNumber) {
                  const num = parseFloat(e.target.value);
                  field.onChange(isNaN(num) ? undefined : num);
                } else {
                  field.onChange(e.target.value);
                }
              }}
            />
          );
        }

        const { type, min, max, step } = rest as TextFieldProps<TFormValues>;

        return (
          <Input
            {...field}
            type={type}
            label={label}
            error={errorMessage}
            description={description}
            required={required}
            placeholder={placeholder}
            className={className}
            min={min}
            max={max}
            step={step}
            value={field.value ?? ''}
            onChange={(e) => {
              if (type === 'number') {
                const num = parseFloat(e.target.value);
                field.onChange(isNaN(num) ? undefined : num);
              } else {
                field.onChange(e.target.value);
              }
            }}
          />
        );
      }}
    />
  );
}
