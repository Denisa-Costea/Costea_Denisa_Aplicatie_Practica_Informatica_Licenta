'use client'; // Marchează componenta pentru randare pe partea de client

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Hook-uri Next.js pentru navigare și citirea parametrilor din URL
import { useAuth } from '@/context/AuthContext'; // Hook pentru a accesa datele utilizatorului curent logat
import { Share2, Globe, Facebook, Instagram, Linkedin, Send, Loader2, AlertCircle, CheckCircle2, ArrowLeft, FileText } from 'lucide-react'; // Import pictograme
import api from '@/lib/axios'; // Instanța Axios configurată pentru apeluri API
import { cn } from '@/lib/utils'; // Utilitar îmbinare clase CSS
import { Button } from '@/components/ui';
import { SocialPreview } from '@/components/social-preview'; // Componenta de previzualizare Facebook/Instagram/LinkedIn
import Link from 'next/link';
import styles from './publish.module.scss'; // Stilurile SCSS specifice paginii

export default function PublishPage() {
    const searchParams = useSearchParams(); // Permite citirea parametrilor din URL (ex: ?id=X&type=Y)
    const router = useRouter(); // Permite navigarea programatică (ex: înapoi sau către altă pagină)
    const { user } = useAuth(); // Extrage datele utilizatorului logat
    
    // --- STĂRI REVOLUTIVE (STATE-URI REACT) ---
    const contentId = searchParams.get('id'); // ID-ul conținutului generat primit din URL
    const contentType = searchParams.get('type') || 'image'; // Tipul conținutului (text, imagine, video, full)
    const [content, setContent] = useState<any>(null); // Stochează detaliile conținutului încărcat din baza de date
    const [platform, setPlatform] = useState<'facebook' | 'instagram' | 'linkedin'>('facebook'); // Starea pentru platforma selectată de utilizator
    const [loading, setLoading] = useState(false); // Indicator pentru starea de trimitere a cererii de publicare (loading spinner)
    const [error, setError] = useState(''); // Stochează mesajele de eroare returnate de API
    const [success, setSuccess] = useState(false); // Starea care indică dacă publicarea a fost realizată cu succes
    const [pages, setPages] = useState<any[]>([]); // Lista paginilor de Facebook asociate contului conectat
    const [selectedPageId, setSelectedPageId] = useState<string>(''); // ID-ul paginii de Facebook selectate de utilizator
    const [fetchingPages, setFetchingPages] = useState(false); // Indicator de încărcare pentru lista de pagini Facebook

    const connected = searchParams.get('connected'); // Parametru din URL pentru confirmarea conectării cu Facebook
    const errorParam = searchParams.get('error'); // Parametru din URL pentru eventuale erori de conectare

    // --- EFECTE (EFFECTS) ---

    // Redirecționează utilizatorul dacă lipsește ID-ul conținutului (ex: la conectarea Facebook în setări)
    useEffect(() => {
        if (!contentId) {
            if (connected === 'facebook') {
                router.push('/dashboard/settings?connected=facebook');
            } else if (errorParam === 'facebook_connection_failed') {
                router.push('/dashboard/settings?error=facebook_connection_failed');
            } else {
                router.push('/dashboard/settings');
            }
        }
    }, [contentId, connected, errorParam, router]);

    // Încarcă datele postării (text, imagine, video) din backend
    useEffect(() => {
        const fetchContent = async () => {
            if (!contentId) return;
            try {
                // Apelează endpoint-ul de previzualizare specific conținutului
                const response = await api.get(`/ai/preview/${contentId}?type=${contentType}`);
                setContent(response.data); // Pune datele în starea `content`
            } catch (err) {
                console.error('Failed to fetch content:', err);
                setError('Nu s-a putut încărca conținutul generat.');
            }
        };
        fetchContent();
    }, [contentId, contentType]);

    // Dacă rețeaua selectată este Facebook, aduce de la API paginile de Facebook pe care utilizatorul le administrează
    useEffect(() => {
        if (platform === 'facebook') {
            const fetchPages = async () => {
                setFetchingPages(true);
                try {
                    const response = await api.get('/social/facebook/pages');
                    setPages(response.data); // Pune paginile în stare
                    if (response.data.length > 0) {
                        setSelectedPageId(response.data[0].id.toString()); // Selectează implicit prima pagină
                    }
                } catch (err) {
                    console.error('Failed to fetch pages:', err);
                } finally {
                    setFetchingPages(false);
                }
            };
            fetchPages();
        } else {
            setPages([]);
            setSelectedPageId('');
        }
    }, [platform]);

    // --- FUNCȚIA DE PUBLICARE ---
    const handlePublish = async () => {
        // Validează selectarea paginii de Facebook
        if (platform === 'facebook' && !selectedPageId) {
            setError('Vă rugăm să selectați o pagină de Facebook mai întâi.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Alege endpoint-ul și datele transmise în funcție de rețeaua socială selectată
            const endpoint = platform === 'facebook' ? '/social/facebook/publish' : '/social/publish';
            const payload = platform === 'facebook' ? {
                page_id: parseInt(selectedPageId),
                caption: content?.generated_text || '',
                image_url: content?.generated_image_url,
                video_url: content?.video_url,
                content_id: parseInt(contentId || '0')
            } : {
                content_id: contentId,
                platform: platform,
                caption: content?.generated_text || '',
                image_url: content?.generated_image_url,
                video_url: content?.video_url
            };

            // Trimite cererea POST către server
            await api.post(endpoint, payload);
            setSuccess(true); // Afișează mesajul de succes
            // Redirecționează utilizatorul la pagina de istoric postări după 2 secunde
            setTimeout(() => router.push('/dashboard/posts'), 2000);
        } catch (err: any) {
            const errorData = err.response?.data?.detail;
            const errorMessage = typeof errorData === 'object' 
                ? JSON.stringify(errorData) 
                : (errorData || 'Publicarea a eșuat. Asigurați-vă că aveți conturile sociale conectate.');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // În timp ce datele se încarcă de la server, arată un spinner de loading
    if (!content && !error) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            {/* Antetul paginii cu Butonul de Înapoi (ArrowLeft) */}
            <div className={styles.headerRow}>
                <button onClick={() => router.back()} className={styles.backButton} title="Înapoi">
                    <ArrowLeft size={18} />
                </button>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Publicare Conținut</h1>
                    <p className={styles.subtitle}>Selectează rețeaua socială de destinație</p>
                </div>
            </div>

            <div className={styles.contentGrid}>
                {/* ---------------- PANOU STÂNGA: PREVIZUALIZAREA POSTĂRII ---------------- */}
                <div className={styles.previewCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitleBlock}>
                            <div className={styles.cardIconBoxBlue}>
                                <FileText size={20} />
                            </div>
                            <h3 className={styles.cardTitle}>Previzualizare Postare</h3>
                        </div>
                        {/* Indicator animat în timp real (Pulse Dot) */}
                        <div className={styles.liveIndicator}>
                            <div className={styles.pulseDot}></div>
                            <span className={styles.liveLabel}>Randare în timp real</span>
                        </div>
                    </div>

                    {/* Componenta care construiește efectiv aspectul de FB, IG sau LinkedIn */}
                    <SocialPreview 
                        platform={platform}
                        text={content?.generated_text || ''}
                        image={content?.generated_image_url}
                        video={content?.video_url}
                        userName={user?.email ? user.email.split('@')[0] : 'Utilizator Cognify'}
                    />
                    
                    {/* Box mic explicativ pentru utilizator */}
                    <div className={styles.insightsBox}>
                        <p className={styles.insightsLabel}>Informații Editor</p>
                        <p className={styles.insightsText}>
                            Așa va apărea postarea ta pentru audiență pe {platform}. Formatarea și așezarea elementelor media au fost optimizate pentru o conversie ridicată.
                        </p>
                    </div>
                </div>

                {/* ---------------- PANOU DREAPTA: SELECȚIE PLATFORMĂ ȘI PUBLICARE ---------------- */}
                <div className={styles.controlsCol}>
                    <div className={styles.controlsCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardTitleBlock}>
                                <div className={styles.cardIconBoxEmerald}>
                                    <Globe size={20} />
                                </div>
                                <h3 className={styles.cardTitle}>Destinație Rețea</h3>
                            </div>
                        </div>

                        {/* Listă butoane pentru a selecta rețeaua socială (Facebook, Instagram, LinkedIn) */}
                        <div className={styles.platformList}>
                            {[
                                { id: 'facebook', label: 'Facebook', icon: Facebook, color: styles['fb-bg'] },
                                { id: 'instagram', label: 'Instagram', icon: Instagram, color: styles['ig-bg'] },
                                { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: styles['li-bg'] }
                            ].map((plat) => (
                                <button
                                    key={plat.id}
                                    onClick={() => setPlatform(plat.id as any)} // Schimbă starea `platform` la click
                                    className={cn(
                                        styles.platformButton,
                                        platform === plat.id && styles.platformButtonActive // Aplică clasa activă dacă butonul corespunde platformei curente
                                    )}
                                >
                                    <div className={styles.platInfoWrapper}>
                                        <div className={cn(styles.platIconBox, plat.color)}>
                                            <plat.icon size={24} />
                                        </div>
                                        <div className={styles.platDetails}>
                                            <p className={styles.platLabel}>{plat.label}</p>
                                            <p className={styles.platSub}>Cont conectat</p>
                                        </div>
                                    </div>
                                    {/* Indicator rotund în formă de bifă din dreapta butonului de platformă */}
                                    <div className={cn(
                                        styles.checkboxCircle,
                                        platform === plat.id && styles.checkboxCircleActive
                                    )}>
                                        {platform === plat.id && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Meniu de selecție a Paginilor Facebook (Apare doar dacă platforma selectată este Facebook) */}
                        {platform === 'facebook' && (
                            <div className={styles.selectWrapper}>
                                <label className={styles.selectLabel}>Selectează Pagina</label>
                                {fetchingPages ? (
                                    // Afișează că se încarcă paginile
                                    <div className={styles.selectLoader}>
                                        <Loader2 size={14} className="animate-spin" /> Se încarcă paginile conectate...
                                    </div>
                                ) : pages.length > 0 ? (
                                    // Meniu derulant (Select dropdown) cu paginile găsite
                                    <select
                                        value={selectedPageId}
                                        onChange={(e) => setSelectedPageId(e.target.value)} // Actualizează pagina selectată
                                        className={styles.select}
                                    >
                                        {pages.map(page => (
                                            <option key={page.id} value={page.id} className="bg-[#0f172a]">{page.page_name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    // Afișează eroare dacă nu sunt pagini și oferă link spre setări
                                    <div className={styles.selectError}>
                                        <AlertCircle size={16} />
                                        Nicio pagină găsită. <Link href="/dashboard/settings" className="underline">Conectează Facebook</Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Alertă de eroare - apare dacă publicarea a eșuat */}
                        {error && (
                            <div className={styles.alertError}>
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {/* Alertă de succes - apare când API-ul a răspuns cu succes */}
                        {success && (
                            <div className={styles.alertSuccess}>
                                <CheckCircle2 size={18} />
                                Conținutul a fost publicat cu succes pe {platform}!
                            </div>
                        )}

                        {/* Butonul final de trimitere ("Publică Postarea") */}
                        <Button 
                            onClick={handlePublish} // Apelează funcția de publicare definită mai sus
                            disabled={loading || success} // Dezactivează butonul în timpul încărcării sau după succes
                            className={styles.submitButton}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <Send size={18} />
                                    Publică Postarea
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Secțiune suplimentară cu detalii despre transmitere securizată */}
                    <div className={styles.transmissionCard}>
                        <h4 className={styles.transmissionLabel}>Protocol de Transmitere</h4>
                        <p className={styles.transmissionDesc}>
                            Conținutul tău va fi transmis prin serverele noastre securizate. Indicatorii de performanță vor fi vizibili în tab-ul de analiză în scurt timp.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
