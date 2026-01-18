'use client'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { Suspense } from 'react'

import type { Header } from 'src/payload-types'
import { MobileMenu } from './MobileMenu'

import { LogoIcon } from '@/components/icons/logo'
import { cn } from '@/utilities/cn'
import { usePathname } from 'next/navigation'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()

  return (
    <div className="relative z-20 border-b">
      <nav className="container relative flex items-center justify-between py-2">
        {/* Mobile Menu - Left */}
        <div className="flex md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>

        {/* Desktop Logo - Left */}
        <div className="hidden md:flex w-full md:w-auto items-center">
          <Link className="flex items-center" href="/">
            <LogoIcon className="w-10 h-auto" />
          </Link>
        </div>

        {/* Mobile Logo - Center (Absolute) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
          <Link className="flex items-center justify-center" href="/">
            <LogoIcon className="w-10 h-auto" />
          </Link>
        </div>

        {/* Desktop Nav - Center/Leftish */}
        {menu.length ? (
          <ul className="hidden gap-6 text-sm md:flex md:items-center md:ml-8">
            {menu.map((item) => (
              <li key={item.id}>
                <CMSLink
                  {...item.link}
                  size={'clear'}
                  className={cn('relative navLink font-medium', {
                    active:
                      item.link.url && item.link.url !== '/'
                        ? pathname.includes(item.link.url)
                        : false,
                  })}
                  appearance="nav"
                />
              </li>
            ))}
          </ul>
        ) : null}

        {/* Cart - Right */}
        <div className="flex items-center justify-end gap-4">
          <Suspense fallback={<OpenCartButton />}>
            <Cart />
          </Suspense>
        </div>
      </nav>
    </div>
  )
}
