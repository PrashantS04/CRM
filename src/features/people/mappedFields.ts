import type { Person } from '@/types/domain'

export interface MappedFieldGroup {
  group: string
  fields: { label: string; value: string }[]
}

/**
 * Person values organised by the imported Contact field map (EXT_CRM_Field_Map_MASTERContact.csv).
 * Values the mock Person record does not hold are placeholders until the API supplies them.
 */
export function buildMappedPersonFields(person: Person): MappedFieldGroup[] {
  const isInvestor = person.type === 'Investor'
  const notApplicable = 'Not applicable'
  return [
    {
      group: 'Classification',
      fields: [
        { label: 'Type of contact', value: person.type },
        { label: 'Type of investor', value: isInvestor ? 'Private Wealth' : notApplicable },
      ],
    },
    {
      group: 'Personal details',
      fields: [
        { label: 'Preferred name', value: person.name.split(' ')[0] ?? person.name },
        { label: 'Phone', value: person.phone || 'Not entered' },
        { label: 'Email', value: person.email },
        { label: 'Address', value: 'Level 4, 100 Collins Street, Melbourne VIC 3000' },
      ],
    },
    {
      group: 'Contact profile',
      fields: [
        { label: 'Contact Source', value: 'Direct Outreach' },
        { label: 'Database source', value: 'PrivateInvest CRM' },
      ],
    },
    {
      group: 'Investor profile',
      fields: [
        {
          label: 'Preferred investment offerings',
          value: isInvestor ? 'PI First Mortgage Fund' : notApplicable,
        },
        {
          label: 'Preferred loan sector',
          value: isInvestor ? 'Commercial, Industrial' : notApplicable,
        },
      ],
    },
    {
      group: 'Communication consent',
      fields: [{ label: 'Preferred channel', value: 'Email, Phone' }],
    },
    {
      group: 'Marketing',
      fields: [
        { label: 'Marketing consent', value: 'Opted in' },
        { label: 'Marketing channels', value: 'Email' },
      ],
    },
    {
      group: 'Flag',
      fields: [
        { label: 'Engagement Temperature', value: person.status === 'Active' ? 'Warm' : 'Cold' },
        { label: 'Data quality', value: 'Complete' },
      ],
    },
  ]
}
