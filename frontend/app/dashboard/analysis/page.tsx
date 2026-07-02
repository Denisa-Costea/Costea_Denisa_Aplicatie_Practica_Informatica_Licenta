'use client'; // Permite componentei să ruleze pe client (folosește state și efecte React)

import { useEffect, useState } from 'react';
import api from '@/lib/axios'; // Axios configurat cu backend url
import { 
    Loader2, TrendingUp, CheckCircle2, AlertCircle, BarChart3,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui';
import styles from './analysis.module.scss'; // Stilurile SCSS specifice paginii de analiză

interface ScoreItem {
    readability_score: number;
    seo_score: number;
    sentiment_label: string;
    critique: string;
    suggestions: string[];
}

interface ContentItem {
    id: number;
    prompt: string;
    content_type: string;
    created_at: string;
    score: ScoreItem | null;
}

export default function AnalysisPage() {
    // 1. STATE-URI SPECIFICE PAGINII DE ANALIZĂ AI
    const [analyzedHistory, setAnalyzedHistory] = useState<ContentItem[]>([]); // Lista postărilor care au scoruri de analiză AI
    const [loading, setLoading] = useState(true); // Indicator de încărcare date de pe server

    // 2. INCĂRCARE DATE DIN BAZA DE DATE (HISTORY)
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/ai/history');
                // Filtrăm doar postările care au deja o analiză efectuată (score !== null)
                const analyzed = response.data.filter((item: any) => item.score !== null);
                setAnalyzedHistory(analyzed);
            } catch (error) {
                console.error('Eroare la preluarea istoricului analizat:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Afișează spinner-ul dacă datele sunt în curs de descărcare
    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            {/* Antetul secțiunii */}
            <div className={styles.titleSection}>
                <h1 className={styles.title}>Analiză AI</h1>
                <p className={styles.subtitle}>Informații detaliate despre performanța și optimizarea SEO a conținutului tău.</p>
            </div>

            {/* Verifică dacă există analize în baza de date */}
            {analyzedHistory.length === 0 ? (
                // Afișare stare goală (Dacă userul nu a analizat nicio postare încă)
                <div className={styles.emptyState}>
                    <BarChart3 size={64} className="text-slate-600 mb-6" />
                    <h3 className={styles.emptyTitle}>Nu există date încă</h3>
                    <p className={styles.emptyDesc}>Analizează textele generate pentru a vedea scorurile de evaluare aici.</p>
                </div>
            ) : (
                // Listă cu cardurile detaliate de analiză AI
                <div className={styles.listWrapper}>
                    {analyzedHistory.map((item) => {
                        if (!item.score) return null;
                        const score = item.score;
                        // Calculăm media aritmetică a lizibilității și optimizării SEO ca notă generală
                        const overallScore = Math.round((score.readability_score + score.seo_score) / 2);
                        
                        return (
                            <div key={item.id} className={styles.analysisCard}>
                                
                                {/* Panou Grad Indicator (Cerc cu nota generală) */}
                                <div className={styles.gradePanel}>
                                    <div className={styles.gradeCircleWrapper}>
                                        <div className={styles.pulseBg}></div>
                                        <div className={styles.gradeCircle}>
                                            <span className={styles.gradeScore}>{overallScore}</span>
                                        </div>
                                    </div>
                                    <p className={styles.gradeLabel}>Notă Generală</p>
                                    <div className={styles.optimizationTag}>
                                        <TrendingUp size={12} /> Optimizare Ridicată
                                    </div>
                                </div>

                                {/* Panoul de metrici detaliate (Lizibilitate, SEO, Sentiment) */}
                                <div className={styles.metricsPanel}>
                                    <div className={styles.metricsGroup}>
                                        {/* Lizibilitate */}
                                        <div className={styles.progressItem}>
                                            <div className={styles.progressLabelRow}>
                                                <span className={styles.progressLabel}>Lizibilitate</span>
                                                <span className={styles.progressValue}>{score.readability_score}%</span>
                                            </div>
                                            <Progress value={score.readability_score} className="h-2 bg-white/5" />
                                        </div>
                                        {/* Scor SEO */}
                                        <div className={styles.progressItem}>
                                            <div className={styles.progressLabelRow}>
                                                <span className={styles.progressLabel}>Scor SEO</span>
                                                <span className={styles.progressValue}>{score.seo_score}%</span>
                                            </div>
                                            <Progress value={score.seo_score} className="h-2 bg-white/5" />
                                        </div>
                                        {/* Sentiment Label */}
                                        <div className={styles.sentimentSection}>
                                            <span className={styles.sentimentLabel}>Sentiment Conținut</span>
                                            <div className={styles.sentimentBadge}>
                                                <div className={styles.sentimentDot}></div>
                                                <span className={styles.sentimentText}>
                                                    {score.sentiment_label === 'Positive' ? 'Pozitiv' : score.sentiment_label === 'Negative' ? 'Negativ' : score.sentiment_label === 'Neutral' ? 'Neutru' : score.sentiment_label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Critică AI și sugestii detaliate de la model */}
                                    <div className={styles.insightsGroup}>
                                        {/* Critica AI (Paragraf explicativ oferit de GPT) */}
                                        <div className={styles.critiqueCard}>
                                            <h4 className={styles.critiqueHeader}>
                                                <AlertCircle size={14} /> Critica AI
                                            </h4>
                                            <p className={styles.critiqueText}>
                                                &quot;{score.critique}&quot;
                                            </p>
                                        </div>
                                        
                                        {/* Sugestii de Îmbunătățire */}
                                        <div className={styles.suggestionsCard}>
                                            <h4 className={styles.suggestionsHeader}>
                                                <CheckCircle2 size={14} /> Îmbunătățiri recomandate
                                            </h4>
                                            <ul className={styles.suggestionsList}>
                                                {score.suggestions.map((s, i) => (
                                                    <li key={i} className={styles.suggestionItem}>
                                                        <ArrowUpRight size={14} className={styles.suggestionIcon} />
                                                        {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
