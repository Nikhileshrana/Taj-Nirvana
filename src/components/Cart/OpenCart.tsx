import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  return (
    <Button
      variant="ghost"
      size="default"
      className="navLink relative items-center gap-2 hover:cursor-pointer"
      {...rest}
    > 
      <Heart className="h-7 w-7 fill-red-500 text-red-500" />

      {quantity ? (
        <>
          <span>•</span>
          <span>{quantity}</span>
        </>
      ) : null}
    </Button>
  )
}
