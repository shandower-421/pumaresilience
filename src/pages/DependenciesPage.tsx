import { useState, useEffect, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import cytoscape from 'cytoscape'
// @ts-expect-error no type declarations for cytoscape-dagre
import dagre from 'cytoscape-dagre'
import { db } from '@/db/database'
import type { DependencyType } from '@/db/types'
import { computeCascade } from '@/lib/graph-engine'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmContent,
  DialogHeader as ConfirmHeader,
  DialogTitle as ConfirmTitle,
  DialogDescription as ConfirmDesc,
} from '@/components/ui/dialog'
import { Plus, Trash2, ZapOff, RotateCcw, Info, ArrowUpDown, Search, X } from 'lucide-react'

dagre(cytoscape)

const critColors: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

const depStyles: Record<string, { color: string; style: string }> = {
  Hard: { color: '#ef4444', style: 'solid' },
  Soft: { color: '#f97316', style: 'dashed' },
  Optional: { color: '#9ca3af', style: 'dotted' },
}

export function DependenciesPage() {
  const assets = useLiveQuery(() => db.assets.toArray()) ?? []
  const dependencies = useLiveQuery(() => db.dependencies.toArray()) ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [upstreamId, setUpstreamId] = useState('')
  const [downstreamId, setDownstreamId] = useState('')
  const [depType, setDepType] = useState<DependencyType>('Hard')
  const [depDesc, setDepDesc] = useState('')
  const [failedAsset, setFailedAsset] = useState<string | null>(null)
  const [deleteDepId, setDeleteDepId] = useState<string | null>(null)
  const [filterAsset, setFilterAsset] = useState('')
  const [filterType, setFilterType] = useState<'' | DependencyType>('')
  const [sortCol, setSortCol] = useState<'upstream' | 'downstream' | 'type'>('upstream')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const graphRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  const buildGraph = useCallback(() => {
    if (!graphRef.current || assets.length === 0) return

    if (cyRef.current) {
      cyRef.current.destroy()
    }

    const elements: cytoscape.ElementDefinition[] = [
      ...assets.map((a) => ({
        data: {
          id: a.id,
          label: a.name,
          criticality: a.criticality,
          category: a.category,
        },
      })),
      ...dependencies.map((d) => ({
        data: {
          id: d.id,
          source: d.upstreamAssetId,
          target: d.downstreamAssetId,
          depType: d.dependencyType,
        },
      })),
    ]

    const cy = cytoscape({
      container: graphRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'font-size': '11px',
            'background-color': (ele: cytoscape.NodeSingular) =>
              critColors[ele.data('criticality')] ?? '#9ca3af',
            width: 40,
            height: 40,
            shape: (ele: cytoscape.NodeSingular) => {
              const cat = ele.data('category')
              if (cat === 'SaaS' || cat === 'Cloud') return 'round-rectangle'
              if (cat === 'Hardware' || cat === 'On-Prem') return 'rectangle'
              if (cat === 'Network') return 'diamond'
              if (cat === 'Data Store') return 'barrel'
              return 'ellipse'
            },
            'border-width': 2,
            'border-color': '#e5e7eb',
          } as cytoscape.Css.Node,
        },
        {
          selector: 'edge',
          style: {
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            width: 2,
            'line-color': (ele: cytoscape.EdgeSingular) =>
              depStyles[ele.data('depType')]?.color ?? '#9ca3af',
            'target-arrow-color': (ele: cytoscape.EdgeSingular) =>
              depStyles[ele.data('depType')]?.color ?? '#9ca3af',
            'line-style': (ele: cytoscape.EdgeSingular) =>
              depStyles[ele.data('depType')]?.style ?? 'solid',
          } as cytoscape.Css.Edge,
        },
        {
          selector: '.failed',
          style: {
            'background-color': '#dc2626',
            'border-color': '#991b1b',
            'border-width': 4,
          } as cytoscape.Css.Node,
        },
        {
          selector: '.cascade-affected',
          style: {
            'background-color': '#fb923c',
            'border-color': '#c2410c',
            'border-width': 3,
          } as cytoscape.Css.Node,
        },
        {
          selector: '.cascade-edge',
          style: {
            'line-color': '#dc2626',
            'target-arrow-color': '#dc2626',
            width: 3,
          } as cytoscape.Css.Edge,
        },
      ],
      layout: {
        name: 'dagre',
        rankDir: 'TB',
        spacingFactor: 1.5,
      } as cytoscape.LayoutOptions,
    })

    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id()
      simulateFailure(nodeId, cy)
    })

    cyRef.current = cy
  }, [assets, dependencies])

  function simulateFailure(assetId: string, cy?: cytoscape.Core) {
    const graph = cy ?? cyRef.current
    if (!graph) return

    graph.elements().removeClass('failed cascade-affected cascade-edge')
    setFailedAsset(assetId)

    const cascade = computeCascade([assetId], assets, dependencies)

    graph.getElementById(assetId).addClass('failed')
    for (const id of cascade.affectedAssetIds) {
      if (id !== assetId) {
        graph.getElementById(id).addClass('cascade-affected')
      }
    }
    for (const edgeId of cascade.affectedEdges) {
      graph.getElementById(edgeId).addClass('cascade-edge')
    }
  }

  function resetSimulation() {
    setFailedAsset(null)
    cyRef.current?.elements().removeClass('failed cascade-affected cascade-edge')
  }

  useEffect(() => {
    buildGraph()
  }, [buildGraph])

  async function addDependency() {
    if (!upstreamId || !downstreamId || upstreamId === downstreamId) return
    await db.dependencies.add({
      id: uuid(),
      upstreamAssetId: upstreamId,
      downstreamAssetId: downstreamId,
      dependencyType: depType,
      description: depDesc,
      createdAt: Date.now(),
    })
    setShowAdd(false)
    setUpstreamId('')
    setDownstreamId('')
    setDepType('Hard')
    setDepDesc('')
  }

  async function removeDep() {
    if (!deleteDepId) return
    await db.dependencies.delete(deleteDepId)
    setDeleteDepId(null)
  }

  const failedAssetObj = failedAsset
    ? assets.find((a) => a.id === failedAsset)
    : null
  const cascadeResult = failedAsset
    ? computeCascade([failedAsset], assets, dependencies)
    : null

  const assetName = (id: string) => assets.find((a) => a.id === id)?.name ?? ''

  const filteredDeps = dependencies
    .filter((dep) => {
      if (filterAsset && dep.upstreamAssetId !== filterAsset && dep.downstreamAssetId !== filterAsset) return false
      if (filterType && dep.dependencyType !== filterType) return false
      return true
    })
    .sort((a, b) => {
      let aVal = '', bVal = ''
      if (sortCol === 'upstream') { aVal = assetName(a.upstreamAssetId); bVal = assetName(b.upstreamAssetId) }
      else if (sortCol === 'downstream') { aVal = assetName(a.downstreamAssetId); bVal = assetName(b.downstreamAssetId) }
      else { aVal = a.dependencyType; bVal = b.dependencyType }
      const cmp = aVal.localeCompare(bVal)
      return sortDir === 'asc' ? cmp : -cmp
    })

  function toggleSort(col: 'upstream' | 'downstream' | 'type') {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const hasFilters = filterAsset !== '' || filterType !== ''

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dependency Map</h1>
          <p className="text-sm text-muted-foreground">
            Map what relies on what. Click any node in the graph to simulate a
            failure.
          </p>
        </div>
        <div className="flex gap-2">
          {failedAsset && (
            <Button variant="outline" onClick={resetSimulation}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={() => setShowAdd(true)} disabled={assets.length < 2}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dependency
          </Button>
        </div>
      </div>

      {assets.length < 2 ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Add your technology first</CardTitle>
            <CardDescription>
              You need at least 2 assets before you can map how they depend
              on each other. Head to Assets to add your tools, services, and
              infrastructure.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative">
                <div
                  ref={graphRef}
                  className="w-full h-[500px] bg-muted/30 rounded-md"
                />
                {!failedAsset && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-background/90 backdrop-blur-sm text-xs text-muted-foreground px-2.5 py-1.5 rounded-md border shadow-sm">
                    <Info className="h-3 w-3" />
                    Click any node to simulate a failure
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cascade info panel */}
          {failedAssetObj && cascadeResult && (
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ZapOff className="h-4 w-4 text-red-500" />
                  Failure Simulation: {failedAssetObj.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {cascadeResult.affectedAssetIds.length - 1} downstream
                  asset(s) affected across {cascadeResult.phases.length - 1}{' '}
                  cascade phase(s).
                </p>
                {cascadeResult.phases.slice(1).map((phase) => (
                  <div key={phase.phase} className="mb-1">
                    <span className="text-xs font-medium">
                      Phase {phase.phase}:{' '}
                    </span>
                    {phase.assetIds.map((id) => {
                      const a = assets.find((x) => x.id === id)
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="text-xs mr-1"
                        >
                          {a?.name ?? id}
                        </Badge>
                      )
                    })}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Dependencies table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CardTitle className="text-sm shrink-0">
                  Dependencies ({dependencies.length})
                </CardTitle>
                {dependencies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <Select
                      value={filterAsset || 'all'}
                      onValueChange={(v) => setFilterAsset(!v || v === 'all' ? '' : v)}
                    >
                      <SelectTrigger className="h-8 text-xs w-[200px]">
                        <Search className="h-3 w-3 mr-1.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {filterAsset ? assetName(filterAsset) : 'All assets'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All assets</SelectItem>
                        {assets
                          .filter((a) => dependencies.some((d) => d.upstreamAssetId === a.id || d.downstreamAssetId === a.id))
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(!v || v === 'all' ? '' : v as DependencyType)}>
                      <SelectTrigger className="h-8 text-xs w-[120px]">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                        <SelectItem value="Soft">Soft</SelectItem>
                        <SelectItem value="Optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground"
                        onClick={() => { setFilterAsset(''); setFilterType('') }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {dependencies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No dependencies mapped yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-3 font-medium">
                          <button
                            onClick={() => toggleSort('upstream')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            Upstream
                            <ArrowUpDown className={`h-3 w-3 ${sortCol === 'upstream' ? 'text-foreground' : 'opacity-40'}`} />
                          </button>
                        </th>
                        <th className="pb-2 pr-3 font-medium" aria-label="arrow"></th>
                        <th className="pb-2 pr-3 font-medium">
                          <button
                            onClick={() => toggleSort('downstream')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            Downstream
                            <ArrowUpDown className={`h-3 w-3 ${sortCol === 'downstream' ? 'text-foreground' : 'opacity-40'}`} />
                          </button>
                        </th>
                        <th className="pb-2 pr-3 font-medium">
                          <button
                            onClick={() => toggleSort('type')}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            Type
                            <ArrowUpDown className={`h-3 w-3 ${sortCol === 'type' ? 'text-foreground' : 'opacity-40'}`} />
                          </button>
                        </th>
                        <th className="pb-2 pr-3 font-medium hidden sm:table-cell">Description</th>
                        <th className="pb-2 font-medium w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDeps.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground">
                            No dependencies match the current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredDeps.map((dep) => {
                          const up = assets.find((a) => a.id === dep.upstreamAssetId)
                          const down = assets.find((a) => a.id === dep.downstreamAssetId)
                          return (
                            <tr
                              key={dep.id}
                              className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                            >
                              <td className="py-2 pr-3 font-medium">{up?.name}</td>
                              <td className="py-2 pr-3 text-muted-foreground">→</td>
                              <td className="py-2 pr-3 font-medium">{down?.name}</td>
                              <td className="py-2 pr-3">
                                <Badge variant="outline" className="text-[10px]">
                                  {dep.dependencyType}
                                </Badge>
                              </td>
                              <td className="py-2 pr-3 text-muted-foreground hidden sm:table-cell max-w-xs truncate">
                                {dep.description || '—'}
                              </td>
                              <td className="py-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteDepId(dep.id)}
                                  aria-label="Remove dependency"
                                  className="hover:text-red-600 h-7 w-7 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                  {hasFilters && filteredDeps.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing {filteredDeps.length} of {dependencies.length} dependencies
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Dependency Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Dependency</DialogTitle>
            <DialogDescription>
              Define a relationship: if the upstream asset fails, the downstream
              asset is affected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Upstream (depended on)</Label>
              <Select value={upstreamId} onValueChange={(v) => setUpstreamId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset..." />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Downstream (affected when upstream fails)</Label>
              <Select value={downstreamId} onValueChange={(v) => setDownstreamId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select asset..." />
                </SelectTrigger>
                <SelectContent>
                  {assets
                    .filter((a) => a.id !== upstreamId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dependency Type</Label>
              <Select
                value={depType}
                onValueChange={(v) => setDepType(v as DependencyType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hard">
                    Hard — downstream stops completely
                  </SelectItem>
                  <SelectItem value="Soft">
                    Soft — downstream degraded but functional
                  </SelectItem>
                  <SelectItem value="Optional">
                    Optional — nice to have, not critical
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={depDesc}
                onChange={(e) => setDepDesc(e.target.value)}
                placeholder="e.g., Shopify sends orders to QuickBooks via Zapier"
              />
            </div>
            <Button onClick={addDependency} className="w-full">
              Add Dependency
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dependency Confirmation */}
      <ConfirmDialog open={!!deleteDepId} onOpenChange={() => setDeleteDepId(null)}>
        <ConfirmContent>
          <ConfirmHeader>
            <ConfirmTitle>Remove this dependency?</ConfirmTitle>
            <ConfirmDesc>
              This will remove the dependency relationship. The assets themselves will not be deleted.
            </ConfirmDesc>
          </ConfirmHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDepId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={removeDep}>Remove</Button>
          </div>
        </ConfirmContent>
      </ConfirmDialog>
    </div>
  )
}
