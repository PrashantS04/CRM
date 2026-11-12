import {
  Banknote,
  Building2,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface SubNavItem {
  label: string
  /** Omit for items that are listed but not built yet. */
  to?: string
}

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Shown only while the parent section is active. */
  children?: readonly SubNavItem[]
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    children: [
      { label: 'Loan Opportunities', to: '/dashboard/loan' },
      { label: 'Investment Opportunities', to: '/dashboard/investment' },
    ],
  },
  { label: 'Loan Opportunities', to: '/loan-opportunities', icon: Banknote },
  { label: 'Investment Opportunities', to: '/investment-opportunities', icon: TrendingUp },
  { label: 'People', to: '/people', icon: Users },
  { label: 'Entities', to: '/entities', icon: Building2 },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { label: 'Reports', to: '/reports', icon: FileText },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    children: [
      { label: 'Opportunity stages', to: '/settings/pipelines' },
      { label: 'Field map configuration', to: '/settings/forms' },
      { label: 'Validations', to: '/settings/validations' },
      { label: 'Reference data' },
      { label: 'User management' },
      { label: 'Audit log' },
    ],
  },
]
