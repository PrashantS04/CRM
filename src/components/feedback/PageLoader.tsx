import CircularProgress from '@mui/material/CircularProgress'

/** Centred spinner for page- and section-level loading. */
export function PageLoader() {
  return (
    <div className="grid place-items-center py-16" role="status" aria-label="Loading">
      <CircularProgress size={28} />
    </div>
  )
}
