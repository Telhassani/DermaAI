import * as React from "react"

interface TooltipContextType {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined)

const TooltipProvider = ({ children, delayDuration = 200 }: { children: React.ReactNode, delayDuration?: number }) => {
  return <>{children}</>
}

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
}

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    const context = React.useContext(TooltipContext)
    if (!context) throw new Error("TooltipTrigger must be used within a Tooltip")

    const handleMouseEnter = () => context.setIsOpen(true)
    const handleMouseLeave = () => context.setIsOpen(false)

    // If asChild is true, we should clone the child and add props
    // But for simplicity in this fix, we'll wrap it in a div if it's not a simple element
    // Or just attach handlers to the wrapper div from Tooltip component if possible?
    // Actually, let's just return a wrapper div for now to ensure events are caught
    return (
      <div
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
        {...props}
      >
        {children}
      </div>
    )
  }
)
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const context = React.useContext(TooltipContext)
  if (!context) throw new Error("TooltipContent must be used within a Tooltip")

  if (!context.isOpen) return null

  return (
    <div
      ref={ref}
      className={`absolute z-50 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
      style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px', width: 'max-content', maxWidth: '300px' }}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
