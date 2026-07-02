'use client'; // Indică faptul că această pagină este randată pe client (în browser)

import { useEffect, useState } from 'react';
import api from '@/lib/axios'; // Instanța Axios pentru cereri HTTP
import { format } from 'date-fns'; // Funcție utilitară pentru formatarea datelor calendaristice
import Link from 'next/link';
import { 
    Cpu, Image as ImageIcon, Video, FileText, 
    Download, Trash2, ExternalLink, Loader2, History,
    Linkedin, Facebook, Instagram, Twitter, BarChart3
} from 'lucide-react'; // Importăm pictogramele necesare pentru UI
import { cn } from '@/lib/utils'; // Utilitar îmbinare clase
import styles from './history.module.scss'; // Stilurile SCSS ale arhivei

// Structura unui element din istoric (Content sau Video)
interface ContentItem {
    id: number;
    prompt: string;
    generated_text?: string;
    generation_type: string;
    generated_image_url?: string;
    video_url?: string;
    platform?: string;
    content_type?: string;
    created_at: string;
    score?: number;
}

export default function HistoryPage() {
    // --- STATE-URI (STĂRI) REACT ---
    const [history, setHistory] = useState<ContentItem[]>([]); // Stochează întreaga listă de conținut generat
    const [loading, setLoading] = useState(true); // Indicator pentru starea inițială de încărcare a datelor
    const [filter, setFilter] = useState('all'); // Filtrul curent selectat (Toate, Texte, Imagini, Video)
    const [analyzing, setAnalyzing] = useState<number | null>(null); // Reține ID-ul postării care se află în curs de analiză în acest moment

    // --- FUNCȚIE ÎNCĂRCARE ISTORIC ---
    const fetchHistory = async () => {
        try {
            // Apelează endpoint-ul unificat de istoric din backend
            const response = await api.get('/ai/history');
            setHistory(response.data); // Setează istoricul în stare
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false); // Ascunde indicatorul de încărcare
        }
    };

    // Rulează funcția de încărcare o singură dată la montarea paginii în browser
    useEffect(() => {
        fetchHistory();
    }, []);

    // --- FUNCȚIE PENTRU DEClanșarea ANALIZEI AI ---
    const handleAnalyze = async (id: number) => {
        setAnalyzing(id); // Setează starea de analiză activă pentru acest conținut
        try {
            // Trimite cererea POST către backend pentru a porni analiza textului
            await api.post(`/content/${id}/analyze`);
            // Reîncărcăm istoricul pentru a actualiza scorul primit de la backend
            await fetchHistory();
        } catch (err) {
            console.error('Analysis failed:', err);
        } finally {
            setAnalyzing(null); // Resetează starea de analiză
        }
    };

    // --- FUNCȚIE PENTRU ȘTERGERE CREAȚIE ---
    const handleDelete = async (id: number, generationType: string) => {
        if (!confirm('Sigur doriți să ștergeți această creație?')) return; // Cere confirmarea utilizatorului
        try {
            // Apelează endpoint-ul de ștergere în funcție de tipul de conținut (video sau altceva)
            if (generationType === 'video') {
                await api.delete(`/ai/video/${id}`);
            } else {
                await api.delete(`/content/${id}`);
            }
            // Filtrează starea locală pentru a elimina elementul șters imediat (fără a mai face un apel get la server)
            setHistory(prev => prev.filter(item => !(item.id === id && item.generation_type === generationType)));
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Ștergerea a eșuat. Vă rugăm să încercați din nou.');
        }
    };

    // Filtrează lista de conținut pe baza filtrului selectat de utilizator
    const filteredHistory = history.filter(item => 
        filter === 'all' || item.generation_type.includes(filter)
    );

    // În timp ce se încarcă datele, se afișează un spinner mare
    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            {/* Antetul paginii și secțiunea de filtre */}
            <div className={styles.pageHeader}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Arhiva de Creație</h1>
                    <p className={styles.subtitle}>Accesează biblioteca ta de conținut generat cu Inteligență Artificială.</p>
                </div>

                {/* Butoanele de Filtrare a listei de creații */}
                <div className={styles.filterBar}>
                    {['all', 'text', 'image', 'video'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)} // Schimbă filtrul activ la click
                            className={cn(
                                styles.filterBtn,
                                filter === f && styles.filterBtnActive // Adaugă clasă activă dacă este cel selectat
                            )}
                        >
                            {f === 'all' ? 'Toate creațiile' : f === 'text' ? 'Texte' : f === 'image' ? 'Imagini' : 'Video'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dacă după filtrare nu avem nicio creație, arătăm o stare goală */}
            {filteredHistory.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIconWrapper}>
                        <History size={32} className="text-slate-600" />
                    </div>
                    <h3 className={styles.emptyTitle}>Bibliotecă Goală</h3>
                    <p className={styles.emptyDesc}>Călătoria ta creativă începe aici. Creează ceva uimitor!</p>
                </div>
            ) : (
                // Afișăm grila de elemente din istoric
                <div className={styles.gridContainer}>
                    {filteredHistory.map((item) => (
                        <div key={item.id} className={styles.card}>
                            {/* Zona de previzualizare rapidă din interiorul cardului */}
                            <div className={styles.cardThumbnailWrapper}>
                                {item.generated_image_url ? (
                                    // Dacă avem o imagine, o afișăm
                                    <div className="w-full h-full relative">
                                        <img src={item.generated_image_url} alt="Generated" className={styles.thumbnailImage} />
                                        {/* Pentru Postare Magică (full) suprapunem și o previzualizare de text */}
                                        {item.generation_type === 'full' && item.generated_text && (
                                            <div className={styles.thumbnailTextOverlay}>
                                                <p className={styles.overlayText}>
                                                    {item.generated_text}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : item.generation_type === 'video' && item.video_url ? (
                                    // Dacă este un video, afișăm elementul video
                                    <video src={item.video_url} className="w-full h-full object-cover" />
                                ) : (
                                    // Dacă este doar text, afișăm o pictogramă de document și textul în ghilimele
                                    <div className={styles.thumbnailTextOnly}>
                                        <div className={styles.backgroundIcon}>
                                            <FileText size={120} strokeWidth={1} />
                                        </div>
                                        <p className={styles.creationQuote}>
                                            &quot;{item.generated_text}&quot;
                                        </p>
                                    </div>
                                )}
                                
                                {/* Eticheta de rețea socială sau tip de conținut din colțul stânga sus al imaginii */}
                                <div className={styles.platformBadge}>
                                    {item.platform === 'LinkedIn' ? <Linkedin size={10} className="text-blue-400" /> :
                                     item.platform === 'Facebook' ? <Facebook size={10} className="text-blue-600" /> :
                                     item.platform === 'Instagram' ? <Instagram size={10} className="text-pink-400" /> :
                                     item.platform?.includes('Twitter') ? <Twitter size={10} className="text-slate-200" /> :
                                     item.generation_type === 'image' ? <ImageIcon size={10} className="text-blue-400" /> : 
                                     item.generation_type === 'video' ? <Video size={10} className="text-emerald-400" /> : 
                                     item.generation_type === 'full' ? <Cpu size={10} className="text-amber-400" /> :
                                     <FileText size={10} className="text-purple-400" />}
                                    <span className={styles.badgeText}>
                                        {item.platform || (item.generation_type === 'text' ? 'Text' : item.generation_type === 'image' ? 'Imagine' : item.generation_type === 'video' ? 'Video' : item.generation_type === 'full' ? 'Postare Magică' : item.generation_type)}
                                    </span>
                                </div>
                                
                                {/* Overlay cu buton la trecerea mouse-ului (Hover) pentru a deschide pagina de Publicare */}
                                <div className={styles.hoverOverlay}>
                                    <Link href={`/dashboard/publish?id=${item.id}&type=${item.generation_type}`}>
                                        <button className={styles.viewDetailBtn} title="Deschide în editorul de publicare">
                                            <ExternalLink size={16} />
                                        </button>
                                    </Link>
                                </div>
                            </div>

                            {/* Subsolul cardului: Textul promptului inițial, Data creării și Butoanele de Acțiune */}
                            <div className={styles.cardFooter}>
                                <p className={styles.promptText}>{item.prompt}</p>
                                <div className={styles.metaRow}>
                                    {/* Data formatată calendaristic (ex: 24.06.2026) */}
                                    <span className={styles.dateText}>
                                        {format(new Date(item.created_at), 'dd.MM.yyyy')}
                                    </span>
                                    
                                    {/* Grupul de Butoane de Acțiuni */}
                                    <div className={styles.actionsGroup}>
                                        {/* Butonul de ANALIZĂ AI (Apare doar pentru conținut de tip TEXT sau FULL POST) */}
                                        {(item.generation_type === 'text' || item.generation_type === 'full') && (
                                            <button 
                                                onClick={() => handleAnalyze(item.id)} // Pornește analiza la click
                                                disabled={analyzing === item.id || !!item.score} // Dezactivează dacă este deja analizat sau se analizează acum
                                                className={cn(
                                                    styles.analyzeBtn,
                                                    item.score ? styles.analyzedActive : "" // Aplică clasă verde/activă dacă are deja scor
                                                )}
                                                title={item.score ? "Conținut analizat" : "Trimite spre analiză AI"}
                                            >
                                                {analyzing === item.id ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                                            </button>
                                        )}
                                        {/* Butonul de Descărcare */}
                                        <button className={styles.actionIconBtn} title="Descarcă fișierul">
                                            <Download size={14} />
                                        </button>
                                        {/* Butonul de Ștergere (pictogramă Coș de Gunoi) */}
                                        <button 
                                             onClick={() => handleDelete(item.id, item.generation_type)} // Șterge din baza de date la click
                                             className={styles.deleteBtn}
                                             title="Șterge din arhivă"
                                         >
                                             <Trash2 size={14} />
                                         </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
