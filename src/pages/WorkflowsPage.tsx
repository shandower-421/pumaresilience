import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Workflow, Criticality } from '@/db/types'
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
import { Plus, Pencil, Trash2, Workflow as WorkflowIcon } from 'lucide-react'

const criticalities: Criticality[] = ['Critical', 'High', 'Medium', 'Low']

const critColor: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
}

function emptyWorkflow(): Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    description: '',
    criticality: 'Medium',
    maxTolerableDowntime: '',
    revenueImpactDescription: '',
    manualWorkaround: '',
    assetIds: [],
  }
}

export function WorkflowsPage() {
  const assets = useLiveQuery(() => db.assets.toArray()) ?? []
  const workflows = useLiveQuery(() => db.workflows.orderBy('name').toArray()) ?? []
  const [showEditor, setShowEditor] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyWorkflow())

  function openNew() {
    setEditingId(null)
    setForm(emptyWorkflow())
    setShowEditor(true)
  }

  function openEdit(wf: Workflow) {
    setEditingId(wf.id)
    setForm({ ...wf })
    setShowEditor(true)
  }

  async function save() {
    if (!form.name.trim()) return
    const now = Date.now()
    if (editingId) {
      await db.workflows.update(editingId, { ...form, updatedAt: now })
    } else {
      await db.workflows.add({
        ...form,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      })
    }
    setShowEditor(false)
  }

  async function remove(id: string) {
    await db.workflows.delete(id)
  }

  function toggleAsset(assetId: string) {
    const ids = form.assetIds.includes(assetId)
      ? form.assetIds.filter((id) => id !== assetId)
      : [...form.assetIds, assetId]
    setForm({ ...form, assetIds: ids })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Business Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Map your key business processes and which technology each one depends
            on.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>What keeps the business running?</CardTitle>
            <CardDescription>
              Document your key processes — "Process Customer Orders", "Run
              Payroll", "Respond to Support Tickets" — and link each one to
              the technology it depends on. When something goes down, you will
              know exactly which processes are affected and what the manual
              workaround is.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {workflows.map((wf) => {
            const linkedAssets = assets.filter((a) =>
              wf.assetIds.includes(a.id)
            )
            return (
              <Card key={wf.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <WorkflowIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{wf.name}</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${critColor[wf.criticality]}`}
                        >
                          {wf.criticality}
                        </Badge>
                      </div>
                      {wf.description && (
                        <p className="text-xs text-muted-foreground mb-2 ml-6">
                          {wf.description}
                        </p>
                      )}
                      <div className="ml-6 space-y-1">
                        {wf.maxTolerableDowntime && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">
                              Max tolerable downtime:{' '}
                            </span>
                            {wf.maxTolerableDowntime}
                          </p>
                        )}
                        {wf.revenueImpactDescription && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">
                              Revenue impact:{' '}
                            </span>
                            {wf.revenueImpactDescription}
                          </p>
                        )}
                        {wf.manualWorkaround && (
                          <p className="text-xs">
                            <span className="text-muted-foreground">
                              Manual workaround:{' '}
                            </span>
                            {wf.manualWorkaround}
                          </p>
                        )}
                        {linkedAssets.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {linkedAssets.map((a) => (
                              <Badge
                                key={a.id}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {a.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(wf)}
                        aria-label={`Edit ${wf.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(wf.id)}
                        aria-label={`Delete ${wf.name}`}
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

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Workflow' : 'Add Workflow'}
            </DialogTitle>
            <DialogDescription>
              Describe a business process and link it to the technology it
              depends on.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Workflow Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Process Customer Orders"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                placeholder="What does this process involve?"
              />
            </div>
            <div>
              <Label>Criticality</Label>
              <Select
                value={form.criticality}
                onValueChange={(v) =>
                  setForm({ ...form, criticality: (v ?? 'Medium') as Criticality })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {criticalities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>How quickly do you need this back?</Label>
              <Input
                value={form.maxTolerableDowntime}
                onChange={(e) =>
                  setForm({ ...form, maxTolerableDowntime: e.target.value })
                }
                placeholder="e.g., 4 hours, same day, 1 business day"
              />
            </div>
            <div>
              <Label>Revenue impact when this is down</Label>
              <Input
                value={form.revenueImpactDescription}
                onChange={(e) =>
                  setForm({
                    ...form,
                    revenueImpactDescription: e.target.value,
                  })
                }
                placeholder="e.g., ~$500/hr in lost sales, customers go to competitor"
              />
            </div>
            <div>
              <Label>Manual workaround (pen and paper fallback)</Label>
              <Textarea
                value={form.manualWorkaround}
                onChange={(e) =>
                  setForm({ ...form, manualWorkaround: e.target.value })
                }
                rows={2}
                placeholder="What can staff do if the technology is unavailable?"
              />
            </div>
            <div>
              <Label>Which assets does this workflow depend on?</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Click to toggle. Selected assets are highlighted.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {assets.map((a) => {
                  const selected = form.assetIds.includes(a.id)
                  return (
                    <Button
                      key={a.id}
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => toggleAsset(a.id)}
                    >
                      {a.name}
                    </Button>
                  )
                })}
              </div>
            </div>
            <Button onClick={save} className="w-full">
              {editingId ? 'Update' : 'Add'} Workflow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
