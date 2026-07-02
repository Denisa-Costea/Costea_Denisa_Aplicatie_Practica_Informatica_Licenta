'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { 
    LayoutDashboard, Sparkles, History, 
    Settings, LogOut, Zap, Share2, 
    BarChart3, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './dashboard-layout.module.scss';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className={styles.loaderScreen}>
                <div className={styles.loaderOrb}></div>
            </div>
        );
    }

    if (!user) return null;

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/generate', label: 'Generare AI', icon: Sparkles },
        { href: '/dashboard/history', label: 'Istoric', icon: History },
        { href: '/dashboard/posts', label: 'Postări Sociale', icon: Share2 },
        { href: '/dashboard/analysis', label: 'Analiză & Scor', icon: BarChart3 },
        { href: '/dashboard/settings', label: 'Setări', icon: Settings },
    ];

    if (user.is_superuser) {
        navItems.push({ href: '/admin', label: 'Administrare', icon: ShieldCheck });
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* Ambient Background - Soft & Minimal */}
            <div className={styles.ambientBg}>
                <div className={styles.ambientOrb1}></div>
                <div className={styles.ambientOrb2}></div>
            </div>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logoIcon}>
                        <Zap className="w-6 h-6 text-white" fill="currentColor" />
                    </div>
                    <div>
                        <h1 className={styles.sidebarTitle}>Cognify</h1>
                    </div>
                </div>
                
                <nav className={styles.navMenu}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    styles.navItem,
                                    isActive && styles.navItemActive
                                )}
                            >
                                {isActive && (
                                    <div className={styles.activeIndicator}></div>
                                )}
                                <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userWidget}>
                        <div className={styles.userProfile}>
                            <div className={styles.avatar}>
                                {user.email[0].toUpperCase()}
                            </div>
                            <div className={styles.userInfo}>
                                <p className={styles.userEmail}>{user.email}</p>
                                <p className={styles.userPlan}>PLAN {user.license?.plan_type || 'FREE'}</p>
                            </div>
                        </div>
                        <div className={styles.creditsHeader}>
                            <span>Credite</span>
                            <span className={styles.creditsValue}>{user.license?.credits_remaining ?? 0}</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div 
                                className={styles.progressFill} 
                                style={{ 
                                    width: `${Math.min(100, ((user.license?.credits_remaining ?? 0) / (user.license?.plan_type === 'ENTERPRISE' ? 1000 : user.license?.plan_type === 'PRO' ? 100 : 10)) * 100)}%` 
                                }}
                            ></div>
                        </div>
                    </div>
                    
                    <Button 
                        variant="ghost" 
                        className={styles.logoutButton}
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Deconectare
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={styles.mainWrapper}>
                {/* Subtle internal glow */}
                <div className={styles.internalGlow}></div>
                <div className={styles.contentArea}>
                    {children}
                </div>
            </main>
        </div>
    );
}
