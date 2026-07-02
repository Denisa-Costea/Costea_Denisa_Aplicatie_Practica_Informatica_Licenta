'use client'; // Utilizăm logica React pe client pentru hook-uri și manipulare formular

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Router local Next.js pentru schimbare rută
import Link from 'next/link';
import { Zap, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios'; // Instanța axios pentru comunicare cu API-ul FastAPI
import styles from '@/styles/auth-layout.module.scss'; // Stilurile SCSS partajate pentru Auth

export default function RegisterPage() {
    // 1. STATE-URILE COMPONENTEI PENTRU INREGISTRARE
    const [email, setEmail] = useState(''); // Valoarea câmpului Email
    const [password, setPassword] = useState(''); // Valoarea câmpului Parolă
    const [confirmPassword, setConfirmPassword] = useState(''); // Valoarea câmpului de Confirmare Parolă
    const [error, setError] = useState(''); // Stocarea mesajelor de eroare
    const [loading, setLoading] = useState(false); // Indicator de încărcare/trimitere formular
    const router = useRouter();

    // 2. LOGICA DE SUBMIT (Trimiterea cererii de înregistrare cont)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Oprește reîncărcarea browserului
        setError(''); // Șterge mesajele de eroare vechi

        // Verificăm dacă parolele introduse se potrivesc
        if (password !== confirmPassword) {
            setError('Parolele introduse nu coincid');
            return;
        }

        setLoading(true); // Începe procesul de înregistrare
        try {
            // Trimite POST către endpoint-ul FastAPI `/auth/register`
            await api.post('/auth/register', {
                email,
                password,
            });
            // Redirecționează către login și transmite parametrul de succes în URL
            router.push('/login?registered=true');
        } catch (err: any) {
            // Preia mesajul de eroare din backend sau afișează unul implicit
            setError(err.response?.data?.detail || 'Înregistrare eșuată. Încercați cu altă adresă de email.');
        } finally {
            setLoading(false); // Oprește spinner-ul
        }
    };

    return (
        <div className={styles.authWrapper}>
            <div className={styles.authContainer}>
                {/* Antetul paginii cu logo-ul și subtitlu */}
                <div className={styles.logoHeader}>
                    <div className={styles.logoIcon}>
                        <Zap size={32} className="text-white" />
                    </div>
                    <h1 className={styles.title}>Creare Cont</h1>
                    <p className={styles.subtitle}>Alătură-te Cognify și începe să generezi conținut astăzi</p>
                </div>

                {/* Cardul formularului */}
                <div className={styles.card}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Alerta de eroare dacă există */}
                        {error && (
                            <div className={styles.alert}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Câmp Input Email */}
                        <div className={styles.field}>
                            <label className={styles.label}>Email</label>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)} // State updates dynamically
                                    placeholder="nume@email.com"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        {/* Câmp Input Parolă */}
                        <div className={styles.field}>
                            <label className={styles.label}>Parolă</label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} // State updates dynamically
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        {/* Câmp Input Confirmare Parolă */}
                        <div className={styles.field}>
                            <label className={styles.label}>Confirmă Parola</label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={18} />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)} // State updates dynamically
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        {/* Buton Submit Înregistrare */}
                        <button
                            type="submit"
                            disabled={loading} // Blocăm dubla accesare în timpul trimiterii
                            className={styles.submitButton}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Înregistrare'}
                        </button>
                    </form>

                    {/* Link către pagina de login */}
                    <div className={styles.footerText}>
                        <p>
                            Ai deja un cont?{' '}
                            <Link href="/login" className={styles.footerLink}>Autentifică-te aici</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
