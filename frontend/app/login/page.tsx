'use client'; // Componenta utilizează hook-uri React (state-uri, router local) ce rulează în browser

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // Contextul global de autentificare (contine functia login)
import { useRouter } from 'next/navigation'; // Router Next.js pentru navigare programatică
import Link from 'next/link';
import { Zap, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios'; // Axios configurat cu baseURL
import styles from '@/styles/auth-layout.module.scss'; // Stilurile SCSS pentru paginile de autentificare

export default function LoginPage() {
    // 1. STATE-URILE PAGINII (Măsoară câmpurile din formular și erorile)
    const [email, setEmail] = useState(''); // Valoarea câmpului de Email
    const [password, setPassword] = useState(''); // Valoarea câmpului de Parolă
    const [error, setError] = useState(''); // Stochează eventualele erori primite de la backend
    const [loading, setLoading] = useState(false); // Indică dacă o cerere de login este în desfășurare

    const { login } = useAuth(); // Extragem funcția globală login din contextul Auth
    const router = useRouter();

    // 2. FUNCTIA DE SUBMIT (Trimiterea datelor către backend)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevenim reîncărcarea nativă a paginii
        setError(''); // Resetăm erorile anterioare
        setLoading(true); // Activăm starea de încărcare (afișează spinner-ul)
        
        try {
            // Trimitem datele de login prin POST către backend
            const response = await api.post('/auth/login', {
                email: email,
                password: password,
            });
            // Apelăm funcția login din context, care salvează token-ul JWT și redirecționează userul
            login(response.data.access_token);
        } catch (err: any) {
            // Extragem eroarea returnată de FastAPI sau un mesaj implicit de eșec
            setError(err.response?.data?.detail || 'Autentificare eșuată. Verificați datele introduse.');
        } finally {
            setLoading(false); // Dezactivăm starea de încărcare
        }
    };

    return (
        <div className={styles.authWrapper}>
            <div className={styles.authContainer}>
                {/* Antetul paginii cu logo-ul Cognify */}
                <div className={styles.logoHeader}>
                    <div className={styles.logoIcon}>
                        <Zap size={32} className="text-white" />
                    </div>
                    <h1 className={styles.title}>Bun venit înapoi</h1>
                    <p className={styles.subtitle}>Autentifică-te în contul tău pentru a continua</p>
                </div>

                {/* Cardul care conține formularul propriu-zis */}
                <div className={styles.card}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {/* Afișarea alertelor de eroare */}
                        {error && (
                            <div className={styles.alert}>
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Câmpul de email */}
                        <div className={styles.field}>
                            <label className={styles.label}>Email</label>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)} // Actualizează state-ul la fiecare tastare
                                    placeholder="nume@email.com"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        {/* Câmpul de parolă */}
                        <div className={styles.field}>
                            <label className={styles.label}>Parolă</label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)} // Actualizează state-ul la fiecare tastare
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        {/* Butonul de trimitere (Submit) */}
                        <button
                            type="submit"
                            disabled={loading} // Dezactivat în timpul încărcării pentru a preveni cereri multiple
                            className={styles.submitButton}
                        >
                            {/* Afișează un loader animat sau textul simplu */}
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Autentificare'}
                        </button>
                    </form>

                    {/* Navigarea către pagina de înregistrare */}
                    <div className={styles.footerText}>
                        <p>
                            Nu ai un cont?{' '}
                            <Link href="/register" className={styles.footerLink}>Înregistrează-te aici</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
