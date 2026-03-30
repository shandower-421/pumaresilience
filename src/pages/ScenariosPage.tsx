import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { v4 as uuid } from 'uuid'
import { db } from '@/db/database'
import type { Scenario, ScenarioStep, ScenarioStatus } from '@/db/types'
import { scenarioTemplates } from '@/db/templates'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FileText,
} from 'lucide-react'

const statusColors: Record<ScenarioStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
}

export function ScenariosPage() {
  const assets = useLiveQuery(() => db.assets.toArray()) ?? []
  const dependencies = useLiveQuery(() => db.dependencies.toArray()) ?? []
  const backups = useLiveQuery(() => db.backupInfos.toArray()) ?? []
  const scenarios = useLiveQuery(() => db.scenarios.toArray()) ?? []

  const [showTemplates, setShowTemplates] = useState(false)
  const [deleteScenarioId, setDeleteScenarioId] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [exerciseStep, setExerciseStep] = useState(0)
  const [completedName, setCompletedName] = useState<string | null>(null)

  const backupMap = new Map(backups.map((b) => [b.assetId, b]))

  async function createFromTemplate(tpl: (typeof scenarioTemplates)[0]) {
    const now = Date.now()
    const scenario: Scenario = {
      id: uuid(),
      name: tpl.name,
      scenarioType: tpl.scenarioType,
      triggerDescription: tpl.triggerDescription,
      initiallyAffectedAssetIds: [],
      discussionPrompts: tpl.discussionPrompts,
      recoverySteps: [],
      exerciseNotes: '',
      status: 'Not Started',
      createdAt: now,
      updatedAt: now,
    }
    await db.scenarios.add(scenario)
    setShowTemplates(false)
  }

  async function deleteScenario(id: string) {
    await db.scenarios.delete(id)
    if (activeScenario === id) setActiveScenario(null)
  }

  async function updateScenario(id: string, updates: Partial<Scenario>) {
    await db.scenarios.update(id, { ...updates, updatedAt: Date.now() })
  }

  function startExercise(id: string) {
    setActiveScenario(id)
    setExerciseStep(0)
    updateScenario(id, { status: 'In Progress' })
  }

  const active = scenarios.find((s) => s.id === activeScenario)
  const cascade = active
    ? computeCascade(active.initiallyAffectedAssetIds, assets, dependencies)
    : null

  const exerciseSteps = [
    'setup',
    'impact',
    'response',
    'recovery',
    'backups',
    'gaps',
    'actions',
  ] as const

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tabletop Scenarios</h1>
          <p className="text-sm text-muted-foreground">
            Run guided "what if" exercises to build recovery plans.
          </p>
        </div>
        <Button onClick={() => setShowTemplates(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Scenario
        </Button>
      </div>

      {!activeScenario ? (
        <>
          {completedName && (
            <Card className="border-emerald-200 bg-emerald-50/50 animate-fade-in">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Exercise completed: {completedName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review the notes and action items you captured, then
                      assign owners and deadlines. Export a PDF from the Data
                      page to share with your team.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCompletedName(null)}
                    aria-label="Dismiss"
                    className="shrink-0 text-muted-foreground"
                  >
                    &times;
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {scenarios.length === 0 ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle>Ready to test your plan?</CardTitle>
                <CardDescription>
                  A tabletop exercise walks your team through a disaster
                  scenario step by step — who do you call, what breaks, and
                  what is the plan B? Pick a scenario to start. Most exercises
                  take 30-45 minutes and reveal gaps you did not know you had.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-3">
              {scenarios.map((s) => (
                <Card key={s.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{s.name}</span>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${statusColors[s.status]}`}
                          >
                            {s.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {s.scenarioType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {s.triggerDescription}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startExercise(s.id)}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          {s.status === 'Completed' ? 'Review' : 'Start'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteScenarioId(s.id)}
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : active ? (
        <div className="space-y-4">
          {/* Stepper */}
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveScenario(null)}>
              Back to List
            </Button>
            <div className="flex items-center gap-0">
              {exerciseSteps.map((step, i) => {
                const isActive = i === exerciseStep
                const isCompleted = i < exerciseStep
                return (
                  <div key={step} className="flex items-center">
                    <button
                      onClick={() => setExerciseStep(i)}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <span
                        className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold border-2 transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary scale-110'
                            : isCompleted
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300 animate-check'
                              : 'bg-muted text-muted-foreground border-transparent group-hover:border-primary/30'
                        }`}
                      >
                        {isCompleted ? '\u2713' : i + 1}
                      </span>
                      <span
                        className={`text-[10px] capitalize ${
                          isActive
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {step}
                      </span>
                    </button>
                    {i < exerciseSteps.length - 1 && (
                      <div
                        className={`h-0.5 w-6 mx-1 mt-[-16px] ${
                          isCompleted ? 'bg-emerald-300' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step: Setup */}
          {exerciseStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  The Scenario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{active.triggerDescription}</p>
                <Separator />
                <div>
                  <Label>Which assets are directly affected?</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select the assets that are initially hit by this scenario.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assets.map((a) => {
                      const selected =
                        active.initiallyAffectedAssetIds.includes(a.id)
                      return (
                        <Button
                          key={a.id}
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            const ids = selected
                              ? active.initiallyAffectedAssetIds.filter(
                                  (id) => id !== a.id
                                )
                              : [...active.initiallyAffectedAssetIds, a.id]
                            updateScenario(active.id, {
                              initiallyAffectedAssetIds: ids,
                            })
                          }}
                        >
                          {a.name}
                        </Button>
                      )
                    })}
                  </div>
                </div>
                <Button onClick={() => setExerciseStep(1)}>
                  Next: Impact Assessment
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step: Impact */}
          {exerciseStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Impact Assessment</CardTitle>
                <CardDescription>
                  Based on your dependency map, here is what is affected.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {active.initiallyAffectedAssetIds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Go back and select which assets are directly affected.
                  </p>
                ) : cascade ? (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Directly affected ({active.initiallyAffectedAssetIds.length}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {active.initiallyAffectedAssetIds.map((id) => {
                          const a = assets.find((x) => x.id === id)
                          return (
                            <Badge key={id} variant="destructive" className="text-xs">
                              {a?.name ?? id}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                    {cascade.phases.length > 1 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Cascade effects:</p>
                        {cascade.phases.slice(1).map((phase) => (
                          <div key={phase.phase} className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              Phase {phase.phase} (downstream):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {phase.assetIds.map((id) => {
                                const a = assets.find((x) => x.id === id)
                                return (
                                  <Badge key={id} variant="secondary" className="text-xs">
                                    {a?.name ?? id}
                                  </Badge>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {cascade.affectedAssetIds.length <=
                      active.initiallyAffectedAssetIds.length && (
                      <p className="text-xs text-muted-foreground">
                        No additional downstream impacts found. (Have you mapped
                        dependencies?)
                      </p>
                    )}
                  </>
                ) : null}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setExerciseStep(0)}>
                    Back
                  </Button>
                  <Button onClick={() => setExerciseStep(2)}>
                    Next: Immediate Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Immediate Response */}
          {exerciseStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Immediate Response</CardTitle>
                <CardDescription>
                  Discuss and document your immediate reaction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {active.discussionPrompts.map((prompt, i) => (
                  <div key={i} className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">{prompt}</p>
                  </div>
                ))}
                <div>
                  <Label>Exercise Notes</Label>
                  <Textarea
                    value={active.exerciseNotes}
                    onChange={(e) =>
                      updateScenario(active.id, {
                        exerciseNotes: e.target.value,
                      })
                    }
                    rows={6}
                    placeholder="Document the discussion, decisions, and answers..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setExerciseStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setExerciseStep(3)}>
                    Next: Recovery Sequence
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Recovery */}
          {exerciseStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Recovery Sequence</CardTitle>
                <CardDescription>
                  Document the steps to recover, in order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {active.recoverySteps.map((step, i) => (
                  <div key={step.id} className="flex gap-2 items-start">
                    <span className="text-xs font-bold text-muted-foreground mt-2 w-6">
                      {i + 1}.
                    </span>
                    <div className="flex-1 space-y-1">
                      <Input
                        value={step.action}
                        onChange={(e) => {
                          const steps = [...active.recoverySteps]
                          steps[i] = { ...steps[i], action: e.target.value }
                          updateScenario(active.id, { recoverySteps: steps })
                        }}
                        placeholder="What needs to happen?"
                      />
                      <div className="grid grid-cols-2 gap-1">
                        <Input
                          value={step.responsiblePerson}
                          onChange={(e) => {
                            const steps = [...active.recoverySteps]
                            steps[i] = {
                              ...steps[i],
                              responsiblePerson: e.target.value,
                            }
                            updateScenario(active.id, { recoverySteps: steps })
                          }}
                          placeholder="Who?"
                          className="text-xs"
                        />
                        <Input
                          value={step.estimatedDuration}
                          onChange={(e) => {
                            const steps = [...active.recoverySteps]
                            steps[i] = {
                              ...steps[i],
                              estimatedDuration: e.target.value,
                            }
                            updateScenario(active.id, { recoverySteps: steps })
                          }}
                          placeholder="How long?"
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const steps = active.recoverySteps.filter(
                          (_, idx) => idx !== i
                        )
                        updateScenario(active.id, { recoverySteps: steps })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const step: ScenarioStep = {
                      id: uuid(),
                      stepNumber: active.recoverySteps.length + 1,
                      action: '',
                      responsiblePerson: '',
                      estimatedDuration: '',
                      notes: '',
                    }
                    updateScenario(active.id, {
                      recoverySteps: [...active.recoverySteps, step],
                    })
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Step
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setExerciseStep(2)}>
                    Back
                  </Button>
                  <Button onClick={() => setExerciseStep(4)}>
                    Next: Backup Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Backups */}
          {exerciseStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Backup Reality Check</CardTitle>
                <CardDescription>
                  For each affected asset, can you actually restore it?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(cascade?.affectedAssetIds ?? active.initiallyAffectedAssetIds).map(
                  (id) => {
                    const asset = assets.find((a) => a.id === id)
                    const backup = backupMap.get(id)
                    if (!asset) return null
                    return (
                      <div
                        key={id}
                        className="p-3 border rounded-md flex items-center justify-between"
                      >
                        <div>
                          <span className="text-sm font-medium">
                            {asset.name}
                          </span>
                          {backup?.hasBackup === 'Yes' ? (
                            <p className="text-xs text-green-600">
                              Backed up ({backup.backupMethod})
                              {backup.lastTestRestoreDate &&
                                ` · Last tested: ${backup.lastTestRestoreDate}`}
                            </p>
                          ) : backup?.hasBackup === 'No' ? (
                            <p className="text-xs text-red-600">No backup!</p>
                          ) : (
                            <p className="text-xs text-yellow-600">
                              Backup status unknown
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setExerciseStep(3)}>
                    Back
                  </Button>
                  <Button onClick={() => setExerciseStep(5)}>
                    Next: Gap Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Gaps */}
          {exerciseStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Gap Analysis</CardTitle>
                <CardDescription>
                  Issues identified from this exercise.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const affectedIds =
                    cascade?.affectedAssetIds ??
                    active.initiallyAffectedAssetIds
                  const gaps: string[] = []

                  for (const id of affectedIds) {
                    const asset = assets.find((a) => a.id === id)
                    const backup = backupMap.get(id)
                    if (!asset) continue
                    if (!backup || backup.hasBackup !== 'Yes') {
                      gaps.push(`${asset.name}: No documented backup`)
                    } else {
                      if (!backup.lastTestRestoreDate) {
                        gaps.push(
                          `${asset.name}: Backup never test-restored`
                        )
                      }
                      if (!backup.restoreSteps) {
                        gaps.push(
                          `${asset.name}: No restore steps documented`
                        )
                      }
                    }
                    if (!asset.ownerName) {
                      gaps.push(`${asset.name}: No owner assigned`)
                    }
                  }

                  if (active.recoverySteps.length === 0) {
                    gaps.push('No recovery steps documented')
                  }

                  return gaps.length > 0 ? (
                    <ul className="space-y-1">
                      {gaps.map((g, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      No critical gaps found for this scenario.
                    </div>
                  )
                })()}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setExerciseStep(4)}>
                    Back
                  </Button>
                  <Button onClick={() => setExerciseStep(6)}>
                    Next: Action Items
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Actions */}
          {exerciseStep === 6 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Action Items & Wrap-up
                </CardTitle>
                <CardDescription>
                  Document what needs to change based on this exercise.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Additional Notes & Action Items</Label>
                  <Textarea
                    value={active.exerciseNotes}
                    onChange={(e) =>
                      updateScenario(active.id, {
                        exerciseNotes: e.target.value,
                      })
                    }
                    rows={8}
                    placeholder="What needs to change? What did you learn? What are the next steps?"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setExerciseStep(5)}>
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      updateScenario(active.id, { status: 'Completed' })
                      setCompletedName(active.name)
                      setActiveScenario(null)
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

      {/* Delete Confirmation */}
      <Dialog open={deleteScenarioId !== null} onOpenChange={(open) => { if (!open) setDeleteScenarioId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scenario</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteScenarioId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteScenarioId) deleteScenario(deleteScenarioId)
                setDeleteScenarioId(null)
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Picker */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose a Scenario</DialogTitle>
            <DialogDescription>
              Pick a pre-built scenario to start a tabletop exercise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {scenarioTemplates.map((tpl) => (
              <Card
                key={tpl.name}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => createFromTemplate(tpl)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{tpl.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {tpl.scenarioType}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {tpl.triggerDescription}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
