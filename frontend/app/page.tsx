// Pagina Principală (Landing Page) a platformei Cognify.
// Aceasta este o pagină statică de prezentare a serviciului.

import Link from "next/link";
import { Button } from "@/components/ui";
import { ArrowRight, Sparkles, Zap, Shield, Cpu, Globe, Rocket, Terminal } from "lucide-react"; // Importăm iconițe din biblioteca Lucide
import { cn } from "@/lib/utils"; // Utilitar de concatenare clase CSS
import styles from "./page.module.scss"; // Stiluri specifice landing-page

export default function LandingPage() {
  return (
    <div className={styles.landingWrapper}>
      {/* 1. Efecte de fundal ambientale (Orbs cu lumini difuze) */}
      <div className={styles.backgroundEffects}>
        <div className={styles.orbTopLeft}></div>
        <div className={styles.orbBottomRight}></div>
        <div className={styles.orbMiddle}></div>
      </div>

      {/* 2. Antetul paginii (Header) */}
      <header className={styles.header}>
        {/* Logo / Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className={styles.brandName}>Cognify</span>
        </div>
        
        {/* Navigație simplă */}
        <nav className={styles.nav}>
          <a href="#features" className={styles.navLink}>Funcționalități</a>
          <a href="#solutions" className={styles.navLink}>Soluții</a>
          <a href="#pricing" className={styles.navLink}>Prețuri</a>
        </nav>
        
        {/* Butoane de acțiune în Header (Autentificare și Înregistrare) */}
        <div className={styles.headerActions}>
          <Link href="/login">
            {/* Butonul de autentificare */}
            <Button variant="ghost" className="uppercase tracking-widest text-[10px] font-bold">
              Autentificare
            </Button>
          </Link>
          <Link href="/register">
            {/* Butonul de înregistrare */}
            <Button className="rounded-xl px-6 uppercase tracking-widest text-[10px] font-bold">
              Începe Acum
            </Button>
          </Link>
        </div>
      </header>

      {/* 3. Conținutul Principal */}
      <main className={styles.main}>
        {/* Secțiunea Erou (Hero Section) */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            {/* Badge de sistem status */}
            <div className={styles.badge}>
              <Terminal className="w-3 h-3" />
              NUCLEU SISTEM v2.0 ACTIV
            </div>
            
            {/* Titlul principal cu gradient textil */}
            <h1 className={styles.title}>
              Avantajul <span className={styles.indigoGradient}>Neuronal</span> în Marketing.
            </h1>
            
            {/* Subtitlu explicativ */}
            <p className={styles.subtitle}>
              Generează, optimizează și distribuie campanii de marketing de înaltă performanță folosind modele AI specializate pentru precizie și impact.
            </p>
            
            {/* Butoanele de Call to Action (CTA) din Hero */}
            <div className={styles.actions}>
              <Link href="/register">
                {/* Butonul principal care trimite la crearea unui cont */}
                <Button size="xl" className="shadow-2xl gap-3">
                  Inițializează Nod Gratuit <ArrowRight size={20} />
                </Button>
              </Link>
              <Link href="/login?demo=true">
                {/* Buton secundar pentru pornirea demo-ului direct */}
                <Button size="xl" variant="outline">
                  Lansează Simularea
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Partea Vizuală a Eroului (Orb AI 3D/animat în centrul atenției) */}
          <div className={styles.visualWrapper}>
            <div className={styles.visualContent}>
                <div className="ai-orb scale-[2.5]"></div>
                <div className={styles.visualOverlayLabels}>
                    <p className={styles.visualLabelPrimary}>Procesare Neuronală</p>
                    <p className={styles.visualLabelSecondary}>CONFIG_SYS: ACTIVAT</p>
                </div>
            </div>
          </div>
        </section>

        {/* 4. Grila de funcționalități principale (Feature Grid) */}
        <section className={styles.featuresSection} id="features">
          {[
            { 
              title: "Sinteză Rapidă", 
              desc: "Distribuie texte persuasive și elemente vizuale cu rată mare de conversie în întreaga ta rețea în doar câteva milisecunde.",
              icon: Zap,
              bgStyle: styles["bg-blue"]
            },
            { 
              title: "Evaluare Neuronală", 
              desc: "Feedback algoritmic avansat privind claritatea, persuasiunea și integritatea structurală a fiecărui material.",
              icon: Cpu,
              bgStyle: styles["bg-purple"]
            },
            { 
              title: "Distribuire Multi-Nod", 
              desc: "Publicare simultană pe LinkedIn, Instagram și Facebook printr-un centru de comandă unificat.",
              icon: Globe,
              bgStyle: styles["bg-emerald"]
            }
          ].map((feature, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.cardGlowEffect}></div>
              {/* Iconița cu fundal specific */}
              <div className={cn(styles.iconWrapper, feature.bgStyle)}>
                <feature.icon className="w-7 h-7" />
              </div>
              {/* Titlul funcționalității */}
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              {/* Descrierea detaliată */}
              <p className={styles.cardDesc}>
                {feature.desc}
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* 5. Subsolul Paginii (Footer) */}
      <footer className={styles.footer}>
        <div>© 2026 Arhitectura Cognify</div>
        <div className={styles.footerLinks}>
          <a href="#" className={styles.footerLink}>Politică Neuronală</a>
          <a href="#" className={styles.footerLink}>Loguri de Acces</a>
          <a href="#" className={styles.footerLink}>Nod de Securitate</a>
        </div>
      </footer>
    </div>
  );
}
