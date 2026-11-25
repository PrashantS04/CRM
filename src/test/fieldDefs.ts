/**
 * Field definitions for unit and component tests. `contactFields()` is the Person configuration as the backend
 * seeds it from the client field map (BE migrations 003 and 005, checked row by row by the backend's
 * ContactFieldMapConformanceTest), trimmed to what the form rules read.
 */
import type { ServerPicklistValue } from '@/features/records/api'
import type { DataType, DisplayCondition, FieldDef } from '@/features/records/fields/types'

export function fieldDef(apiName: string, dataType: DataType, extra: Partial<FieldDef> = {}): FieldDef {
  return {
    id: `person-${apiName}`, object: 'person', apiName, label: apiName, help: null, dataType, picklist: null,
    mandatory: false, expected: false, sensitive: false, defaultValue: null, showInList: false, maxLength: null,
    decimalPlaces: null, sortOrder: 0, active: true, version: 0, storage: 'CUSTOM', systemKey: null, placeholder: null,
    width: 'HALF', validation: {}, showOnCreate: true, showOnDetail: true, listOrder: 0, searchable: false,
    filterable: true, sortable: true, editableAfterCreate: true, requiredLocked: false, section: 'Details',
    displayRules: {}, formula: null, optionsFrom: null, arm: 'BOTH', system: false, deletable: true, canEdit: true,
    operators: [], ...extra,
  }
}

const when = (field: string, operator: DisplayCondition['operator'], value?: unknown): DisplayCondition[] => [
  { field, operator, value },
]
const both = (c: DisplayCondition[]) => ({ visibleWhen: c, requiredWhen: c })

let order = 0
const f = (apiName: string, label: string, dataType: DataType, section: string, extra: Partial<FieldDef> = {}) =>
  fieldDef(apiName, dataType, { label, section, sortOrder: (order += 10), ...extra })

/** The Person (Contact) fields of the client field map, as seeded. */
export function contactFields(): FieldDef[] {
  order = 0
  const broker = [
    { field: 'personTypes', operator: 'CONTAINS_ANY', value: ['BROKER'] },
    { field: '$linkedEntityType', operator: 'IN', value: ['AGGREGATOR_GROUP', 'AGGREGATOR_OFFICE'] },
  ] as DisplayCondition[]
  return [
    f('personTypes', 'Type of contact', 'MULTI_PICKLIST', 'Classification', { picklist: 'PERSON_TYPE', mandatory: true, arm: 'CREDIT' }),
    f('investorSubType', 'Type of investor', 'PICKLIST', 'Classification', { picklist: 'INVESTOR_SUBTYPE', arm: 'CAPITAL' }),
    f('serviceProviderTypes', 'Type of service provider', 'MULTI_PICKLIST', 'Classification', { picklist: 'SERVICE_PROVIDER_TYPE' }),
    f('firstName', 'First Name', 'TEXT', 'Personal details', { mandatory: true }),
    f('lastName', 'Last Name', 'TEXT', 'Personal details', { mandatory: true }),
    f('preferredName', 'Preferred name', 'TEXT', 'Personal details'),
    f('dateOfBirth', 'Date of Birth', 'DATE', 'Personal details'),
    f('street', 'Address line 1', 'TEXT', 'Personal details', { mandatory: true }),
    f('addressLine2', 'Address line 2', 'TEXT', 'Personal details', { mandatory: true }),
    f('suburb', 'Suburb or city', 'TEXT', 'Personal details', { mandatory: true }),
    f('state', 'State or region', 'TEXT', 'Personal details', { mandatory: true }),
    f('postcode', 'Postcode', 'TEXT', 'Personal details', { mandatory: true }),
    f('country', 'Country', 'TEXT', 'Personal details', { mandatory: true, defaultValue: 'Australia' }),
    f('phones', 'Phones', 'PHONE_LIST', 'Personal details', { picklist: 'PHONE_LABEL', mandatory: true }),
    f('emails', 'Email', 'EMAIL_LIST', 'Personal details', { picklist: 'EMAIL_LABEL', mandatory: true }),
    f('linkedinUrl', 'LinkedIn profile', 'URL', 'Personal details'),
    f('webpage', 'Webpage', 'URL', 'Personal details'),
    f('soleTrader', 'Sole trader', 'PICKLIST', 'Legal details', { picklist: 'YES_NO' }),
    f('abn', 'ABN', 'TEXT', 'Legal details', { validation: { format: 'ABN' }, displayRules: both(when('soleTrader', 'EQUALS', 'YES')) }),
    f('tradingName', 'Trading name', 'TEXT', 'Legal details'),
    f('background', 'Background', 'LONG_TEXT', 'Contact profile'),
    f('preferredChannels', 'Preferred channel', 'MULTI_PICKLIST', 'Communication consent', { picklist: 'CONTACT_CHANNEL' }),
    f('preferredPhone', 'Preferred phone', 'PHONE', 'Communication consent', {
      optionsFrom: 'phones', displayRules: both(when('preferredChannels', 'CONTAINS_ANY', ['SMS', 'PHONE'])) }),
    f('preferredEmail', 'Preferred email', 'EMAIL', 'Communication consent', {
      optionsFrom: 'emails', displayRules: both(when('preferredChannels', 'CONTAINS_ANY', ['EMAIL'])) }),
    f('marketingConsent', 'Marketing consent', 'PICKLIST', 'Marketing', { picklist: 'MARKETING_CONSENT' }),
    f('marketingChannels', 'Marketing channels', 'MULTI_PICKLIST', 'Marketing', {
      picklist: 'CONTACT_CHANNEL', displayRules: both(when('marketingConsent', 'IS_NOT_EMPTY')) }),
    f('preferredMarketingPhone', 'Preferred marketing phone', 'PHONE', 'Marketing', {
      displayRules: both(when('marketingChannels', 'CONTAINS_ANY', ['SMS', 'PHONE'])) }),
    f('preferredMarketingEmail', 'Preferred marketing email', 'EMAIL', 'Marketing', {
      displayRules: both(when('marketingChannels', 'CONTAINS_ANY', ['EMAIL'])) }),
    f('marketingUpdatedBy', 'Last updated by', 'USER', 'Marketing', {
      formula: { fn: 'CHANGED_BY', fields: ['marketingConsent', 'marketingChannels'] }, showOnCreate: false }),
    f('linkedinDate', 'LinkedIn First Connect Date', 'DATE', 'Marketing / LinkedIn'),
    f('linkedinAgeWeeks', 'LinkedIn Connect Age (Weeks)', 'NUMBER', 'Marketing / LinkedIn', {
      formula: { fn: 'WEEKS_SINCE', field: 'linkedinDate' }, decimalPlaces: 0 }),
    f('mailchimpAdded', 'Mailchimp Audience Added', 'CHECKBOX', 'Marketing / Mailchimp'),
    f('acr', 'ACR', 'TEXT', 'Broker profile', { displayRules: { visibleWhen: broker } }),
    f('acl', 'ACL', 'TEXT', 'Broker profile', { displayRules: { visibleWhen: broker } }),
    f('industryBody', 'Industry Body', 'PICKLIST', 'Broker profile', { picklist: 'INDUSTRY_BODY', displayRules: { visibleWhen: broker } }),
  ]
}

const values = (...pairs: [string, string][]): ServerPicklistValue[] =>
  pairs.map(([code, label]) => ({ code, label, arm: 'BOTH', active: true, system: false, parent: null }) as ServerPicklistValue)

/** The option lists the contact fields above use, with the field map's values. */
export const CONTACT_PICKLISTS: Record<string, { values: ServerPicklistValue[] }> = {
  PERSON_TYPE: { values: values(['BROKER', 'Broker'], ['BORROWER', 'Borrower'], ['INVESTOR', 'Investor'], ['NOT_YET_KNOWN', 'Not yet known']) },
  INVESTOR_SUBTYPE: { values: values(['PRIVATE_WEALTH', 'Private Wealth']) },
  SERVICE_PROVIDER_TYPE: { values: values(['CONSTRUCTION', 'Construction'], ['LEGAL_COMPLIANCE', 'Legal & Compliance']) },
  PHONE_LABEL: { values: values(['OFFICE', 'Business'], ['BUSINESS_2', 'Business 2'], ['MOBILE', 'Mobile'], ['HOME', 'Home'], ['OTHER', 'Other']) },
  EMAIL_LABEL: { values: values(['BUSINESS', 'Business'], ['BUSINESS_2', 'Business 2'], ['PERSONAL', 'Personal'], ['OTHER', 'Other']) },
  YES_NO: { values: values(['YES', 'Yes'], ['NO', 'No']) },
  CONTACT_CHANNEL: { values: values(['SMS', 'SMS'], ['EMAIL', 'Email'], ['PHONE', 'Phone']) },
  MARKETING_CONSENT: { values: values(['OPTED_IN', 'Opted in'], ['OPTED_OUT', 'Opted out']) },
  INDUSTRY_BODY: { values: values(['MFAA', 'MFAA'], ['FBAA', 'FBAA'], ['CAFBA', 'CAFBA']) },
}

/** A complete, valid new Person under the field map. */
export function validContact(): Record<string, unknown> {
  return {
    personTypes: ['BROKER'], firstName: 'Ava', lastName: 'Nguyen', street: '1 George St', addressLine2: 'Level 2', suburb: 'Sydney',
    state: 'NSW', postcode: '2000', country: 'Australia',
    phones: [{ label: 'MOBILE', value: '0412 345 678', primary: true }],
    emails: [{ label: 'BUSINESS', value: 'ava@example.test', primary: true }],
  }
}
