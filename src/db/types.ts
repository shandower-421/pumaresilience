export type AssetCategory =
  | 'SaaS'
  | 'Hardware'
  | 'Cloud'
  | 'On-Prem'
  | 'Network'
  | 'Data Store'
  | 'Other'

export type Criticality = 'Critical' | 'High' | 'Medium' | 'Low'

export type DependencyType = 'Hard' | 'Soft' | 'Optional'

export type BackupMethod =
  | 'Vendor-managed'
  | 'Self-managed'
  | 'Manual Export'
  | 'None'
  | 'Unknown'

export type ScenarioType =
  | 'Service Outage'
  | 'Ransomware'
  | 'Data Loss'
  | 'Physical Disaster'
  | 'Vendor Failure'
  | 'Key Person Loss'
  | 'Custom'

export type ScenarioStatus = 'Not Started' | 'In Progress' | 'Completed'

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  vendor: string
  vendorSupportUrl: string
  vendorSupportPhone: string
  criticality: Criticality
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  notes: string
  createdAt: number
  updatedAt: number
}

export interface Dependency {
  id: string
  upstreamAssetId: string
  downstreamAssetId: string
  dependencyType: DependencyType
  description: string
  createdAt: number
}

export interface BackupInfo {
  id: string
  assetId: string
  hasBackup: 'Yes' | 'No' | 'Unknown'
  backupMethod: BackupMethod
  backupLocation: string
  backupFrequency: string
  lastVerifiedDate: string
  lastTestRestoreDate: string
  restoreSteps: string
  estimatedRestoreTime: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  criticality: Criticality
  maxTolerableDowntime: string
  revenueImpactDescription: string
  manualWorkaround: string
  assetIds: string[]
  createdAt: number
  updatedAt: number
}

export interface Scenario {
  id: string
  name: string
  scenarioType: ScenarioType
  triggerDescription: string
  initiallyAffectedAssetIds: string[]
  discussionPrompts: string[]
  recoverySteps: ScenarioStep[]
  exerciseNotes: string
  status: ScenarioStatus
  createdAt: number
  updatedAt: number
}

export interface ScenarioStep {
  id: string
  stepNumber: number
  action: string
  responsiblePerson: string
  estimatedDuration: string
  notes: string
}

export interface ExportData {
  version: string
  exportedAt: string
  appName: 'resilience'
  businessName: string
  assets: Asset[]
  dependencies: Dependency[]
  backupInfos: BackupInfo[]
  workflows: Workflow[]
  scenarios: Scenario[]
}
