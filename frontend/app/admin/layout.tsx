'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
    LayoutDashboard, Users, CreditCard, 
    ShieldCheck, LogOut, ArrowLeft, BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import styles from './admin-layout.module.scss';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (!user.is_superuser) {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router]);

    if (loading || !user || !user.is_superuser) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#030712]">
                <div className="w-20 h-20 bg-red-600/20 rounded-full blur-2xl animate-pulse"></div>
            </div>
        );
    }

    const navItems = [
        { href: '/admin', label: 'Prezentare Generală', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Control Utilizatori', icon: Users },
        { href: '/admin/licenses', label: 'Licențe', icon: CreditCard },
        { href: '/admin/stats', label: 'Metrici Sistem', icon: BarChart2 },
    ];

    return (
        <div className={styles.layoutWrapper}>
            {/* Admin Ambient Light */}
            <div className={styles.ambientLight}>
                <div className={styles.glow}></div>
            </div>

            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.brandIconBox}>
                        <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <div className={styles.brandTextWrapper}>
                        <h1 className={styles.brandTitle}>Admin</h1>
                        <p className={styles.brandSubtitle}>Nod de Control</p>
                    </div>
                </div>
                
                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    styles.navLink,
                                    isActive && styles.navLinkActive
                                )}
                            >
                                <Icon className={cn("w-5 h-5", isActive ? styles.iconActive : "")} />
                                {item.label}
                            </Link>
                        );
                    })}
                    
                    <div className={styles.dividerBlock}>
                        <Link
                            href="/dashboard"
                            className={styles.backLink}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Dashboard Utilizator
                        </Link>
                    </div>
                </nav>

                <div className="mt-auto">
                    <Button 
                        variant="ghost" 
                        className={styles.logoutBtn}
                        onClick={logout}
                    >
                        <LogOut className="w-5 h-5 mr-4" />
                        Deconectare
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={styles.mainContent}>
                <div className={styles.scrollArea}>
                    {children}
                </div>
            </main>
        </div>
    );
}
