import type { ComponentType } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { PageLoader } from '@/components/feedback/PageLoader'
import { AuthGuard } from '@/features/auth/AuthGuard'
import { AppShell } from './layout/AppShell'
import { NotFoundPage, RouteErrorPage } from './RouteErrorPage'

/** Code-splits a page: `lazyPage(() => import('...'), 'NamedExport')`. */
function lazyPage<K extends string>(
  load: () => Promise<Record<K, ComponentType>>,
  exportName: K,
): Pick<RouteObject, 'lazy'> {
  return { lazy: async () => ({ Component: (await load())[exportName] }) }
}

export const routes: RouteObject[] = [
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    ...lazyPage(() => import('@/features/auth/LoginPage'), 'LoginPage'),
  },
  {
    path: 'enter-password',
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    ...lazyPage(() => import('@/features/auth/EnterPasswordPage'), 'EnterPasswordPage'),
  },
  {
    path: 'forgot-password',
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    ...lazyPage(() => import('@/features/auth/ForgotPasswordPage'), 'ForgotPasswordPage'),
  },
  {
    // Cognito Hosted UI redirect target (VITE_COGNITO_REDIRECT_SIGN_IN).
    path: 'home',
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    ...lazyPage(() => import('@/features/auth/AuthCallbackPage'), 'AuthCallbackPage'),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      // { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        handle: { crumb: 'Dashboard' },
        children: [
          {
            index: true,
            ...lazyPage(
              () => import('@/features/dashboard/DashboardHomePage'),
              'DashboardHomePage',
            ),
          },
          {
            path: 'loan',
            handle: { crumb: 'Loan Opportunities' },
            ...lazyPage(
              () => import('@/features/dashboard/PipelineDashboardPage'),
              'LoanDashboardPage',
            ),
          },
          {
            path: 'investment',
            handle: { crumb: 'Investment Opportunities' },
            ...lazyPage(
              () => import('@/features/dashboard/PipelineDashboardPage'),
              'InvestmentDashboardPage',
            ),
          },
          {
            path: 'custom',
            handle: { crumb: 'Custom comparison' },
            ...lazyPage(
              () => import('@/features/dashboard/CustomDashboardPage'),
              'CustomDashboardPage',
            ),
          },
        ],
      },
      {
        path: 'targets',
        handle: { crumb: 'Targets' },
        ...lazyPage(() => import('@/features/targets/TargetsPage'), 'TargetsPage'),
      },
      {
        path: 'calendar',
        handle: { crumb: 'Calendar' },
        ...lazyPage(() => import('@/features/calendar/CalendarPage'), 'CalendarPage'),
      },
      {
        path: 'loan-opportunities',
        handle: { crumb: 'Loan Opportunities' },
        children: [
          {
            index: true,
            ...lazyPage(
              () => import('@/features/opportunities/OpportunitiesPage'),
              'LoanOpportunitiesPage',
            ),
          },
          {
            path: ':opportunityId',
            ...lazyPage(
              () => import('@/features/opportunities/OpportunityDetailPage'),
              'OpportunityDetailPage',
            ),
          },
        ],
      },
      {
        path: 'investment-opportunities',
        handle: { crumb: 'Investment Opportunities' },
        children: [
          {
            index: true,
            ...lazyPage(
              () => import('@/features/opportunities/OpportunitiesPage'),
              'InvestmentOpportunitiesPage',
            ),
          },
          {
            path: ':opportunityId',
            ...lazyPage(
              () => import('@/features/opportunities/OpportunityDetailPage'),
              'OpportunityDetailPage',
            ),
          },
        ],
      },
      {
        path: 'people',
        handle: { crumb: 'People' },
        children: [
          { index: true, ...lazyPage(() => import('@/features/people/PeoplePage'), 'PeoplePage') },
          {
            path: ':personId',
            ...lazyPage(() => import('@/features/people/PersonDetailPage'), 'PersonDetailPage'),
          },
        ],
      },
      {
        path: 'entities',
        handle: { crumb: 'Entities' },
        children: [
          {
            index: true,
            ...lazyPage(() => import('@/features/entities/EntitiesPage'), 'EntitiesPage'),
          },
          {
            path: ':entityId',
            ...lazyPage(() => import('@/features/entities/EntityDetailPage'), 'EntityDetailPage'),
          },
        ],
      },
      {
        path: 'tasks',
        handle: { crumb: 'Tasks' },
        children: [
          { index: true, ...lazyPage(() => import('@/features/tasks/TasksPage'), 'TasksPage') },
          {
            path: ':taskId',
            ...lazyPage(() => import('@/features/tasks/TaskDetailPage'), 'TaskDetailPage'),
          },
        ],
      },
      {
        path: 'reports',
        handle: { crumb: 'Reports' },
        ...lazyPage(() => import('@/features/reports/ReportsPage'), 'ReportsPage'),
      },
      {
        path: 'settings',
        handle: { crumb: 'Settings' },
        children: [
          { index: true, element: <Navigate to="pipelines" replace /> },
          {
            path: 'pipelines',
            handle: { crumb: 'Opportunity stages' },
            ...lazyPage(
              () => import('@/features/settings/PipelineConfigPage'),
              'PipelineConfigPage',
            ),
          },
          {
            path: 'forms',
            handle: { crumb: 'Field map configuration' },
            ...lazyPage(() => import('@/features/settings/FieldMapPage'), 'FieldMapPage'),
          },
          {
            path: 'validations',
            handle: { crumb: 'Validations' },
            ...lazyPage(() => import('@/features/settings/ValidationsPage'), 'ValidationsPage'),
          },
          {
            path: 'roles',
            handle: { crumb: 'Roles and permissions' },
            ...lazyPage(() => import('@/features/settings/GovernancePage'), 'GovernancePage'),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
