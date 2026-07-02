'use client'; // Marchează componenta pentru a rula în browser, permițând utilizarea stărilor locale React

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Preluare context utilizator (pentru credite și actualizare date)
import { 
    Sparkles, Zap, Loader2, FileText, 
    Image as ImageIcon, AlertCircle, Download, 
    Share2, Copy, Rocket, Shield, Linkedin, Facebook, Instagram, Video
} from 'lucide-react'; // Iconițe Lucide React pentru design modern
import { cn } from '@/lib/utils';
import api from '@/lib/axios'; // Comunicare securizată cu FastAPI
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui";
import styles from './generate.module.scss'; // Fișierul SCSS modular pentru stilizarea paginii de generare

export default function GeneratePage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth(); // Preluăm userul și funcția de împrospătare din context

    // 1. STATE-URILE COMPONENTEI PENTRU CONFIGURATORUL GENERĂRII AI
    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'magic' | 'video'>('magic'); // Tab-ul selectat (implicit Magic: Text + Imagine)
    const [prompt, setPrompt] = useState(''); // Textul descriptiv introdus de utilizator
    const [loading, setLoading] = useState(false); // Indică dacă o solicitare AI este în procesare
    const [result, setResult] = useState<any>(null); // Stochează rezultatul primit de la server (text, imagini, video)
    const [error, setError] = useState(''); // Mesajul de eroare dacă ceva nu funcționează sau creditele sunt insuficiente
    
    // Parametri suplimentari de generare
    const [targetNetwork, setTargetNetwork] = useState('LinkedIn'); // Platforma socială (LinkedIn, Facebook, Instagram)
    const [visualTheme, setVisualTheme] = useState('High Fidelity'); // Stilul imaginii (Fidelitate Înaltă, Minimalist, Corporate etc.)
    const [tone, setTone] = useState('Professional'); // Tonul postării text (Profesional, Casual, Persuasiv, Creativ)
    const [imageSize, setImageSize] = useState('1024x1024'); // Formatul imaginii
    const [videoSize, setVideoSize] = useState('1280x720'); // Rezoluția videoclipului
    const [duration, setDuration] = useState(8); // Durata videoclipului (implicit 8 secunde)
    const [contentType, setContentType] = useState('Post'); // Tipul textului (Postare, Articol, Ad, Email)
    const [aiModel, setAiModel] = useState('dall-e-3'); // Modelul generator de imagini (DALL-E 3 sau DALL-E 2)
    const [actionFeedback, setActionFeedback] = useState<string | null>(null); // Feedback rapid pentru utilizator (ex: "Copiat în clipboard")

    // 2. LOGICA DE ACȚIUNE RAPIDĂ PENTRU PREVIZUALIZARE (Copiere, Partajare, Descărcare)
    const handleAction = async (action: string) => {
        if (!result) return;

        if (action === 'Copy') {
            const textToCopy = result.generated_text || result.prompt;
            await navigator.clipboard.writeText(textToCopy);
            showFeedback('Copiat în clipboard!');
        } else if (action === 'Share') {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Conținut Cognify AI',
                        text: result.generated_text || result.prompt,
                        url: result.generated_image_url || result.video_url || window.location.href,
                    });
                } catch (err) {
                    console.error('Partajare eșuată:', err);
                }
            } else {
                await navigator.clipboard.writeText(window.location.href);
                showFeedback('Link copiat în clipboard!');
            }
        } else if (action === 'Download') {
            const url = result.generated_image_url || result.video_url;
            if (url) {
                // Descărcăm resursa media în mod dinamic
                const link = document.createElement('a');
                link.href = url;
                link.download = `cognify-${Date.now()}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (result.generated_text) {
                // Descărcăm textul sub formă de fișier .txt
                const blob = new Blob([result.generated_text], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `cognify-text-${Date.now()}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
            showFeedback('Descărcarea a început!');
        }
    };

    // Funcție utilitară pentru afișarea unui mesaj de succes temporar (tooltip/toast)
    const showFeedback = (msg: string) => {
        setActionFeedback(msg);
        setTimeout(() => setActionFeedback(null), 3000);
    };

    // 3. LOGICA PRINCIPALĂ DE GENERARE AI (Apeluri API specifice fiecărui Tab)
    const handleGenerate = async () => {
        if (!prompt) return;

        // Avertizare cost crescut credite pentru generarea video
        if (activeTab === 'video') {
            const confirmed = window.confirm("Generarea video consumă semnificativ mai multe credite (50 credite). Continuați?");
            if (!confirmed) return;
        }
        
        setLoading(true);
        setError('');
        setResult(null);

        try {
            let endpoint = '';
            let payload: any = { prompt };

            // Setăm endpoint-ul și structura datelor în funcție de tipul de generare selectat
            if (activeTab === 'text') {
                endpoint = '/ai/generate-text';
                payload = {
                    prompt,
                    content_type: contentType,
                    platform: targetNetwork,
                    tone: tone
                };
            } else if (activeTab === 'image') {
                endpoint = '/ai/generate-image';
                payload = {
                    prompt,
                    style: visualTheme,
                    size: imageSize,
                    platform: targetNetwork,
                    model: aiModel
                };
            } else if (activeTab === 'magic') {
                // Generare completă (Text și Imagine) într-o singură tranzacție
                endpoint = '/ai/generate-full-post';
                payload = {
                    prompt,
                    content_type: contentType,
                    platform: targetNetwork,
                    tone: tone,
                    style: visualTheme,
                    size: '1024x1024',
                    model: aiModel
                };
            } else if (activeTab === 'video') {
                endpoint = '/ai/video-generate';
                payload = {
                    prompt,
                    size: videoSize,
                    seconds: duration,
                    platform: targetNetwork
                };
            }

            // Realizăm apelul POST către API-ul FastAPI
            const response = await api.post(endpoint, payload);
            setResult(response.data); // Salvăm rezultatul
            await refreshUser(); // Actualizăm datele de licență (soldul creditelor scăzute)
        } catch (err: any) {
            let errorMessage = 'Generare eșuată. Verificați creditele rămase.';
            const detail = err.response?.data?.detail;
            if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (Array.isArray(detail) && detail.length > 0) {
                errorMessage = detail[0].msg || 'Eroare de validare';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Taburile disponibile
    const tabs = [
        { id: 'text', icon: FileText, label: 'Text' },
        { id: 'image', icon: ImageIcon, label: 'Imagine' },
        { id: 'magic', icon: Sparkles, label: 'Magic (Complet)' },
        { id: 'video', icon: Video, label: 'Video' },
    ];

    return (
        <div className={styles.pageWrapper}>
            {/* Secțiunea Superioară (Header + Indicator Credite Disponibile în timp real) */}
            <div className={styles.pageHeader}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Studioul de Creație</h1>
                    <p className={styles.subtitle}>Transformă-ți ideile în conținut de marketing de înaltă performanță.</p>
                </div>
                {/* Widget de Credite active în cont */}
                <div className={styles.creditsWidget}>
                    <div className={styles.creditsIcon}>
                        <Zap size={18} fill="currentColor" />
                    </div>
                    <div className={styles.creditsTextWrapper}>
                        <p className={styles.creditsCount}>{user?.license?.credits_remaining ?? 0}</p>
                        <p className={styles.creditsLabel}>Credite Disponibile</p>
                    </div>
                </div>
            </div>

            {/* Grila Layout: Stânga (Configurator Generare) | Dreapta (Previzualizare Rezultat) */}
            <div className={styles.layoutGrid}>
                
                {/* PANOU STÂNGA - FORMULAR CONFIGURARE */}
                <div className={styles.formCol}>
                    <div className={styles.formCard}>
                        
                        {/* Selector Tab-uri (Text, Imagine, Magic, Video) */}
                        <div className={styles.tabSwitcher}>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id as any);
                                        setError('');
                                    }}
                                    className={cn(
                                        styles.tabBtn,
                                        activeTab === tab.id && styles.tabBtnActive
                                    )}
                                >
                                    <tab.icon size={14} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Rândul cu selectoare dinamice (se schimbă în funcție de Tab-ul activ) */}
                        <div className={styles.selectorsRow}>
                            {/* OPȚIUNI PENTRU GENERATORUL DE TEXT */}
                            {activeTab === 'text' && (
                                <>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Rețea Socială</label>
                                        <Select value={targetNetwork} onValueChange={setTargetNetwork}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="LinkedIn" className="focus:bg-blue-600 focus:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Linkedin size={14} className="text-blue-400" />
                                                        <span>LinkedIn</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="Instagram" className="focus:bg-pink-600 focus:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Instagram size={14} className="text-pink-400" />
                                                        <span>Instagram</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="Facebook" className="focus:bg-blue-600 focus:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <Facebook size={14} className="text-blue-500" />
                                                        <span>Facebook</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Tip Conținut</label>
                                        <Select value={contentType} onValueChange={setContentType}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="Post">Postare Socială</SelectItem>
                                                <SelectItem value="Article">Articol Detaliat</SelectItem>
                                                <SelectItem value="Ad">Reclamă Copyscript</SelectItem>
                                                <SelectItem value="Email">Newsletter Email</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Ton Text</label>
                                        <Select value={tone} onValueChange={setTone}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="Professional">Profesional</SelectItem>
                                                <SelectItem value="Casual">Casual / Prietenos</SelectItem>
                                                <SelectItem value="Persuasive">Persuasiv / Vanzari</SelectItem>
                                                <SelectItem value="Creative">Creativ / Metaforic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {/* OPȚIUNI PENTRU GENERATORUL DE IMAGINI */}
                            {activeTab === 'image' && (
                                <>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Rețea Socială</label>
                                        <Select value={targetNetwork} onValueChange={setTargetNetwork}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="LinkedIn"><div className="flex items-center gap-2"><Linkedin size={14} className="text-blue-400"/><span>LinkedIn</span></div></SelectItem>
                                                <SelectItem value="Instagram"><div className="flex items-center gap-2"><Instagram size={14} className="text-pink-400"/><span>Instagram</span></div></SelectItem>
                                                <SelectItem value="Facebook"><div className="flex items-center gap-2"><Facebook size={14} className="text-blue-500"/><span>Facebook</span></div></SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Stil Vizual (Temă)</label>
                                        <Select value={visualTheme} onValueChange={setVisualTheme}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="High Fidelity">HQ Photorealistic</SelectItem>
                                                <SelectItem value="Minimalist">Minimalist / Curat</SelectItem>
                                                <SelectItem value="Corporate">Corporate / Vector</SelectItem>
                                                <SelectItem value="Creative">Artistic / Ilustrație</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Rezoluție / Format</label>
                                        <Select value={imageSize} onValueChange={setImageSize}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="1024x1024">Pătrat (1:1)</SelectItem>
                                                <SelectItem value="1024x1792">Portret (9:16 - Story/Reels)</SelectItem>
                                                <SelectItem value="1792x1024">Peisaj (16:9 - Banner)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Model AI</label>
                                        <Select value={aiModel} onValueChange={setAiModel}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="dall-e-3">DALL-E 3 (Ultra Calitate)</SelectItem>
                                                <SelectItem value="dall-e-2">DALL-E 2 (Rapid)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {/* OPȚIUNI PENTRU GENERAREA MAGICĂ (TEXT + IMAGINE) */}
                            {activeTab === 'magic' && (
                                <>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Rețea Socială</label>
                                        <Select value={targetNetwork} onValueChange={setTargetNetwork}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="LinkedIn"><div className="flex items-center gap-2"><Linkedin size={14} className="text-blue-400"/><span>LinkedIn</span></div></SelectItem>
                                                <SelectItem value="Instagram"><div className="flex items-center gap-2"><Instagram size={14} className="text-pink-400"/><span>Instagram</span></div></SelectItem>
                                                <SelectItem value="Facebook"><div className="flex items-center gap-2"><Facebook size={14} className="text-blue-500"/><span>Facebook</span></div></SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Stil Vizual Imagine</label>
                                        <Select value={visualTheme} onValueChange={setVisualTheme}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="High Fidelity">Fotorealist (DALL-E 3)</SelectItem>
                                                <SelectItem value="Minimalist">Minimalist modern</SelectItem>
                                                <SelectItem value="Corporate">Corporate vector</SelectItem>
                                                <SelectItem value="Creative">Concept Artistic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Ton Text</label>
                                        <Select value={tone} onValueChange={setTone}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="Professional">Profesional</SelectItem>
                                                <SelectItem value="Casual">Casual</SelectItem>
                                                <SelectItem value="Creative">Creativ</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {/* OPȚIUNI PENTRU GENERAREA VIDEO */}
                            {activeTab === 'video' && (
                                <>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Rețea Socială</label>
                                        <Select value={targetNetwork} onValueChange={setTargetNetwork}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="LinkedIn"><div className="flex items-center gap-2"><Linkedin size={14} className="text-blue-400"/><span>LinkedIn</span></div></SelectItem>
                                                <SelectItem value="Instagram"><div className="flex items-center gap-2"><Instagram size={14} className="text-pink-400"/><span>Instagram</span></div></SelectItem>
                                                <SelectItem value="Facebook"><div className="flex items-center gap-2"><Facebook size={14} className="text-blue-500"/><span>Facebook</span></div></SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Format Video</label>
                                        <Select value={videoSize} onValueChange={setVideoSize}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="1280x720">Peisaj (16:9 - Landscape)</SelectItem>
                                                <SelectItem value="720x1280">Portret (9:16 - Reels/TikTok)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className={styles.selectorWrapper}>
                                        <label className={styles.selectorLabel}>Durată Video</label>
                                        <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                                            <SelectTrigger className="w-full h-11 bg-black/30 border-white/10 rounded-xl text-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0f172a] border-white/10 text-slate-200">
                                                <SelectItem value="4">4 secunde</SelectItem>
                                                <SelectItem value="8">8 secunde</SelectItem>
                                                <SelectItem value="12">12 secunde</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Câmp de text pentru introducerea conceptului (Prompt) */}
                        <div className={styles.promptWrapper}>
                            <label className={styles.selectorLabel}>Descrie conceptul tău (Prompt)</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: O reclamă pentru o cafenea modernă, evidențiind cafeaua de specialitate..."
                                className={styles.textarea}
                            />
                        </div>
                        
                        {/* Șabloane predefinite (Presets) pentru completare rapidă */}
                        <div className={styles.presetsContainer}>
                            {[
                                { label: 'LI Profesional', text: 'Noutăți profesionale despre eficiența AI în marketing', platform: 'LinkedIn', tone: 'Professional' },
                                { label: 'IG Creativ', text: 'Text creativ despre stilul de viață al unui pasionat de tehnologie', platform: 'Instagram', tone: 'Creative' },
                                { label: 'FB Text Reclamă', text: 'Text publicitar atractiv pentru o reducere limitată a abonamentului SaaS', platform: 'Facebook', tone: 'Persuasive' },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        setPrompt(preset.text);
                                        setTargetNetwork(preset.platform);
                                        setTone(preset.tone);
                                        if (activeTab !== 'magic' && activeTab !== 'text') setActiveTab('text');
                                    }}
                                    className={styles.presetBtn}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Afișare erori primite */}
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-xs font-medium mb-6">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* BUTONUL PRINCIPAL DE GENERARE */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt}
                            className={cn(
                                styles.generateBtn,
                                activeTab === 'text' ? styles['btn-text'] : activeTab === 'image' ? styles['btn-image'] : activeTab === 'video' ? styles['btn-video'] : styles['btn-magic']
                            )}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>{activeTab === 'magic' ? 'Creează Postare Completă' : 'Creează Conținut'}</span>
                                    {/* Indicator de cost credite corespunzător tipului de generare */}
                                    <span className={styles.creditCostBadge}>
                                        {activeTab === 'text' ? '1' : activeTab === 'image' ? '5' : activeTab === 'video' ? '50' : '6'} Credite
                                    </span>
                                    <div className={styles.hoverLayer}></div>
                                </>
                            )}
                        </button>
                    </div>

                    <div className={styles.securityBadge}>
                        <Shield className="text-blue-400" size={16} />
                        <p className={styles.securityText}>Securitate Cognify. Procesare securizată pe servere dedicate.</p>
                    </div>
                </div>

                {/* PANOU DREAPTA - PREVIZUALIZARE REZULTATE GENERATE */}
                <div className={styles.previewCol}>
                    <div className={styles.previewCard}>
                        
                        {/* Bara de instrumente a previzualizării (Descărcare, Partajare, Copiere, Publicare) */}
                        <div className={styles.previewToolbar}>
                            <div className={styles.statusIndicator}>
                                <div className={styles.pulseDot}></div>
                                <span className={styles.statusText}>
                                    {actionFeedback || (result ? 'Generat cu succes' : 'Zonă Previzualizare')}
                                </span>
                            </div>
                            
                            {/* Butoane rapide de acțiune pe conținutul generat (activate doar dacă există rezultat) */}
                            <div className={styles.toolbarActions}>
                                {[
                                    { label: 'Descărcare', icon: Download, active: !!result },
                                    { label: 'Partajare', icon: Share2, active: !!result },
                                    { label: 'Copiere', icon: Copy, active: !!result },
                                    { label: 'Publică', icon: Rocket, active: !!result, highlight: true },
                                ].map((action) => (
                                    <button
                                        key={action.label}
                                        disabled={!action.active}
                                        onClick={() => {
                                            if (action.label === 'Publică' && result) {
                                                const type = activeTab === 'video' ? 'video' : result.generation_type;
                                                // Trimite userul direct la publicarea în feed (unde Facebook/Instagram API sunt active)
                                                router.push(`/dashboard/publish?id=${result.id}&type=${type}`);
                                            } else {
                                                const engLabel = action.label === 'Descărcare' ? 'Download' : action.label === 'Partajare' ? 'Share' : 'Copy';
                                                handleAction(engLabel);
                                            }
                                        }}
                                        className={action.highlight ? styles.highlightActionBtn : styles.actionBtn}
                                    >
                                        <action.icon size={13} />
                                        <span className="hidden sm:inline">{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Zona de afișare conținut propriu-zisă */}
                        <div className={styles.previewContent}>
                            {/* Overlay de Încărcare (Se afișează când AI procesează promptul) */}
                            {loading && (
                                <div className={styles.loadingOverlay}>
                                    <div className={styles.loaderSpinnerWrapper}>
                                        <div className={styles.loaderPulseBg}></div>
                                        <Loader2 className={styles.loaderSpinner} strokeWidth={1} />
                                    </div>
                                    <h3 className={styles.loadingTitle}>Procesare Algoritmică</h3>
                                    <p className={styles.loadingDesc}>AI modelează ideile tale pentru cel mai bun impact publicitar...</p>
                                </div>
                            )}

                            {/* Starea Goală (Default: când nu avem conținut generat încă) */}
                            {!result && !loading && (
                                <div className={styles.emptyPreviewState}>
                                    <div className={styles.dashedBox}>
                                        <ImageIcon size={32} className="text-slate-600" />
                                    </div>
                                    <div>
                                        <h3 className={styles.emptyTitle}>Studio inactiv</h3>
                                        <p className={styles.emptyDesc}>Adăugați detalii în panoul din stânga pentru a începe simularea și generarea.</p>
                                    </div>
                                </div>
                            )}

                            {/* Afișare Rezultat Generat (Imagine, Video sau Text) */}
                            {result && (
                                <div className={styles.resultWrapper}>
                                    {/* 1. AFISARE IMAGINE GENERATA */}
                                    {(activeTab === 'image' || activeTab === 'magic') && result.generated_image_url && (
                                        <div className={styles.resultImageWrapper}>
                                            <img 
                                                src={result.generated_image_url} 
                                                alt="AI Generated Banner" 
                                                className={styles.resultImage}
                                            />
                                            <div className={styles.imageOverlay}>
                                                <p className={styles.imageOverlayText}>Creat de DALL-E</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* 2. AFISARE VIDEO GENERAT (SORA) */}
                                    {activeTab === 'video' && result.video_url && (
                                        <div className={styles.resultVideoWrapper}>
                                            <video src={result.video_url} controls className={styles.videoElement} />
                                        </div>
                                    )}
                                    
                                    {/* 3. GENERARE ÎN DESFĂȘURARE ASINCRONĂ PENTRU VIDEO */}
                                    {activeTab === 'video' && !result.video_url && result.status && (
                                        <div className={styles.videoProgressCard}>
                                            <div className={styles.progressCardIcon}>
                                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                            </div>
                                            <div className={styles.progressCardHeader}>
                                                <h4 className={styles.progressCardTitle}>Generare Video în Coadă</h4>
                                                <p className={styles.progressCardDesc}>Videoclipul este în curs de randare pe serverele noastre GPU. Puteți verifica istoricul peste câteva momente pentru a-l descărca.</p>
                                            </div>
                                            <Link href="/dashboard/history">
                                                <button className={styles.vaultBtn}>
                                                    Vezi în Istoric
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                    
                                    {/* 4. AFISARE TEXT GENERAT */}
                                    {(activeTab === 'text' || activeTab === 'magic') && result.generated_text && (
                                        <div className={styles.textResultCard}>
                                            <div className={styles.cardContainer}>
                                                <div className={styles.cardHeader}>
                                                    <div className={styles.headerTitleWrapper}>
                                                        <FileText size={14} className={styles.headerIcon} />
                                                        <span className={styles.headerLabel}>Text Copyscript AI</span>
                                                    </div>
                                                    <div className={styles.dotsWrapper}>
                                                        <div className={styles.dot}></div>
                                                        <div className={styles.dot}></div>
                                                        <div className={styles.dot}></div>
                                                    </div>
                                                </div>
                                                <div className={styles.cardBody}>
                                                    <div className="prose prose-invert max-w-none">
                                                        <p className={styles.proseText}>
                                                            {result.generated_text}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={styles.cardFooter}>
                                                    <span className={styles.wordCount}>
                                                        {result.generated_text.split(/\s+/).length} Cuvinte • Analiză Finalizată
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(result.generated_text);
                                                            showFeedback('Copiat în clipboard!');
                                                        }}
                                                        className={styles.copyLink}
                                                    >
                                                        <Copy size={12} /> Copiază
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
