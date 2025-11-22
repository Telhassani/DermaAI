import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

// Stub implementation - the @radix-ui/react-tooltip module has resolution issues
// These are placeholder components that can be replaced once the module resolution is fixed

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    const Component = asChild ? Slot : 'div'
    return (
      <Component ref={ref} {...props}>
        {children}
      </Component>
    )
  }
)
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <div
    ref={ref}
    className="z-50 overflow-hidden rounded-md border border-slate-200 bg-slate-950 px-3 py-1.5 text-sm text-slate-50 shadow-md"
    {...props}
  >
    {children}
  </div>
))
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
