'use client'; // Componentă ce rulează pe client (gestionează starea sesiunii în browser)

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios'; // Instanța de axios configurată cu URL-ul serverului FastAPI
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
    license?: {
        plan_type: string;
        credits_remaining: number;
        expires_at: string | null;
    };
}

interface AuthContextType {
    user: User | null; // Profilul utilizatorului curent logat (sau null dacă nu este logat)
    loading: boolean; // Indică dacă sistemul verifică starea sesiunii active (loading state)
    login: (token: string) => void; // Funcție care marchează utilizatorul ca logat folosind token-ul JWT primite de la backend
    logout: () => void; // Funcție de deconectare
    refreshUser: () => Promise<void>; // Actualizează profilul utilizatorului (de ex: după ce consumă credite)
}

// Crearea contextului global de Autentificare
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Setează token-ul de autorizare într-un Cookie de sesiune securizat
function setAuthCookie(token: string) {
    document.cookie = `cognify_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

// Șterge cookie-ul de sesiune la deconectare
function removeAuthCookie() {
    document.cookie = 'cognify_auth=; path=/; max-age=0';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // 1. OBTINERE DATE PROFIL USER DE LA BACKEND (Apelează `/auth/me`)
    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data); // Pune profilul utilizatorului în starea globală
        } catch (error) {
            console.error('Failed to fetch user:', error);
            // Dacă token-ul a expirat sau este invalid, curățăm datele locale
            setUser(null);
            localStorage.removeItem('token');
            removeAuthCookie();
        }
    };

    // 2. VERIFICARE SESIUNE ACTIVĂ LA PORNIREA APLICAȚIEI (Montare componentă)
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                // Dacă token-ul există în localStorage, îi cerem serverului datele despre user
                await fetchUser();
            }
            setLoading(false); // Oprim ecranul inițial de încărcare
        };
        checkAuth();
    }, []);

    // 3. LOGICA DE LOGIN (Salvare token în localStorage & cookie + actualizare user)
    const login = async (token: string) => {
        localStorage.setItem('token', token);
        setAuthCookie(token);
        await fetchUser(); // Obține datele userului după login reușit
        router.push('/dashboard'); // Redirecționează în Dashboard
    };

    // 4. LOGICA DE LOGOUT (Curățare stări și cookie-uri + redirecționare la login)
    const logout = () => {
        localStorage.removeItem('token');
        removeAuthCookie();
        setUser(null);
        router.push('/login');
    };

    // 5. METODĂ DE ACTUALIZARE UTILIZATOR (Utilizată după generarea de conținut)
    const refreshUser = async () => {
        await fetchUser();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook custom pentru a folosi cu ușurință datele de autentificare în orice componentă
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
