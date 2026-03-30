import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import {
  exportData,
  importData,
  downloadJson,
  readJsonFile,
} from '@/db/export-import'
import { generateRecoveryPlanPDF } from '@/lib/pdf-export'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  FileText,
} from 'lucide-react'

export function DataPage() {
  const assetsData = useLiveQuery(() => db.assets.toArray()) ?? []
  const depsData = useLiveQuery(() => db.dependencies.toArray()) ?? []
  const backupsData = useLiveQuery(() => db.backupInfos.toArray()) ?? []
  const workflowsData = useLiveQuery(() => db.workflows.toArray()) ?? []
  const scenariosData = useLiveQuery(() => db.scenarios.toArray()) ?? []

  const assets = assetsData.length
  const deps = depsData.length
  const backupsCount = backupsData.length
  const workflows = workflowsData.length
  const scenariosCount = scenariosData.length

  const [businessName, setBusinessName] = useState('')
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pendingImport, setPendingImport] = useState<ReturnType<
    typeof readJsonFile
  > | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    try {
      const data = await exportData(businessName || 'Unnamed Business')
      downloadJson(data)
      setMessage({ type: 'success', text: 'Data exported successfully.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      })
    }
  }

  function handlePdfExport() {
    try {
      generateRecoveryPlanPDF({
        businessName: businessName || 'Unnamed Business',
        assets: assetsData,
        dependencies: depsData,
        backups: backupsData,
        workflows: workflowsData,
        scenarios: scenariosData,
      })
      setMessage({ type: 'success', text: 'PDF recovery plan downloaded.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: `PDF export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      })
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await readJsonFile(file)
      if (data.appName !== 'resilience') {
        setMessage({ type: 'error', text: 'Not a valid PumaResilience export file.' })
        return
      }
      setPendingImport(Promise.resolve(data))
      setShowImportConfirm(true)
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      })
    }

    if (fileRef.current) fileRef.current.value = ''
  }

  async function confirmImport() {
    try {
      const data = await pendingImport
      if (data) {
        await importData(data)
        setBusinessName(data.businessName ?? '')
        setMessage({
          type: 'success',
          text: `Imported ${data.assets?.length ?? 0} assets, ${data.dependencies?.length ?? 0} dependencies, ${data.scenarios?.length ?? 0} scenarios.`,
        })
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      })
    }
    setShowImportConfirm(false)
    setPendingImport(null)
  }

  async function clearAllData() {
    await db.assets.clear()
    await db.dependencies.clear()
    await db.backupInfos.clear()
    await db.workflows.clear()
    await db.scenarios.clear()
    setShowClearConfirm(false)
    setMessage({ type: 'success', text: 'All data cleared.' })
  }

  const totalRecords = assets + deps + backupsCount + workflows + scenariosCount

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Data Management</h1>
        <p className="text-sm text-muted-foreground">
          Export, import, and manage your PumaResilience data. All data is stored
          locally in your browser.
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {message.type === 'success' ? 'Success' : 'Error'}
          </AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Current data summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Current Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{assets}</div>
              <div className="text-xs text-muted-foreground">Assets</div>
            </div>
            <div>
              <div className="text-lg font-bold">{deps}</div>
              <div className="text-xs text-muted-foreground">Dependencies</div>
            </div>
            <div>
              <div className="text-lg font-bold">{backupsCount}</div>
              <div className="text-xs text-muted-foreground">Backup Records</div>
            </div>
            <div>
              <div className="text-lg font-bold">{workflows}</div>
              <div className="text-xs text-muted-foreground">Workflows</div>
            </div>
            <div>
              <div className="text-lg font-bold">{scenariosCount}</div>
              <div className="text-xs text-muted-foreground">Scenarios</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      {!__DEMO_MODE__ && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export Data</CardTitle>
          <CardDescription>
            Download all your data as a JSON file. Keep this as a backup or to
            transfer to another browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Business Name (included in export)</Label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Business Name"
            />
          </div>
          <Button onClick={handleExport} disabled={totalRecords === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export to JSON
          </Button>
        </CardContent>
      </Card>
      )}

      {/* PDF Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export Recovery Plan (PDF)</CardTitle>
          <CardDescription>
            Generate a printable recovery plan document with asset inventory,
            dependency map, backup status, workflows, scenario playbooks, and
            contact directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handlePdfExport}
            disabled={totalRecords === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download PDF Plan
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      {!__DEMO_MODE__ && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Import Data</CardTitle>
          <CardDescription>
            Load data from a previously exported JSON file. This will replace
            all current data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Choose JSON File
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Clear */}
      {!__DEMO_MODE__ && (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-sm text-red-600">Clear All Data</CardTitle>
          <CardDescription>
            Permanently remove all data from your browser. Export first if you
            want to keep it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowClearConfirm(true)}
            disabled={totalRecords === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Everything
          </Button>
        </CardContent>
      </Card>
      )}

      {/* Import confirmation */}
      <Dialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Import</DialogTitle>
            <DialogDescription>
              Importing will replace ALL current data. This cannot be undone.
              Export your current data first if you want to keep it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowImportConfirm(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmImport}>Replace & Import</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear confirmation */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Clear All Data</DialogTitle>
            <DialogDescription>
              This will permanently delete {totalRecords} records. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearAllData}>
              Delete Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
