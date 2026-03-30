import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import { findSinglePointsOfFailure } from '@/lib/graph-engine'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Network,
  Database,
  XCircle,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react'

export function DashboardPage() {
  const assets = useLiveQuery(() => db.assets.toArray()) ?? []
  const dependencies = useLiveQuery(() => db.dependencies.toArray()) ?? []
  const backups = useLiveQuery(() => db.backupInfos.toArray()) ?? []
  const scenarios = useLiveQuery(() => db.scenarios.toArray()) ?? []
  const workflows = useLiveQuery(() => db.workflows.toArray()) ?? []

  const criticalAssets = assets.filter((a) => a.criticality === 'Critical')
  const backupMap = new Map(backups.map((b) => [b.assetId, b]))
  const spofs = findSinglePointsOfFailure(assets, dependencies)

  const assetsWithBackup = assets.filter((a) => {
    const b = backupMap.get(a.id)
    return b && b.hasBackup === 'Yes'
  })

  const untestedBackups = backups.filter((b) => {
    if (b.hasBackup !== 'Yes') return false
    if (!b.lastTestRestoreDate) return true
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000
    return new Date(b.lastTestRestoreDate).getTime() < sixMonthsAgo
  })

  const criticalWithoutBackup = criticalAssets.filter((a) => {
    const b = backupMap.get(a.id)
    return !b || b.hasBackup !== 'Yes'
  })

  const completedScenarios = scenarios.filter((s) => s.status === 'Completed')
  const coverage =
    assets.length > 0
      ? Math.round((assetsWithBackup.length / assets.length) * 100)
      : 0

  const issueCount =
    criticalWithoutBackup.length +
    (untestedBackups.length > 0 ? 1 : 0) +
    (spofs.length > 0 ? 1 : 0)

  // Empty state / onboarding
  if (assets.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome to PumaResilience</h1>
          <p className="text-muted-foreground mt-1">
            Plan for the worst so your business survives it.
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Get started in 5 steps</CardTitle>
            <CardDescription>
              Walk through each step to build your business continuity plan.
              Each takes 10-15 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                num: 1,
                label: 'Add your technology',
                desc: 'List the tools, services, and hardware your business depends on',
                href: '/assets',
              },
              {
                num: 2,
                label: 'Map dependencies',
                desc: 'Show what relies on what — so you can see the cascade when something fails',
                href: '/dependencies',
              },
              {
                num: 3,
                label: 'Check your backups',
                desc: 'Document what is backed up, where, and when you last tested a restore',
                href: '/backups',
              },
              {
                num: 4,
                label: 'Document your workflows',
                desc: 'Identify your key business processes and their manual workarounds',
                href: '/workflows',
              },
              {
                num: 5,
                label: 'Run a tabletop scenario',
                desc: 'Walk through a "what if" exercise to find gaps in your plan',
                href: '/scenarios',
              },
            ].map((step) => (
              <Link
                key={step.num}
                to={step.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group"
              >
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {step.num}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {issueCount > 0 ? (
          <Badge variant="destructive" className="text-xs">
            {issueCount} issue{issueCount !== 1 ? 's' : ''} to address
          </Badge>
        ) : (
          <Badge className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
            <CheckCircle2 className="h-3 w-3 mr-1" /> All clear
          </Badge>
        )}
      </div>

      {/* Backup coverage hero — the most actionable metric */}
      <Card
        className={
          coverage >= 80
            ? 'border-emerald-200 bg-emerald-50/50'
            : coverage >= 50
              ? 'border-yellow-200 bg-yellow-50/50'
              : 'border-red-200 bg-red-50/50'
        }
      >
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Backup Coverage</span>
            </div>
            <span className="text-2xl font-bold">{coverage}%</span>
          </div>
          <div className="h-2.5 bg-white/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full animate-bar-fill ${
                coverage >= 80
                  ? 'bg-emerald-500'
                  : coverage >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${coverage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {coverage === 100
              ? 'Every asset has a documented backup. Well done.'
              : coverage >= 80
                ? `${assetsWithBackup.length} of ${assets.length} backed up — almost there.`
                : coverage >= 50
                  ? `${assetsWithBackup.length} of ${assets.length} backed up — good progress, keep going.`
                  : coverage > 0
                    ? `${assetsWithBackup.length} of ${assets.length} backed up — your critical assets should be the priority.`
                    : 'No backups documented yet. Start with your most critical assets.'}
          </p>
        </CardContent>
      </Card>

      {/* Alerts — the primary action area */}
      {issueCount > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Issues to Address
          </h2>

          {criticalWithoutBackup.length > 0 && (
            <Card className="border-red-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Critical assets without backup
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {criticalWithoutBackup.map((a) => (
                        <Badge
                          key={a.id}
                          variant="secondary"
                          className="text-xs bg-red-50 text-red-700"
                        >
                          {a.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Link to="/backups">
                    <Button size="sm" variant="outline" className="shrink-0">
                      Fix
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {untestedBackups.length > 0 && (
            <Card className="border-yellow-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {untestedBackups.length} backup(s) never tested or
                      tested over 6 months ago
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A backup you have never tested is a backup you cannot
                      trust.
                    </p>
                  </div>
                  <Link to="/backups">
                    <Button size="sm" variant="outline" className="shrink-0">
                      Review
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {spofs.length > 0 && (
            <Card className="border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {spofs.length} Single Point(s) of Failure
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {spofs.slice(0, 5).map(({ asset, downstreamCount }) => (
                        <Badge
                          key={asset.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {asset.name}{' '}
                          <span className="text-muted-foreground ml-1">
                            ({downstreamCount} downstream)
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Link to="/dependencies">
                    <Button size="sm" variant="outline" className="shrink-0">
                      View Map
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {issueCount === 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-medium text-sm">
                  Your business is prepared
                </p>
                <p className="text-xs text-muted-foreground">
                  Critical assets backed up, no single points of failure, and{' '}
                  {completedScenarios.length > 0
                    ? `${completedScenarios.length} tabletop exercise${completedScenarios.length !== 1 ? 's' : ''} completed. Schedule your next review to keep this current.`
                    : 'infrastructure looks solid. Run a tabletop scenario to test your team\'s readiness.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary stats — compact secondary info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Link to="/assets" className="group">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <HardDrive className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Assets</span>
              </div>
              <div className="text-xl font-bold">{assets.length}</div>
              <p className="text-[10px] text-muted-foreground">
                {criticalAssets.length} critical
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dependencies" className="group">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Network className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Dependencies</span>
              </div>
              <div className="text-xl font-bold">{dependencies.length}</div>
              <p className="text-[10px] text-muted-foreground">
                {spofs.length} SPOF{spofs.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/workflows" className="group">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <ClipboardList className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Workflows</span>
              </div>
              <div className="text-xl font-bold">{workflows.length}</div>
              <p className="text-[10px] text-muted-foreground">
                business processes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/scenarios" className="group">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Scenarios</span>
              </div>
              <div className="text-xl font-bold">
                {completedScenarios.length}/{scenarios.length}
              </div>
              <p className="text-[10px] text-muted-foreground">completed</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/backups" className="group">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                <Database className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Backups</span>
              </div>
              <div className="text-xl font-bold">{coverage}%</div>
              <p className="text-[10px] text-muted-foreground">coverage</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
