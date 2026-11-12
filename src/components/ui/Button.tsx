import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'
import type { SxProps, Theme } from '@mui/material/styles'
import { Link, type LinkProps } from 'react-router-dom'
import { palette } from '@/theme/tokens'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'

const MUI_VARIANT: Record<ButtonVariant, Pick<MuiButtonProps, 'variant' | 'color'>> = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'outlined', color: 'inherit' },
  ghost: { variant: 'outlined', color: 'primary' },
  link: { variant: 'text', color: 'primary' },
}

const VARIANT_SX: Record<ButtonVariant, SxProps<Theme>> = {
  primary: {},
  secondary: {
    borderColor: palette.line,
    color: palette.text,
    backgroundColor: palette.surface,
    '&:hover': { borderColor: palette.subtle, backgroundColor: palette.surfaceAlt },
  },
  ghost: {
    borderColor: palette.brandBorder,
    backgroundColor: palette.surface,
    '&:hover': { borderColor: palette.brand, backgroundColor: palette.brandTint },
  },
  link: {
    minWidth: 0,
    padding: 0,
    fontSize: 12,
    fontWeight: 700,
    '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
  },
}

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'color'> {
  variant?: ButtonVariant
}

function mergeSx(variant: ButtonVariant, sx: SxProps<Theme> | undefined): SxProps<Theme> {
  return [VARIANT_SX[variant], ...(Array.isArray(sx) ? sx : [sx])] as SxProps<Theme>
}

/** App button. Variants: primary (CTA), secondary (default), ghost (red outline), link. */
export function Button({ variant = 'secondary', sx, ...rest }: ButtonProps) {
  return <MuiButton {...MUI_VARIANT[variant]} sx={mergeSx(variant, sx)} {...rest} />
}

export interface ButtonLinkProps extends Omit<ButtonProps, 'href'> {
  to: LinkProps['to']
}

/** Same look as `Button`, but navigates with the router. */
export function ButtonLink({ variant = 'secondary', sx, to, ...rest }: ButtonLinkProps) {
  return (
    <MuiButton
      component={Link}
      to={to}
      {...MUI_VARIANT[variant]}
      sx={mergeSx(variant, sx)}
      {...rest}
    />
  )
}
