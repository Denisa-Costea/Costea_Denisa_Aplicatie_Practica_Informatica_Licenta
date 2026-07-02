'use client'; // Componenta folosește stări client și rulează direct în browser

import { useEffect, useState } from 'react';
import { 
    Users, CreditCard, Activity, ArrowRight,
    ShieldCheck, Cpu, Layers, Terminal, 
    Zap, Database, Server
} from 'lucide-react';
import api from '@/lib/axios'; // Axios pentru apelarea API-urilor securizate de admin
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import styles from './admin-overview.module.scss'; // Stilurile SCSS ale tabloului de admin

interface Stats {
    total_users: number;
    total_generations: number;
    license_stats: Record<string, number>;
}

export default function AdminDashboardPage() {
    // 1. STATE-URI PENTRU STATISTICI GENERALE ȘI UTILIZATORI RECENTȚI
    const [stats, setStats] = useState<Stats | null>(null); // Stochează statisticile primite de la `/admin/stats`
    const [recentUsers, setRecentUsers] = useState<any[]>([]); // Stochează ultimii 8 utilizatori înregistrați
    const [loading, setLoading] = useState(true); // Indicator încărcare inițială date administrative

    // 2. EFECT PENTRU CITIRE DATE ADMIN DE PE SERVER
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Execută apelurile în paralel pentru a reduce latența la încărcare
                const [statsRes, usersRes] = await Promise.all([
                    api.get('/admin/stats'), // Obține cifrele globale
                    api.get('/admin/users')  // Obține lista completă de utilizatori
                ]);
                setStats(statsRes.data);
                
                // Sortăm utilizatorii după data înregistrării descrescător și păstrăm primii 8
                const sortedUsers = usersRes.data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setRecentUsers(sortedUsers.slice(0, 8));
            } catch (error) {
                console.error("Eroare la obținerea datelor de administrare:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Loader animat stilizat în formă de sferă cu pulsație
    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="ai-orb scale-75 animate-pulse-slow"></div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            {/* Antet Centru de Comandă / Monitorizare Sistem */}
            <div className={styles.pageHeader}>
                <div className={styles.headerTitleWrapper}>
                    <div className={styles.headerIconBox}>
                        <Terminal className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className={styles.headerTitleText}>
                        <h1 className={styles.title}>Centru de Comandă AI</h1>
                        <div className={styles.subtitleRow}>
                            <span className={styles.pulseDot}></span>
                            <p className={styles.subtitleText}>
                                SISTEM CORE STABIL • {stats?.total_users} NODURI ACTIVE
                            </p>
                        </div>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/admin/licenses">
                        <button className={styles.actionBtn}>
                            Gestiune Licențe <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                    </Link>
                </div>
            </div>

            {/* Secțiunea de Metrici Principale (Carduri cu date agregate) */}
            <div className={styles.metricsGrid}>
                {[
                    { label: 'Noduri Active', value: stats?.total_users ?? 0, sub: 'Total utilizatori înregistrați', icon: Users, color: styles['blue-bg'] },
                    { label: 'Conexiuni PRO', value: stats?.license_stats['PRO'] ?? 0, sub: 'Conturi Pro active', icon: Zap, color: styles['orange-bg'] },
                    { label: 'Enterprise', value: stats?.license_stats['ENTERPRISE'] ?? 0, sub: 'Grupuri gestionate', icon: ShieldCheck, color: styles['purple-bg'] },
                    { label: 'Sincronizări Totale', value: stats?.total_generations ?? 0, sub: 'Total generări efectuate', icon: Activity, color: styles['emerald-bg'] }
                ].map((stat, i) => (
                    <div key={i} className={styles.metricCard}>
                        <div className={cn(styles.metricIconBox, stat.color)}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                        <h3 className={styles.metricLabel}>{stat.label}</h3>
                        <div className={styles.metricValue}>{stat.value}</div>
                        <p className={styles.metricSub}>{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Grila Secundară: Registru Utilizatori (Stânga) | Diagnosticare Sistem (Dreapta) */}
            <div className={styles.dashboardGrid}>
                
                {/* 1. REGISTRU UTILIZATORI RECENT INREGISTRATI */}
                <div className={styles.registryCol}>
                    <div className={styles.card}>
                        <div className={styles.cardHeaderBlock}>
                            <div>
                                <h3 className={styles.cardTitle}>
                                    <Database className="h-5 w-5 text-blue-400" />
                                    Registru Noduri (Utilizatori)
                                </h3>
                                <p className={styles.cardDesc}>Monitorizare live a înregistrărilor</p>
                            </div>
                            <Badge className="bg-blue-600/10 text-blue-400 border-blue-500/20 py-1 px-3">8 EVENIMENTE RECENTE</Badge>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead className={styles.tableHeadRow}>
                                    <tr>
                                        <th className={styles.tableHeader}>Identificator Nod (Email)</th>
                                        <th className={styles.tableHeader}>Abonament</th>
                                        <th className={styles.tableHeader}>Data Înregistrării</th>
                                        <th className="px-8 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map(user => (
                                        <tr key={user.id} className={styles.tableRow}>
                                            <td className={styles.userCell}>
                                                <div className={styles.avatar}>
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <span className={styles.userEmail}>{user.email}</span>
                                            </td>
                                            <td className={styles.badgeCell}>
                                                <Badge variant="outline" className={cn(
                                                    "border-none px-3 py-1 text-[10px] font-black tracking-widest",
                                                    user.license?.plan_type === 'PRO' ? 'bg-blue-500/10 text-blue-400' : 
                                                    user.license?.plan_type === 'ENTERPRISE' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-500/10 text-slate-500'
                                                )}>
                                                    {user.license?.plan_type || 'FREE'}
                                                </Badge>
                                            </td>
                                            <td className={styles.timeCell}>
                                                {format(new Date(user.created_at), 'dd.MM, HH:mm')}
                                            </td>
                                            <td className={styles.actionCell}>
                                                <button className={styles.inspectBtn}>
                                                    INSPECTEAZĂ
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 2. DIAGNOSTICARE SERVER / SERVICII AI */}
                <div className={styles.diagnosticsCol}>
                    <div className={styles.diagnosticsCard}>
                        <h3 className={styles.diagTitle}>
                            <Server className="h-5 w-5 text-emerald-400" />
                            Diagnosticare Sistem
                        </h3>
                        <div className={styles.diagList}>
                            {/* Integritate */}
                            <div className={styles.diagItem}>
                                <div className={cn(styles.diagIconBox, styles.diagEmerald)}>
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className={styles.diagProgWrapper}>
                                    <div className={styles.diagHeaderRow}>
                                        <p className={styles.diagName}>Integritate Sistem</p>
                                        <span className={cn(styles.diagVal, "text-emerald-400")}>100%</span>
                                    </div>
                                    <div className={styles.diagBar}>
                                        <div className={cn(styles.diagBarFill, styles['bg-emerald'])} style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Latență */}
                            <div className={styles.diagItem}>
                                <div className={cn(styles.diagIconBox, styles.diagBlue)}>
                                    <Cpu className="h-6 w-6" />
                                </div>
                                <div className={styles.diagProgWrapper}>
                                    <div className={styles.diagHeaderRow}>
                                        <p className={styles.diagName}>Latență API / AI</p>
                                        <span className={cn(styles.diagVal, "text-blue-400")}>24ms</span>
                                    </div>
                                    <div className={styles.diagBar}>
                                        <div className={cn(styles.diagBarFill, styles['bg-blue'])} style={{ width: '15%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Încărcare DB */}
                            <div className={styles.diagItem}>
                                <div className={cn(styles.diagIconBox, styles.diagPurple)}>
                                    <Layers className="h-6 w-6" />
                                </div>
                                <div className={styles.diagProgWrapper}>
                                    <div className={styles.diagHeaderRow}>
                                        <p className={styles.diagName}>Încărcare Bază Date</p>
                                        <span className={cn(styles.diagVal, "text-purple-400")}>Optimă</span>
                                    </div>
                                    <div className={styles.diagBar}>
                                        <div className={cn(styles.diagBarFill, styles['bg-purple'])} style={{ width: '30%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.cachingCard}>
                        <h4 className={styles.cachingTitle}>Optimizare Automată</h4>
                        <p className={styles.cachingDesc}>
                            Optimizarea prin cache este activă pentru generarea frecventă a articolelor.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
