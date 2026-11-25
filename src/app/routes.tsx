import type { ComponentType } from 'react'
import { Navigate, redirect, type RouteObject } from 'react-router-dom'
import { PageLoader } from '@/components/feedback/PageLoader'
import { AppShell } from './layout/AppShell'
import { RouteErrorPage } from './RouteErrorPage'

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
    path: '/',
    element: <AppShell />,
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
      // People and Entities are served by the live, metadata-driven records module (CRM-Backend
      // /api/persons and /api/entities).
      {
        path: 'people',
        handle: { crumb: 'People' },
        children: [
          { index: true, ...lazyPage(() => import('@/features/records/pages'), 'LivePeoplePage') },
          {
            path: ':personId',
            ...lazyPage(() => import('@/features/records/pages'), 'LivePersonPage'),
          },
        ],
      },
      // Older links used /persons/:id.
      { path: 'persons', element: <Navigate to="/people" replace /> },
      {
        path: 'persons/:personId',
        loader: ({ params }) => redirect(`/people/${params.personId ?? ''}`),
      },
      {
        path: 'entities',
        handle: { crumb: 'Entities' },
        children: [
          {
            index: true,
            ...lazyPage(() => import('@/features/records/pages'), 'LiveEntitiesPage'),
          },
          {
            path: ':entityId',
            ...lazyPage(() => import('@/features/records/pages'), 'LiveEntityPage'),
          },
        ],
      },
      // The earlier mock-data People and Entities prototypes, kept reachable until they are retired.
      {
        path: 'prototype',
        handle: { crumb: 'Prototype' },
        children: [
          {
            path: 'people',
            handle: { crumb: 'People (mock data)' },
            children: [
              {
                index: true,
                ...lazyPage(() => import('@/features/people/PeoplePage'), 'PeoplePage'),
              },
              {
                path: ':personId',
                ...lazyPage(() => import('@/features/people/PersonDetailPage'), 'PersonDetailPage'),
              },
            ],
          },
          {
            path: 'entities',
            handle: { crumb: 'Entities (mock data)' },
            children: [
              {
                index: true,
                ...lazyPage(() => import('@/features/entities/EntitiesPage'), 'EntitiesPage'),
              },
              {
                path: ':entityId',
                ...lazyPage(
                  () => import('@/features/entities/EntityDetailPage'),
                  'EntityDetailPage',
                ),
              },
            ],
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
            handle: { crumb: 'Field map and objects' },
            ...lazyPage(() => import('@/features/settings/FieldMapPage'), 'FieldMapPage'),
          },
          {
            path: 'setup',
            handle: { crumb: 'Setup' },
            ...lazyPage(() => import('@/features/records/setup/SetupPage'), 'SetupPage'),
          },
          {
            path: 'validations',
            handle: { crumb: 'Validations' },
            ...lazyPage(() => import('@/features/settings/ValidationsPage'), 'ValidationsPage'),
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]
