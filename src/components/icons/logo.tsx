import Image from 'next/image'

export function LogoIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={100}
      height={100}
      className={className}
    />
  )
}
