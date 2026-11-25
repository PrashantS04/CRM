export interface CatalogField {
  field: string
  type: string
  required: string
  rule: string
}

export interface BlockNote {
  title: string
  description: string
}

export const FIELD_MAP_CATALOG: Record<string, CatalogField[]> = {
  Person: [
    {
      field: 'Type of contact',
      type: 'Multi-select picklist',
      required: 'Required',
      rule: 'Broker, Builder, Borrower, Investor, Adviser, Introducer, Support Staff, Service Provider, Servicing Client',
    },
    {
      field: 'Type of investor',
      type: 'Single-select picklist',
      required: 'Optional',
      rule: 'Private Wealth',
    },
    { field: 'First Name', type: 'Text', required: 'Required', rule: '' },
    { field: 'Last Name', type: 'Text', required: 'Required', rule: '' },
    { field: 'Preferred name', type: 'Text', required: 'Optional', rule: '' },
    { field: 'Date of Birth', type: 'Text', required: 'Optional', rule: '' },
    { field: 'Address', type: 'Text', required: 'Required', rule: 'Google address lookup' },
    { field: 'Address line 1', type: 'Text', required: 'Required', rule: '' },
    { field: 'Address line 2', type: 'Text', required: 'Required', rule: '' },
    { field: 'Suburb or city', type: 'Text', required: 'Required', rule: '' },
    { field: 'State or region', type: 'Text', required: 'Required', rule: '' },
    { field: 'Postcode', type: 'Text', required: 'Required', rule: '' },
    { field: 'Country', type: 'Text', required: 'Required', rule: '' },
    {
      field: 'Phones',
      type: 'Picklist',
      required: 'Required',
      rule: 'Business, Business 2, Mobile, Home, Other',
    },
    {
      field: 'Email',
      type: 'Picklist',
      required: 'Required',
      rule: 'Business, Business 2, Personal, Other',
    },
    { field: 'LinkedIn profile', type: 'Text', required: 'Optional', rule: '' },
    { field: 'Webpage', type: 'Text', required: 'Optional', rule: '' },
    { field: 'Sole trader', type: 'Picklist', required: 'Optional', rule: 'Yes, No' },
    { field: 'ABN', type: 'Text', required: 'Required if sole trader', rule: '' },
    { field: 'Trading name', type: 'Text', required: 'Optional', rule: '' },
    { field: 'Background', type: 'Text', required: 'Optional', rule: '' },
    {
      field: 'Contact Source',
      type: 'Multi-select picklist',
      required: 'Optional',
      rule:
        'Advertising, Broker, Database, Direct Outreach, Email Campaign, Employee Referral, External Distributor, ' +
        'External Referral, Google Search, Inbound Call, LendForGood, LinkedIn, Mailchimp Campaign, Media Article, ' +
        'Networking Event, Other, Phone Call, PrivateInvest Insights, Social Media, Website',
    },
    { field: 'Database source', type: 'Multi-select picklist', required: 'Optional', rule: '' },
    { field: 'Engagement style', type: 'Text', required: 'Optional', rule: 'Capital' },
    {
      field: 'Preferred investment offerings',
      type: 'Multi-choice',
      required: 'Optional',
      rule: 'PI First Mortgage Fund, PI Select Mortgage Trusts, Quick Service Retail (QSR) & Industrial, Managing Credit Books',
    },
    {
      field: 'Preferred loan sector',
      type: 'Multi-choice',
      required: 'Optional',
      rule: 'Alternative, Commercial, Industrial, Mixed use, Residential, Retail',
    },
    { field: 'Industry of wealth', type: 'Multi-choice', required: 'Optional', rule: '' },
    { field: 'Holder ID', type: 'Text', required: 'Optional', rule: 'Capital' },
    { field: 'Registration details', type: 'Text', required: 'Optional', rule: 'Capital' },
    { field: 'Holder type', type: 'Text', required: 'Optional', rule: 'Capital' },
    { field: 'Preferred channel', type: 'Multi-select picklist', required: 'Optional', rule: 'SMS, Email, Phone' },
    { field: 'Marketing consent', type: 'Picklist', required: 'Optional', rule: 'Opted in, Opted out' },
    { field: 'Engagement Temperature', type: 'Picklist', required: 'Optional', rule: 'Hot, Warm, Cold' },
    { field: 'Data quality', type: 'Picklist', required: 'Optional', rule: '' },
  ],
  Entity: [
    { field: 'Entity name', type: 'Text', required: 'Required', rule: 'Existing CRM field' },
    { field: 'Entity type', type: 'Dependent', required: 'System', rule: 'Read from linked Entity context' },
    { field: 'ACN', type: 'Text', required: 'Required', rule: 'Unique. Hard gate G1' },
    { field: 'ABN', type: 'Text', required: 'Required', rule: 'Unique. Hard gate G1' },
    { field: 'Date linked', type: 'Dependent', required: 'System', rule: 'From Person–Entity link' },
    {
      field: 'Entity Role',
      type: 'Dependent',
      required: 'Optional',
      rule: 'Decision maker, Influencer, Authorised signatory, Relationship manager, Gatekeeper, Finance lead, Trustee',
    },
  ],
  'Linked entities': [
    { field: 'Entity', type: 'Dependent', required: 'Required', rule: 'Linked entities block' },
    { field: 'Entity type', type: 'Dependent', required: 'System', rule: 'Linked entities block' },
    { field: 'Date linked', type: 'Dependent', required: 'System', rule: 'Linked entities block' },
    {
      field: 'Entity Role',
      type: 'Dependent',
      required: 'Optional',
      rule: 'Decision maker, Influencer, Authorised signatory, Relationship manager, Gatekeeper, Finance lead, Trustee',
    },
  ],
  'Linked opportunities': [
    { field: 'Opportunity name', type: 'Lookup', required: 'Dependent', rule: '' },
    { field: 'Opportunity type', type: 'Lookup', required: 'Dependent', rule: 'Capital or Credit' },
    { field: 'Opportunity role', type: 'Lookup', required: 'Dependent', rule: '' },
    { field: 'Stage', type: 'Lookup', required: 'Dependent', rule: '' },
  ],
  'Broker profile': [
    { field: 'ACR', type: 'Text', required: 'Dependent', rule: '' },
    { field: 'ACL', type: 'Text', required: 'Dependent', rule: '' },
    { field: 'Industry Body', type: 'Picklist', required: 'Dependent', rule: '' },
  ],
  'Panel membership': [
    { field: 'Aggregator or Aggregator Office', type: 'Lookup', required: 'Required', rule: '' },
    { field: 'Panel Start Date', type: 'Date', required: 'Required', rule: '' },
    { field: 'Panel End Date', type: 'Date', required: 'Required', rule: '' },
    { field: 'Panel Status', type: 'Picklist', required: 'Required', rule: '' },
    { field: 'Aggregator Broker ID', type: 'Alpha-numeric', required: 'System', rule: '' },
    { field: 'Aggregator BDM', type: 'Lookup Person', required: 'Required', rule: '' },
    { field: 'Commission rate percent', type: 'Percentage', required: 'Optional', rule: '' },
    { field: 'Commission to date', type: 'Formula', required: 'System', rule: '' },
  ],
  Documents: [
    { field: 'Document name', type: 'Text', required: 'Required', rule: '' },
    { field: 'Document link', type: 'URL', required: 'Required', rule: 'SharePoint link' },
    { field: 'Added', type: 'Date', required: 'System', rule: '' },
  ],
  Note: [
    { field: 'Subject', type: 'Text', required: 'Required', rule: '' },
    { field: 'Date logged', type: 'Date', required: 'Required', rule: '' },
    { field: 'Logged by', type: 'Text', required: 'System', rule: '' },
  ],
  Activity: [
    { field: 'Type', type: 'Lookup', required: 'Required', rule: '' },
    { field: 'Subject', type: 'Text', required: 'Required', rule: '' },
    { field: 'With', type: 'Lookup', required: 'Required', rule: '' },
    { field: 'Timestamp', type: 'Date and time', required: 'System', rule: '' },
  ],
  'Loan Opportunity': [
    { field: 'Identifier', type: 'Text', required: 'System', rule: 'Shared LMS key' },
    { field: 'Project name', type: 'Text', required: 'Required', rule: '' },
    { field: 'Reference', type: 'Text', required: 'System', rule: '' },
    { field: 'Owner', type: 'User lookup', required: 'Required', rule: '' },
    {
      field: 'Source channel',
      type: 'Picklist',
      required: 'Expected at creation',
      rule: 'Broker, Referral, Direct outreach, Inbound enquiry, Marketing campaign, Event, Distributor, Database',
    },
    { field: 'Loan amount requested', type: 'Currency', required: 'Required', rule: '' },
    {
      field: 'Appetite band',
      type: 'Formula',
      required: 'System',
      rule: 'Below appetite, Low, Core, Upper, Above appetite',
    },
    { field: 'Interest type', type: 'Picklist', required: 'Optional', rule: 'Capitalised, Prepaid, Serviced' },
    {
      field: 'Primary security type',
      type: 'Picklist',
      required: 'Expected from stage 2',
      rule: 'Development, Land, Property',
    },
    { field: 'Primary security sector', type: 'Picklist', required: 'Expected from stage 2', rule: 'LMS list' },
    { field: 'Probability', type: 'Percentage', required: 'Optional', rule: 'Owner maintained' },
    { field: 'Expected settlement date', type: 'Date', required: 'Optional', rule: '' },
    { field: 'Lost reason', type: 'Picklist', required: 'Required for Closed Lost', rule: 'G3 hard gate' },
    { field: 'Lost description', type: 'Long text', required: 'Required for Closed Lost', rule: '' },
    { field: 'Date entered stage', type: 'Date', required: 'System', rule: '' },
    { field: 'Days in stage', type: 'Formula', required: 'System', rule: '' },
    { field: 'LMS status', type: 'Lookup', required: 'System', rule: 'Read only after handoff' },
  ],
}

export const BLOCK_NOTES: Record<string, { helper: string; rules: BlockNote[] }> = {
  Person: {
    helper:
      'Person maps to the source Contact object. Linked entities, opportunities, Broker profile, Panel membership, Notes, Activities and Documents retain their own source blocks.',
    rules: [
      { title: 'Person and links', description: 'Mapped from Contact records' },
      { title: 'Entity identity', description: 'ACN and ABN remain protected by G1' },
      { title: 'Dynamic fields', description: 'Additional fields remain configurable' },
    ],
  },
  Entity: {
    helper:
      'Entity maps legal organizations (Companies, Trusts, Partnerships). Strict ACN and ABN uniqueness is guarded by Hard Gate G1.',
    rules: [
      { title: 'Entity identity', description: 'ACN and ABN remain protected by G1' },
      { title: 'Check digit gates', description: 'ACN (mod 10) and ABN (mod 89) validated on save' },
      { title: 'Dynamic fields', description: 'Custom fields inherit metadata permissions' },
    ],
  },
  'Linked entities': {
    helper: 'Bi-directional relationships between natural persons and legal entities.',
    rules: [
      { title: 'Relationship roles', description: 'Director, Shareholder, Signatory, etc.' },
      { title: 'Primary designation', description: 'Reports inherit primary entity categorization' },
      { title: 'Dynamic links', description: 'Links do not duplicate party records' },
    ],
  },
  'Linked opportunities': {
    helper: 'Direct associations between individuals/entities and credit or capital deals.',
    rules: [
      { title: 'Deal roles', description: 'Borrower, Guarantor, Sponsor, Investor' },
      { title: 'Cross-workstream', description: 'Supports both Credit and Capital opportunities' },
      { title: 'Stage progression', description: 'Opportunity progression updates relationship state' },
    ],
  },
  'Broker profile': {
    helper: 'Specific regulatory and compliance accreditation details for commercial credit brokers.',
    rules: [
      { title: 'Credit representative', description: 'ACR and ACL registration numbers' },
      { title: 'Industry compliance', description: 'MFAA or FBAA membership validation' },
      { title: 'Aggregator linkage', description: 'Tied to active panel aggregator office' },
    ],
  },
  'Panel membership': {
    helper: 'Commercial aggregator panel agreements, tier statuses, and trail commission mappings.',
    rules: [
      { title: 'Agreement dates', description: 'Tracks panel start and expiry periods' },
      { title: 'BDM assignment', description: 'Dedicated PrivateInvest relationship manager' },
      { title: 'Commercial terms', description: 'Commission schedules mirror LMS contracts' },
    ],
  },
  Documents: {
    helper: 'Compliance, identity verification, and financial documentation checklist.',
    rules: [
      { title: 'Document verification', description: 'ID, Trust Deeds, Financial Statements' },
      { title: 'SharePoint sync', description: 'Files link securely to enterprise storage' },
      { title: 'Stage prerequisites', description: 'Required documents act as stage gates' },
    ],
  },
  Note: {
    helper: 'Chronological team notes, meeting minutes, and credit observation logs.',
    rules: [
      { title: 'Audit integrity', description: 'Author-stamped and timestamped' },
      { title: 'Edit grace window', description: 'Editable within configured window (e.g. 24h)' },
      { title: 'Privacy scope', description: 'Visible across CRM operational teams' },
    ],
  },
  Activity: {
    helper: 'System activity stream tracking phone calls, emails, tasks, and stage changes.',
    rules: [
      { title: 'Automatic tracking', description: 'Generated on status and record transitions' },
      { title: 'Interaction logging', description: 'User-logged calls and correspondence' },
      { title: 'Full audit history', description: 'Persisted in PostgreSQL audit trail' },
    ],
  },
  'Loan Opportunity': {
    helper: 'Commercial real estate debt pipeline deals from initial enquiry to LMS booking handoff.',
    rules: [
      { title: 'Commercial origination', description: '9 pipeline stages from Enquiry to Booked' },
      { title: 'Tranche structuring', description: 'Facility limits, loan purpose, and security' },
      { title: 'LMS Handoff', description: 'Seamless field-mapped export at settlement' },
    ],
  },
}
