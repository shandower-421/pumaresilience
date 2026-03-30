import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Asset, AssetCategory, Criticality } from '@/db/types'
import { assetTemplates, type AssetTemplate } from '@/db/templates'
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
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react'

const categories: AssetCategory[] = [
  'SaaS',
  'Hardware',
  'Cloud',
  'On-Prem',
  'Network',
  'Data Store',
  'Other',
]
const criticalities: Criticality[] = ['Critical', 'High', 'Medium', 'Low']

const critColor: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-emerald-100 text-emerald-800',
}

const critOrder: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
}

function BackupIndicator({ status }: { status: 'Yes' | 'No' | 'Unknown' | 'none' }) {
  if (status === 'Yes')
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
  if (status === 'No')
    return <XCircle className="h-3.5 w-3.5 text-red-500" />
  if (status === 'Unknown')
    return <HelpCircle className="h-3.5 w-3.5 text-yellow-500" />
  return <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground/40" />
}

function emptyAsset(): Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    category: 'SaaS',
    vendor: '',
    vendorSupportUrl: '',
    vendorSupportPhone: '',
    criticality: 'Medium',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    notes: '',
  }
}

export function AssetsPage() {
  const assets = useLiveQuery(() => db.assets.toArray()) ?? []
  const backups = useLiveQuery(() => db.backupInfos.toArray()) ?? []
  const dependencies = useLiveQuery(() => db.dependencies.toArray()) ?? []
  const [showEditor, setShowEditor] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyAsset())
  const [search, setSearch] = useState('')
  const [filterCrit, setFilterCrit] = useState<string>('all')
  const [templateSearch, setTemplateSearch] = useState('')

  const backupMap = new Map(backups.map((b) => [b.assetId, b]))

  const filtered = useMemo(() => {
    let result = [...assets]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.vendor.toLowerCase().includes(q) ||
          a.ownerName.toLowerCase().includes(q)
      )
    }
    if (filterCrit !== 'all') {
      result = result.filter((a) => a.criticality === filterCrit)
    }
    return result.sort(
      (a, b) => (critOrder[a.criticality] ?? 4) - (critOrder[b.criticality] ?? 4)
    )
  }, [assets, search, filterCrit])

  function openNew() {
    setEditingId(null)
    setForm(emptyAsset())
    setShowEditor(true)
  }

  function openEdit(asset: Asset) {
    setEditingId(asset.id)
    setForm({ ...asset })
    setShowEditor(true)
  }

  async function save() {
    if (!form.name.trim()) return
    const now = Date.now()
    if (editingId) {
      await db.assets.update(editingId, { ...form, updatedAt: now })
    } else {
      await db.assets.add({ ...form, id: uuid(), createdAt: now, updatedAt: now })
    }
    setShowEditor(false)
  }

  async function confirmDelete() {
    if (!showDeleteConfirm) return
    const id = showDeleteConfirm
    await db.assets.delete(id)
    await db.dependencies
      .where('upstreamAssetId')
      .equals(id)
      .or('downstreamAssetId')
      .equals(id)
      .delete()
    await db.backupInfos.where('assetId').equals(id).delete()
    setShowDeleteConfirm(null)
  }

  async function addFromTemplate(tpl: AssetTemplate) {
    const exists = assets.some(
      (a) => a.name.toLowerCase() === tpl.name.toLowerCase()
    )
    if (exists) return
    const now = Date.now()
    await db.assets.add({
      id: uuid(),
      name: tpl.name,
      category: tpl.category,
      vendor: tpl.vendor,
      vendorSupportUrl: tpl.vendorSupportUrl,
      vendorSupportPhone: tpl.vendorSupportPhone,
      criticality: tpl.defaultCriticality,
      ownerName: '',
      ownerEmail: '',
      ownerPhone: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    })
  }

  const templateGroups = assetTemplates.reduce<Record<string, AssetTemplate[]>>(
    (acc, tpl) => {
      ;(acc[tpl.group] ??= []).push(tpl)
      return acc
    },
    {}
  )

  const existingNames = new Set(assets.map((a) => a.name.toLowerCase()))
  const deleteTarget = assets.find((a) => a.id === showDeleteConfirm)
  const deleteDepCount = showDeleteConfirm
    ? dependencies.filter(
        (d) =>
          d.upstreamAssetId === showDeleteConfirm ||
          d.downstreamAssetId === showDeleteConfirm
      ).length
    : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Technology Assets</h1>
          <p className="text-sm text-muted-foreground">
            Everything your business depends on.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplates(true)}>
            <Package className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      {assets.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets, vendors, owners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {['all', ...criticalities].map((c) => (
              <Button
                key={c}
                variant={filterCrit === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCrit(c)}
                className="text-xs"
              >
                {c === 'all' ? 'All' : c}
              </Button>
            ))}
          </div>
        </div>
      )}

      {assets.length === 0 ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>No assets yet</CardTitle>
            <CardDescription>
              Start by adding technology from{' '}
              <button
                onClick={() => setShowTemplates(true)}
                className="text-primary underline underline-offset-2"
              >
                templates
              </button>
              , or add your own custom entries.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No assets match your search.
        </p>
      ) : (
        <div className="grid gap-2">
          {filtered.map((asset, i) => {
            const backup = backupMap.get(asset.id)
            const backupStatus = backup?.hasBackup ?? 'none'
            return (
              <Card
                key={asset.id}
                className="animate-list-item hover:border-primary/20"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <BackupIndicator status={backupStatus as 'Yes' | 'No' | 'Unknown' | 'none'} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {asset.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${critColor[asset.criticality]}`}
                          >
                            {asset.criticality}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {asset.category}
                          </Badge>
                        </div>
                        {(asset.vendor || asset.ownerName) && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {asset.vendor}
                            {asset.vendor && asset.ownerName && ' · '}
                            {asset.ownerName && `Owner: ${asset.ownerName}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(asset)}
                        aria-label={`Edit ${asset.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(asset.id)}
                        className="hover:text-red-600"
                        aria-label={`Delete ${asset.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog
        open={!!showDeleteConfirm}
        onOpenChange={() => setShowDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              This will permanently remove this asset
              {deleteDepCount > 0 && (
                <span className="text-red-600 font-medium">
                  {' '}
                  and {deleteDepCount} associated dependency(ies)
                </span>
              )}
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Asset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the details for this technology asset.'
                : 'Add a new technology asset that your business depends on.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., QuickBooks Online"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as AssetCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Criticality</Label>
                <Select
                  value={form.criticality}
                  onValueChange={(v) =>
                    setForm({ ...form, criticality: v as Criticality })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {criticalities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Vendor</Label>
              <Input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vendor Support URL</Label>
                <Input
                  value={form.vendorSupportUrl}
                  onChange={(e) =>
                    setForm({ ...form, vendorSupportUrl: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Vendor Support Phone</Label>
                <Input
                  value={form.vendorSupportPhone}
                  onChange={(e) =>
                    setForm({ ...form, vendorSupportPhone: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Owner Name</Label>
              <Input
                value={form.ownerName}
                onChange={(e) =>
                  setForm({ ...form, ownerName: e.target.value })
                }
                placeholder="Who is responsible for this?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Owner Email</Label>
                <Input
                  value={form.ownerEmail}
                  onChange={(e) =>
                    setForm({ ...form, ownerEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Owner Phone</Label>
                <Input
                  value={form.ownerPhone}
                  onChange={(e) =>
                    setForm({ ...form, ownerPhone: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={save} className="w-full">
              {editingId ? 'Update' : 'Add'} Asset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Picker Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add from Templates</DialogTitle>
            <DialogDescription>
              Click to add common business tools. Already-added items are
              dimmed.
            </DialogDescription>
          </DialogHeader>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="space-y-5">
            {Object.entries(templateGroups)
              .map(([group, templates]) => {
                const tq = templateSearch.toLowerCase()
                const filteredTpls = tq
                  ? templates.filter(
                      (t) =>
                        t.name.toLowerCase().includes(tq) ||
                        t.group.toLowerCase().includes(tq)
                    )
                  : templates
                if (filteredTpls.length === 0) return null
                return (
                  <div key={group}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      {group}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredTpls.map((tpl) => {
                        const exists = existingNames.has(
                          tpl.name.toLowerCase()
                        )
                        return (
                          <Button
                            key={tpl.name}
                            variant={exists ? 'ghost' : 'outline'}
                            size="sm"
                            disabled={exists}
                            onClick={() => addFromTemplate(tpl)}
                            className="text-xs"
                          >
                            {exists ? (
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                            ) : (
                              <Plus className="h-3 w-3 mr-1" />
                            )}
                            {tpl.name}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )
              })
              .filter(Boolean)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
