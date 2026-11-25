import { useState } from 'react'
import { CrmApiError, errorMessage } from '@/api/crmClient'
import { useToast } from '@/components/feedback/toastContext'
import { Button, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { createSection, deleteSection, updateSection, type ObjectKey } from '../api'
import { FieldLabel, Select, inputClass } from '../fields/FieldInput'
import type { FieldSectionDef } from '../fields/types'
import { useInvalidateConfig, useObjectInfo } from '../hooks'

/** New section, or rename / describe an existing one. */
export function SectionFormDialog({ object, section, onClose }: { object: ObjectKey; section?: FieldSectionDef; onClose: () => void }) {
  const info = useObjectInfo(object)
  const invalidate = useInvalidateConfig()
  const toast = useToast()
  const [name, setName] = useState(section?.name ?? '')
  const [description, setDescription] = useState(section?.description ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    const body = { name: name.trim(), description: description.trim() || null }
    if (!body.name) return setError('Enter a section name.')
    setBusy(true)
    try {
      if (section) await updateSection(section.id, section.version, body)
      else await createSection(object, body)
      await invalidate()
      toast.success(section ? 'Section saved' : `Section "${body.name}" added`)
      onClose()
    } catch (e) {
      setError(e instanceof CrmApiError && e.errors.name ? e.errors.name : errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open title={section ? `Edit section "${section.name}"` : `New ${info.singular} section`} onClose={onClose} maxWidth={500}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : section ? 'Save section' : 'Create section'}</Button></>}>
      <form className="space-y-4 p-[22px]" onSubmit={(e) => { e.preventDefault(); void save() }}>
        <div>
          <FieldLabel htmlFor="section-name" required>Section name</FieldLabel>
          <input id="section-name" value={name} maxLength={80} placeholder="e.g. Compliance" onChange={(e) => { setName(e.target.value); setError(null) }}
            aria-invalid={!!error} className={cn(inputClass, error && 'border-brand')} />
          {error && <span role="alert" className="text-brand-dark mt-1 block text-xs">{error}</span>}
        </div>
        <div>
          <FieldLabel htmlFor="section-description">Description</FieldLabel>
          <textarea id="section-description" rows={2} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)}
            className={cn(inputClass, 'h-auto py-2')} />
          <span className="text-subtle mt-1 block text-xs">Shown to admins here; forms show the section name only.</span>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Deletes a section. A section with fields (deleted ones included) moves them to another section first, so no
 * field is left without a section; the last section can't be deleted.
 */
export function DeleteSectionDialog({ section, sections, onClose }: { section: FieldSectionDef; sections: FieldSectionDef[]; onClose: () => void }) {
  const invalidate = useInvalidateConfig()
  const toast = useToast()
  const others = sections.filter((s) => s.id !== section.id)
  const [moveTo, setMoveTo] = useState(others[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const count = section.fieldCount + section.deletedFieldCount

  return (
    <Modal open title={`Delete section "${section.name}"?`} onClose={onClose} maxWidth={460}
      footer={<><Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={busy || !others.length} onClick={async () => {
          setBusy(true)
          try {
            await deleteSection(section.id, section.version, count > 0 ? moveTo : undefined)
            await invalidate()
            toast.success(count > 0 ? `Section deleted; its fields moved to ${others.find((s) => s.id === moveTo)?.name}` : 'Section deleted')
            onClose()
          } catch (e) {
            toast.error(errorMessage(e))
          } finally {
            setBusy(false)
          }
        }}>Delete section</Button></>}>
      <div className="space-y-3 p-[22px] text-sm">
        {count > 0 ? (
          <>
            <p className="m-0">This section has {count} field{count === 1 ? '' : 's'}. They move to the section you choose; no values change.</p>
            <div>
              <FieldLabel htmlFor="move-to">Move its fields to</FieldLabel>
              <Select id="move-to" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                {others.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </div>
          </>
        ) : <p className="m-0">The section is empty, so nothing else changes.</p>}
      </div>
    </Modal>
  )
}
