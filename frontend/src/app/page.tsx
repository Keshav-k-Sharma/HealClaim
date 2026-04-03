import Link from 'next/link'
import {
  Shield,
  Clock,
  FileText,
  CheckCircle,
  User,
  Building2,
  Briefcase,
  ArrowRight,
  Upload,
  QrCode,
  Cpu,
  Lock,
  Globe,
  ChevronRight,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <Hero />
      <HowItWorks />
      <StakeholderSection />
      <AISection />
      <TrustSection />
      <Footer />
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-lg">HealClaim</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            How it works
          </a>
          <a href="#stakeholders" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            For you
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="pt-32 pb-24 px-4 sm:px-6 bg-gradient-to-b from-white to-brand-50">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Globe className="w-4 h-4" />
          Built for developing nations
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
          Paperless medical claims,{' '}
          <span className="text-primary">simplified.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          HealClaim connects patients, hospitals, and insurers on a single
          platform — eliminating paperwork, reducing delays, and bringing
          transparency to every claim.
        </p>

        {/* Role CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <RoleCTA
            href="/auth/register/patient"
            icon={<User className="w-5 h-5" />}
            label="I'm a Patient"
            sub="Upload docs, track claims"
            primary
          />
          <RoleCTA
            href="/auth/register/hospital"
            icon={<Building2 className="w-5 h-5" />}
            label="I'm a Hospital"
            sub="File and manage claims"
          />
          <RoleCTA
            href="/auth/register/insurer"
            icon={<Briefcase className="w-5 h-5" />}
            label="I'm an Insurer"
            sub="Review and settle quickly"
          />
        </div>

        {/* Social proof */}
        <p className="mt-10 text-sm text-gray-400">
          Trusted by hospitals and insurers across India
        </p>
      </div>
    </section>
  )
}

interface RoleCTAProps {
  href: string
  icon: React.ReactNode
  label: string
  sub: string
  primary?: boolean
}

function RoleCTA({ href, icon, label, sub, primary }: RoleCTAProps) {
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-4 px-6 py-4 rounded-xl border transition-all w-full sm:w-auto
        ${
          primary
            ? 'bg-primary border-primary text-white hover:bg-brand-800 shadow-lg shadow-primary/20'
            : 'bg-white border-gray-200 text-gray-900 hover:border-primary hover:shadow-md'
        }
      `}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          primary ? 'bg-white/20' : 'bg-brand-50 text-primary'
        }`}
      >
        {icon}
      </div>
      <div className="text-left">
        <div className="font-semibold text-sm">{label}</div>
        <div className={`text-xs mt-0.5 ${primary ? 'text-white/70' : 'text-gray-400'}`}>
          {sub}
        </div>
      </div>
      <ChevronRight
        className={`w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform ${
          primary ? 'text-white/60' : 'text-gray-300'
        }`}
      />
    </Link>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

const steps = [
  {
    step: '01',
    icon: <Upload className="w-6 h-6" />,
    title: 'Pre-upload your documents',
    description:
      'Patients register once and securely upload their PAN, Aadhaar, and insurance policy. Your documents are ready before you ever visit a hospital.',
  },
  {
    step: '02',
    icon: <QrCode className="w-6 h-6" />,
    title: 'Hospital scans your QR',
    description:
      'At the hospital, staff scan your unique QR code to instantly access your identity and policy details — no forms to fill, no photocopies needed.',
  },
  {
    step: '03',
    icon: <FileText className="w-6 h-6" />,
    title: 'Claim bundle is created',
    description:
      'The hospital uploads treatment documents — bills, reports, prescriptions. The system merges everything into a single, verified claim bundle.',
  },
  {
    step: '04',
    icon: <CheckCircle className="w-6 h-6" />,
    title: 'You decide, insurer settles',
    description:
      'Choose to pay cash or proceed with insurance. If insured, the claim goes directly to your insurer\'s dashboard — with AI-powered insights for faster decisions.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How HealClaim works
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Four steps from hospital admission to claim settlement.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className="relative p-6 rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all group"
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                {s.step}
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden lg:block absolute top-8 -right-3 w-6 h-6 text-brand-200 z-10" />
              )}
              <div className="w-12 h-12 bg-brand-50 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                {s.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Stakeholder section ──────────────────────────────────────────────────────

const stakeholders = [
  {
    role: 'For Patients',
    icon: <User className="w-6 h-6" />,
    color: 'text-primary bg-brand-50',
    headline: 'Your medical records, always ready.',
    features: [
      'Upload PAN, Aadhaar, and policy once — reuse forever',
      'Get a unique QR code for instant hospital lookup',
      'Track every claim in real time with a status timeline',
      'Choose cash or insurance at discharge — no pressure',
    ],
    cta: 'Register as patient',
    href: '/register?role=PATIENT',
  },
  {
    role: 'For Hospitals',
    icon: <Building2 className="w-6 h-6" />,
    color: 'text-purple-700 bg-purple-50',
    headline: 'File claims in minutes, not days.',
    features: [
      'Scan patient QR to pull all identity and policy docs instantly',
      'Upload bills, reports, and prescriptions in one flow',
      'Submit verified claim bundles directly to insurers',
      'Track outstanding document requests in one dashboard',
    ],
    cta: 'Register as hospital',
    href: '/register?role=HOSPITAL',
  },
  {
    role: 'For Insurers',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'text-orange-700 bg-orange-50',
    headline: 'Review smarter, settle faster.',
    features: [
      'Publish your policy catalog — patients self-match to your plans',
      'Receive fully bundled, pre-verified claims in your queue',
      'AI flags fraud risk before you open a single document',
      'Approve, reject, or request more docs in one click',
    ],
    cta: 'Register as insurer',
    href: '/register?role=INSURER',
  },
]

function StakeholderSection() {
  return (
    <section id="stakeholders" className="py-24 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Built for everyone in the claim chain
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            One platform, three perspectives — each designed for the people who
            use it most.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {stakeholders.map((s) => (
            <div
              key={s.role}
              className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-lg transition-all flex flex-col"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
                {s.icon}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                {s.role}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{s.headline}</h3>
              <ul className="space-y-3 flex-1">
                {s.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={s.href}
                className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-brand-800 transition-colors group"
              >
                {s.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── AI section ───────────────────────────────────────────────────────────────

function AISection() {
  return (
    <section className="py-24 px-4 sm:px-6 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full text-sm font-medium mb-6">
              <Cpu className="w-4 h-4" />
              AI-powered insights
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Predictions that give everyone confidence.
            </h2>
            <p className="text-gray-400 leading-relaxed mb-8">
              Our AI model analyses every claim bundle and surfaces four key
              predictions — visible to the patient, hospital, and insurer
              simultaneously. No black boxes. Just clear, actionable insights.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Approval likelihood', value: '87%', color: 'text-green-400' },
                { label: 'Estimated payout', value: '₹1.2L', color: 'text-blue-400' },
                { label: 'Fraud score', value: 'Low', color: 'text-green-400' },
                { label: 'vs. benchmark', value: '−12%', color: 'text-amber-400' },
              ].map((m) => (
                <div key={m.label} className="bg-white/5 rounded-xl p-4">
                  <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0 hidden md:block">
            <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                <Cpu className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Trust section ────────────────────────────────────────────────────────────

const trustItems = [
  { icon: <Lock className="w-5 h-5" />, label: 'AES-256 encrypted storage', sub: 'All documents encrypted at rest and in transit' },
  { icon: <Shield className="w-5 h-5" />, label: 'JWT-secured API', sub: 'Stateless auth, role-isolated access' },
  { icon: <Clock className="w-5 h-5" />, label: '99.9% uptime SLA', sub: 'Built on AWS with auto-scaling' },
  { icon: <Globe className="w-5 h-5" />, label: 'DPDP compliant', sub: 'Adheres to India\'s data protection bill' },
]

function TrustSection() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Built with security at its core
          </h2>
          <p className="text-gray-500">
            Medical data deserves the highest level of protection.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((t) => (
            <div key={t.label} className="flex items-start gap-4 bg-white p-5 rounded-xl border border-gray-100">
              <div className="w-10 h-10 bg-brand-50 text-primary rounded-lg flex items-center justify-center flex-shrink-0">
                {t.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{t.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-10 px-4 sm:px-6 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-gray-900">HealClaim</span>
        </div>
        <p className="text-sm text-gray-400 text-center">
          © {new Date().getFullYear()} HealClaim. Streamlining medical claims across developing nations.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Privacy</a>
          <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Terms</a>
          <a href="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  )
}