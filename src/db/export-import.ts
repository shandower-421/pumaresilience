import { db } from './database'
import type { ExportData } from './types'

const EXPORT_VERSION = '1.0.0'

export async function exportData(businessName: string): Promise<ExportData> {
  const [assets, dependencies, backupInfos, workflows, scenarios] =
    await Promise.all([
      db.assets.toArray(),
      db.dependencies.toArray(),
      db.backupInfos.toArray(),
      db.workflows.toArray(),
      db.scenarios.toArray(),
    ])

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'resilience',
    businessName,
    assets,
    dependencies,
    backupInfos,
    workflows,
    scenarios,
  }
}

export async function importData(data: ExportData): Promise<void> {
  if (data.appName !== 'resilience') {
    throw new Error('Invalid file: not a Resilience export')
  }

  if (!data.version) {
    throw new Error('Invalid file: missing version')
  }

  await db.transaction(
    'rw',
    [db.assets, db.dependencies, db.backupInfos, db.workflows, db.scenarios],
    async () => {
      await db.assets.clear()
      await db.dependencies.clear()
      await db.backupInfos.clear()
      await db.workflows.clear()
      await db.scenarios.clear()

      if (data.assets?.length) await db.assets.bulkAdd(data.assets)
      if (data.dependencies?.length)
        await db.dependencies.bulkAdd(data.dependencies)
      if (data.backupInfos?.length)
        await db.backupInfos.bulkAdd(data.backupInfos)
      if (data.workflows?.length) await db.workflows.bulkAdd(data.workflows)
      if (data.scenarios?.length) await db.scenarios.bulkAdd(data.scenarios)
    }
  )
}

export function downloadJson(data: ExportData) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const timestamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `resilience-backup-${timestamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function readJsonFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        resolve(data)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
