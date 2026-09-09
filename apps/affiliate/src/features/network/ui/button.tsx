import { Button as BrandButton, type ButtonProps } from '@waverly/design-system/ui/button'

type Props = Omit<ButtonProps, 'variant' | 'size'> & {
  variant?: ButtonProps['variant'] | 'outline'
  size?: ButtonProps['size'] | 'xs' | 'icon-xs' | 'icon-lg'
}

export function Button({ variant, size, ...props }: Props) {
  return (
    <BrandButton
      {...props}
      variant={variant === 'outline' ? 'secondary' : variant}
      size={
        size === 'xs' ? 'sm' : size === 'icon-xs' ? 'icon-sm' : size === 'icon-lg' ? 'icon' : size
      }
    />
  )
}
