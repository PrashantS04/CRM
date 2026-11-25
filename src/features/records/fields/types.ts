// Field registry shapes, as returned by GET /api/metadata/objects/{object}/fields.
// Nothing here names a Person field: forms, lists and filters are built from these definitions.

export type DataType =
  | 'TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'CURRENCY'
  | 'PERCENT'
  | 'DATE'
  | 'CHECKBOX'
  | 'BOOLEAN'
  | 'PICKLIST'
  | 'MULTI_PICKLIST'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'USER'
  /** Several phone numbers, each labelled (Mobile, Business...), one of them primary. */
  | 'PHONE_LIST'
  /** Several email addresses, each labelled (Business, Personal...), one of them primary. */
  | 'EMAIL_LIST'

/** One item of a phone or email list. `label` is a code from the field's label list. */
export interface ListItem {
  label: string
  value: string
  primary: boolean
}

/** A display condition: compares a field (or a fact about the record, e.g. "$linkedEntityType") with a value. */
export interface DisplayCondition {
  field: string
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'CONTAINS_ANY' | 'IS_EMPTY' | 'IS_NOT_EMPTY' | 'IS_TRUE' | 'IS_FALSE'
  value?: unknown
}

/** When a field shows and when it is required; every condition of a list must hold. */
export interface DisplayRules {
  visibleWhen?: DisplayCondition[]
  requiredWhen?: DisplayCondition[]
}

/** A value the CRM works out: weeks or days since a date, or who last changed some fields. */
export interface Formula {
  fn: 'WEEKS_SINCE' | 'DAYS_SINCE' | 'CHANGED_BY'
  field?: string
  fields?: string[]
}

export type Storage = 'CORE' | 'CHILD' | 'CUSTOM'

export type Operator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'CONTAINS'
  | 'NOT_CONTAINS'
  | 'STARTS_WITH'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'BETWEEN'
  | 'BEFORE'
  | 'AFTER'
  | 'IN'
  | 'NOT_IN'
  | 'CONTAINS_ANY'
  | 'CONTAINS_ALL'
  | 'EXCLUDES'
  | 'IS_TRUE'
  | 'IS_FALSE'
  | 'IS_ME'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY'

export interface Validation {
  minLength?: number
  min?: number
  max?: number
  pattern?: string
  patternMessage?: string
  /** ABN or ACN: the number's check digits are checked. */
  format?: 'ABN' | 'ACN'
}

export interface FieldDef {
  id: string
  object: string
  apiName: string
  label: string
  help: string | null
  dataType: DataType
  /** Picklist set code for PICKLIST / MULTI_PICKLIST. */
  picklist: string | null
  mandatory: boolean
  expected: boolean
  sensitive: boolean
  defaultValue: unknown
  showInList: boolean
  maxLength: number | null
  decimalPlaces: number | null
  sortOrder: number
  active: boolean
  version: number
  storage: Storage
  systemKey: string | null
  placeholder: string | null
  width: 'HALF' | 'FULL'
  validation: Validation
  showOnCreate: boolean
  showOnDetail: boolean
  listOrder: number
  searchable: boolean
  filterable: boolean
  sortable: boolean
  editableAfterCreate: boolean
  requiredLocked: boolean
  section: string
  displayRules: DisplayRules
  formula: Formula | null
  /** For a phone or email field: picks one of the record's items in this list field. */
  optionsFrom: string | null
  /** The business arm the field serves (the field map's BU column). */
  arm: 'CREDIT' | 'CAPITAL' | 'BOTH'
  /** From the field view: system fields can't be deleted; this user may edit the value. */
  system: boolean
  deletable: boolean
  canEdit: boolean
  operators: Operator[]
}

/** A persisted section heading that groups fields and defines section display order. */
export interface FieldSectionDef {
  id: string
  object: string
  name: string
  description: string | null
  sortOrder: number
  version: number
  fieldCount: number
  activeFieldCount: number
  deletedFieldCount: number
}

export type Values = Record<string, unknown>

export interface RecordField {
  id: string
  label: string
  dataType: DataType
  value: unknown
  sortOrder: number
  version: number
}

/** A one-off field typed on the New Person form, before the Person exists. */
export interface DraftRecordField {
  key: string
  label: string
  dataType: DataType
  value: unknown
}

/** One numbered filter of a list view. A list value means "any of" (equals A, B). */
export interface Condition {
  field: string
  operator: Operator
  value?: unknown
}

/** What a list shows: "show me", numbered filters and their logic, columns and sort (Salesforce: a list view). */
export interface ViewDefinition {
  ownerScope: 'ALL' | 'MINE'
  conditions: Condition[]
  /** e.g. "1 AND (2 OR 3)"; blank means all filters with AND. */
  logic: string
  /** Empty means the fields set to show in the list. */
  columns: string[]
  sort: { field: string; dir: 'ASC' | 'DESC' }[]
}

/** Types a one-off (record-level) field can have; dropdowns need a shared field. */
export const RECORD_FIELD_TYPES: { value: DataType; label: string }[] = [
  { value: 'TEXT', label: 'Text' },
  { value: 'LONG_TEXT', label: 'Long text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'CURRENCY', label: 'Currency' },
  { value: 'PERCENT', label: 'Percent' },
  { value: 'DATE', label: 'Date' },
  { value: 'BOOLEAN', label: 'Yes / No' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'URL', label: 'Web address' },
]

/** Types an admin can give a new shared field. */
export const SHARED_FIELD_TYPES: { value: DataType; label: string }[] = [
  ...RECORD_FIELD_TYPES,
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'PICKLIST', label: 'Picklist' },
  { value: 'MULTI_PICKLIST', label: 'Multi-select picklist' },
  { value: 'PHONE_LIST', label: 'Phone list (labelled, one primary)' },
  { value: 'EMAIL_LIST', label: 'Email list (labelled, one primary)' },
]

/** Types whose definition has an option list (dropdown options, or the labels of a list). */
export const hasOptions = (t: DataType) => t === 'PICKLIST' || t === 'MULTI_PICKLIST' || t === 'PHONE_LIST' || t === 'EMAIL_LIST'
export const isList = (t: DataType) => t === 'PHONE_LIST' || t === 'EMAIL_LIST'
/** A field the CRM fills in (formula or stamp): never typed into. */
export const isComputed = (f: Pick<FieldDef, 'formula'>) => !!f.formula && Object.keys(f.formula).length > 0

/** Operator names as Salesforce list views word them. */
export const OPERATOR_LABELS: Record<Operator, string> = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not equal to',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'does not contain',
  STARTS_WITH: 'starts with',
  GT: 'greater than',
  GTE: 'greater or equal',
  LT: 'less than',
  LTE: 'less or equal',
  BETWEEN: 'between',
  BEFORE: 'before',
  AFTER: 'after',
  IN: 'equals any of',
  NOT_IN: 'not equal to any of',
  CONTAINS_ANY: 'includes',
  CONTAINS_ALL: 'includes all of',
  EXCLUDES: 'excludes',
  IS_TRUE: 'is true',
  IS_FALSE: 'is false',
  IS_ME: 'is me',
  IS_EMPTY: 'is empty',
  IS_NOT_EMPTY: 'is not empty',
}

/** Date operators read better as "on or before" / "on or after". */
export const DATE_OPERATOR_LABELS: Partial<Record<Operator, string>> = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not equal to',
  LTE: 'on or before',
  GTE: 'on or after',
}

/** Salesforce relative dates. LAST_N_DAYS / NEXT_N_DAYS take a number: "LAST_N_DAYS:30". */
export const RELATIVE_DATES: { value: string; label: string }[] = [
  { value: 'TODAY', label: 'Today' },
  { value: 'YESTERDAY', label: 'Yesterday' },
  { value: 'TOMORROW', label: 'Tomorrow' },
  { value: 'THIS_WEEK', label: 'This week' },
  { value: 'LAST_WEEK', label: 'Last week' },
  { value: 'NEXT_WEEK', label: 'Next week' },
  { value: 'THIS_MONTH', label: 'This month' },
  { value: 'LAST_MONTH', label: 'Last month' },
  { value: 'NEXT_MONTH', label: 'Next month' },
  { value: 'THIS_QUARTER', label: 'This quarter' },
  { value: 'LAST_QUARTER', label: 'Last quarter' },
  { value: 'NEXT_QUARTER', label: 'Next quarter' },
  { value: 'THIS_YEAR', label: 'This year' },
  { value: 'LAST_YEAR', label: 'Last year' },
  { value: 'NEXT_YEAR', label: 'Next year' },
  { value: 'LAST_N_DAYS', label: 'Last N days' },
  { value: 'NEXT_N_DAYS', label: 'Next N days' },
]

export const NO_VALUE_OPERATORS: Operator[] = ['IS_EMPTY', 'IS_NOT_EMPTY', 'IS_TRUE', 'IS_FALSE', 'IS_ME']
