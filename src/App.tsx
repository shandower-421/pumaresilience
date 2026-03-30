import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Shield,
  Network,
  HardDrive,
  AlertTriangle,
  Database,
  LayoutDashboard,
  Workflow,
  Lock,
  Menu,
  X,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HelpModal } from '@/components/HelpModal'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AssetsPage = lazy(() => import('@/pages/AssetsPage').then(m => ({ default: m.AssetsPage })))
const DependenciesPage = lazy(() => import('@/pages/DependenciesPage').then(m => ({ default: m.DependenciesPage })))
const BackupsPage = lazy(() => import('@/pages/BackupsPage').then(m => ({ default: m.BackupsPage })))
const ScenariosPage = lazy(() => import('@/pages/ScenariosPage').then(m => ({ default: m.ScenariosPage })))
const WorkflowsPage = lazy(() => import('@/pages/WorkflowsPage').then(m => ({ default: m.WorkflowsPage })))
const DataPage = lazy(() => import('@/pages/DataPage').then(m => ({ default: m.DataPage })))

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assets', icon: HardDrive, label: 'Assets' },
  { to: '/dependencies', icon: Network, label: 'Dependencies' },
  { to: '/backups', icon: Database, label: 'Backups' },
  { to: '/workflows', icon: Workflow, label: 'Workflows' },
  { to: '/scenarios', icon: AlertTriangle, label: 'Scenarios' },
  { to: '/data', icon: Shield, label: 'Data' },
]

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-sm text-muted-foreground">Loading...</div>
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </>
  )
}

function AppContent() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const pageTitle = navItems.find(
    (n) => n.to === location.pathname || (n.to === '/' && location.pathname === '/')
  )?.label ?? 'PumaResilience'

  return (
    <TooltipProvider>
      {/* Skip nav link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:text-sm"
      >
        Skip to main content
      </a>

      {__DEMO_MODE__ && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          Demo Mode — Sample data pre-loaded. Import/export/clear disabled.
        </div>
      )}

      <div className={`flex bg-background ${__DEMO_MODE__ ? 'h-[calc(100vh-40px)]' : 'h-screen'}`}>
        {/* Desktop sidebar */}
        <nav
          className="hidden lg:flex w-56 bg-sidebar text-sidebar-foreground flex-col shrink-0"
          aria-label="Main navigation"
        >
          <header className="p-4 border-b border-sidebar-border">
            <div className="text-lg font-bold flex items-center gap-2 text-white">
              <a href="https://www.greykit.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Shield className="h-5 w-5 text-sidebar-primary" aria-hidden="true" />
                PumaResilience
              </a>
            </div>
            <p className="text-xs text-sidebar-foreground/60 mt-1">
              BCP/DR Planning Tool
            </p>
          </header>
          <div className="flex-1 p-2 space-y-0.5">
            <NavLinks />
          </div>
          <footer className="p-3 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/50">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Data stored locally
              </div>
              <HelpModal />
            </div>
          </footer>
        </nav>

        {/* Mobile header */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-sidebar text-sidebar-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="text-sidebar-foreground hover:bg-sidebar-accent min-h-[44px] min-w-[44px]"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-white font-bold">
              <Shield className="h-4 w-4 text-sidebar-primary" aria-hidden="true" />
              PumaResilience
            </div>
            <span className="text-sidebar-foreground/60 text-sm ml-auto mr-1">
              {pageTitle}
            </span>
            <HelpModal />
          </div>

          {/* Main content */}
          <main id="main-content" className="flex-1 overflow-auto" role="main">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/dependencies" element={<DependenciesPage />} />
                <Route path="/backups" element={<BackupsPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/scenarios" element={<ScenariosPage />} />
                <Route path="/data" element={<DataPage />} />
              </Routes>
            </Suspense>
          </main>
        </div>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border [&>button]:text-sidebar-foreground"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <header className="p-4 border-b border-sidebar-border flex items-center justify-between">
              <div className="text-lg font-bold flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-sidebar-primary" aria-hidden="true" />
                PumaResilience
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="text-sidebar-foreground hover:bg-sidebar-accent min-h-[44px] min-w-[44px]"
              >
                <X className="h-5 w-5" />
              </Button>
            </header>
            <div className="p-2 space-y-0.5">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <footer className="absolute bottom-0 left-0 right-0 p-3 border-t border-sidebar-border">
              <div className="flex items-center gap-1.5 text-xs text-sidebar-foreground/50">
                <Lock className="h-3 w-3" aria-hidden="true" />
                All data stored locally
              </div>
            </footer>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  )
}

function App() {
  const Router = __STANDALONE_MODE__ ? HashRouter : BrowserRouter
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
