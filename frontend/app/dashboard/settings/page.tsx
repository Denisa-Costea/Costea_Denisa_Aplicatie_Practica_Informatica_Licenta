'use client'; // Marchează componenta pentru a rula în browser (folosește hook-uri și efecte client-side)

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Preluare utilizator logat din contextul global
import api from '@/lib/axios'; // Comunicare API
import { useSearchParams } from 'next/navigation'; // Citire query URL params (ex: ?connected=facebook)
import { Linkedin, Instagram, Facebook, CheckCircle2, Loader2, User, Key, Share2, Zap, Shield, Mail, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import styles from './settings.module.scss'; // Stilurile SCSS specifice paginii de setări

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const searchParams = useSearchParams();
    const connectedParam = searchParams.get('connected'); // Parametru din URL după autentificare socială reușită
    const errorParam = searchParams.get('error'); // Parametru din URL după eroare conectare rețea socială

    // 1. STATE-URI PENTRU SCHIMBARE PAROLĂ ȘI UPDATE PROFIL
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(''); // Eroare globală pagină
    const [success, setSuccess] = useState(''); // Succes global pagină
    const [loading, setLoading] = useState(false); // Încărcare schimbare parolă
    const [profileLoading, setProfileLoading] = useState(false); // Încărcare modificare email
    
    // Conexiunile conturilor sociale
    const [connections, setConnections] = useState({
        linkedin: false,
        instagram: false,
        facebook: false
    });
    const [connecting, setConnecting] = useState<string | null>(null); // Stochează care platformă este în curs de conectare

    // State-uri pentru token-ul manual Facebook
    const [fbPageToken, setFbPageToken] = useState('');
    const [fbPageName, setFbPageName] = useState('');
    const [fbPageId, setFbPageId] = useState('');
    const [tokenLoading, setTokenLoading] = useState(false);
    const [connectedPages, setConnectedPages] = useState<any[]>([]);

    // 2. EFECT PENTRU AFISARE ALERTE DIN URL (OAUTH CALLBACKS)
    useEffect(() => {
        if (connectedParam === 'facebook') {
            setSuccess('Contul Facebook a fost conectat cu succes!');
        } else if (errorParam === 'facebook_connection_failed') {
            setError('Conectarea contului Facebook a eșuat.');
        }
    }, [connectedParam, errorParam]);

    // 3. EFECT PENTRU SETARE INITIALA DATE USER
    useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
        fetchConnections(); // Preia conturile sociale conectate de pe server
        fetchConnectedPages(); // Preia paginile Facebook conectate
    }, [user]);

    // Preia conexiunile sociale active de la backend `/social/accounts`
    const fetchConnections = async () => {
        try {
            const response = await api.get('/social/accounts');
            const connectedMap = { linkedin: false, instagram: false, facebook: false };
            response.data.forEach((acc: any) => {
                if (acc.provider in connectedMap) {
                    connectedMap[acc.provider as keyof typeof connectedMap] = true;
                }
            });
            setConnections(connectedMap);
        } catch (err) {
            console.error('Failed to fetch connections:', err);
        }
    };

    // Preia paginile Facebook conectate
    const fetchConnectedPages = async () => {
        try {
            const response = await api.get('/social/facebook/pages');
            setConnectedPages(response.data);
        } catch (err) {
            console.error('Failed to fetch pages:', err);
        }
    };

    // Salvează manual un Page Access Token de Facebook
    const handleManualToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!fbPageToken.trim() || !fbPageName.trim()) {
            setError('Completează token-ul și numele paginii.');
            return;
        }

        setTokenLoading(true);
        try {
            await api.post('/social/facebook/manual-token', {
                page_access_token: fbPageToken,
                page_name: fbPageName,
                page_id: fbPageId || undefined
            });
            setSuccess('Pagina Facebook a fost conectată cu succes!');
            setFbPageToken('');
            setFbPageName('');
            setFbPageId('');
            await fetchConnectedPages();
            await fetchConnections();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Conectarea manuală a eșuat.');
        } finally {
            setTokenLoading(false);
        }
    };

    // 4. MODIFICARE PAROLĂ (Submit către API-ul securizat `/auth/change-password`)
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validare egalitate parole noi introduse
        if (newPassword !== confirmPassword) {
            setError("Noua parolă nu se potrivește cu parola de confirmare");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
            });
            setSuccess('Parola a fost actualizată cu succes');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.detail || "Actualizarea parolei a eșuat");
        } finally {
            setLoading(false);
        }
    };

    // 5. ACTUALIZARE EMAIL PROFIL (Submit către `/auth/me`)
    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setProfileLoading(true);

        try {
            await api.put('/auth/me', { email });
            await refreshUser(); // Re-actualizăm starea globală a utilizatorului
            setSuccess('Profilul a fost actualizat cu succes');
        } catch (err: any) {
            setError(err.response?.data?.detail || "Actualizarea profilului a eșuat");
        } finally {
            setProfileLoading(false);
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.titleSection}>
                <h1 className={styles.title}>Setări Cont</h1>
                <p className={styles.subtitle}>Configurează profilul tău de utilizator și conexiunile sociale.</p>
            </div>

            {/* Afișarea alertelor de succes/eroare la nivel de pagină */}
            {success && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    <span>{success}</span>
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Grila setărilor: Stânga (Date Profil & Parolă) | Dreapta (Conexiuni Sociale) */}
            <div className={styles.layoutGrid}>
                
                {/* COLOANA STÂNGA - FORMULARE DE ACTUALIZARE DATE */}
                <div className={styles.formCol}>
                    
                    {/* CARDUL DATE PROFIL */}
                    <div className={styles.card}>
                        <div className={styles.bgIcon}>
                            <User size={120} />
                        </div>
                        
                        <div className={styles.cardHeaderBlock}>
                            <div className={styles.iconBoxBlue}>
                                <Mail size={20} />
                            </div>
                            <h3 className={styles.cardTitle}>Date Profil</h3>
                        </div>
                        
                        <form onSubmit={handleProfileUpdate} className={styles.form}>
                            <div className={styles.field}>
                                <label className={styles.label}>Adresă de Email</label>
                                <input 
                                    className={styles.input}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Informații suplimentare despre abonament și credite */}
                            <div className={styles.detailsGrid}>
                                <div className={styles.detailCard}>
                                    <p className={styles.detailLabel}>ID Utilizator</p>
                                    <p className={styles.detailValue}>#{user?.id.toString().padStart(4, '0')}</p>
                                </div>
                                <div className={styles.detailCard}>
                                    <p className={styles.detailLabel}>Tip Abonament</p>
                                    <p className={styles.detailValueBlue}>{user?.license?.plan_type || 'FREE'}</p>
                                </div>
                                <div className={styles.detailCard}>
                                    <p className={styles.detailLabel}>Credite Rămase</p>
                                    <p className={styles.detailValue}>{user?.license?.credits_remaining ?? 0}</p>
                                </div>
                            </div>

                            <Button type="submit" disabled={profileLoading} className={styles.submitBtnBlue}>
                                {profileLoading ? <Loader2 className="animate-spin" /> : 'Salvează Modificările'}
                            </Button>
                        </form>
                    </div>

                    {/* CARDUL DE SECURITATE (SCHIMBARE PAROLĂ) */}
                    <div className={styles.card}>
                        <div className={styles.bgIcon}>
                            <Shield size={120} />
                        </div>

                        <div className={styles.cardHeaderBlock}>
                            <div className={styles.iconBoxPurple}>
                                <Key size={20} />
                            </div>
                            <h3 className={styles.cardTitle}>Securitate Cont</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className={styles.form}>
                            <div className={styles.form}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Parola Curentă</label>
                                    <input 
                                        className={styles.inputPurple}
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroupRow}>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Noua Parolă</label>
                                        <input 
                                            className={styles.inputPurple}
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Confirmă Noua Parolă</label>
                                        <input 
                                            className={styles.inputPurple}
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className={styles.submitBtnPurple}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Salvează Noua Parolă'}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* COLOANA DREAPTA - CONEXIUNI SOCIAL MEDIA */}
                <div className={styles.sidebarCol}>
                    <div className={styles.card}>
                        <div className={styles.cardHeaderBlock}>
                            <div className={styles.iconBoxEmerald}>
                                <Share2 size={20} />
                            </div>
                            <h3 className={styles.cardTitle}>Conexiuni Rețele Sociale</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { id: 'facebook', label: 'Facebook', icon: Facebook, color: styles['fb-bg'] },
                                { id: 'instagram', label: 'Instagram', icon: Instagram, color: styles['ig-bg'] },
                                { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: styles['li-bg'] }
                            ].map((plat) => (
                                <div key={plat.id} className={styles.integrationRow}>
                                    <div className={styles.integrationInfo}>
                                        <div className={cn(styles.integrationIconWrapper, plat.color)}>
                                            <plat.icon size={18} />
                                        </div>
                                        <div className={styles.integrationLabelWrapper}>
                                            <p className={styles.integrationName}>{plat.label}</p>
                                            <p className={styles.integrationSub}>Profil Social</p>
                                        </div>
                                    </div>
                                    <button 
                                        className={cn(
                                            connections[plat.id as keyof typeof connections] 
                                                ? styles.unlinkBtn 
                                                : styles.linkBtn
                                        )}
                                        onClick={async () => {
                                            if (plat.id === 'facebook') {
                                                setConnecting('facebook');
                                                try {
                                                    // Obținem URL-ul de autentificare OAuth Facebook de la backend
                                                    const response = await api.get('/social/facebook/connect');
                                                    // Redirecționăm către interfața de Facebook Login / Dialog OAuth
                                                    window.location.href = response.data.url;
                                                } catch (err) {
                                                    console.error('Failed to get Facebook login URL:', err);
                                                    setConnecting(null);
                                                }
                                            } else {
                                                // Simulare rapidă conectare pentru Instagram și LinkedIn (mock setup)
                                                setConnecting(plat.id);
                                                setTimeout(() => {
                                                    setConnections(prev => ({ ...prev, [plat.id]: !prev[plat.id as keyof typeof connections] }));
                                                    setConnecting(null);
                                                }, 800);
                                            }
                                        }}
                                        disabled={connecting === plat.id}
                                    >
                                        {connecting === plat.id ? <Loader2 className="animate-spin" size={12} /> : 
                                         connections[plat.id as keyof typeof connections] ? 'DECONECTEAZĂ' : 'CONECTEAZĂ'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CARDUL TOKEN FACEBOOK MANUAL */}
                    <div className={styles.card}>
                        <div className={styles.bgIcon}>
                            <Facebook size={120} />
                        </div>

                        <div className={styles.cardHeaderBlock}>
                            <div className={cn(styles.integrationIconWrapper, styles['fb-bg'])} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.375rem' }}>
                                <Key size={18} />
                            </div>
                            <h3 className={styles.cardTitle}>Token Pagină Facebook</h3>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'rgb(148 163 184)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                            Introdu manual <strong style={{ color: 'rgb(96 165 250)' }}>Page Access Token</strong>-ul de la Facebook Developer pentru a conecta pagina ta direct.
                        </p>

                        <form onSubmit={handleManualToken} className={styles.form}>
                            <div className={styles.field}>
                                <label className={styles.label}>Nume Pagină Facebook</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="ex: Pagina Mea de Business"
                                    value={fbPageName}
                                    onChange={(e) => setFbPageName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Page Access Token</label>
                                <textarea
                                    className={styles.input}
                                    style={{ height: 'auto', minHeight: '5rem', paddingTop: '0.75rem', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.7rem' }}
                                    placeholder="EAAxxxxxxx..."
                                    value={fbPageToken}
                                    onChange={(e) => setFbPageToken(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Page ID (opțional)</label>
                                <input
                                    className={styles.input}
                                    type="text"
                                    placeholder="ex: 123456789012345"
                                    value={fbPageId}
                                    onChange={(e) => setFbPageId(e.target.value)}
                                />
                            </div>

                            <Button type="submit" disabled={tokenLoading} className={styles.submitBtnBlue}>
                                {tokenLoading ? <Loader2 className="animate-spin" /> : 'Conectează Pagina'}
                            </Button>
                        </form>

                        {/* Lista paginilor conectate */}
                        {connectedPages.length > 0 && (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                                <p className={styles.label} style={{ marginBottom: '0.75rem' }}>Pagini Conectate</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {connectedPages.map((page: any) => (
                                        <div key={page.id} className={styles.integrationRow}>
                                            <div className={styles.integrationInfo}>
                                                <div className={cn(styles.integrationIconWrapper, styles['fb-bg'])} style={{ width: '2rem', height: '2rem' }}>
                                                    <Facebook size={14} />
                                                </div>
                                                <div className={styles.integrationLabelWrapper}>
                                                    <p className={styles.integrationName}>{page.page_name}</p>
                                                    <p className={styles.integrationSub}>ID: {page.page_id}</p>
                                                </div>
                                            </div>
                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card upgrade licență/abonament */}
                    <div className={styles.upgradeCard}>
                        <Zap className={styles.upgradeIcon} size={24} />
                        <h4 className={styles.upgradeTitle}>Ai nevoie de mai multă putere?</h4>
                        <p className={styles.upgradeDesc}>
                            Treci la un abonament superior pentru a debloca generări nelimitate și clipuri video la calitate cinematografică.
                        </p>
                        <button className={styles.upgradeBtn}>
                            Upgrade Acum
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
