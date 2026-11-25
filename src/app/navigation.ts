import {
  Banknote,
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
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
  /** Omit for items that are listed in the prototype but not built yet. */
  to?: string
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
  { label: 'Calendar', icon: Calendar },
  { label: 'Security holders', icon: ShieldCheck },
  { label: 'Reports', to: '/reports', icon: FileText },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    children: [
      { label: 'Opportunity stages', to: '/settings/pipelines' },
      { label: 'Field map and objects', to: '/settings/forms' },
      { label: 'Validations', to: '/settings/validations' },
      { label: 'Roles and permissions' },
      { label: 'Reference data' },
      { label: 'User management' },
      { label: 'Audit log' },
    ],
  },
]
