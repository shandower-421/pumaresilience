import Dexie, { type Table } from 'dexie'
import type {
  Asset,
  Dependency,
  BackupInfo,
  Workflow,
  Scenario,
} from './types'

export class ResilienceDB extends Dexie {
  assets!: Table<Asset, string>
  dependencies!: Table<Dependency, string>
  backupInfos!: Table<BackupInfo, string>
  workflows!: Table<Workflow, string>
  scenarios!: Table<Scenario, string>

  constructor() {
    super('resilience')
    this.version(1).stores({
      assets: 'id, name, category, criticality, createdAt',
      dependencies: 'id, upstreamAssetId, downstreamAssetId',
      backupInfos: 'id, assetId',
      workflows: 'id, name, criticality',
      scenarios: 'id, name, scenarioType, status',
    })
  }
}

export const db = new ResilienceDB()
