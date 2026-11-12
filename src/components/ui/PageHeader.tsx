import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { ButtonLink } from './Button'

export interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Renders a "← Back to ..." link above the title. */
  back?: { to: string; label: string }
  actions?: ReactNode
}

/** Page title block with optional back link and right-aligned actions. */
export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <ButtonLink
            to={back.to}
            variant="link"
            startIcon={<ArrowLeft size={14} />}
            sx={{ mb: 1 }}
          >
            {back.label}
          </ButtonLink>
        )}
        <h1 className="text-ink m-0 mb-1.5 text-[26px] leading-tight font-bold tracking-tight sm:text-[30px]">
          {title}
        </h1>
        {description && <p className="text-muted m-0">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
