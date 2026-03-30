import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HelpCircle, AlertTriangle } from 'lucide-react'

const tabs = [
  { key: 'getting-started' as const, label: 'Getting Started' },
  { key: 'data' as const, label: 'Your Data' },
  { key: 'about' as const, label: 'About' },
]

type TabKey = (typeof tabs)[number]['key']

export function HelpModal() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('getting-started')

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Help and About"
        className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent min-h-[44px] min-w-[44px]"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Help and About</DialogTitle>
          </DialogHeader>

          {/* Tab bar */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-muted border border-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 text-sm font-medium px-3 py-1.5 rounded-md text-center transition-all ${
                  activeTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'getting-started' && (
            <div className="space-y-3">
              <h3 className="font-semibold">Getting Started</h3>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">
                    1. Inventory your technology.
                  </strong>{' '}
                  Go to <strong>Assets</strong> and use the template picker to
                  quickly add your tools, services, and infrastructure. Set the
                  criticality level for each — this drives the priority of
                  everything else.
                </p>
                <p>
                  <strong className="text-foreground">
                    2. Map your dependencies.
                  </strong>{' '}
                  On the <strong>Dependencies</strong> page, connect assets to
                  show what relies on what. Click any node in the graph to
                  simulate a failure and see the downstream cascade.
                </p>
                <p>
                  <strong className="text-foreground">
                    3. Check your backups.
                  </strong>{' '}
                  The <strong>Backups</strong> page shows the backup status of
                  every asset. Document what is backed up, where, and when you
                  last tested a restore. The traffic-light indicators make gaps
                  obvious.
                </p>
                <p>
                  <strong className="text-foreground">
                    4. Document your workflows.
                  </strong>{' '}
                  On the <strong>Workflows</strong> page, list your key
                  business processes and link them to the assets they depend on.
                  Include the manual workaround for each — what can staff do
                  with pen and paper if the technology is down?
                </p>
                <p>
                  <strong className="text-foreground">
                    5. Run a tabletop scenario.
                  </strong>{' '}
                  The <strong>Scenarios</strong> page walks you through guided
                  "what if" exercises. Pick a scenario (ransomware, internet
                  outage, key person departure, etc.), select the affected
                  assets, and work through the 7-step exercise. Most take 30-45
                  minutes and reveal gaps you did not know you had.
                </p>
                <p>
                  <strong className="text-foreground">
                    6. Export your plan.
                  </strong>{' '}
                  On the <strong>Data</strong> page, export a PDF recovery plan
                  document or a JSON backup of all your data.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-3">
              <h3 className="font-semibold">Your Data</h3>
              <div className="space-y-2.5 text-sm text-muted-foreground">
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
                  <p className="font-medium text-yellow-700 dark:text-yellow-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    This is not a secure datastore.
                  </p>
                  <p className="mt-1 text-yellow-800/80 dark:text-yellow-400/80">
                    All data is stored in your browser's IndexedDB. It is not
                    encrypted, not backed up automatically, and will be lost if
                    you clear your browser data.
                  </p>
                </div>
                <p>
                  <strong className="text-foreground">
                    Export regularly.
                  </strong>{' '}
                  Use "Export to JSON" on the Data page to save your assessment
                  to a file. This is your backup — keep it somewhere safe.
                  The exported file includes all assets, dependencies, backup
                  records, workflows, and scenarios.
                </p>
                <p>
                  <strong className="text-foreground">
                    Import to restore.
                  </strong>{' '}
                  Use "Choose JSON File" on the Data page to load a previously
                  exported file. This will replace all current data — you will
                  be asked to confirm before it happens.
                </p>
                <p>
                  <strong className="text-foreground">
                    PDF export for sharing.
                  </strong>{' '}
                  The PDF recovery plan is a printable document you can hand to
                  a client or keep in a binder. It includes the full asset
                  inventory, dependency map, backup status, workflows, scenario
                  playbooks, and contact directory.
                </p>
                <p>
                  <strong className="text-foreground">
                    Do not store sensitive data.
                  </strong>{' '}
                  Avoid entering passwords, API keys, or other secrets in any
                  field. Browser storage is accessible to any script running on
                  the same origin.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">PumaResilience</h3>
                <p className="text-sm text-muted-foreground">
                  BCP/DR Planning Tool
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                This tool is provided as-is, with no warranties or guarantees
                of any kind. Use it at your own risk. I am not responsible for
                how you use this tool, any decisions you make based on its
                output, the accuracy of its results, any bugs or security
                vulnerabilities, or the safety and security of any data you
                enter into it. This tool does not provide professional advice.
                By using it, you accept full responsibility for any outcomes
                that result from your use.
              </p>
              <p className="text-sm">
                Built by{' '}
                <a
                  href="https://www.greykit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Greykit.com
                </a>
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
