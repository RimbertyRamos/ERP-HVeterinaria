import React, { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import {
  PawPrint,
  Stethoscope,
  Package,
  Calendar,
  ShieldCheck,
  Monitor,
  Banknote,
  ChevronRight,
  Check,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Zap,
  Globe,
  HeartPulse,
  Clock,
  Users,
  BarChart3,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Play,
  Quote,
  MousePointerClick,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { api } from "../utils/api";
import { LeadModal } from "../components/LeadModal";

// Datos de contacto reales del hospital
const CONTACTO = {
  email: "vetcareuagrm@gmail.com",
  tel: "+59178143144",
  whatsapp: "59178143144",
  direccion:
    "Módulo 236 de la Ciudad Universitaria, sobre la Av. Busch, entre el 2do y 3er anillo",
};

const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/* ───────────────────── Animated Counter ───────────────────── */
const AnimatedCounter: React.FC<{
  end: number;
  suffix?: string;
  duration?: number;
}> = ({ end, suffix = "", duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

/* ───────────────────── Floating Particles ───────────────────── */
const FloatingParticles: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: Math.random() * 6 + 2,
          height: Math.random() * 6 + 2,
          background: `rgba(176, 68, 58, ${Math.random() * 0.3 + 0.1})`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          x: [0, Math.random() * 20 - 10, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: Math.random() * 4 + 3,
          repeat: Infinity,
          delay: Math.random() * 2,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

/* ───────────────────── Section Wrapper ───────────────────── */
const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = "", id }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

/* ───────────────────── DATA ───────────────────── */
const features = [
  {
    icon: PawPrint,
    title: "Gestión de Pacientes",
    desc: "Historial clínico completo, vacunas, alergias y seguimiento integral de cada mascota con ficha digital.",
    color: "from-brand to-brand-strong",
  },
  {
    icon: Stethoscope,
    title: "Consultas Médicas",
    desc: "Registro SOAP profesional, signos vitales, diagnósticos y planes de tratamiento estructurados.",
    color: "from-emerald-400 to-teal-500",
  },
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    desc: "Programación de citas con calendario visual, recordatorios automáticos y check-in digital.",
    color: "from-blue-400 to-indigo-500",
  },
  {
    icon: Package,
    title: "Inventario & Stock",
    desc: "Control de stock en tiempo real, kardex de movimientos y alertas de reposición de productos.",
    color: "from-pink-400 to-rose-500",
  },
  {
    icon: Banknote,
    title: "Punto de Venta & Caja",
    desc: "Facturación integrada, múltiples métodos de pago, reportes financieros y cierres de caja.",
    color: "from-cyan-400 to-sky-500",
  },
  {
    icon: Monitor,
    title: "Sala de Espera Digital",
    desc: "Pantalla pública modo kiosk para TV/tablet con visualización en tiempo real del estado de atención.",
    color: "from-lime-400 to-green-500",
  },
  {
    icon: Sparkles,
    title: "Asistente IA",
    desc: "Chatbot inteligente con IA (Google Gemini) para consultas de emergencia veterinaria en tiempo real.",
    color: "from-accent to-[#a87c33]",
  },
];

const stats = [
  { value: 500, suffix: "+", label: "Clínicas Activas" },
  { value: 150, suffix: "K+", label: "Pacientes Registrados" },
  { value: 99.9, suffix: "%", label: "Tiempo Activo" },
  { value: 24, suffix: "/7", label: "Soporte Técnico" },
];

const testimonials = [
  {
    name: "Dra. María González",
    role: "Directora — Clínica VetSalud",
    text: "Desde que implementamos VET-ERP, la eficiencia de nuestra clínica mejoró un 60%. Los módulos de consulta y caja son increíblemente intuitivos.",
    avatar: "MG",
  },
  {
    name: "Dr. Carlos Mendoza",
    role: "Veterinario Jefe — Hospital Animal Plus",
    text: "La integración entre inventario y caja nos permite un control total del negocio. El soporte técnico es excepcional.",
    avatar: "CM",
  },
  {
    name: "Lic. Ana Rodríguez",
    role: "Administradora — PetCare Center",
    text: "El dashboard y los reportes financieros nos dan visibilidad completa. La sala de espera digital es un plus que nuestros clientes aman.",
    avatar: "AR",
  },
];

const plans = [
  {
    name: "Starter",
    price: "49",
    desc: "Para clínicas pequeñas que inician su transformación digital",
    features: [
      "Hasta 3 usuarios",
      "Gestión de pacientes",
      "Agenda de citas",
      "Consultas médicas (SOAP)",
      "Soporte por email",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "129",
    desc: "La solución completa para clínicas en crecimiento",
    features: [
      "Hasta 15 usuarios",
      "Todos los módulos incluidos",
      "POS & facturación",
      "Inventario & stock",
      "Asistente IA",
      "Sala de espera digital",
      "Soporte prioritario 24/7",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Contacto",
    desc: "Para hospitales veterinarios y cadenas de clínicas",
    features: [
      "Usuarios ilimitados",
      "Multi-sucursal",
      "API & integraciones",
      "Personalización completa",
      "SLA garantizado",
      "Onboarding dedicado",
      "Capacitación presencial",
      "Servidor dedicado",
    ],
    highlighted: false,
  },
];

const faqs = [
  {
    q: "¿Cuánto tiempo toma implementar VET-ERP?",
    a: "La implementación básica toma entre 1-3 días. Incluimos migración de datos, configuración inicial y capacitación de tu equipo.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Absolutamente. Utilizamos encriptación JWT, base de datos PostgreSQL con backups automáticos y cumplimos con estándares de seguridad de datos.",
  },
  {
    q: "¿Puedo acceder desde cualquier dispositivo?",
    a: "Sí. VET-ERP es una aplicación web responsive que funciona en cualquier navegador moderno, desde PC, tablet o smartphone.",
  },
  {
    q: "¿Ofrecen período de prueba?",
    a: "Sí, ofrecemos 14 días de prueba gratuita con todas las funcionalidades del plan Professional sin compromiso.",
  },
  {
    q: "¿Qué pasa con mi información si cancelo?",
    a: "Tus datos siempre te pertenecen. Al cancelar, te proporcionamos una exportación completa en formatos estándar (CSV/JSON).",
  },
];

/* ───────────────────── FAQ Accordion Item ───────────────────── */
const FAQItem: React.FC<{ q: string; a: string; index: number }> = ({
  q,
  a,
  index,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      viewport={{ once: true }}
      className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="font-bold text-slate-900 dark:text-white pr-4">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="px-5 md:px-6 pb-5 md:pb-6 text-slate-600 dark:text-slate-400 leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ═══════════════════════ LANDING PAGE ═══════════════════════ */
export const Landing: React.FC<{ onGoToLogin?: () => void }> = ({
  onGoToLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((p) => (p + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  // ── Pago de planes (Stripe) + captura de lead ──
  const [leadPlan, setLeadPlan] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [pago, setPago] = useState<null | { ok: boolean; plan?: string | null }>(
    null,
  );

  const handlePlan = async (plan: string) => {
    if (plan === "Enterprise") {
      setLeadPlan("Enterprise");
      return;
    }
    setCheckoutPlan(plan);
    try {
      const { url } = await api.crearCheckout(plan);
      if (url) {
        window.location.href = url;
        return;
      }
      setLeadPlan(plan);
    } catch {
      // Sin pasarela configurada (o error) → captura de lead.
      setLeadPlan(plan);
    } finally {
      setCheckoutPlan(null);
    }
  };

  // ── Formulario de contacto / demo ──
  const [contacto, setContacto] = useState({
    nombre: "",
    apellido: "",
    email: "",
    empresa: "",
    mensaje: "",
    website: "", // honeypot
  });
  const [contactoEnviando, setContactoEnviando] = useState(false);
  const [contactoExito, setContactoExito] = useState(false);
  const [contactoError, setContactoError] = useState<string | null>(null);
  const setC = (k: keyof typeof contacto, v: string) =>
    setContacto((c) => ({ ...c, [k]: v }));

  const handleContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactoError(null);
    if (contacto.nombre.trim().length < 2) {
      setContactoError("Ingresa tu nombre.");
      return;
    }
    if (!emailValido(contacto.email)) {
      setContactoError("Ingresa un correo electrónico válido.");
      return;
    }
    setContactoEnviando(true);
    try {
      await api.crearLead({
        nombre: `${contacto.nombre} ${contacto.apellido}`.trim(),
        email: contacto.email,
        empresa: contacto.empresa,
        mensaje: contacto.mensaje,
        origen: "DEMO",
        website: contacto.website,
      });
      setContactoExito(true);
      setContacto({
        nombre: "",
        apellido: "",
        email: "",
        empresa: "",
        mensaje: "",
        website: "",
      });
    } catch (err: any) {
      setContactoError(err?.message ?? "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setContactoEnviando(false);
    }
  };

  // Resultado del pago al volver de Stripe (?checkout=success|cancel)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const estado = params.get("checkout");
    if (!estado) return;
    if (estado === "success") {
      const sid = params.get("session_id");
      if (sid) {
        api
          .verificarCheckout(sid)
          .then((r: any) => setPago({ ok: !!r?.pagado, plan: r?.plan }))
          .catch(() => setPago({ ok: true }));
      } else {
        setPago({ ok: true });
      }
    } else if (estado === "cancel") {
      setPago({ ok: false });
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const navLinks = [
    { label: "Características", id: "features" },
    { label: "Precios", id: "pricing" },
    { label: "Testimonios", id: "testimonials" },
    { label: "FAQ", id: "faq" },
    { label: "Contacto", id: "contact" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden">
      {pago && (
        <div
          className={`fixed top-0 left-0 right-0 z-[210] px-4 py-3 text-center text-sm font-bold ${
            pago.ok ? "bg-emerald-500 text-white" : "bg-slate-800 text-white"
          }`}
        >
          {pago.ok
            ? `✅ ¡Pago confirmado! Tu plan ${pago.plan ?? ""} quedó activado. Te contactaremos para los siguientes pasos.`
            : "El pago no se completó. Puedes intentarlo cuando quieras."}
          <button
            onClick={() => setPago(null)}
            className="ml-3 underline opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ────────── NAVBAR ────────── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50
            ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-slate-900/5 dark:shadow-black/20 border-b border-slate-200/50 dark:border-slate-800/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center shadow-lg shadow-brand/30">
                  <PawPrint size={22} className="text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-brand-ink to-accent bg-clip-text text-transparent">
                  VET-ERP
                </span>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 -mt-0.5">
                  Software Veterinario
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((l) => (
                <button
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onGoToLogin}
                className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => scrollTo("pricing")}
                className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-brand to-brand-strong text-white rounded-xl shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:scale-105 active:scale-95 transition-all"
              >
                Prueba Gratis
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
            >
              <div className="p-4 space-y-1">
                {navLinks.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => scrollTo(l.id)}
                    className="block w-full text-left px-4 py-3 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {l.label}
                  </button>
                ))}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    onClick={onGoToLogin}
                    className="w-full py-3 text-sm font-bold text-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => scrollTo("pricing")}
                    className="w-full py-3 text-sm font-bold text-center rounded-xl bg-gradient-to-r from-brand to-brand-strong text-white"
                  >
                    Prueba Gratis
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ────────── HERO ────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-brand-soft/40 dark:from-slate-950 dark:via-slate-900 dark:to-brand/15" />
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand/5 to-transparent rounded-full" />
          <FloatingParticles />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.95]"
            >
              <span className="block">El software que</span>
              <span className="block mt-2 bg-gradient-to-r from-brand-ink via-[#b1443a] to-accent bg-clip-text text-transparent">
                transforma tu clínica
              </span>
              <span className="block mt-2">veterinaria</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 md:mt-8 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              Sistema integral de gestión ERP diseñado exclusivamente para
              hospitales y clínicas veterinarias. Desde la recepción hasta la
              facturación, todo en una sola plataforma.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => scrollTo("pricing")}
                className="group relative px-8 py-4 bg-gradient-to-r from-brand to-brand-strong text-white font-bold rounded-2xl shadow-xl shadow-brand/25 hover:shadow-2xl hover:shadow-brand/40 hover:scale-105 active:scale-95 transition-all text-base flex items-center gap-2"
              >
                Comenzar Prueba Gratuita
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={() => scrollTo("features")}
                className="group px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-base hover:border-brand dark:hover:border-brand-ink hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Play size={18} className="text-brand-ink" />
                Ver Demostración
              </button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold uppercase tracking-wider"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Datos Seguros</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-brand-ink" />
                <span>Setup en 24hrs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe size={14} className="text-blue-500" />
                <span>100% Cloud</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartPulse size={14} className="text-red-500" />
                <span>Soporte 24/7</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-16 md:mt-24 relative mx-auto max-w-5xl"
          >
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 bg-slate-900">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-slate-700 rounded-lg px-4 py-1 text-xs text-slate-400 font-mono flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    app.vet-erp.com/dashboard
                  </div>
                </div>
              </div>
              {/* Dashboard Preview */}
              <div className="p-4 md:p-6 bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="grid grid-cols-4 gap-3 md:gap-4 mb-4">
                  {[
                    {
                      icon: PawPrint,
                      label: "Pacientes Hoy",
                      value: "28",
                      trend: "+12%",
                      color: "text-[#e0938b]",
                    },
                    {
                      icon: Stethoscope,
                      label: "Consultas",
                      value: "15",
                      trend: "+8%",
                      color: "text-emerald-400",
                    },
                    {
                      icon: Banknote,
                      label: "Ingresos",
                      value: "$4,250",
                      trend: "+23%",
                      color: "text-blue-400",
                    },
                    {
                      icon: Clock,
                      label: "En Espera",
                      value: "3",
                      trend: "-5%",
                      color: "text-violet-400",
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + i * 0.1 }}
                      className="bg-slate-800/80 rounded-xl p-3 md:p-4 border border-slate-700/50"
                    >
                      <stat.icon size={16} className={`${stat.color} mb-2`} />
                      <p className="text-lg md:text-2xl font-black text-white">
                        {stat.value}
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-400 font-semibold mt-0.5">
                        {stat.label}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-400">
                        {stat.trend}
                      </span>
                    </motion.div>
                  ))}
                </div>
                {/* Chart bars mockup */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-slate-300">
                      Ingresos Semanales
                    </p>
                    <div className="flex gap-2">
                      <div className="h-2 w-8 rounded-full bg-[#c2564a]/30" />
                      <div className="h-2 w-8 rounded-full bg-emerald-500/30" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map(
                      (h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{
                            delay: 1.5 + i * 0.05,
                            duration: 0.5,
                            ease: "easeOut",
                          }}
                          className="flex-1 rounded-md bg-gradient-to-t from-[#8a2015]/80 to-[#c2564a]/80"
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-brand/25 blur-3xl rounded-full" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <MousePointerClick size={20} className="text-slate-400" />
        </motion.div>
      </section>

      {/* ────────── STATS ────────── */}
      <Section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-3xl md:text-5xl font-black bg-gradient-to-r from-brand-ink to-accent bg-clip-text text-transparent">
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ────────── FEATURES ────────── */}
      <Section id="features" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-6"
            >
              <BarChart3 size={14} className="text-brand-ink" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Módulos del Sistema
              </span>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Todo lo que necesitas,{" "}
              <span className="bg-gradient-to-r from-brand-ink to-accent bg-clip-text text-transparent">
                en un solo lugar
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Cada módulo está diseñado específicamente para el flujo de trabajo
              veterinario, integrado de forma nativa con todos los demás.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand/40 dark:hover:border-brand-ink/30 shadow-sm hover:shadow-xl hover:shadow-brand/5 transition-all duration-300"
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg mb-4`}
                >
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-ink opacity-0 group-hover:opacity-100 transition-opacity">
                  Conocer más <ChevronRight size={12} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ────────── WORKFLOW ────────── */}
      <Section className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Flujo de atención{" "}
              <span className="bg-gradient-to-r from-brand-ink to-accent bg-clip-text text-transparent">
                completamente digital
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Desde que el paciente llega hasta que se factura, cada paso está
              optimizado.
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-ink/0 via-brand-ink/30 to-brand-ink/0 -translate-y-1/2" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
              {[
                {
                  icon: Users,
                  label: "Recepción",
                  desc: "Registro de ficha y paciente",
                },
                {
                  icon: Clock,
                  label: "Sala de Espera",
                  desc: "Monitoreo en tiempo real",
                },
                {
                  icon: Stethoscope,
                  label: "Consulta",
                  desc: "Diagnóstico SOAP completo",
                },
                {
                  icon: Banknote,
                  label: "Facturación",
                  desc: "Cobro y cierre de caja",
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative z-10 h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-brand-ink/50 shadow-lg shadow-brand/10 flex items-center justify-center mb-4">
                    <step.icon
                      size={28}
                      className="text-brand-ink"
                    />
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-brand text-white flex items-center justify-center text-xs font-black">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-base">{step.label}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ────────── TESTIMONIALS ────────── */}
      <Section id="testimonials" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Profesionales que{" "}
              <span className="bg-gradient-to-r from-brand-ink to-accent bg-clip-text text-transparent">
                confían en nosotros
              </span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <Quote size={40} className="text-brand-ink/30 mx-auto mb-6" />
                <p className="text-xl md:text-2xl font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{testimonials[activeTestimonial].text}"
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand to-brand-strong flex items-center justify-center text-white font-black text-lg shadow-lg">
                    {testimonials[activeTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">
                      {testimonials[activeTestimonial].name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {testimonials[activeTestimonial].role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-10">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial
                      ? "w-8 bg-brand-ink"
                      : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ────────── PRICING ────────── */}
      <Section
        id="pricing"
        className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Planes que se adaptan a{" "}
              <span className="bg-gradient-to-r from-brand-ink to-accent bg-clip-text text-transparent">
                tu clínica
              </span>
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">
              Sin contratos a largo plazo. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-slate-900 to-slate-950 text-white border-2 border-accent/50 shadow-2xl shadow-brand/10 scale-105"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                } transition-all`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-brand to-brand-strong text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                    Más Popular
                  </div>
                )}

                <h3 className="text-xl font-black">{plan.name}</h3>
                <p
                  className={`text-sm mt-1 ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}
                >
                  {plan.desc}
                </p>

                <div className="mt-6 mb-8">
                  {plan.price !== "Contacto" ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">${plan.price}</span>
                      <span
                        className={`text-sm font-semibold ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}
                      >
                        /mes
                      </span>
                    </div>
                  ) : (
                    <span className="text-4xl font-black bg-gradient-to-r from-brand-ink to-accent bg-clip-text text-transparent">
                      Personalizado
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-3">
                      <Check
                        size={16}
                        className={`flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-accent" : "text-emerald-500"}`}
                      />
                      <span
                        className={`text-sm ${plan.highlighted ? "text-slate-300" : "text-slate-600 dark:text-slate-400"}`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlan(plan.name)}
                  disabled={checkoutPlan === plan.name}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-brand to-brand-strong text-white shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                  }`}
                >
                  {checkoutPlan === plan.name ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Redirigiendo…
                    </>
                  ) : plan.price === "Contacto" ? (
                    "Contactar Ventas"
                  ) : (
                    "Comenzar Ahora"
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ────────── FAQ ────────── */}
      <Section id="faq" className="py-20 md:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Preguntas{" "}
              <span className="bg-gradient-to-r from-brand-ink to-accent bg-clip-text text-transparent">
                frecuentes
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </Section>

      {/* ────────── FINAL CTA ────────── */}
      <Section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c2564a]/25 rounded-full blur-3xl" />
        </div>
        <FloatingParticles />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="h-20 w-20 mx-auto mb-8 bg-gradient-to-br from-brand to-brand-strong rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/30">
              <PawPrint size={40} className="text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              ¿Listo para modernizar
              <br />
              <span className="bg-gradient-to-r from-[#e0938b] to-accent bg-clip-text text-transparent">
                tu clínica veterinaria?
              </span>
            </h2>
            <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto">
              Únete a cientos de profesionales que ya confían en VET-ERP.
              Comienza tu prueba gratuita de 14 días sin compromiso.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => scrollTo("pricing")}
                className="group px-10 py-4 bg-gradient-to-r from-brand to-brand-strong text-white font-bold rounded-2xl shadow-xl shadow-brand/25 hover:shadow-2xl hover:shadow-brand/40 hover:scale-105 active:scale-95 transition-all text-lg flex items-center gap-2"
              >
                Empezar Gratis
                <Sparkles
                  size={20}
                  className="group-hover:rotate-12 transition-transform"
                />
              </button>
              <button
                onClick={() => scrollTo("contact")}
                className="px-10 py-4 border-2 border-slate-700 text-white rounded-2xl font-bold text-lg hover:border-accent/50 hover:bg-white/5 transition-all"
              >
                Hablar con Ventas
              </button>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ────────── CONTACT ────────── */}
      <Section
        id="contact"
        className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            {/* Info */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                Contáctanos
              </h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                ¿Tienes preguntas sobre nuestro sistema? Nuestro equipo de
                ventas está listo para ayudarte a encontrar la solución perfecta
                para tu clínica.
              </p>

              <div className="mt-10 space-y-6">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: CONTACTO.email,
                    href: `mailto:${CONTACTO.email}`,
                  },
                  {
                    icon: Phone,
                    label: "Teléfono",
                    value: CONTACTO.tel,
                    href: `tel:${CONTACTO.tel}`,
                  },
                  {
                    icon: MessageCircle,
                    label: "WhatsApp",
                    value: CONTACTO.tel,
                    href: `https://wa.me/${CONTACTO.whatsapp}`,
                  },
                  {
                    icon: MapPin,
                    label: "Oficina",
                    value: CONTACTO.direccion,
                    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      CONTACTO.direccion,
                    )}`,
                  },
                ].map((info, i) => {
                  const externo = info.href.startsWith("http");
                  return (
                    <motion.a
                      key={i}
                      href={info.href}
                      target={externo ? "_blank" : undefined}
                      rel={externo ? "noopener noreferrer" : undefined}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="h-12 w-12 rounded-xl bg-brand-soft dark:bg-brand/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#e8cfc9] dark:group-hover:bg-brand/30 transition-colors">
                        <info.icon
                          size={20}
                          className="text-brand-ink"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {info.label}
                        </p>
                        <p className="text-base font-semibold break-words group-hover:text-brand-ink transition-colors">
                          {info.value}
                        </p>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <h3 className="text-xl font-black mb-6">Solicita una demo</h3>
              <form
                className="space-y-4"
                onSubmit={handleContacto}
                autoComplete="off"
              >
                {/* Honeypot anti-spam (oculto) */}
                <input
                  type="text"
                  value={contacto.website}
                  onChange={(e) => setC("website", e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                {contactoExito && (
                  <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl px-4 py-3">
                    ✅ ¡Gracias! Recibimos tu solicitud. Te contactaremos muy
                    pronto.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={contacto.nombre}
                      onChange={(e) => setC("nombre", e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={contacto.apellido}
                      onChange={(e) => setC("apellido", e.target.value)}
                      placeholder="Tu apellido"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contacto.email}
                    onChange={(e) => setC("email", e.target.value)}
                    placeholder="correo@clinica.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Nombre de la Clínica
                  </label>
                  <input
                    type="text"
                    value={contacto.empresa}
                    onChange={(e) => setC("empresa", e.target.value)}
                    placeholder="Ej: Clínica Veterinaria San Martín"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Mensaje
                  </label>
                  <textarea
                    rows={4}
                    value={contacto.mensaje}
                    onChange={(e) => setC("mensaje", e.target.value)}
                    placeholder="Cuéntanos sobre tu clínica y lo que necesitas..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow resize-none"
                  />
                </div>
                {contactoError && (
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
                    {contactoError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={contactoEnviando}
                  className="w-full py-4 bg-gradient-to-r from-brand to-brand-strong text-white font-bold rounded-xl shadow-lg shadow-brand/25 hover:shadow-brand/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {contactoEnviando ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    <>
                      Enviar Solicitud
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ────────── FOOTER ────────── */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-brand to-brand-strong rounded-xl flex items-center justify-center">
                  <PawPrint size={22} className="text-white" />
                </div>
                <span className="text-xl font-black tracking-tighter">
                  VET-ERP
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sistema integral de gestión diseñado para clínicas y hospitales
                veterinarios modernos.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300 mb-4">
                Producto
              </h4>
              <ul className="space-y-2.5">
                {[
                  { l: "Características", id: "features" },
                  { l: "Precios", id: "pricing" },
                  { l: "Integraciones", id: "features" },
                  { l: "Actualizaciones", id: "features" },
                ].map((x) => (
                  <li key={x.l}>
                    <button
                      onClick={() => scrollTo(x.id)}
                      className="text-sm text-slate-400 hover:text-white transition-colors text-left"
                    >
                      {x.l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300 mb-4">
                Empresa
              </h4>
              <ul className="space-y-2.5">
                {[
                  { l: "Sobre Nosotros", id: "testimonials" },
                  { l: "Blog", id: "features" },
                  { l: "Carreras", id: "contact" },
                  { l: "Contacto", id: "contact" },
                ].map((x) => (
                  <li key={x.l}>
                    <button
                      onClick={() => scrollTo(x.id)}
                      className="text-sm text-slate-400 hover:text-white transition-colors text-left"
                    >
                      {x.l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300 mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Términos de Servicio",
                  "Política de Privacidad",
                  "Cookies",
                  "Seguridad",
                ].map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => scrollTo("contact")}
                      className="text-sm text-slate-400 hover:text-white transition-colors text-left"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} VET-ERP. Todos los derechos
              reservados.
            </p>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              Hecho con
              <HeartPulse size={14} className="text-red-500 mx-1" />
              para la comunidad veterinaria
            </div>
          </div>
        </div>
      </footer>

      {leadPlan && (
        <LeadModal
          plan={leadPlan}
          titulo={
            leadPlan === "Enterprise"
              ? "Contactar con Ventas"
              : `Solicitar plan ${leadPlan}`
          }
          subtitulo={
            leadPlan === "Enterprise"
              ? "Cuéntanos sobre tu hospital o cadena y preparamos una propuesta a medida."
              : "Déjanos tus datos y te ayudamos a activar tu plan."
          }
          origen="PLAN"
          onClose={() => setLeadPlan(null)}
        />
      )}
    </div>
  );
};
