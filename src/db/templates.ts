import type { AssetCategory, Criticality } from './types'

export interface AssetTemplate {
  name: string
  category: AssetCategory
  vendor: string
  vendorSupportUrl: string
  vendorSupportPhone: string
  defaultCriticality: Criticality
  group: string
}

export interface DependencyTemplate {
  upstreamName: string
  downstreamName: string
  description: string
}

export const assetTemplates: AssetTemplate[] = [
  // Email & Communication
  {
    name: 'Gmail / Google Workspace',
    category: 'SaaS',
    vendor: 'Google',
    vendorSupportUrl: 'https://support.google.com/a',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'Email & Communication',
  },
  {
    name: 'Microsoft 365 / Outlook',
    category: 'SaaS',
    vendor: 'Microsoft',
    vendorSupportUrl: 'https://support.microsoft.com/microsoft-365',
    vendorSupportPhone: '1-800-642-7676',
    defaultCriticality: 'Critical',
    group: 'Email & Communication',
  },
  {
    name: 'Slack',
    category: 'SaaS',
    vendor: 'Salesforce',
    vendorSupportUrl: 'https://slack.com/help',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Email & Communication',
  },
  {
    name: 'Microsoft Teams',
    category: 'SaaS',
    vendor: 'Microsoft',
    vendorSupportUrl: 'https://support.microsoft.com/teams',
    vendorSupportPhone: '1-800-642-7676',
    defaultCriticality: 'High',
    group: 'Email & Communication',
  },
  {
    name: 'Zoom',
    category: 'SaaS',
    vendor: 'Zoom',
    vendorSupportUrl: 'https://support.zoom.us',
    vendorSupportPhone: '',
    defaultCriticality: 'Medium',
    group: 'Email & Communication',
  },

  // Accounting & Finance
  {
    name: 'QuickBooks Online',
    category: 'SaaS',
    vendor: 'Intuit',
    vendorSupportUrl: 'https://quickbooks.intuit.com/support',
    vendorSupportPhone: '1-800-446-8848',
    defaultCriticality: 'Critical',
    group: 'Accounting & Finance',
  },
  {
    name: 'Xero',
    category: 'SaaS',
    vendor: 'Xero',
    vendorSupportUrl: 'https://www.xero.com/support',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'Accounting & Finance',
  },
  {
    name: 'Square',
    category: 'SaaS',
    vendor: 'Block',
    vendorSupportUrl: 'https://squareup.com/help',
    vendorSupportPhone: '1-855-700-6000',
    defaultCriticality: 'Critical',
    group: 'Accounting & Finance',
  },
  {
    name: 'Stripe',
    category: 'SaaS',
    vendor: 'Stripe',
    vendorSupportUrl: 'https://support.stripe.com',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'Accounting & Finance',
  },

  // E-Commerce
  {
    name: 'Shopify',
    category: 'SaaS',
    vendor: 'Shopify',
    vendorSupportUrl: 'https://help.shopify.com',
    vendorSupportPhone: '1-888-746-7439',
    defaultCriticality: 'Critical',
    group: 'E-Commerce',
  },
  {
    name: 'WooCommerce',
    category: 'SaaS',
    vendor: 'Automattic',
    vendorSupportUrl: 'https://woocommerce.com/support',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'E-Commerce',
  },

  // CRM & Sales
  {
    name: 'Salesforce',
    category: 'SaaS',
    vendor: 'Salesforce',
    vendorSupportUrl: 'https://help.salesforce.com',
    vendorSupportPhone: '1-800-667-6389',
    defaultCriticality: 'High',
    group: 'CRM & Sales',
  },
  {
    name: 'HubSpot',
    category: 'SaaS',
    vendor: 'HubSpot',
    vendorSupportUrl: 'https://knowledge.hubspot.com',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'CRM & Sales',
  },

  // File Storage
  {
    name: 'Google Drive',
    category: 'SaaS',
    vendor: 'Google',
    vendorSupportUrl: 'https://support.google.com/drive',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'File Storage',
  },
  {
    name: 'OneDrive / SharePoint',
    category: 'SaaS',
    vendor: 'Microsoft',
    vendorSupportUrl: 'https://support.microsoft.com/onedrive',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'File Storage',
  },
  {
    name: 'Dropbox',
    category: 'SaaS',
    vendor: 'Dropbox',
    vendorSupportUrl: 'https://help.dropbox.com',
    vendorSupportPhone: '',
    defaultCriticality: 'Medium',
    group: 'File Storage',
  },

  // Project Management
  {
    name: 'Asana',
    category: 'SaaS',
    vendor: 'Asana',
    vendorSupportUrl: 'https://asana.com/guide',
    vendorSupportPhone: '',
    defaultCriticality: 'Medium',
    group: 'Project Management',
  },
  {
    name: 'Trello',
    category: 'SaaS',
    vendor: 'Atlassian',
    vendorSupportUrl: 'https://support.atlassian.com/trello',
    vendorSupportPhone: '',
    defaultCriticality: 'Medium',
    group: 'Project Management',
  },
  {
    name: 'Monday.com',
    category: 'SaaS',
    vendor: 'Monday.com',
    vendorSupportUrl: 'https://support.monday.com',
    vendorSupportPhone: '',
    defaultCriticality: 'Medium',
    group: 'Project Management',
  },

  // Website & Hosting
  {
    name: 'WordPress',
    category: 'SaaS',
    vendor: 'Automattic / Self-hosted',
    vendorSupportUrl: 'https://wordpress.org/support',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Website & Hosting',
  },
  {
    name: 'Squarespace',
    category: 'SaaS',
    vendor: 'Squarespace',
    vendorSupportUrl: 'https://support.squarespace.com',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Website & Hosting',
  },

  // Point of Sale
  {
    name: 'Square POS',
    category: 'Hardware',
    vendor: 'Block',
    vendorSupportUrl: 'https://squareup.com/help',
    vendorSupportPhone: '1-855-700-6000',
    defaultCriticality: 'Critical',
    group: 'Point of Sale',
  },
  {
    name: 'Toast POS',
    category: 'Hardware',
    vendor: 'Toast',
    vendorSupportUrl: 'https://central.toasttab.com',
    vendorSupportPhone: '1-617-682-0225',
    defaultCriticality: 'Critical',
    group: 'Point of Sale',
  },
  {
    name: 'Clover POS',
    category: 'Hardware',
    vendor: 'Fiserv',
    vendorSupportUrl: 'https://www.clover.com/help',
    vendorSupportPhone: '1-855-853-8340',
    defaultCriticality: 'Critical',
    group: 'Point of Sale',
  },

  // Infrastructure
  {
    name: 'Internet Connection',
    category: 'Network',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'Infrastructure',
  },
  {
    name: 'Wi-Fi Router',
    category: 'Network',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Infrastructure',
  },
  {
    name: 'Office Workstations',
    category: 'Hardware',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Infrastructure',
  },
  {
    name: 'On-Premise Server',
    category: 'On-Prem',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'Infrastructure',
  },
  {
    name: 'Network Printer / MFP',
    category: 'Hardware',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'Low',
    group: 'Infrastructure',
  },
  {
    name: 'VPN',
    category: 'Network',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Infrastructure',
  },

  // Security
  {
    name: 'Antivirus / EDR',
    category: 'SaaS',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Security',
  },
  {
    name: 'Password Manager',
    category: 'SaaS',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Security',
  },
  {
    name: 'MFA / 2FA Provider',
    category: 'SaaS',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'Security',
  },

  // Healthcare
  {
    name: 'EHR / EMR System',
    category: 'SaaS',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'Healthcare',
  },
  {
    name: 'Practice Management System',
    category: 'SaaS',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'Critical',
    group: 'Healthcare',
  },
  {
    name: 'Patient Portal',
    category: 'SaaS',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    defaultCriticality: 'High',
    group: 'Healthcare',
  },
]

export const commonDependencyTemplates: DependencyTemplate[] = [
  {
    upstreamName: 'Internet Connection',
    downstreamName: 'Wi-Fi Router',
    description: 'Router requires internet uplink',
  },
  {
    upstreamName: 'Internet Connection',
    downstreamName: 'VPN',
    description: 'VPN requires internet connectivity',
  },
  {
    upstreamName: 'Shopify',
    downstreamName: 'Stripe',
    description: 'Shopify processes payments through Stripe',
  },
  {
    upstreamName: 'QuickBooks Online',
    downstreamName: 'Stripe',
    description: 'QuickBooks syncs with payment processor',
  },
]

export const scenarioTemplates = [
  {
    name: 'Email Provider Down for 48 Hours',
    scenarioType: 'Service Outage' as const,
    triggerDescription:
      'You arrive at work Monday morning and discover that your email service is completely unavailable. The vendor status page confirms a major outage with no ETA for resolution. It has been down since Friday evening.',
    discussionPrompts: [
      'How do staff communicate with customers right now?',
      'Are there any time-sensitive emails (invoices, contracts, support tickets) that are stuck?',
      'Do you have an alternative way to reach critical contacts?',
      'How do you notify staff about the outage and the workaround plan?',
      'What business processes are completely blocked without email?',
      'When does this become a revenue problem?',
    ],
  },
  {
    name: 'Ransomware Attack',
    scenarioType: 'Ransomware' as const,
    triggerDescription:
      'Staff arrive to find all office computers displaying a ransomware notice. Files are encrypted, and the attackers are demanding payment in cryptocurrency. Your cloud services appear unaffected, but you are not sure what data has been exfiltrated.',
    discussionPrompts: [
      'Who do you call first? (IT, insurance, legal, law enforcement?)',
      'Do you have offline backups that were not connected to the network?',
      'Can the business operate using only phones and personal devices temporarily?',
      'What customer data might be compromised, and who needs to be notified?',
      'Do you have cyber insurance? Do you know how to file a claim?',
      'What is your policy on paying the ransom?',
      'How do you communicate this to customers and partners?',
    ],
  },
  {
    name: 'Internet Outage (Full Business Day)',
    scenarioType: 'Service Outage' as const,
    triggerDescription:
      'Your internet service provider is experiencing a regional outage. There is no connectivity at your office. Mobile hotspots are available but slow. The ISP estimates 8-12 hours for restoration.',
    discussionPrompts: [
      'Which of your tools still work without internet? Which are dead?',
      'Can staff use mobile hotspots to access critical cloud services?',
      'Is there a nearby location (co-working space, coffee shop) where staff could work?',
      'What happens to phone systems if they are VoIP?',
      'Can you process payments if the POS needs internet?',
      'Should you close for the day or try to operate in a degraded state?',
    ],
  },
  {
    name: 'Key Employee Sudden Departure',
    scenarioType: 'Key Person Loss' as const,
    triggerDescription:
      'Your most technically knowledgeable employee — the one who set up all your systems and manages all the passwords — just resigned effective immediately. They are not hostile, but they are gone by end of day.',
    discussionPrompts: [
      'What accounts and systems does only this person have access to?',
      'Are all passwords stored in a shared password manager, or in their head?',
      'What vendor relationships do they manage that need to be transferred?',
      'Is there documentation for the systems they built or maintain?',
      'Who is the backup person for their responsibilities?',
      'What needs to happen in the next 4 hours before they leave?',
    ],
  },
  {
    name: 'Primary Vendor Shutting Down',
    scenarioType: 'Vendor Failure' as const,
    triggerDescription:
      'You receive an email from the vendor of your most critical business tool. They are shutting down operations in 60 days. All data must be exported before then. There is no acquisition or migration path announced.',
    discussionPrompts: [
      'Can you export all your data from this vendor? In what format?',
      'What alternatives exist, and how long would migration take?',
      'What business processes are completely dependent on this vendor?',
      'Do you have contracts or SLAs that provide any protection?',
      'How much would it cost to switch to an alternative?',
      'Can you operate with a manual workaround during the transition?',
    ],
  },
  {
    name: 'Office Inaccessible (Fire / Flood / Emergency)',
    scenarioType: 'Physical Disaster' as const,
    triggerDescription:
      'A water main break has flooded your office overnight. The building manager says access will be restricted for at least two weeks while repairs are made. Some equipment may be damaged. Fire department has not yet cleared the building for inspection.',
    discussionPrompts: [
      'Can all staff work from home? Do they have the equipment and access?',
      'Is any critical hardware (servers, backup drives) in the office?',
      'Where are your paper records, and are they protected?',
      'Do you have business interruption insurance?',
      'What is your plan for receiving mail and deliveries?',
      'Do you need a temporary physical workspace?',
    ],
  },
  {
    name: 'Payment Processing Down on Busiest Day',
    scenarioType: 'Service Outage' as const,
    triggerDescription:
      'It is your busiest day of the year. Your payment processor goes down. You cannot charge credit cards, process online orders, or run your POS system. The vendor says they are working on it but has no ETA.',
    discussionPrompts: [
      'Can you accept cash or checks as a temporary measure?',
      'Is there a backup payment processor you could switch to?',
      'How do you communicate this to customers in your store?',
      'What happens to online orders that are in progress?',
      'How much revenue are you losing per hour?',
      'At what point do you close up for the day vs. keep trying?',
    ],
  },
]
