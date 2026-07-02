'use client'; // Permite utilizarea logicii React pe client (stări și efecte)

import { useEffect, useState } from 'react';
import api from '@/lib/axios'; // Axios configurat pentru apeluri API
import { format } from 'date-fns';
import { 
    Facebook, Instagram, Linkedin, Globe, 
    Calendar, MoreVertical, ExternalLink, 
    Share2, Trash2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './posts.module.scss'; // Stilurile SCSS ale listei de postări publicate

interface Post {
    id: number;
    platform: string;
    provider_post_id: string;
    caption: string;
    image_url?: string;
    video_url?: string;
    status: string;
    published_at: string;
}

export default function PostsPage() {
    // 1. STATE-URI PENTRU POSTĂRI ȘI STARE DE ÎNCĂRCARE
    const [posts, setPosts] = useState<Post[]>([]); // Stochează lista postărilor returnate de server
    const [loading, setLoading] = useState(true); // Indicator de încărcare date de la API

    // 2. EFECT PENTRU CITIRE DATE DE LA SOCIAL POSTS
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Obținem postările trimise către Facebook, Instagram, LinkedIn etc.
                const response = await api.get('/social/posts');
                setPosts(response.data);
            } catch (error) {
                console.error('Eroare la preluarea postărilor:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    // Returnează pictograma corectă corespunzătoare platformei sociale
    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'facebook': return <Facebook className="w-5 h-5 text-blue-600" />;
            case 'instagram': return <Instagram className="w-5 h-5 text-pink-600" />;
            case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-700" />;
            default: return <Globe className="w-5 h-5 text-slate-400" />;
        }
    };

    // Afișează spinner-ul în timpul încărcării
    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            {/* Antetul secțiunii de postări */}
            <div className={styles.titleSection}>
                <h1 className={styles.title}>Postări Publicate</h1>
                <p className={styles.subtitle}>Urmărește performanța și istoricul postărilor tale sociale.</p>
            </div>

            {/* Verifică dacă există postări în baza de date */}
            {posts.length === 0 ? (
                // Afișare stare goală (Nu s-a postat nimic încă)
                <div className={styles.emptyState}>
                    <Share2 size={64} className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>Nicio postare publicată</h3>
                    <p className={styles.emptyDesc}>Conținutul tău publicat pe rețelele sociale va apărea aici.</p>
                </div>
            ) : (
                // Grila cu cardurile postărilor publicate efectiv pe social media
                <div className={styles.postsGrid}>
                    {posts.map((post) => (
                        <div key={post.id} className={styles.card}>
                            
                            {/* Antetul Postării */}
                            <div className={styles.cardHeader}>
                                <div className={styles.headerInfoBlock}>
                                    <div className={styles.iconWrapper}>
                                        {getPlatformIcon(post.platform)}
                                    </div>
                                    <div className={styles.platformDetails}>
                                        <p className={styles.platformName}>{post.platform}</p>
                                        <div className={styles.dateRow}>
                                            <Calendar size={10} className="text-slate-500" />
                                            {/* Data publicării formatată frumos */}
                                            <span className={styles.dateLabel}>
                                                {format(new Date(post.published_at), 'd MMM, HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.headerActionRow}>
                                    <div className={styles.statusBadge}>
                                        Activă
                                    </div>
                                    <button className={styles.menuBtn}>
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Corpul Cardului (Imagine și Caption) */}
                            <div className={styles.cardBody}>
                                {post.image_url && (
                                    <div className={styles.imageWrapper}>
                                        <img 
                                            src={post.image_url} 
                                            alt="Post media content" 
                                            className={styles.image}
                                        />
                                        <div className={styles.imageHoverOverlay}>
                                            <button className={styles.quickPreviewBtn}>
                                                Previzualizare rapidă
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <p className={styles.captionText}>
                                    &quot;{post.caption}&quot;
                                </p>
                            </div>

                            {/* Subsol Card (Link spre pagina externă originală și buton de ștergere) */}
                            <div className={styles.cardFooter}>
                                <a 
                                    href={post.platform.toLowerCase() === 'facebook' ? `https://facebook.com/${post.provider_post_id}` : '#'} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1"
                                >
                                    <button className={styles.viewBtn}>
                                        <ExternalLink size={14} /> Vezi postarea originală
                                    </button>
                                </a>
                                <button className={styles.deleteButton} title="Șterge log postare">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
