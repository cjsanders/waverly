import { AvatarBadge, AvatarFallback, Avatar as ShadcnAvatar } from '#/features/network/ui/avatar'
import { Badge } from '#/features/network/ui/badge'
import { Button as ShadcnButton } from '#/features/network/ui/button'
import { Card as ShadcnCard } from '#/features/network/ui/card'
import { Input } from '#/features/network/ui/input'
import { Progress as ShadcnProgress } from '#/features/network/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/features/network/ui/select'
import { Separator } from '#/features/network/ui/separator'
import { Switch as ShadcnSwitch } from '#/features/network/ui/switch'
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/features/network/ui/table'
import { Tabs, TabsList, TabsTrigger } from '#/features/network/ui/tabs'
import { cn } from '#/lib/utils'
import { Paperclip, X, type LucideProps } from 'lucide-react'
import {
  Children,
  createElement,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

type Dimension = number | string
type StackProps = HTMLAttributes<HTMLDivElement> & {
  gap?: number
  padding?: number
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  wrap?: 'wrap' | 'nowrap'
  width?: Dimension
  height?: Dimension
  maxWidth?: Dimension
}

function dimension(value: Dimension | undefined) {
  if (value === undefined) return undefined
  if (value === 'fill') return '100%'
  return typeof value === 'number' ? `${value}px` : value
}

function space(value: number | undefined) {
  return value === undefined ? undefined : `${value * 0.25}rem`
}

function stackStyle(props: StackProps, direction: 'row' | 'column'): CSSProperties {
  return {
    display: 'flex',
    flexDirection: direction,
    gap: space(props.gap),
    padding: space(props.padding),
    alignItems:
      props.align === 'start' ? 'flex-start' : props.align === 'end' ? 'flex-end' : props.align,
    justifyContent:
      props.justify === 'between'
        ? 'space-between'
        : props.justify === 'start'
          ? 'flex-start'
          : props.justify === 'end'
            ? 'flex-end'
            : props.justify,
    flexWrap: props.wrap,
    width: dimension(props.width),
    height: dimension(props.height),
    maxWidth: dimension(props.maxWidth),
  }
}

export function VStack({ className, style, ...props }: StackProps) {
  const {
    gap: _gap,
    padding: _padding,
    align: _align,
    justify: _justify,
    wrap: _wrap,
    width: _width,
    height: _height,
    maxWidth: _maxWidth,
    ...domProps
  } = props
  return (
    <div
      className={cn('waverly-vstack', className)}
      style={{ ...stackStyle(props, 'column'), ...style }}
      {...domProps}
    />
  )
}

export function HStack({ className, style, ...props }: StackProps) {
  const {
    gap: _gap,
    padding: _padding,
    align: _align,
    justify: _justify,
    wrap: _wrap,
    width: _width,
    height: _height,
    maxWidth: _maxWidth,
    ...domProps
  } = props
  return (
    <div
      className={cn('waverly-hstack', className)}
      style={{ ...stackStyle(props, 'row'), ...style }}
      {...domProps}
    />
  )
}

type GridProps = HTMLAttributes<HTMLDivElement> &
  StackProps & {
    columns?: number | { minWidth: number; max?: number; repeat?: string }
  }

export function Grid({ columns = 1, className, style, ...props }: GridProps) {
  const template =
    typeof columns === 'number'
      ? `repeat(${columns}, minmax(0, 1fr))`
      : `repeat(auto-fit, minmax(min(${columns.minWidth}px, 100%), 1fr))`
  const {
    gap: _gap,
    padding: _padding,
    align: _align,
    justify: _justify,
    wrap: _wrap,
    width: _width,
    height: _height,
    maxWidth: _maxWidth,
    ...domProps
  } = props
  return (
    <div
      className={cn('waverly-grid', className)}
      style={{ display: 'grid', gridTemplateColumns: template, gap: space(props.gap), ...style }}
      {...domProps}
    />
  )
}

export function GridSpan({
  columns,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { columns?: number | 'full' }) {
  return (
    <div
      style={{
        gridColumn: columns === 'full' ? '1 / -1' : `span ${columns ?? 1}`,
        minWidth: 0,
        ...style,
      }}
      {...props}
    />
  )
}

type TextProps = HTMLAttributes<HTMLElement> & {
  type?:
    | 'body'
    | 'large'
    | 'label'
    | 'code'
    | 'supporting'
    | 'display-1'
    | 'display-2'
    | 'display-3'
  color?: string
  weight?: 'normal' | 'medium' | 'semibold'
  hasTabularNumbers?: boolean
  textWrap?: CSSProperties['textWrap']
  width?: Dimension
  maxLines?: number
}

export function Text({
  type = 'body',
  color = 'primary',
  weight = 'normal',
  hasTabularNumbers,
  textWrap,
  width,
  maxLines,
  className,
  style,
  ...props
}: TextProps) {
  return (
    <p
      className={cn(
        'waverly-text',
        `waverly-text-${type}`,
        `waverly-color-${color}`,
        `waverly-weight-${weight}`,
        hasTabularNumbers && 'tabular-nums',
        className,
      )}
      style={{
        textWrap,
        width: dimension(width),
        ...(maxLines
          ? {
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: maxLines,
              overflow: 'hidden',
            }
          : {}),
        ...style,
      }}
      {...props}
    />
  )
}

export function Heading({
  level = 2,
  type,
  color = 'primary',
  textWrap,
  className,
  ...props
}: TextProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  return createElement(`h${level}`, {
    className: cn(
      'waverly-heading',
      type && `waverly-text-${type}`,
      `waverly-color-${color}`,
      className,
    ),
    style: { textWrap },
    ...props,
  })
}

export type IconType = ComponentType<LucideProps>

export function Icon({
  icon: IconComponent,
  color = 'primary',
  size = 'md',
  className,
}: {
  icon: IconType
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <IconComponent
      aria-hidden
      className={cn('waverly-icon', `waverly-color-${color}`, className)}
      size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
    />
  )
}

type ButtonProps = Omit<HTMLAttributes<HTMLElement>, 'onChange'> & {
  label: string
  icon?: ReactNode
  href?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  width?: Dimension
  isDisabled?: boolean
  type?: 'button' | 'submit'
}

export function Button({
  label,
  icon,
  href,
  variant = 'primary',
  size = 'md',
  width,
  isDisabled,
  className,
  ...props
}: ButtonProps) {
  const mappedVariant = variant === 'primary' ? 'default' : variant
  const mappedSize = size === 'md' ? 'default' : size
  const content = (
    <>
      {icon}
      {label}
    </>
  )
  if (href) {
    return (
      <a
        href={href}
        className={cn('waverly-link-button', `waverly-button-${mappedVariant}`, className)}
        style={{ width: dimension(width) }}
      >
        {content}
      </a>
    )
  }
  return (
    <ShadcnButton
      variant={mappedVariant}
      size={mappedSize}
      disabled={isDisabled}
      className={className}
      style={{ width: dimension(width) }}
      {...props}
    >
      {content}
    </ShadcnButton>
  )
}

export function IconButton({
  label,
  icon,
  tooltip,
  isDisabled,
  ...props
}: Omit<ButtonProps, 'label'> & { label: string; tooltip?: string }) {
  return (
    <ShadcnButton
      aria-label={label}
      title={tooltip ?? label}
      variant={props.variant === 'primary' || !props.variant ? 'default' : props.variant}
      size="icon"
      disabled={isDisabled}
      onClick={props.onClick}
    >
      {icon}
    </ShadcnButton>
  )
}

export function Card({
  padding = 4,
  variant = 'default',
  elevation,
  height,
  className,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  padding?: number
  variant?: string
  elevation?: string
  height?: Dimension
}) {
  return (
    <ShadcnCard
      className={cn(
        'waverly-card',
        `waverly-card-${variant}`,
        elevation && `waverly-elevation-${elevation}`,
        className,
      )}
      style={{ padding: space(padding), height: dimension(height), ...style }}
      {...props}
    />
  )
}

export function Section({
  padding = 4,
  variant = 'default',
  className,
  style,
  ...props
}: HTMLAttributes<HTMLElement> & { padding?: number; variant?: string }) {
  return (
    <section
      className={cn('waverly-section', `waverly-section-${variant}`, className)}
      style={{ padding: space(padding), ...style }}
      {...props}
    />
  )
}

export function Divider(props: HTMLAttributes<HTMLDivElement>) {
  return <Separator {...props} />
}

export function AspectRatio({
  ratio,
  fit,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { ratio: number; fit?: string }) {
  return (
    <div
      className="waverly-aspect-ratio"
      style={{ aspectRatio: ratio, ...style }}
      data-fit={fit}
      {...props}
    />
  )
}

export function StatusDot({
  variant = 'neutral',
  label,
  isPulsing,
}: {
  variant?: string
  label: string
  isPulsing?: boolean
}) {
  // A CSS status marker has no image resource; expose its text equivalent.
  return (
    <span
      title={label}
      className={cn(
        'waverly-status-dot',
        `waverly-status-${variant}`,
        isPulsing && 'waverly-status-pulse',
      )}
    >
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function Token({
  label,
  color = 'gray',
  size = 'md',
}: {
  label: string
  color?: string
  size?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn('waverly-token', `waverly-token-${color}`, size === 'sm' && 'waverly-token-sm')}
    >
      {label}
    </Badge>
  )
}

export function Banner({
  status = 'info',
  title,
  description,
  endContent,
  children,
  isDismissable,
  onDismiss,
  className,
}: {
  status?: string
  title: ReactNode
  description?: ReactNode
  endContent?: ReactNode
  children?: ReactNode
  isDismissable?: boolean
  onDismiss?: () => void
  className?: string
  collapsible?: boolean
}) {
  return (
    <section
      role={status === 'error' ? 'alert' : 'status'}
      className={cn('waverly-banner', `waverly-banner-${status}`, className)}
    >
      <div className="waverly-banner-copy">
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
      {endContent}
      {isDismissable ? (
        <IconButton label="Dismiss" icon={<X />} variant="ghost" onClick={onDismiss} />
      ) : null}
    </section>
  )
}

export function List({
  header,
  children,
  hasDividers,
  density = 'balanced',
  className,
}: {
  header?: ReactNode
  children?: ReactNode
  hasDividers?: boolean
  density?: string
  className?: string
}) {
  return (
    <section
      className={cn(
        'waverly-list',
        `waverly-list-${density}`,
        hasDividers && 'waverly-list-divided',
        className,
      )}
    >
      {header ? <header className="waverly-list-header">{header}</header> : null}
      <div>{children}</div>
    </section>
  )
}

export function ListItem({
  label,
  description,
  startContent,
  endContent,
  onClick,
  isSelected,
  className,
}: {
  label: ReactNode
  description?: ReactNode
  startContent?: ReactNode
  endContent?: ReactNode
  onClick?: () => void
  isSelected?: boolean
  className?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={cn(
        'waverly-list-item',
        onClick && 'waverly-list-item-action',
        isSelected && 'waverly-list-item-selected',
        className,
      )}
      onClick={onClick}
    >
      {startContent ? <div className="waverly-list-item-start">{startContent}</div> : null}
      <div className="waverly-list-item-copy">
        <div className="waverly-list-item-label">{label}</div>
        {description ? <div className="waverly-list-item-description">{description}</div> : null}
      </div>
      {endContent ? <div className="waverly-list-item-end">{endContent}</div> : null}
    </Tag>
  )
}

export function ProgressBar({
  label,
  value,
  max = 100,
  hasValueLabel,
  isLabelHidden,
  formatValueLabel,
}: {
  label: string
  value: number
  max?: number
  hasValueLabel?: boolean
  isLabelHidden?: boolean
  formatValueLabel?: (value: number) => string
  variant?: string
  marks?: Array<{ value: number; label: string }>
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="waverly-progress">
      {!isLabelHidden || hasValueLabel ? (
        <div className="waverly-progress-label">
          {!isLabelHidden ? <span>{label}</span> : <span />}
          {hasValueLabel ? (
            <span>{formatValueLabel?.(value) ?? `${Math.round(percentage)}%`}</span>
          ) : null}
        </div>
      ) : null}
      <ShadcnProgress aria-label={label} value={percentage} />
    </div>
  )
}

type Option = string | { value: string; label: string }

export function Selector({
  label,
  options,
  value,
  onChange,
  isLabelHidden,
  width,
  size = 'default',
  variant,
  description,
  isDisabled,
}: {
  label: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  isLabelHidden?: boolean
  width?: Dimension
  size?: 'sm' | 'default'
  variant?: string
  description?: ReactNode
  isDisabled?: boolean
  disabledMessage?: string
}) {
  return (
    <label
      className={cn('waverly-field', isLabelHidden && 'waverly-sr-label')}
      style={{ width: dimension(width) }}
    >
      <span>{label}</span>
      {description ? <small>{description}</small> : null}
      <Select
        items={options.map((option) =>
          typeof option === 'string' ? { value: option, label: option } : option,
        )}
        value={value}
        onValueChange={(next) => onChange(String(next))}
        disabled={isDisabled}
      >
        <SelectTrigger
          aria-label={label}
          size={size}
          className={cn('w-full', variant === 'ghost' && 'border-transparent bg-transparent')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const item = typeof option === 'string' ? { value: option, label: option } : option
            return (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </label>
  )
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  isLabelHidden,
  isReadOnly,
  hasClear,
  startIcon: StartIcon,
  width,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  isLabelHidden?: boolean
  isReadOnly?: boolean
  hasClear?: boolean
  startIcon?: IconType
  width?: Dimension
}) {
  return (
    <label
      className={cn('waverly-field', isLabelHidden && 'waverly-sr-label')}
      style={{ width: dimension(width) }}
    >
      <span>{label}</span>
      <span className="waverly-input-wrap">
        {StartIcon ? <StartIcon aria-hidden /> : null}
        <Input
          aria-label={isLabelHidden ? label : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          readOnly={isReadOnly}
        />
        {hasClear && value ? (
          <button type="button" aria-label={`Clear ${label}`} onClick={() => onChange('')}>
            <X />
          </button>
        ) : null}
      </span>
    </label>
  )
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  units,
  width,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  units?: string
  width?: Dimension
  hasNumberSteppers?: boolean
  isWheelEnabled?: boolean
}) {
  return (
    <label className="waverly-field" style={{ width: dimension(width) }}>
      <span>{label}</span>
      <span className="waverly-input-wrap">
        <Input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(event.target.valueAsNumber)}
        />
        {units ? <span className="waverly-input-unit">{units}</span> : null}
      </span>
    </label>
  )
}

export type ISODateString = string
export type DateRange = { start: ISODateString; end: ISODateString }

export function DateRangeInput({
  label,
  value,
  onChange,
  min,
  max,
  width,
}: {
  label: string
  value: DateRange | null
  onChange: (value: DateRange | null) => void
  min?: string
  max?: string
  width?: Dimension
  presets?: unknown[]
  numberOfMonths?: number
  size?: string
  hasClear?: boolean
}) {
  const range = value ?? { start: '', end: '' }
  return (
    <fieldset className="waverly-field" style={{ width: dimension(width) }}>
      <legend>{label}</legend>
      <span className="waverly-date-range">
        <Input
          aria-label={`${label} start`}
          type="date"
          value={range.start}
          min={min}
          max={max}
          onChange={(event) => onChange({ ...range, start: event.target.value })}
        />
        <span>–</span>
        <Input
          aria-label={`${label} end`}
          type="date"
          value={range.end}
          min={min}
          max={max}
          onChange={(event) => onChange({ ...range, end: event.target.value })}
        />
      </span>
    </fieldset>
  )
}

export function Switch({
  label,
  value,
  onChange,
  isLabelHidden,
  description,
  isDisabled,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  isLabelHidden?: boolean
  description?: ReactNode
  labelPosition?: string
  labelSpacing?: string
  width?: Dimension
  isDisabled?: boolean
  disabledMessage?: string
}) {
  return (
    <label className="waverly-switch-row">
      <span className={cn(isLabelHidden && 'sr-only')}>
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
      <ShadcnSwitch
        aria-label={isLabelHidden ? label : undefined}
        checked={value}
        onCheckedChange={onChange}
        disabled={isDisabled}
      />
    </label>
  )
}

export function Tab({ value, label, icon }: { value: string; label: string; icon?: ReactNode }) {
  return (
    <TabsTrigger value={value}>
      {icon}
      {label}
    </TabsTrigger>
  )
}

export function TabList({
  value,
  onChange,
  children,
  overflow,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  size?: string
  hasDivider?: boolean
  overflow?: string
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(String(next))}
      className={cn(overflow === 'scroll' && 'min-w-0 overflow-x-auto')}
    >
      <TabsList variant="line">{children}</TabsList>
    </Tabs>
  )
}

export interface TableColumn<T extends Record<string, unknown>> {
  key: keyof T | string
  header: ReactNode
  width?: { value: number; unit: 'px' | 'fr' }
  align?: 'start' | 'center' | 'end'
  renderCell?: (row: T) => ReactNode
}

export const pixel = (value: number) => ({ value, unit: 'px' as const })
export const proportional = (value: number) => ({ value, unit: 'fr' as const })

export function Table<T extends Record<string, unknown>>({
  data,
  columns,
  idKey,
  hasHover,
  density = 'balanced',
}: {
  data: T[]
  columns: TableColumn<T>[]
  idKey: keyof T
  density?: string
  dividers?: string
  hasHover?: boolean
  textOverflow?: string
}) {
  return (
    <div className="waverly-table-wrap">
      <ShadcnTable className={cn(`waverly-table-${density}`)}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                style={{ textAlign: column.align === 'end' ? 'right' : column.align }}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={String(row[idKey])} className={cn(hasHover && 'hover:bg-muted/50')}>
              {columns.map((column) => (
                <TableCell
                  key={String(column.key)}
                  style={{ textAlign: column.align === 'end' ? 'right' : column.align }}
                >
                  {column.renderCell
                    ? column.renderCell(row)
                    : String(row[column.key as keyof T] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </ShadcnTable>
    </div>
  )
}

export function Toolbar({
  startContent,
  endContent,
  children,
  label,
  size: _size,
  variant,
  dividers,
}: {
  startContent?: ReactNode
  endContent?: ReactNode
  children?: ReactNode
  label?: string
  size?: string
  variant?: string
  dividers?: string[]
}) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={cn(
        'waverly-toolbar',
        variant === 'muted' && 'waverly-toolbar-muted',
        dividers?.includes('bottom') && 'waverly-toolbar-divider',
      )}
    >
      {startContent ?? children}
      <div className="waverly-toolbar-end">{endContent}</div>
    </div>
  )
}

export const LayoutContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { padding?: number }
>(function LayoutContent({ padding = 0, className, style, ...props }, ref) {
  return (
    <main
      ref={ref}
      className={cn('waverly-layout-content', className)}
      style={{ padding: space(padding), ...style }}
      {...props}
    />
  )
})

export function LayoutHeader({
  padding = 0,
  ...props
}: HTMLAttributes<HTMLElement> & { padding?: number }) {
  return <header className="waverly-layout-header" style={{ padding: space(padding) }} {...props} />
}

export function LayoutPanel({
  width,
  padding = 0,
  hasDivider,
  label,
  ...props
}: HTMLAttributes<HTMLElement> & {
  width?: Dimension
  padding?: number
  hasDivider?: boolean
  label?: string
}) {
  return (
    <aside
      aria-label={label}
      className={cn('waverly-layout-panel', hasDivider && 'waverly-layout-panel-divider')}
      style={{ width: dimension(width), padding: space(padding) }}
      {...props}
    />
  )
}

export function Layout({
  start,
  header,
  content,
  children,
  height,
}: {
  start?: ReactNode
  header?: ReactNode
  content?: ReactNode
  children?: ReactNode
  height?: Dimension
  contentWidth?: number
  defaultHasDividers?: boolean
}) {
  return (
    <div className="waverly-layout" style={{ height: dimension(height) }}>
      {start}
      <div className="waverly-layout-main">
        {header}
        {content ?? children}
      </div>
    </div>
  )
}

export function AppShell({
  sideNav,
  children,
  contentPadding = 0,
  height,
  variant,
}: {
  sideNav?: ReactNode
  children: ReactNode
  contentPadding?: number
  height?: Dimension
  variant?: string
}) {
  return (
    <div
      className={cn('waverly-app-shell', variant && `waverly-app-shell-${variant}`)}
      style={{ minHeight: height === 'fill' ? '100svh' : dimension(height) }}
    >
      {sideNav}
      {
        <div className="waverly-app-shell-content" style={{ padding: space(contentPadding) }}>
          {children}
        </div>
      }
    </div>
  )
}

export function SideNav({
  header,
  footer,
  footerIcons,
  children,
  collapsible,
}: {
  header?: ReactNode
  footer?: ReactNode
  footerIcons?: ReactNode
  children?: ReactNode
  collapsible?: {
    isCollapsed: boolean
    onCollapsedChange: (value: boolean) => void
    buttonLabel: string
  }
  'aria-label'?: string
}) {
  const collapsed = collapsible?.isCollapsed
  return (
    <nav
      aria-label="Workspace navigation"
      className={cn('waverly-side-nav', collapsed && 'waverly-side-nav-collapsed')}
    >
      <div className="waverly-side-nav-header">
        {header}
        {collapsible ? (
          <button
            type="button"
            aria-label={collapsible.buttonLabel}
            className="waverly-side-nav-toggle"
            onClick={() => collapsible.onCollapsedChange(!collapsed)}
          >
            ‹
          </button>
        ) : null}
      </div>
      <div className="waverly-side-nav-body">{children}</div>
      <div className="waverly-side-nav-footer">{collapsed ? footerIcons : footer}</div>
    </nav>
  )
}

export function SideNavHeading({
  icon,
  superheading,
  heading,
  subheading,
}: {
  icon?: ReactNode
  superheading?: string
  heading: string
  subheading?: string
}) {
  return (
    <div className="waverly-nav-heading">
      {icon}
      <div>
        {superheading ? <small>{superheading}</small> : null}
        <strong>{heading}</strong>
        {subheading ? <span>{subheading}</span> : null}
      </div>
    </div>
  )
}

export function SideNavSection({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="waverly-nav-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function SideNavItem({
  label,
  icon: IconComponent,
  isSelected,
  onClick,
}: {
  label: string
  icon: IconType
  isSelected?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-current={isSelected ? 'page' : undefined}
      className={cn('waverly-nav-item', isSelected && 'waverly-nav-item-selected')}
      onClick={onClick}
    >
      <IconComponent aria-hidden />
      <span>{label}</span>
    </button>
  )
}

export function useSideNavRenderMode() {
  return useMediaQuery('(max-width: 900px)') ? 'topbar' : 'sidebar'
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

export function Step({ step, label }: { step: number; label: string; indicator?: string }) {
  return <span data-step={step} data-label={label} />
}

export function Stepper({
  activeStep,
  onStepClick,
  children,
  label,
}: {
  activeStep: number
  onStepClick: (step: number) => void
  children: ReactNode
  label: string
  density?: string
  indicatorPosition?: string
}) {
  return (
    <ol className="waverly-stepper" aria-label={label}>
      {Children.map(children, (child, index) => {
        const childLabel = isValidElement(child)
          ? String((child.props as { label?: string }).label ?? index + 1)
          : String(index + 1)
        return (
          <li>
            <button
              type="button"
              className={cn(index === activeStep && 'active', index < activeStep && 'complete')}
              onClick={() => onStepClick(index)}
            >
              <span>{index + 1}</span>
              {childLabel}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function EmptyState({
  title,
  description,
  icon,
  isCompact,
}: {
  title: string
  description?: string
  icon?: ReactNode
  isCompact?: boolean
}) {
  return (
    <div className={cn('waverly-empty', isCompact && 'waverly-empty-compact')}>
      {icon}
      <Heading level={3}>{title}</Heading>
      {description ? <Text color="secondary">{description}</Text> : null}
    </div>
  )
}

export function ChatLayout({
  composer,
  emptyState,
  children,
}: {
  composer?: ReactNode
  emptyState?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="waverly-chat-layout">
      <div className="waverly-chat-scroll">{children ?? emptyState}</div>
      {composer}
    </div>
  )
}

export function ChatMessageList({
  children,
}: {
  children?: ReactNode
  density?: string
  align?: string
}) {
  return <div className="waverly-chat-list">{children}</div>
}

function formatAttachmentSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const noAttachments: File[] = []

export function ChatComposer({
  placeholder,
  value,
  onChange,
  onSubmit,
  isDisabled,
  isSubmitting,
  status,
  attachments = noAttachments,
  onAttachmentsChange,
  onFocusChange,
  accept,
  maxAttachments = 4,
  maxAttachmentBytes = 10 * 1024 * 1024,
}: {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  isDisabled?: boolean
  isSubmitting?: boolean
  status?: { type: string; message: string }
  elevation?: string
  attachments?: File[]
  onAttachmentsChange?: (files: File[]) => void
  onFocusChange?: (focused: boolean) => void
  accept?: string
  maxAttachments?: number
  maxAttachmentBytes?: number
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (value.trim() || attachments.length > 0) onSubmit(value.trim())
  }
  const addAttachments = (files: File[]) => {
    setAttachmentError(null)
    const oversized = files.find((file) => file.size > maxAttachmentBytes)
    if (oversized) {
      setAttachmentError(
        `${oversized.name} is larger than ${formatAttachmentSize(maxAttachmentBytes)}.`,
      )
      return
    }
    const unique = [...attachments]
    for (const file of files) {
      if (
        !unique.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        )
      ) {
        unique.push(file)
      }
    }
    if (unique.length > maxAttachments) {
      setAttachmentError(`Add up to ${maxAttachments} attachments per message.`)
      return
    }
    onAttachmentsChange?.(unique)
  }

  return (
    <form className="waverly-chat-composer" onSubmit={submit}>
      {attachments.length > 0 ? (
        <div className="waverly-chat-composer-files" aria-label="Pending attachments">
          {attachments.map((file) => (
            <span
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="waverly-chat-composer-file"
            >
              <Paperclip aria-hidden />
              <span>
                <strong>{file.name}</strong>
                <small>{formatAttachmentSize(file.size)}</small>
              </span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                disabled={isDisabled}
                onClick={() => onAttachmentsChange?.(attachments.filter((item) => item !== file))}
              >
                <X aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="waverly-chat-composer-controls">
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          multiple
          accept={accept}
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            addAttachments(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
        <ShadcnButton
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Add attachments"
          title="Add attachments"
          disabled={isDisabled || attachments.length >= maxAttachments}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip />
        </ShadcnButton>
        <Input
          value={value}
          placeholder={placeholder}
          disabled={isDisabled}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onChange={(event) => onChange(event.target.value)}
        />
        <ShadcnButton
          type="submit"
          disabled={isDisabled || (!value.trim() && attachments.length === 0)}
        >
          {isSubmitting ? 'Sending…' : 'Send'}
        </ShadcnButton>
      </div>
      {attachmentError ? <p role="alert">{attachmentError}</p> : null}
      {status ? <p role="alert">{status.message}</p> : null}
    </form>
  )
}

export function Avatar({
  name,
  size = 'md',
  status,
  onClick,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  status?: ReactNode
  onClick?: () => void
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <ShadcnAvatar
      size={size === 'md' ? 'default' : size}
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer')}
    >
      <AvatarFallback>{initials}</AvatarFallback>
      {status ? <AvatarBadge>{status}</AvatarBadge> : null}
    </ShadcnAvatar>
  )
}

export function AvatarStatusDot({
  variant = 'neutral',
  label,
}: {
  variant?: string
  label: string
}) {
  return <StatusDot variant={variant} label={label} />
}
