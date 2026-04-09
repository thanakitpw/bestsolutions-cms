import Link from 'next/link'

type Breadcrumb = { label: string; href?: string }

type PageHeaderProps = {
  title: string
  breadcrumbs?: Breadcrumb[]
  action?: React.ReactNode
}

export function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-8 pt-8 pb-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav
            className="flex items-center gap-1 text-sm text-muted-foreground mb-1"
            aria-label="breadcrumb"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
