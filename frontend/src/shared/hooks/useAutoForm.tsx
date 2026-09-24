import { type JSX, type SyntheticEvent, useCallback, useState } from 'react'
import { z } from 'zod'

import { formatCellValue } from '@/shared/lib/index.js'
import { Input, Select, Toggle } from '@/shared/ui/inputs/index.js'

export type FieldType = 'text' | 'number' | 'email' | 'select' | 'toggle'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldDefinition {
  name: string
  type?: FieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: FieldOption[]
  hint?: string
  disabled?: boolean
  /** Min value for number fields */
  min?: number
  /** Max value for number fields */
  max?: number
}

type FieldErrors = Record<string, string | undefined>

interface UseAutoFormProps<T extends Record<string, unknown>> {
  fields: FieldDefinition[]
  schema: z.ZodType
  onSubmit: (data: T) => void | Promise<void>
  initialValues?: Partial<T>
}

interface UseAutoFormReturn<T extends Record<string, unknown>> {
  values: T
  errors: FieldErrors
  isSubmitting: boolean
  submitError: string | null
  handleChange: (name: string, value: unknown) => void
  handleSubmit: (e: SyntheticEvent) => void
  reset: () => void
}

export function useAutoForm<T extends Record<string, unknown> = Record<string, unknown>> ({
  fields,
  schema,
  onSubmit,
  initialValues
}: UseAutoFormProps<T>): UseAutoFormReturn<T> {
  const [values, setValues] = useState<T>(() => getInitialValues(fields, initialValues))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setSubmitError(null)
    setErrors((prev) => {
      if (name in prev) {
        const { [name]: _, ...rest } = prev
        return rest
      }
      return prev
    })
  }, [])

  const handleSubmit = useCallback((e: SyntheticEvent) => {
    e.preventDefault()
    const validationErrors = validateWithZod(schema, values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const result = onSubmit(values)
      void Promise.resolve(result)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : 'Submission failed'
          setSubmitError(message)
          console.error(error) // eslint-disable-line no-console -- intentional error logging
        })
        .finally(() => { setIsSubmitting(false) })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Submission failed'
      setSubmitError(message)
      setIsSubmitting(false)
      console.error(error) // eslint-disable-line no-console -- intentional error logging
    }
  }, [schema, values, onSubmit])

  const reset = useCallback(() => {
    setValues(getInitialValues(fields, initialValues))
    setErrors({})
    setSubmitError(null)
    setIsSubmitting(false)
  }, [fields, initialValues])

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    handleSubmit,
    reset
  }
}

interface FieldRendererProps {
  field: FieldDefinition
  value: unknown
  error?: string
  onChange: (name: string, value: unknown) => void
}

export function FieldRenderer ({
  field,
  value,
  error,
  onChange
}: FieldRendererProps): JSX.Element {
  const type = field.type ?? 'text'

  if (type === 'toggle') {
    return (
      <Toggle
        checked={value === true}
        onChange={(checked) => { onChange(field.name, checked) }}
        label={field.label}
        disabled={field.disabled}
      />
    )
  }

  if (type === 'select') {
    return (
      <Select
        label={field.label}
        required={field.required}
        error={error}
        hint={field.hint}
        placeholder={field.placeholder}
        disabled={field.disabled}
        options={field.options ?? []}
        value={formatCellValue(value)}
        onChange={(selected) => { onChange(field.name, selected) }}
      />
    )
  }

  return (
    <Input
      type={type}
      label={field.label}
      required={field.required}
      error={error}
      hint={field.hint}
      placeholder={field.placeholder}
      disabled={field.disabled}
      value={formatCellValue(value)}
      onChange={(e) => { onChange(field.name, e.target.value) }}
    />
  )
}

function buildFieldSchema (field: FieldDefinition): z.ZodType {
  switch (field.type) {
    case 'number':
      return buildNumberSchema(field, field.required === true)
    case 'email':
      return field.required === true
        ? z.string().min(1, 'Required').pipe(z.email({ message: 'Invalid email' }))
        : z.string().pipe(z.email({ message: 'Invalid email' })).optional().or(z.literal(''))
    case 'toggle':
      return z.boolean()
    case 'select':
      return buildEnumSchema(field.options?.map((o) => o.value) ?? [], field.required === true)
    default:
      return field.required === true
        ? z.string().min(1, 'Required')
        : z.string().optional()
  }
}

export function buildFormSchema (fields: FieldDefinition[]): z.ZodObject<Record<string, z.ZodType>> {
  const shape: Record<string, z.ZodType> = {}
  for (const field of fields) {
    shape[field.name] = buildFieldSchema(field)
  }
  return z.object(shape)
}

function getInitialValues<T extends Record<string, unknown>> (fields: FieldDefinition[], initialValues?: Partial<T>): T {
  const values: Record<string, unknown> = { ...initialValues }
  for (const field of fields) {
    if (field.name in values) continue
    values[field.name] = field.type === 'toggle' ? false : ''
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- constructed Record<string,unknown> safely satisfies T constraint
  return values as T
}

function validateWithZod (
  schema: z.ZodType,
  values: Record<string, unknown>
): FieldErrors {
  const result = schema.safeParse(values)
  if (result.success) {
    return {}
  }

  const errors: FieldErrors = {}
  for (const { path: issuePath, message } of result.error.issues) {
    const [path] = issuePath
    if (typeof path === 'string' && !(path in errors)) {
      errors[path] = message
    }
  }
  return errors
}

function buildNumberSchema (field: FieldDefinition, required: boolean): z.ZodType {
  let inner = z.coerce.number(required ? { error: 'Required' } : undefined)
  if (field.min !== undefined) {
    inner = inner.min(field.min, { message: `Minimum value is ${String(field.min)}` })
  }
  if (field.max !== undefined) {
    inner = inner.max(field.max, { message: `Maximum value is ${String(field.max)}` })
  }
  return z.preprocess((v) => v === '' ? undefined : v, required ? inner : inner.optional())
}

function buildEnumSchema (optionValues: string[], required: boolean): z.ZodType {
  if (optionValues.length === 0) {
    return z.string()
  }
  const entries = Object.fromEntries(optionValues.map((v) => [v, v]))
  return required
    ? z.preprocess((v) => v === '' ? undefined : v, z.enum(entries, { error: 'Required' }))
    : z.preprocess((v) => v === '' ? undefined : v, z.enum(entries).optional())
}
