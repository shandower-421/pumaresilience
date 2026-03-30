import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { BackupInfo, BackupMethod } from '@/db/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, Pencil } from 'lucide-react'

const backupMethods: BackupMethod[] = [
  'Vendor-managed',
  'Self-managed',
  'Manual Export',
  'None',
  'Unknown',
]

function trafficLight(backup: BackupInfo | undefined) {
  if (!backup || backup.hasBackup === 'Unknown')
    return { icon: AlertTriangle, color: 'text-yellow-500', label: 'Unknown' }
  if (backup.hasBackup === 'No')
    return { icon: XCircle, color: 'text-red-500', label: 'No Backup' }
  if (!backup.lastTestRestoreDate)
    return {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      label: 'Untested',
    }
  const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000
  if (new Date(backup.lastTestRestoreDate).getTime() < sixMonthsAgo)
    return {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      label: 'Stale Test',
    }
  return { icon: CheckCircle2, color: 'text-green-500', label: 'Verified' }
}

function emptyBackup(assetId: string): Omit<BackupInfo, 'id'> {
  return {
    assetId,
    hasBackup: 'Unknown',
    backupMethod: 'Unknown',
    backupLocation: '',
    backupFrequency: '',
    lastVerifiedDate: '',
    lastTestRestoreDate: '',
    restoreSteps: '',
    estimatedRestoreTime: '',
  }
}

export function BackupsPage() {
  const assets = useLiveQuery(() => db.assets.toArray()) ?? []
  const backups = useLiveQuery(() => db.backupInfos.toArray()) ?? []
  const [showEditor, setShowEditor] = useState(false)
  const [form, setForm] = useState(emptyBackup(''))
  const [editingId, setEditingId] = useState<string | null>(null)

  const backupMap = new Map(backups.map((b) => [b.assetId, b]))

  const totalWithBackup = assets.filter(
    (a) => backupMap.get(a.id)?.hasBackup === 'Yes'
  ).length
  const coverage =
    assets.length > 0 ? Math.round((totalWithBackup / assets.length) * 100) : 0

  function openEditor(assetId: string) {
    const existing = backupMap.get(assetId)
    if (existing) {
      setEditingId(existing.id)
      setForm({ ...existing })
    } else {
      setEditingId(null)
      setForm(emptyBackup(assetId))
    }
    setShowEditor(true)
  }

  async function save() {
    if (editingId) {
      await db.backupInfos.update(editingId, { ...form })
    } else {
      await db.backupInfos.add({ ...form, id: uuid() })
    }
    setShowEditor(false)
  }

  const editingAsset = assets.find((a) => a.id === form.assetId)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Backup Status</h1>
        <p className="text-sm text-muted-foreground">
          For each asset, document whether it is backed up, how, and when you
          last tested a restore.
        </p>
      </div>

      {/* Coverage bar */}
      {assets.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Backup Coverage</span>
              <span className="text-sm font-bold">{coverage}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  coverage >= 80
                    ? 'bg-green-500'
                    : coverage >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${coverage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalWithBackup} of {assets.length} assets have documented
              backups
            </p>
          </CardContent>
        </Card>
      )}

      {assets.length === 0 ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Add your technology first</CardTitle>
            <CardDescription>
              Once you have assets listed, this page will show the backup
              status of each one — what is backed up, what is not, and what
              has never been tested. Head to Assets to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-2">
          {assets
            .sort((a, b) => {
              const order = { Critical: 0, High: 1, Medium: 2, Low: 3 }
              return (
                (order[a.criticality] ?? 4) - (order[b.criticality] ?? 4)
              )
            })
            .map((asset) => {
              const backup = backupMap.get(asset.id)
              const tl = trafficLight(backup)
              const Icon = tl.icon
              return (
                <Card key={asset.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${tl.color}`} />
                        <div>
                          <span className="font-medium text-sm">
                            {asset.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] ml-2"
                          >
                            {asset.criticality}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {backup
                              ? `${backup.backupMethod}${backup.backupLocation ? ` · ${backup.backupLocation}` : ''}`
                              : 'Not yet documented'}
                            {backup?.lastTestRestoreDate &&
                              ` · Last tested: ${backup.lastTestRestoreDate}`}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditor(asset.id)}
                        aria-label={`Edit backup for ${asset.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Backup Info: {editingAsset?.name ?? 'Asset'}
            </DialogTitle>
            <DialogDescription>
              Document the backup status for this asset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Is this asset backed up?</Label>
              <Select
                value={form.hasBackup}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    hasBackup: v as 'Yes' | 'No' | 'Unknown',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Unknown">Unknown / Not Sure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.hasBackup === 'Yes' && (
              <>
                <div>
                  <Label>Backup Method</Label>
                  <Select
                    value={form.backupMethod}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        backupMethod: v as BackupMethod,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {backupMethods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Where is the backup stored?</Label>
                  <Input
                    value={form.backupLocation}
                    onChange={(e) =>
                      setForm({ ...form, backupLocation: e.target.value })
                    }
                    placeholder="e.g., AWS S3, external hard drive, vendor cloud"
                  />
                </div>
                <div>
                  <Label>How often is it backed up?</Label>
                  <Input
                    value={form.backupFrequency}
                    onChange={(e) =>
                      setForm({ ...form, backupFrequency: e.target.value })
                    }
                    placeholder="e.g., daily, weekly, real-time"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Last verified date</Label>
                    <Input
                      type="date"
                      value={form.lastVerifiedDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          lastVerifiedDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Last test restore date</Label>
                    <Input
                      type="date"
                      value={form.lastTestRestoreDate}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          lastTestRestoreDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Estimated restore time</Label>
                  <Input
                    value={form.estimatedRestoreTime}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedRestoreTime: e.target.value,
                      })
                    }
                    placeholder="e.g., 2 hours, 1 business day"
                  />
                </div>
                <div>
                  <Label>Restore steps</Label>
                  <Textarea
                    value={form.restoreSteps}
                    onChange={(e) =>
                      setForm({ ...form, restoreSteps: e.target.value })
                    }
                    rows={4}
                    placeholder="Step-by-step instructions to restore from backup..."
                  />
                </div>
              </>
            )}
            <Button onClick={save} className="w-full">
              Save Backup Info
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
