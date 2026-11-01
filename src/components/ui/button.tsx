import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const baseButtonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-body text-md font-normal whitespace-nowrap transition-[background-color,color,border-color,transform] duration-(--dur-short) ease-out outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-55 aria-busy:cursor-progress aria-invalid:border-destructive motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-brand text-brand-ink hover:bg-brand-hi",
        // Só o canal do comprador (WhatsApp) usa verde
        signal: "bg-signal text-signal-ink hover:bg-signal-hi",
        outline: "border-rule-2 bg-transparent text-ink hover:bg-paper-2 aria-expanded:bg-paper-2",
        secondary: "bg-paper-3 text-ink hover:bg-rule aria-expanded:bg-rule",
        ghost: "text-ink hover:bg-paper-2 aria-expanded:bg-paper-2",
        destructive: "border-error text-error hover:bg-paper-2",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        // 48px no toque; 40px com ponteiro fino (app UI, alvo de 44px garantido pelo padding da linha)
        default: "h-12 gap-2 px-6 pointer-fine:h-10 pointer-fine:px-5",
        sm: "h-10 gap-1.5 px-4 text-sm pointer-fine:h-9 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-14 gap-2 px-7 text-lg pointer-fine:h-12",
        icon: "size-12 pointer-fine:size-10",
        "icon-sm": "size-10 pointer-fine:size-9 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Mescla as classes também quando usado direto em <a> (cva sozinho só concatena)
const buttonVariants = (props?: Parameters<typeof baseButtonVariants>[0]) => cn(baseButtonVariants(props))

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof baseButtonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
