import React from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { LandingPage } from '@pages/LandingPage'
import { LoginPage } from '@pages/LoginPage'
import { SignUpPage } from '@pages/SignUpPage'
import { DashboardPage } from '@pages/DashboardPage'
import { DagEditorPage } from '@pages/DagEditorPage'
import { SurveyPage } from '@pages/SurveyPage'
import { FlowStatsPage } from '@pages/FlowStatsPage'
import { OfferPreviewPage } from '@pages/OfferPreviewPage'
import { useAuthStore } from '@features/auth/store/auth.store'

// ─── Root route ───────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

// ─── Animated page wrapper ────────────────────────────────────────────────────
// CRITICAL: Use min-height: 0 (not 100vh) so the flex chain can shrink properly.
// The actual page height is controlled by each page component.
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        flex: '1 1 0%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Auth guard helper ────────────────────────────────────────────────────────
function requireAuth() {
  const { isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated) {
    throw redirect({ to: '/' })
  }
}

function requireGuest() {
  const { isAuthenticated } = useAuthStore.getState()
  if (isAuthenticated) {
    throw redirect({ to: '/dashboard' })
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: () => <LandingPage />,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: requireGuest,
  component: () => (
    <PageWrapper>
      <LoginPage />
    </PageWrapper>
  ),
})

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  beforeLoad: requireGuest,
  component: () => (
    <PageWrapper>
      <SignUpPage />
    </PageWrapper>
  ),
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: requireAuth,
  component: () => (
    <PageWrapper>
      <DashboardPage />
    </PageWrapper>
  ),
})

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/editor/$surveyId',
  beforeLoad: requireAuth,
  component: () => (
    <PageWrapper>
      <DagEditorPage />
    </PageWrapper>
  ),
})

const statsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stats/$flowId',
  beforeLoad: requireAuth,
  component: () => (
    <PageWrapper>
      <FlowStatsPage />
    </PageWrapper>
  ),
})

// Public landing page route — always accessible
const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/landing',
  component: () => <LandingPage />,
})

// Public survey-taking route — no authentication required
const surveyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/survey/$surveyId',
  component: () => (
    <PageWrapper>
      <SurveyPage />
    </PageWrapper>
  ),
})

// Offer preview — opened in new tab from the DAG editor
// Accepts ?offerId=<uuid> (fetch from backend) or ?data=<base64> (inline data)
const offerPreviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/offer-preview',
  validateSearch: (search: Record<string, unknown>) => ({
    offerId: typeof search.offerId === 'string' ? search.offerId : undefined,
    data: typeof search.data === 'string' ? search.data : undefined,
  }),
  component: () => (
    <PageWrapper>
      <OfferPreviewPage />
    </PageWrapper>
  ),
})

// ─── Router ──────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  landingRoute,
  loginRoute,
  signupRoute,
  dashboardRoute,
  editorRoute,
  statsRoute,
  surveyRoute,
  offerPreviewRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
