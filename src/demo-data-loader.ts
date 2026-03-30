import demoData from '../demo-data.json'
import { importData } from './db/export-import'
import type { ExportData } from './db/types'

export async function loadDemoData(): Promise<void> {
  await importData(demoData as ExportData)
}
