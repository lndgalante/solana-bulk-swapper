import type { RadioGroupProps, RadioProps } from '@nextui-org/react'
import { RadioGroup, VisuallyHidden, cn, useRadio } from '@nextui-org/react'

export function CustomRadioGroup(props: RadioGroupProps) {
  const { children, ...otherProps } = props

  return (
    <RadioGroup
      {...otherProps}
      classNames={{
        wrapper: cn(
          'flex-row',
        ),
      }}
    >
      {children}
    </RadioGroup>
  )
}

export function CustomRadio(props: RadioProps) {
  const {
    Component,
    children,
    getBaseProps,
    getInputProps,
    getLabelProps,
    getLabelWrapperProps,
  } = useRadio(props)

  return (
    <Component
      {...getBaseProps()}
      className={cn(
        'group inline-flex items-center hover:opacity-70 active:opacity-50 tap-highlight-transparent',
        'flex-1 cursor-pointer border-2 border-default rounded-lg gap-4 p-4',
        'data-[selected=true]:border-primary',
      )}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <div {...getLabelWrapperProps()}>
        {children && <div {...getLabelProps()} className="flex flex-row">{children}</div>}
      </div>
    </Component>
  )
}
