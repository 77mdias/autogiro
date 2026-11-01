import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-card border border-rule-2 bg-paper px-4 py-3 text-md text-ink outline-2 outline-offset-[-3px] outline-transparent transition-[outline-color] duration-(--dur-micro) placeholder:text-ink-3 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-error motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
