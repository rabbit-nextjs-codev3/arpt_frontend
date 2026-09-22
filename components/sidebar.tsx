"use client";

import Link from "next/link";
import { useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Panel } from "react-resizable-panels";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export interface SidebarMenuItem {
    id: string;
    icon: LucideIcon | ComponentType<{ className?: string }>;
    badgeKey?: "reclamationsOuvertes" | "messagesNonLus";
}

export interface SidebarMenuGroup {
    titreKey: string;
    items: SidebarMenuItem[];
}

interface SidebarProps {
    menuGroups: SidebarMenuGroup[];
    section: string;
    overview: {
        reclamations: { ouvertes: number } | null;
        messagesContact: { nonLus: number } | null;
    } | null;
    onSectionChange: (section: string) => void;
}

export function Sidebar({ menuGroups, section, overview, onSectionChange }: SidebarProps) {
    const t = useTranslations("admin");
    const { user, hasPermission } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    function handleSidebarResize(size: { asPercentage: number }) {
        setSidebarCollapsed(size.asPercentage < 17);
    }

    return (
        <Panel
            id="sidebar"
            defaultSize="30%"
            minSize="5%"
            maxSize="50%"
            onResize={handleSidebarResize}
            className="h-full min-w-0"
        >
            <aside className="sticky top-0 z-10 flex h-full flex-col self-start overflow-y-auto bg-sidebar text-sidebar-foreground">
                <div className={cn("border-b border-sidebar-border py-6 transition-[padding]", sidebarCollapsed ? "px-2" : "px-5")}>
                    <div className="flex items-center gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">A</div>
                        {!sidebarCollapsed && (
                            <div className="min-w-0">
                                <p className="font-heading text-sm font-semibold tracking-wide uppercase">{t("nav.groups.administration")}</p>
                                <p className="mt-1 truncate text-xs opacity-60">{user?.email}</p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                            aria-pressed={sidebarCollapsed}
                            aria-label={sidebarCollapsed ? "Déployer la barre latérale" : "Réduire la barre latérale"}
                            className={cn(
                                "grid size-7 shrink-0 place-items-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary",
                                !sidebarCollapsed && "ml-auto",
                            )}
                        >
                            <ChevronRight className={cn("size-3.5 transition-transform", !sidebarCollapsed && "rotate-180")} aria-hidden />
                        </button>
                    </div>
                </div>

                <nav aria-label="Sections d'administration" className={cn("grid gap-1 py-5", sidebarCollapsed ? "px-2" : "px-3")}>
                    {!sidebarCollapsed && (
                        <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
                            {t("nav.groups.overview")}
                        </p>
                    )}
                    {menuGroups.flatMap((group) => group.items)
                        .filter((menu) => menu.id !== "candidatures" || hasPermission("view_candidatures") || hasPermission("view_submissions"))
                        .map((menu) => {
                            const active = section === menu.id;
                            const badgeValue = menu.badgeKey === "reclamationsOuvertes"
                                ? overview?.reclamations?.ouvertes
                                : menu.badgeKey === "messagesNonLus"
                                    ? overview?.messagesContact?.nonLus
                                    : undefined;
                            const label = t(`nav.${menu.id}`);

                            return (
                                <Link
                                    key={menu.id}
                                    href={`/admin?section=${menu.id}`}
                                    title={sidebarCollapsed ? label : undefined}
                                    aria-current={active ? "page" : undefined}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        onSectionChange(menu.id);
                                    }}
                                    className={cn(
                                        "flex cursor-pointer items-center gap-3 rounded-md border-l-[3px] py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary",
                                        sidebarCollapsed ? "justify-start border-l-0 px-2" : "px-3",
                                        active
                                            ? "border-gold bg-sidebar-accent text-sidebar-accent-foreground"
                                            : "border-transparent opacity-75 hover:bg-sidebar-accent/60 hover:opacity-100",
                                    )}
                                >
                                    <menu.icon className="size-4 shrink-0" aria-hidden />
                                    <span className={cn("truncate", sidebarCollapsed && "sr-only")}>{label}</span>
                                    {!sidebarCollapsed && !!badgeValue && (
                                        <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-gold-foreground">{badgeValue}</span>
                                    )}
                                </Link>
                            );
                        })}
                </nav>

                {!sidebarCollapsed && (
                    <div className="mt-auto border-t border-sidebar-border px-5 py-5">
                        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                            <span className="size-2 rounded-full bg-sidebar-primary" />
                            {t("sidebar.connectedToApi")}
                        </div>
                    </div>
                )}
            </aside>
        </Panel>
    );
}
