import type { FieldMapRow } from '@/types/domain'

type Row = [field: string, type: string, required: string, rule: string]

const rows = (list: Row[]): FieldMapRow[] =>
  list.map(([field, type, required, rule]) => ({
    field,
    type,
    required,
    rule: rule || 'Configured from field map',
  }))

/** Field-map blocks taken from EXT_CRM_Field_Map_MASTERContact.csv (as shown in the prototype). */
export const FIELD_MAP_CATALOG: Record<string, FieldMapRow[]> = {
  Person: rows([
    [
      'Type of contact',
      'Multi-select picklist',
      'Required',
      'Broker, Builder, Borrower, Investor, Adviser, Introducer, Support Staff, Service Provider',
    ],
    ['Type of investor', 'Single-select picklist', 'Optional', 'Private Wealth'],
    ['First Name', 'Text', 'Required', ''],
    ['Last Name', 'Text', 'Required', ''],
    ['Preferred name', 'Text', 'Optional', ''],
    ['Date of Birth', 'Text', 'Optional', ''],
    ['Address', 'Text', 'Required', 'Google address lookup'],
    ['Address line 1', 'Text', 'Required', ''],
    ['Address line 2', 'Text', 'Required', ''],
    ['Suburb or city', 'Text', 'Required', ''],
    ['State or region', 'Text', 'Required', ''],
    ['Postcode', 'Text', 'Required', ''],
    ['Country', 'Text', 'Required', ''],
    ['Phones', 'Picklist', 'Required', 'Business, Business 2, Mobile, Home, Other'],
    ['Email', 'Picklist', 'Required', 'Business, Business 2, Personal, Other'],
    ['LinkedIn profile', 'Text', 'Optional', ''],
    ['Webpage', 'Text', 'Optional', ''],
    ['Sole trader', 'Picklist', 'Optional', 'Yes, No'],
    ['ABN', 'Text', 'Required if sole trader', ''],
    ['Trading name', 'Text', 'Optional', ''],
    ['Background', 'Text', 'Optional', ''],
    [
      'Contact Source',
      'Multi-select picklist',
      'Optional',
      'Advertising, Broker, Database, Direct Outreach, Email Campaign, Website',
    ],
    ['Database source', 'Multi-select picklist', 'Optional', ''],
    ['Engagement style', 'Text', 'Optional', 'Capital'],
    [
      'Preferred investment offerings',
      'Multi-choice',
      'Optional',
      'PI First Mortgage Fund, PI Select Mortgage Trusts, QSR and Industrial',
    ],
    [
      'Preferred loan sector',
      'Multi-choice',
      'Optional',
      'Alternative, Commercial, Industrial, Mixed use, Residential, Retail',
    ],
    ['Industry of wealth', 'Multi-choice', 'Optional', ''],
    ['Holder ID', 'Text', 'Optional', 'Capital'],
    ['Registration details', 'Text', 'Optional', 'Capital'],
    ['Holder type', 'Text', 'Optional', 'Capital'],
    ['Preferred channel', 'Multi-select picklist', 'Optional', 'SMS, Email, Phone'],
    ['Marketing consent', 'Picklist', 'Optional', 'Opted in, Opted out'],
    ['Engagement Temperature', 'Picklist', 'Optional', 'Hot, Warm, Cold'],
    ['Data quality', 'Picklist', 'Optional', ''],
  ]),
  Entity: rows([
    ['Entity name', 'Text', 'Required', 'Existing CRM field'],
    ['Entity type', 'Dependent', 'System', 'Read from linked Entity context'],
    ['ACN', 'Text', 'Required', 'Unique. Hard gate G1'],
    ['ABN', 'Text', 'Required', 'Unique. Hard gate G1'],
    ['Date linked', 'Dependent', 'System', 'From Person–Entity link'],
    [
      'Entity Role',
      'Dependent',
      'Optional',
      'Decision maker, Influencer, Authorised signatory, Relationship manager, Gatekeeper, Finance lead, Trustee',
    ],
  ]),
  'Linked entities': rows([
    ['Entity', 'Dependent', 'Required', 'Linked entities block'],
    ['Entity type', 'Dependent', 'System', 'Linked entities block'],
    ['Date linked', 'Dependent', 'System', 'Linked entities block'],
    [
      'Entity Role',
      'Dependent',
      'Optional',
      'Decision maker, Influencer, Authorised signatory, Relationship manager, Gatekeeper, Finance lead, Trustee',
    ],
  ]),
  'Linked opportunities': rows([
    ['Opportunity name', 'Lookup', 'Dependent', ''],
    ['Opportunity type', 'Lookup', 'Dependent', 'Capital or Credit'],
    ['Opportunity role', 'Lookup', 'Dependent', ''],
    ['Stage', 'Lookup', 'Dependent', ''],
  ]),
  'Broker profile': rows([
    ['ACR', 'Text', 'Dependent', ''],
    ['ACL', 'Text', 'Dependent', ''],
    ['Industry Body', 'Picklist', 'Dependent', ''],
  ]),
  'Panel membership': rows([
    ['Aggregator or Aggregator Office', 'Lookup', 'Required', ''],
    ['Panel Start Date', 'Date', 'Required', ''],
    ['Panel End Date', 'Date', 'Required', ''],
    ['Panel Status', 'Picklist', 'Required', ''],
    ['Aggregator Broker ID', 'Alpha-numeric', 'System', ''],
    ['Aggregator BDM', 'Lookup Person', 'Required', ''],
    ['Commission rate percent', 'Percentage', 'Optional', ''],
    ['Commission to date', 'Formula', 'System', ''],
  ]),
  Documents: rows([
    ['Document name', 'Text', 'Required', ''],
    ['Document link', 'URL', 'Required', 'SharePoint link'],
    ['Added', 'Date', 'System', ''],
  ]),
  Note: rows([
    ['Subject', 'Text', 'Required', ''],
    ['Date logged', 'Date', 'Required', ''],
    ['Logged by', 'Text', 'System', ''],
  ]),
  Activity: rows([
    ['Type', 'Lookup', 'Required', ''],
    ['Subject', 'Text', 'Required', ''],
    ['With', 'Lookup', 'Required', ''],
    ['Timestamp', 'Date and time', 'System', ''],
  ]),
}

export interface ValidationRuleRow {
  fieldType: string
  available: string
  /** `G2 format` where the field type backs a hard gate. */
  hardGate: 'G2 format' | 'Configurable'
}

export const VALIDATION_RULES: ValidationRuleRow[] = [
  {
    fieldType: 'Text',
    available: 'Required, minimum/maximum length, regex pattern',
    hardGate: 'G2 format',
  },
  {
    fieldType: 'Numeric',
    available: 'Required, minimum/maximum value, decimal precision',
    hardGate: 'Configurable',
  },
  { fieldType: 'Boolean', available: 'Required true / false state', hardGate: 'Configurable' },
  {
    fieldType: 'Date',
    available: 'Required, before/after date, date range',
    hardGate: 'G2 format',
  },
  {
    fieldType: 'Single select',
    available: 'Required choice, allowed values',
    hardGate: 'Configurable',
  },
  {
    fieldType: 'Multi select',
    available: 'Minimum / maximum selections, allowed values',
    hardGate: 'Configurable',
  },
  {
    fieldType: 'Checkbox group',
    available: 'Required selection, selection count',
    hardGate: 'Configurable',
  },
  {
    fieldType: 'Radio group',
    available: 'Required choice, allowed values',
    hardGate: 'Configurable',
  },
]

export const HARD_GATE_REGISTER =
  'G1 duplicate ACN or ABN, G2 invalid format, G3 Closed Lost reason, G4 Lost/Dormant reason, G5 LMS field-map confirmation, G6 legal name before Booking or Closed Won.'
