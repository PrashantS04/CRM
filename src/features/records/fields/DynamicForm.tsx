import { cn } from '@/lib/cn'
import type { RecordConfig } from '../hooks'
import { FieldInput, FieldLabel } from './FieldInput'
import { FieldValue } from './FieldValue'
import { isRequiredNow, isVisible, listItems, type RecordContext } from './logic'
import { isComputed, type FieldDef, type Values } from './types'

/** Groups fields into their sections, in field order (sections follow the order of their first field). */
export function groupBySection(fields: FieldDef[]): [string, FieldDef[]][] {
  const map = new Map<string, FieldDef[]>()
  for (const f of fields) {
    const sec = f.section?.trim() || 'Details'
    if (!map.has(sec)) map.set(sec, [])
    map.get(sec)!.push(f)
  }
  return Array.from(map.entries())
}

export const isWide = (f: FieldDef) =>
  f.width === 'FULL' || f.dataType === 'MULTI_PICKLIST' || f.dataType === 'LONG_TEXT' || f.dataType === 'PHONE_LIST' || f.dataType === 'EMAIL_LIST'

/**
 * The inputs of a set of fields. Display conditions apply as the user types: a field shows only when its
 * visibleWhen conditions hold and is marked required when its requiredWhen conditions hold. A field that picks
 * from the record's phone or email list offers that list's current values. CRM-set fields show read-only.
 */
export function FieldGrid({ fields, values, errors, onChange, mode, context = {}, config }: {
  fields: FieldDef[]
  values: Values
  errors: Record<string, string>
  onChange: (apiName: string, value: unknown) => void
  mode: 'create' | 'edit'
  context?: RecordContext
  config: RecordConfig
}) {
  const shown = fields.filter((f) => isVisible(f, values, context))
  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {shown.map((f, i) => {
        if (isComputed(f)) {
          return (
            <div key={f.apiName} className={cn('animate-fade-up', isWide(f) && 'sm:col-span-2')} style={{ '--stagger': i } as React.CSSProperties}>
              <FieldLabel help={f.help}>{f.label}</FieldLabel>
              <div className="text-text flex h-10 items-center text-sm">
                <FieldValue dataType={f.dataType} picklist={f.picklist} value={values[f.apiName]}
                  optionLabel={config.optionLabel} userName={config.userName} />
              </div>
              <span className="text-subtle block text-xs">Set by the CRM.</span>
            </div>
          )
        }
        const locked = mode === 'edit' && !f.editableAfterCreate
        const options = f.optionsFrom ? listItems(values[f.optionsFrom]).map((x) => x.value).filter((v) => v.trim()) : undefined
        return (
          <div key={f.apiName} className={cn('animate-fade-up', isWide(f) && 'sm:col-span-2')} style={{ '--stagger': Math.min(i, 12) } as React.CSSProperties}>
            <FieldInput field={f} value={values[f.apiName]} onChange={(v) => onChange(f.apiName, v)} error={errors[f.apiName]}
              required={isRequiredNow(f, values, context)} options={options} disabled={locked || !f.canEdit}
              picklists={config.picklists} users={config.users}
              hint={locked ? "Can't be changed after the record is saved." : !f.canEdit ? "You don't have permission to change this." : undefined} />
          </div>
        )
      })}
    </div>
  )
}

/** A full form: each section as a design card with its title bar. */
export function DynamicForm(props: Parameters<typeof FieldGrid>[0]) {
  const visible = props.fields.filter((f) => isVisible(f, props.values, props.context ?? {}))
  return (
    <div className="space-y-4">
      {groupBySection(visible).map(([title, secFields]) => (
        <section key={title} className="border-line bg-surface animate-fade-up overflow-hidden rounded-card border">
          <h3 className="bg-column border-line text-navy m-0 border-b px-4 py-3 text-[15px] font-bold">{title}</h3>
          <div className="p-4">
            <FieldGrid {...props} fields={secFields} />
          </div>
        </section>
      ))}
    </div>
  )
}
