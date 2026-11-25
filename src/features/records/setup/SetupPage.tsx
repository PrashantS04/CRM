import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui'
import { cn } from '@/lib/cn'
import { AuditLogTab } from './AuditLogTab'
import { BusinessSettingsTab } from './BusinessSettingsTab'
import { LabelsTab } from './LabelsTab'
import { ObjectFieldsTab } from './ObjectFieldsTab'
import { ObjectRulesTab } from './ObjectRulesTab'
import { PicklistsTab } from './PicklistsTab'

const TABS = [
  { id: 'person-fields', label: 'Person fields', sf: 'Object Manager → Fields' },
  { id: 'person-rules', label: 'Person rules', sf: 'Duplicate rules, record name' },
  { id: 'entity-fields', label: 'Entity fields', sf: 'Object Manager → Fields' },
  { id: 'entity-rules', label: 'Entity rules', sf: 'Duplicate and matching rules' },
  { id: 'picklists', label: 'Picklists', sf: 'Global value sets' },
  { id: 'objects', label: 'Objects and fields', sf: 'Object Manager' },
  { id: 'settings', label: 'Business settings', sf: 'Custom metadata' },
  { id: 'audit', label: 'Audit log', sf: 'Setup Audit Trail' },
] as const

type TabId = (typeof TABS)[number]['id']

/**
 * Settings → Setup: the Salesforce-style admin area for Person and Entity. Every change applies at once, with
 * no release (brief §2.2). The open tab is kept in the URL (?tab=) so it can be linked and survives a reload.
 */
export function SetupPage() {
  const [params, setParams] = useSearchParams()
  const tab: TabId = TABS.find((t) => t.id === params.get('tab'))?.id ?? 'person-fields'
  const select = (id: TabId) => setParams(id === 'person-fields' ? {} : { tab: id }, { replace: true })

  return (
    <>
      <div className="animate-fade-up">
        <PageHeader title="Setup" description="Fields, rules, picklists, labels and settings for Person and Entity. Changes apply at once; no release is needed." />
      </div>
      <div role="tablist" aria-label="Setup" className="border-line animate-fade-up mb-5 flex flex-wrap gap-x-1 border-b" style={{ '--stagger': 1 } as React.CSSProperties}>
        {TABS.map((t) => (
          <button key={t.id} id={`setup-tab-${t.id}`} type="button" role="tab" aria-selected={tab === t.id} aria-controls="setup-panel"
            onClick={() => select(t.id)}
            className={cn('-mb-px border-b-2 px-3 py-2 text-left text-sm transition-colors',
              tab === t.id ? 'border-brand text-ink font-semibold' : 'text-muted hover:text-ink border-transparent')}>
            {t.label}
            <span className="text-subtle block text-[11px] font-normal">Salesforce: {t.sf}</span>
          </button>
        ))}
      </div>
      <div id="setup-panel" role="tabpanel" aria-labelledby={`setup-tab-${tab}`} key={tab} className="animate-fade">
        {tab === 'person-fields' && <ObjectFieldsTab key="person" object="person" />}
        {tab === 'person-rules' && <ObjectRulesTab key="person" object="person" />}
        {tab === 'entity-fields' && <ObjectFieldsTab key="entity" object="entity" />}
        {tab === 'entity-rules' && <ObjectRulesTab key="entity" object="entity" />}
        {tab === 'picklists' && <PicklistsTab />}
        {tab === 'objects' && <LabelsTab />}
        {tab === 'settings' && <BusinessSettingsTab />}
        {tab === 'audit' && <AuditLogTab />}
      </div>
    </>
  )
}
