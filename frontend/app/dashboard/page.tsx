'use client'; // Marchează această componentă pentru a rula pe client (permite utilizarea stărilor/efectelor React)

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // Hook custom pentru a prelua informațiile despre utilizator
import Link from 'next/link';
import { ArrowRight, Sparkles, History, Zap, Activity, TrendingUp, Cpu, Globe, Rocket } from 'lucide-react';
import api from '@/lib/axios'; // Axios configurat pentru apeluri API
import { format } from 'date-fns'; // Funcție pentru formatarea datelor calendaristice
import { cn } from '@/lib/utils';
import styles from './dashboard-overview.module.scss'; // Stilurile specifice paginii principale de dashboard

interface ContentItem {
    id: number;
    prompt: string;
    content_type: string;
    generation_type: string;
    created_at: string;
}

export default function DashboardPage() {
    const { user } = useAuth(); // Preluăm utilizatorul logat curent din context
    
    // 1. STATE-URI PENTRU REZUMAT ACTIVITATE ȘI STATISTICI
    const [recentActivity, setRecentActivity] = useState<ContentItem[]>([]); // Ultimele 5 elemente generate
    const [statsData, setStatsData] = useState({
        total: 0,
        text: 0,
        image: 0,
        video: 0,
        published: 0,
        creditsUsed: 0
    }); // Statistici agregate despre activitatea utilizatorului

    // 2. EFECT DE INIȚIALIZARE DATE (Încarcă istoricul și postările de pe server)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Rulăm ambele apeluri API în paralel folosind Promise.all pentru eficiență
                const [historyRes, postsRes] = await Promise.all([
                    api.get('/ai/history'), // Istoricul conținutului generat
                    api.get('/social/posts') // Postările publicate pe rețelele sociale
                ]);

                const history = historyRes.data;
                const posts = postsRes.data;

                // Calculăm statisticile local
                const textCount = history.filter((i: any) => i.generation_type === 'text').length;
                const imageCount = history.filter((i: any) => i.generation_type === 'image' || i.generation_type === 'full').length;
                const videoCount = history.filter((i: any) => i.generation_type === 'video').length;
                const creditsUsed = history.reduce((sum: number, i: any) => sum + (i.cost || 0), 0);

                // Salvăm statisticile în state
                setStatsData({
                    total: history.length,
                    text: textCount,
                    image: imageCount,
                    video: videoCount,
                    published: posts.filter((p: any) => p.status === 'published').length,
                    creditsUsed
                });
                
                // Salvăm primele 5 cele mai recente generații pentru secțiunea de Activitate
                setRecentActivity(history.slice(0, 5));
            } catch (error) {
                console.error('Eroare la încărcarea datelor pe dashboard:', error);
            }
        };
        fetchData();
    }, []);

    // Definim cardurile de statistici care vor fi mapate în interfață
    const stats = [
        { label: 'Sold Credite', value: user?.license?.credits_remaining ?? 0, sub: `Abonament ${user?.license?.plan_type === 'FREE' ? 'Gratuit' : user?.license?.plan_type === 'PRO' ? 'Pro' : 'Enterprise'}`, icon: Cpu, bgStyle: styles['stats-blue'] },
        { label: 'Conținut Total', value: statsData.total, sub: `${statsData.creditsUsed} Credite Utilizate`, icon: TrendingUp, bgStyle: styles['stats-purple'] },
        { label: 'Texte / Imagini', value: `${statsData.text} / ${statsData.image}`, sub: `și ${statsData.video} Videoclipuri`, icon: Globe, bgStyle: styles['stats-emerald'] },
        { label: 'Postări Active', value: statsData.published, sub: 'Publicate cu succes', icon: Rocket, bgStyle: styles['stats-orange'] }
    ];

    return (
        <div className={styles.pageWrapper}>
            {/* Banner-ul principal cu Bun Venit și butoane rapide de acțiune */}
            <div className={styles.heroBanner}>
                <div className={styles.gradientOverlay}></div>
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <div className={styles.systemBadge}>
                            <Zap size={14} fill="currentColor" className="animate-pulse" /> Sistem AI Pregătit
                        </div>
                        <h2 className={styles.title}>
                            Creează <span className={styles.titleGradient}>conținut</span> uimitor cu AI.
                        </h2>
                        <p className={styles.subtitle}>
                            Generează texte profesionale de marketing, imagini de înaltă fidelitate și clipuri video în câteva secunde cu Cognify Studio.
                        </p>
                        
                        {/* Butoane de direcționare rapidă */}
                        <div className={styles.buttonGroup}>
                            <Link href="/dashboard/generate">
                                <button className={styles.primaryBtn}>
                                    <Sparkles size={16} />
                                    Începe Generarea
                                </button>
                            </Link>
                            <Link href="/dashboard/history">
                                <button className={styles.secondaryBtn}>
                                    Vezi Istoricul
                                </button>
                            </Link>
                        </div>
                    </div>
                    {/* Element grafic decorativ */}
                    <div className={styles.visualContainer}>
                        <div className={styles.floatingCardWrapper}>
                            <div className={styles.floatGlow}></div>
                            <div className={styles.floatingCard}>
                                <Rocket size={64} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secțiunea superioară cu indicatori de statistici (Credite, Postări, Istoric) */}
            <div className={styles.statsGrid}>
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className={styles.statsCard}>
                            <div className={cn(styles.statsIconWrapper, stat.bgStyle)}>
                                <Icon size={20} />
                            </div>
                            <p className={styles.statsLabel}>{stat.label}</p>
                            <p className={styles.statsValue}>{stat.value}</p>
                            <p className={styles.statsSub}>{stat.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Grila Principală: Coloană Activitate Recentă + Coloană Sfaturi Utile */}
            <div className={styles.mainGrid}>
                {/* 1. ACTIVITATE RECENTĂ */}
                <div className={styles.activityColumn}>
                    <div className={styles.activityHeader}>
                        <div className={styles.activityTitleWrapper}>
                            <div className={styles.activityTitleIcon}>
                                <Activity size={18} />
                            </div>
                            <h3 className={styles.activityTitle}>Activitate Recentă</h3>
                        </div>
                        <Link href="/dashboard/history" className={styles.viewAllLink}>Vezi Tot</Link>
                    </div>
                    
                    <div className={styles.activityList}>
                        {recentActivity.length > 0 ? (
                            recentActivity.map(item => (
                                <div key={item.id} className={styles.activityItem}>
                                    <div className={styles.itemInfoWrapper}>
                                        <div className={styles.itemIcon}>
                                            <Cpu size={20} />
                                        </div>
                                        <div className={styles.itemDetail}>
                                            <p className={styles.itemPrompt}>{item.prompt}</p>
                                            <div className={styles.itemMeta}>
                                                <span className={styles.itemType}>{item.content_type.replace('_', ' ')}</span>
                                                <span className={styles.metaDivider}></span>
                                                <span className={styles.itemDate}>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Trimite utilizatorul direct la publicare pentru elementul selectat */}
                                    <Link href={`/dashboard/publish?id=${item.id}&type=${item.generation_type}`}>
                                        <button className={styles.arrowButton}>
                                            <ArrowRight size={14} />
                                        </button>
                                    </Link>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <p>Nicio activitate încă. Hai să creăm ceva uimitor!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. SFATURI UTILE */}
                <div className={styles.tipsColumn}>
                    <div className={styles.tipsHeader}>
                        <div className={styles.tipsHeaderIcon}>
                            <Rocket size={18} />
                        </div>
                        <h3 className={styles.tipsTitle}>Sfaturi Utile</h3>
                    </div>
                    
                    <div className={styles.tipsList}>
                        <div className={styles.tipItem}>
                            <p className={styles.tipLabel}>
                                <Sparkles size={14} /> Fii Specific
                            </p>
                            <p className={styles.tipDesc}>
                                Prompturile detaliate duc la rezultate AI mult mai bune. Adaugă context despre identitatea brandului tău.
                            </p>
                        </div>
                        <div className={styles.tipItem}>
                            <p className={styles.tipLabelIndigo}>
                                <Zap size={14} /> Publicare Directă
                            </p>
                            <p className={styles.tipDesc}>
                                Conectează-ți conturile de social media pentru a posta direct din Studio, obținând eficiență maximă.
                            </p>
                        </div>
                    </div>
                    
                    <button className={styles.upgradeBtn}>
                        Upgrade Abonament
                    </button>
                </div>
            </div>
        </div>
    );
}
