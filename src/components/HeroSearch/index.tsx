'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { Car, Gem, Home, Map, Search, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type Category = 'all' | 'tours' | 'rent-car' | 'budget' | 'luxury'

export const HeroSearch = () => {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Category>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        // Routes to /tours?q=... as requested
        // If activeTab is different, we might route differently, 
        // but the user only specified /tours?q for now.
        // We could append category if needed, but sticking to prompt instructions.
        const params = new URLSearchParams()
        if (searchQuery) params.set('q', searchQuery)
        if (activeTab !== 'all') params.set('category', activeTab) // Optional enhancement

        router.push(`/tours?${params.toString()}`)
    }

    return (
        <div className="w-full bg-background py-8 md:py-12 px-4 flex flex-col items-center justify-center space-y-6">

            {/* Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground tracking-tight text-center">
                Where to?
            </h1>

            {/* Categories */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 w-full max-w-3xl">
                <CategoryButton
                    active={activeTab === 'all'}
                    onClick={() => setActiveTab('all')}
                    icon={<Home className="w-3 h-3 md:w-5 md:h-5 mb-1" />}
                    label="Search All"
                />
                <CategoryButton
                    active={activeTab === 'budget'}
                    onClick={() => setActiveTab('budget')}
                    icon={<Wallet className="w-3 h-3 md:w-5 md:h-5 mb-1" />}
                    label="Budget Tours"
                />
                <CategoryButton
                    active={activeTab === 'luxury'}
                    onClick={() => setActiveTab('luxury')}
                    icon={<Gem className="w-3 h-3 md:w-5 md:h-5 mb-1" />}
                    label="Luxury Tours"
                />
                <CategoryButton
                    active={activeTab === 'rent-car'}
                    onClick={() => setActiveTab('rent-car')}
                    icon={<Car className="w-3 h-3 md:w-5 md:h-5 mb-1" />}
                    label="Rent Car"
                />
            </div>

            {/* Search Bar */}
            <form
                onSubmit={handleSearch}
                className="relative w-full max-w-2xl shadow-lg rounded-full transition-all duration-300 hover:shadow-xl"
            >
                <div className="relative flex items-center w-full h-12 md:h-14 bg-white dark:bg-card rounded-full border border-border/50 overflow-hidden">

                    <div className="pl-4 md:pl-6 text-muted-foreground">
                        <Search className="w-5 h-5" />
                    </div>

                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Places to go, Taj Mahal, Jaipur, etc..."
                        className="flex-1 h-full px-3 md:px-4 text-sm md:text-base bg-transparent border-none outline-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground/70 text-foreground"
                    />

                    <div className="pr-1">
                        <Button
                            type="submit"
                            variant="default" // Uses primary color
                            className="h-10 md:h-12 px-6 rounded-full text-sm md:text-base font-semibold shadow-sm transition-transform active:scale-95"
                        >
                            Search
                        </Button>
                    </div>

                </div>
            </form>

        </div>
    )
}

const CategoryButton = ({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
}) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center group transition-colors duration-200",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
        >
            <div className={cn(
                "p-2 transition-transform duration-200 group-hover:-translate-y-1",
                active && "text-foreground" // Icon color
            )}>
                {icon}
            </div>
            <span className={cn(
                "text-xs md:text-sm font-medium pb-1 border-b-2 transition-all duration-200",
                active ? "border-foreground text-foreground" : "border-transparent"
            )}>
                {label}
            </span>
        </button>
    )
}
