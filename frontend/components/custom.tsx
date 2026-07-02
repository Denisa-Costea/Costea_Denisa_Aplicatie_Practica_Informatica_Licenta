'use client'; // Specifică faptul că aceste componente utilizează logica React pe partea de client

import React from 'react';
import { 
    Facebook, Instagram, Linkedin, MessageCircle, Heart, Share2, 
    MoreHorizontal, Globe, Send, CheckCircle2, AlertCircle 
} from 'lucide-react'; // Pictograme din biblioteca Lucide React
import { cn } from '@/lib/utils'; // Utilitar pentru manipularea claselor CSS

// Importăm direct componentele UI din fișierul nostru consolidat
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Progress } from '@/components/ui';

// =========================================================================
// 1. PREVIZUALIZARE REȚELE SOCIALE (SocialPreview)
// =========================================================================

interface SocialPreviewProps {
    platform: 'facebook' | 'instagram' | 'linkedin'; // Rețeaua selectată
    text: string; // Textul generat de AI pentru postare
    image?: string; // Imaginea atașată (opțional)
    video?: string; // Videoclipul atașat (opțional)
    userName?: string; // Numele profilului afișat (implicit 'Cognify AI')
}

export function SocialPreview({ platform, text, image, video, userName = 'Cognify AI' }: SocialPreviewProps) {
    
    // PREVIZUALIZARE FACEBOOK
    if (platform === 'facebook') {
        return (
            <div className="bg-[#18191a] text-[#e4e6eb] rounded-xl shadow-2xl border border-white/5 overflow-hidden w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
                {/* Antet Facebook */}
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                            C
                        </div>
                        <div>
                            <p className="text-sm font-bold hover:underline cursor-pointer">{userName}</p>
                            <div className="flex items-center gap-1 text-[11px] text-[#b0b3b8] font-medium">
                                <span>Acum</span>
                                <span>•</span>
                                <Globe size={10} />
                            </div>
                        </div>
                    </div>
                    <button className="text-[#b0b3b8] hover:bg-white/5 p-2 rounded-full transition-colors">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                {/* Corp postare (Text cu paragrafe conservate) */}
                <div className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {text}
                </div>

                {/* Zona Media */}
                {video ? (
                    <div className="bg-black aspect-video flex items-center justify-center">
                        <video src={video} controls className="w-full h-full" />
                    </div>
                ) : image ? (
                    <div className="bg-black min-h-[300px] flex items-center justify-center border-y border-white/5">
                        <img src={image} alt="Post content" className="w-full h-auto" />
                    </div>
                ) : null}

                {/* Statistici Facebook */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 mx-4">
                    <div className="flex items-center gap-1">
                        <div className="flex -space-x-1">
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] border border-[#18191a]">
                                <Heart size={8} fill="white" />
                            </div>
                        </div>
                        <span className="text-xs text-[#b0b3b8]">0</span>
                    </div>
                    <div className="text-xs text-[#b0b3b8] flex gap-2">
                        <span>0 comentarii</span>
                        <span>0 distribuiri</span>
                    </div>
                </div>

                {/* Acțiuni Facebook */}
                <div className="px-2 py-1 flex items-center justify-around font-semibold text-[#b0b3b8] text-sm">
                    <button className="flex-1 py-2 flex items-center justify-center gap-2 hover:bg-white/5 rounded-md transition-colors">
                        <Heart size={18} />
                        <span>Îmi place</span>
                    </button>
                    <button className="flex-1 py-2 flex items-center justify-center gap-2 hover:bg-white/5 rounded-md transition-colors">
                        <MessageCircle size={18} />
                        <span>Comentează</span>
                    </button>
                    <button className="flex-1 py-2 flex items-center justify-center gap-2 hover:bg-white/5 rounded-md transition-colors">
                        <Share2 size={18} />
                        <span>Distribuie</span>
                    </button>
                </div>
            </div>
        );
    }

    // PREVIZUALIZARE INSTAGRAM
    if (platform === 'instagram') {
        return (
            <div className="bg-black text-white rounded-xl shadow-2xl border border-white/5 overflow-hidden w-full max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
                {/* Antet Instagram */}
                <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold">
                                C
                            </div>
                        </div>
                        <span className="text-xs font-bold">{userName.toLowerCase().replace(' ', '_')}</span>
                    </div>
                    <MoreHorizontal size={18} />
                </div>

                {/* Media Instagram */}
                <div className="aspect-square bg-zinc-900 flex items-center justify-center relative">
                    {video ? (
                        <video src={video} controls className="w-full h-full object-cover" />
                    ) : image ? (
                        <img src={image} alt="Post content" className="w-full h-full object-cover" />
                    ) : (
                        <div className="p-10 text-center text-zinc-500 text-xs font-medium">
                            {text}
                        </div>
                    )}
                </div>

                {/* Acțiuni și Descriere */}
                <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Heart size={24} className="hover:text-zinc-400 cursor-pointer" />
                            <MessageCircle size={24} className="hover:text-zinc-400 cursor-pointer" />
                            <Share2 size={24} className="hover:text-zinc-400 cursor-pointer" />
                        </div>
                    </div>
                    <div className="text-xs font-bold">0 aprecieri</div>
                    
                    <div className="text-xs leading-relaxed">
                        <span className="font-bold mr-2">{userName.toLowerCase().replace(' ', '_')}</span>
                        {text}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-tight">Acum</div>
                </div>
            </div>
        );
    }

    // PREVIZUALIZARE LINKEDIN
    return (
        <div className="bg-[#1b1f23] text-white rounded-xl shadow-2xl border border-white/5 overflow-hidden w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-500">
            {/* Antet LinkedIn */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-blue-600 flex items-center justify-center font-bold text-xl">
                        C
                    </div>
                    <div>
                        <p className="text-sm font-bold">{userName}</p>
                        <p className="text-[11px] text-slate-400">Automatizare Marketing AI • Acum</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Globe size={10} />
                            <span>Public</span>
                        </div>
                    </div>
                </div>
                <MoreHorizontal size={20} className="text-slate-400" />
            </div>

            {/* Text LinkedIn */}
            <div className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap">
                {text}
            </div>

            {/* Media LinkedIn */}
            {video ? (
                <div className="bg-black aspect-video flex items-center justify-center">
                    <video src={video} controls className="w-full h-full" />
                </div>
            ) : image ? (
                <div className="bg-zinc-900 border-y border-white/5">
                    <img src={image} alt="Post content" className="w-full h-auto" />
                </div>
            ) : null}

            {/* Acțiuni LinkedIn */}
            <div className="px-2 py-1 flex items-center border-t border-white/5 mt-2">
                <button className="flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-white/5 rounded-md transition-colors text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <Heart size={18} />
                    <span>Apreciază</span>
                </button>
                <button className="flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-white/5 rounded-md transition-colors text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <MessageCircle size={18} />
                    <span>Comentează</span>
                </button>
                <button className="flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-white/5 rounded-md transition-colors text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <Share2 size={18} />
                    <span>Repostează</span>
                </button>
                <button className="flex-1 py-3 flex flex-col items-center justify-center gap-1 hover:bg-white/5 rounded-md transition-colors text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <Send size={18} />
                    <span>Trimite</span>
                </button>
            </div>
        </div>
    );
}


// =========================================================================
// 2. ANALIZĂ CONȚINUT AI (ContentAnalysis)
// =========================================================================

interface Score {
    readability_score: number; // Scor lizibilitate text (0-100)
    seo_score: number; // Scor optimizare SEO (0-100)
    sentiment_label: string; // Etichetă sentiment (Pozitiv, Neutru, Negativ)
    critique: string; // Evaluarea AI propriu-zisă
    suggestions: string[]; // Listă de sugestii pentru îmbunătățire
}

interface ContentAnalysisProps {
    score: Score;
}

export function ContentAnalysis({ score }: ContentAnalysisProps) {
    const getScoreColor = (value: number) => {
        if (value >= 80) return "bg-green-500";
        if (value >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getSentimentLabel = (label: string) => {
        switch (label.toLowerCase()) {
            case 'positive': return 'Pozitiv';
            case 'negative': return 'Negativ';
            case 'neutral': return 'Neutru';
            default: return label;
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
            {/* Lizibilitate */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Lizibilitate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold mb-2">{score.readability_score}/100</div>
                    <Progress value={score.readability_score} className={getScoreColor(score.readability_score)} />
                    <p className="text-xs text-muted-foreground mt-2">
                        Măsoară cât de ușor de citit este textul.
                    </p>
                </CardContent>
            </Card>

            {/* Scor SEO */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Scor SEO</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold mb-2">{score.seo_score}/100</div>
                    <Progress value={score.seo_score} className={getScoreColor(score.seo_score)} />
                    <p className="text-xs text-muted-foreground mt-2">
                        Optimizarea pentru motoarele de căutare și cuvinte cheie.
                    </p>
                </CardContent>
            </Card>

            {/* Sentiment */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{getSentimentLabel(score.sentiment_label)}</span>
                        {score.sentiment_label.toLowerCase() === 'positive' && <Badge variant="secondary" className="bg-green-100 text-green-800">Bun</Badge>}
                        {score.sentiment_label.toLowerCase() === 'negative' && <Badge variant="destructive">Atenție</Badge>}
                    </div>
                </CardContent>
            </Card>

            {/* Sugestii de îmbunătățire */}
            <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Critică & Sugestii AI</CardTitle>
                    <CardDescription>{score.critique}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {score.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                                <span>{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
