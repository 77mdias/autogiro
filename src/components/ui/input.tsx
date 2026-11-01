import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-card border border-rule-2 bg-paper px-4 text-md text-ink outline-2 outline-offset-[-3px] outline-transparent transition-[outline-color] duration-(--dur-micro) placeholder:text-ink-3 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-error motion-reduce:transition-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:text-ink",
        className
      )}
      {...props}
    />
  )
}

export { Input }
