"use client"

import * as React from "react"
import {
    BookOpen,
    Bot,
    LogInIcon,
    Settings2,
    ImagePlay,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
    user: {
        name: "Taj Nirvana",
        email: "tajnirvana@gmail.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Media",
            url: "#",
            icon: ImagePlay,
            isActive: true,
            items: [
                {
                    title: "Manage",
                    url: "/protected/media",
                },
            ],
        },
        {
            title: "Tours",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Manage Tours",
                    url: "/protected/tours",
                },
                {
                    title: "Manage Categories",
                    url: "/protected/categories",
                },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <LogInIcon className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">TN</span>
                                <span className="truncate text-xs">test</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
