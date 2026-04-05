import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

// ─── Icons (inline SVGs) ────────────────────────────────────────────────────

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const BellIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const LogInIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);
const CheckSquareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const SmartphoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const UserCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
  </svg>
);
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
const CheckCircleIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const UserPlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);
const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
);
const ClipboardCheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" ry="1" /><path d="m9 14 2 2 4-4" />
  </svg>
);
const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
  </svg>
);
const PlayCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);
const XIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const InboxIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
);
const HelpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);
const ChevronDownSmallIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
const features = [
  { icon: <UsersIcon />, title: 'Client Management', desc: 'Track all clients, contacts, and work status in one beautiful dashboard.' },
  { icon: <ShieldIcon />, title: 'Secure Documents', desc: 'Encrypted cloud storage for all client documents with easy access.' },
  { icon: <BellIcon />, title: 'GST & IT Tracking', desc: 'Never miss a filing deadline with automated reminders and alerts.' },
  { icon: <LogInIcon />, title: 'Client Portal', desc: 'Let clients upload documents and check their status themselves.' },
  { icon: <CheckSquareIcon />, title: 'Task Tracking', desc: 'Assign tasks to team members and track progress in real-time.' },
  { icon: <SmartphoneIcon />, title: 'Mobile Friendly', desc: "Access your firm's data from any device, anywhere, anytime." },
];

const benefits = [
  { icon: <ClockIcon />, title: 'Save time daily', desc: 'Automate repetitive tasks and focus on billable work that grows your practice.' },
  { icon: <ZapIcon />, title: 'Reduce errors', desc: 'Systematic workflows eliminate manual mistakes and missed deadlines.' },
  { icon: <UserCheckIcon />, title: 'Better client management', desc: 'Every client detail, document, and interaction at your fingertips.' },
  { icon: <ShieldCheckIcon />, title: 'Secure data', desc: "Enterprise-grade encryption keeps your clients' sensitive data safe." },
];

const testimonials = [
  { quote: 'This software simplified our office work completely. We can now track 100+ clients without chaos.', name: 'CA Rajesh Agarwal', firm: 'Agarwal & Associates' },
  { quote: 'MyCAFile saved us hours every week. The client portal alone is worth the subscription.', name: 'CA Priya Mehta', firm: 'Mehta Tax Consultants' },
  { quote: 'Finally, a tool built for Indian CA firms. No more juggling between WhatsApp and spreadsheets.', name: 'CA Suresh Patel', firm: 'Patel & Partners' },
];

const faqs = [
  { q: 'Is my data secure?', a: 'Absolutely. We use industry-standard AES-256 encryption and your data is stored on secure cloud servers in India.' },
  { q: 'Can I cancel anytime?', a: 'Yes. There are no lock-in contracts. You can cancel or downgrade anytime.' },
  { q: 'Do you provide support?', a: 'Yes! We offer email and chat support for all plans.' },
  { q: 'Is it mobile friendly?', a: 'Yes, MyCAFile works beautifully on all devices — desktop, tablet, and mobile.' },
];

const firms = ['Agarwal & Co.', 'Mehta Associates', 'Sharma Tax Pros', 'Patel & Partners', 'Gupta CA Firm', 'Singh Consultants'];

// ─── Sub-components ──────────────────────────────────────────────────────────
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', marginBottom: 12, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 16, fontWeight: 500, color: '#111827' }}>
        {q}
        <ChevronDownIcon open={open} />
      </button>
      {open && <div style={{ padding: '0 24px 20px', color: '#6b7280', lineHeight: 1.6, fontSize: 15 }}>{a}</div>}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [withCloud, setWithCloud] = useState(false);

  useEffect(() => {
    // Satisfy linter and handle fast transition
    const timer = setTimeout(() => setIsLoading(false), 50);
    return () => clearTimeout(timer);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 100, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', width: '100%' }} />
        <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ height: 48, width: '60%', background: '#f3f4f6', borderRadius: 12, animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ height: 48, width: '40%', background: '#f3f4f6', borderRadius: 12, animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginTop: 40 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 200, background: '#f9fafb', borderRadius: 24, animation: 'pulse 1.5s infinite ease-in-out' }} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#111827', background: '#fff', overflowX: 'hidden' }}>
      <Helmet>
        <title>My CA File - Best CA Office Management Software in India</title>
        <meta name="description" content="Manage your Indian CA practice with ease. My CA File is the #1 practice management software for Chartered Accountants. Track GST, ITR, Audit tasks, and secure client documents in one powerful portal. Try it free!" />
        <meta name="keywords" content="CA firm software India, best CA practice management tool, ITR GST software for CA, chartered accountant office management system, CA client portal India" />
        <link rel="canonical" href="https://mycafile.in/" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mycafile.in/" />
        <meta property="og:title" content="My CA File - Best CA Office Management Software in India" />
        <meta property="og:description" content="Streamline your CA practice with secure, automated workflows. Manage GST, ITR, team tasks, and client documents in one portal." />
        <meta property="og:image" content="https://mycafile.in/og-home.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="My CA File - Best CA Office Management Software in India" />
        <meta name="twitter:description" content="Streamline your CA practice with secure, automated workflows." />
        <meta name="twitter:image" content="https://mycafile.in/og-home.png" />
        <meta name="robots" content="index, follow" />

        {/* Structured Data: FAQPage */}
        <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is my CA firm data secure?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. We use industry-standard AES-256 encryption and your data is stored on secure cloud servers in India with strict multi-tenant isolation."
                }
              },
              {
                "@type": "Question",
                "name": "Can I manage multiple CA staff members?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, My CA File is built for team collaboration. You can assign tasks, track timesheets, and manage attendance for all your staff and interns."
                }
              },
              {
                "@type": "Question",
                "name": "Do you provide support for GST and ITR tracking?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, we have specialized modules for GST and ITR tracking with automated deadline reminders and filing status updates."
                }
              }
            ]
          }
        `}
        </script>

        {/* Structured Data: BreadcrumbList */}
        <script type="application/ld+json">
        {`
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://mycafile.in"
              }
            ]
          }
        `}
        </script>
      </Helmet>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-btn-primary { background: linear-gradient(135deg, #7c3aed, #9333ea); color: #fff; border: none; border-radius: 50px; padding: 14px 28px; font-size: 16px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: opacity 0.2s, transform 0.2s; }
        .lp-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .lp-btn-secondary { background: #fff; color: #111827; border: 1.5px solid #d1d5db; border-radius: 50px; padding: 14px 28px; font-size: 16px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.2s, transform 0.2s; }
        .lp-btn-secondary:hover { border-color: #7c3aed; transform: translateY(-1px); }
        .lp-feature-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; transition: box-shadow 0.2s, transform 0.2s; }
        .lp-feature-card:hover { box-shadow: 0 8px 30px rgba(124,58,237,0.12); transform: translateY(-3px); }
        .lp-benefit-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px 28px; display: flex; gap: 16px; align-items: flex-start; transition: box-shadow 0.2s; }
        .lp-benefit-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .lp-nav-link { background: none; border: none; cursor: pointer; font-size: 15px; color: #374151; font-weight: 500; padding: 6px 4px; transition: color 0.2s; }
        .lp-nav-link:hover { color: #7c3aed; }
        .lp-section-label { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #7c3aed; margin-bottom: 12px; }
        .lp-section-title { font-size: clamp(32px, 5vw, 48px); font-weight: 800; line-height: 1.15; color: #111827; }
        .lp-section-sub { font-size: 18px; color: #6b7280; line-height: 1.6; max-width: 560px; margin: 16px auto 0; }
        .lp-gradient-text { background: linear-gradient(135deg, #7c3aed, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .lp-tag { display: inline-flex; align-items: center; gap: 8px; background: rgba(124,58,237,0.08); border: 1.5px solid rgba(124,58,237,0.2); color: #7c3aed; border-radius: 50px; padding: 8px 20px; font-size: 14px; font-weight: 600; }
        .lp-stat { text-align: center; }
        .lp-stat-num { font-size: 36px; font-weight: 800; color: #111827; }
        .lp-stat-label { font-size: 14px; color: #9ca3af; margin-top: 4px; }
        .lp-check { display: inline-flex; align-items: center; gap: 10px; color: #6b7280; font-size: 14px; font-weight: 500; }
        .lp-step-num { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #7c3aed, #9333ea); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; }
        .lp-testimonial-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; }
        .lp-pricing-free { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 20px; padding: 36px 32px; }
        .lp-pricing-popular { background: linear-gradient(160deg, #5b21b6, #7c3aed, #9333ea); color: #fff; border-radius: 20px; padding: 36px 32px; position: relative; transform: scale(1.05); box-shadow: 0 20px 60px rgba(124,58,237,0.35); }
        .lp-pricing-pro { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 20px; padding: 36px 32px; }
        .lp-popular-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: linear-gradient(90deg, #f59e0b, #fbbf24); color: #fff; border-radius: 50px; padding: 6px 20px; font-size: 13px; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 6px; }
        .lp-pricing-btn-outline { width: 100%; border: 2px solid #d1d5db; border-radius: 50px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; background: #fff; color: #111827; transition: border-color 0.2s; }
        .lp-pricing-btn-outline:hover { border-color: #7c3aed; }
        .lp-pricing-btn-white { width: 100%; border: none; border-radius: 50px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; background: #fff; color: #7c3aed; transition: opacity 0.2s; }
        .lp-pricing-btn-white:hover { opacity: 0.9; }
        nav { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.9); backdrop-filter: blur(12px); border-bottom: none; }
        .lp-footer-link { color: #9ca3af; font-size: 14px; background: none; border: none; cursor: pointer; padding: 2px 0; transition: color 0.2s; }
        .lp-footer-link:hover { color: #7c3aed; }
        @media (max-width: 768px) {
          .lp-grid-3 { grid-template-columns: 1fr !important; }
          .lp-grid-2 { grid-template-columns: 1fr !important; }
          .lp-hero-btns { flex-direction: column !important; align-items: center !important; }
          .lp-pricing-grid { grid-template-columns: 1fr !important; }
          .lp-pricing-popular { transform: scale(1) !important; }
          .lp-step-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .lp-step-connector { display: none !important; }
          .lp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-firms { flex-wrap: wrap !important; gap: 24px !important; justify-content: center !important; }
          .lp-nav-desktop { display: none !important; }
          .lp-nav-mobile { display: flex !important; margin-left: auto; }
          .mobile-menu-card { max-width: 320px !important; }
          .lp-footer-grid { grid-template-columns: 1fr !important; gap: 48px !important; text-align: center !important; }
          .lp-footer-logo-box { justify-content: center !important; }
          .lp-footer-desc { margin: 0 auto !important; }
        }
        .nav-item-active { background: rgba(0,0,0,0.03); border-radius: 12px; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 22, color: '#7c3aed', letterSpacing: '-0.5px' }}>
            <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/faviconca.webp" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            </div>
            MyCAFile
          </div>
          <div className="lp-nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <button className="lp-nav-link" style={{ position: 'relative', zIndex: 105 }} onClick={() => scrollTo('features')}>Features</button>
            <button className="lp-nav-link" style={{ position: 'relative', zIndex: 105 }} onClick={() => scrollTo('pricing')}>Our Services</button>
            <a href="/pricing" className="lp-nav-link" style={{ textDecoration: 'none', position: 'relative', zIndex: 105 }}>Pricing</a>
            <button className="lp-nav-link" onClick={() => scrollTo('faq')}>FAQ</button>
            <a href="/superadmin" style={{ background: 'none', border: '1.5px solid #d1d5db', borderRadius: 50, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#7c3aed'; (e.currentTarget as HTMLAnchorElement).style.color = '#7c3aed'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLAnchorElement).style.color = '#374151'; }}
            >Login</a>
            <a href="/contact" className="lp-btn-primary" style={{ padding: '10px 24px', fontSize: 14, transform: 'none', boxShadow: 'none', textDecoration: 'none' }}>Start Free Trial</a>
          </div>

          <div className="lp-nav-mobile" style={{ display: 'none', gap: 12 }}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ background: 'none', border: 'none', color: '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- PREMIUM MOBILE MENU (RIGHT DRAWER) --- */}
      <div 
        className="mobile-menu-card"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 320,
          background: '#fff',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
          zIndex: 10000,
          padding: '24px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          opacity: 1,
          visibility: isMenuOpen ? 'visible' : 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '100vh',
          overflowY: 'auto',
          pointerEvents: isMenuOpen ? 'auto' : 'none',
        }}
      >
        {/* Header Profile with Close Icon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/faviconca.webp" style={{ width: 32, height: 32, objectFit: 'contain' }} alt="MyCAFile" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, fontSize: 17, color: '#111827', letterSpacing: '-0.3px' }}>MyCAFile</span>
              <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>CA Management</span>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111827' }}>
            <XIcon />
          </button>
        </div>

        {/* Main List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <a href="/pricing" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px', color: '#374151' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ color: '#7c3aed' }}><BellIcon /></div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Pricing Plans</span>
              </div>
              <ChevronDownSmallIcon />
          </a>
          {[
            { label: 'Platform Features', icon: <InboxIcon />, id: 'features' },
            { label: 'Help & FAQ', icon: <HelpIcon />, id: 'faq' },
          ].map(item => (
            <button 
              key={item.label} 
              onClick={() => scrollTo(item.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 4px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', color: '#374151' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ color: '#7c3aed' }}>{item.icon}</div>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{item.label}</span>
              </div>
              <ChevronDownSmallIcon />
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a
            href="/superadmin"
            className="lp-btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: 16, fontSize: 15, textDecoration: 'none' }} 
          >
            Login to Dashboard
          </a>
          <a
            href="/contact"
            className="lp-btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: 16, fontSize: 15, textDecoration: 'none' }} 
          >
            Start Free Trial
          </a>
        </div>
      </div>

      {/* Backdrop */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 9999 }} 
        />
      )}

      {/* ── HERO ────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', background: '#fff', minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px' }}>
        {/* Decorative central blob */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', filter: 'blur(30px)', transform: 'translateY(-5%)' }} />
        </div>

        <div style={{ maxWidth: 1024, position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{ marginBottom: 28 }}>
            <span className="lp-tag" style={{ fontSize: 13, padding: '8px 22px', letterSpacing: 0.2 }}>
              <SparklesIcon /> Built for Indian CA Firms
            </span>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 'clamp(38px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.08, color: '#111827', marginBottom: 28, letterSpacing: '-0.5px' }}>
            Manage Clients, Docs &<br />
            GST in{' '}
            <span className="lp-gradient-text">One System</span>
          </h1>

          {/* Sub-heading */}
          <p style={{ fontSize: 19, color: '#4b5563', lineHeight: 1.75, maxWidth: 580, margin: '0 auto 40px' }}>
            Stop using WhatsApp, Excel &amp; Google Drive. MyCAFile helps CA firms work{' '}
            <strong style={{ color: '#111827', fontWeight: 700 }}>faster, safer &amp; smarter</strong>.
          </p>

          {/* CTAs */}
          <div className="lp-hero-btns" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
            <button
              className="lp-btn-primary"
              style={{ padding: '16px 36px', fontSize: 16, boxShadow: '0 8px 30px rgba(124,58,237,0.30)' }}
              onClick={() => window.location.href = '/contact'}
            >
              Start Free Trial <ArrowRightIcon />
            </button>
            <button
              className="lp-btn-secondary"
              style={{ padding: '16px 32px', fontSize: 16 }}
              onClick={() => window.location.href = '/contact'}
            >
              <PlayCircleIcon /> Book Demo
            </button>
          </div>

          {/* Trust indicators */}
          <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="lp-check" style={{ fontSize: 13, color: '#6b7280' }}>✓ No credit card required</span>
            <span className="lp-check" style={{ fontSize: 13, color: '#6b7280' }}>✓ Free forever plan</span>
            <span className="lp-check" style={{ fontSize: 13, color: '#6b7280' }}><span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#9ca3af', textTransform: 'uppercase' }}>IN</span> Made for India</span>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ──────────────────────────────────── */}
      <section style={{ background: '#f9fafb', padding: '40px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 24 }}>TRUSTED BY 50+ CA FIRMS ACROSS INDIA</p>
          <div className="lp-firms" style={{ display: 'flex', gap: 40, justifyContent: 'center', alignItems: 'center' }}>
            {firms.map(f => <span key={f} style={{ color: '#6b7280', fontSize: 16, fontWeight: 600 }}>{f}</span>)}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ─────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="lp-section-label" style={{ color: '#ef4444' }}>THE PROBLEM</p>
            <h2 className="lp-section-title">Still managing your firm<br />like this?</h2>
          </div>
          <div className="lp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {[
              'Documents scattered across WhatsApp & Google Drive',
              'No proper client tracking — everything in Excel',
              'Missed GST & IT deadlines costing penalties',
              'Manual work everywhere — zero automation',
            ].map(item => (
              <div key={item} style={{ background: '#fff', border: '1.5px solid #fee2e2', borderRadius: 14, padding: '22px 24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}><XCircleIcon /></span>
                <span style={{ color: '#374151', fontSize: 15, fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(160deg, #ede9fe 0%, #e0e7ff 100%)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="lp-section-label">THE SOLUTION</p>
            <h2 className="lp-section-title">MyCAFile <span className="lp-gradient-text">solves all of this</span></h2>
          </div>
          <div className="lp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ color: '#ef4444' }}><XCircleIcon /></span>
                <span style={{ fontWeight: 700, fontSize: 18, color: '#ef4444' }}>Before</span>
              </div>
              {['Files lost in WhatsApp groups', 'Excel-based client tracking', 'Missed compliance deadlines', 'No client self-service'].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ color: '#fca5a5' }}><XCircleIcon /></span>
                  <span style={{ color: '#6b7280', fontSize: 15 }}>{i}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid #c4b5fd', borderRadius: 20, padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <CheckCircleIcon color="#7c3aed" />
                <span style={{ fontWeight: 700, fontSize: 18, color: '#7c3aed' }}>After — with MyCAFile</span>
              </div>
              {['Organized secure document storage', 'Smart client management dashboard', 'Automated deadline tracking & alerts', 'Client login portal for documents'].map(i => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                  <CheckCircleIcon color="#7c3aed" />
                  <span style={{ color: '#374151', fontSize: 15 }}>{i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section id="features" style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p className="lp-section-label">FEATURES</p>
            <h2 className="lp-section-title">Everything your CA firm needs</h2>
            <p className="lp-section-sub">Powerful features designed specifically for chartered accountants and tax consultants in India.</p>
          </div>
          <div className="lp-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} className="lp-feature-card">
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(147,51,234,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', marginBottom: 20 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 10, color: '#111827' }}>{f.title}</h3>
                <p style={{ color: '#6b7280', lineHeight: 1.6, fontSize: 15 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 24px', background: 'linear-gradient(160deg, #ede9fe 0%, #e0e7ff 100%)' }}>
        {/* Subtle bg overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.07) 0%, transparent 65%)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Section label */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: 12 }}>How it works</p>
          <h2 className="lp-section-title" style={{ marginBottom: 72 }}>Get started in 3 easy steps</h2>

          {/* Steps grid */}
          <div className="lp-step-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 40 }}>
            {[
              { num: 1, icon: <UserPlusIcon />, title: 'Add Clients', desc: 'Onboard your clients with basic details in seconds.' },
              { num: 2, icon: <UploadIcon />, title: 'Upload Documents', desc: 'Store all GST, IT, and compliance documents securely.' },
              { num: 3, icon: <ClipboardCheckIcon />, title: 'Track & Comply', desc: 'Monitor deadlines, tasks, and filing status effortlessly.' },
            ].map((s, i, arr) => (
              <div key={s.num} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                {/* Connector line (hidden on mobile) */}
                {i < arr.length - 1 && (
                  <div className="lp-step-connector" style={{
                    position: 'absolute',
                    top: 32,
                    left: '60%',
                    width: '80%',
                    height: 2,
                    background: 'linear-gradient(to right, rgba(124,58,237,0.35), transparent)',
                    zIndex: 0
                  }} />
                )}

                {/* Step number bubble */}
                <div style={{
                  position: 'relative', zIndex: 1,
                  width: 64, height: 64, borderRadius: 18,
                  background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.30)',
                  color: '#fff', fontSize: 22, fontWeight: 900,
                  margin: '0 auto'
                }}>
                  {s.num}
                </div>

                {/* Icon */}
                <div style={{ color: '#7c3aed', marginTop: 4 }}>{s.icon}</div>

                {/* Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, color: '#111827' }}>{s.title}</h3>
                  <p style={{ color: '#6b7280', lineHeight: 1.65, fontSize: 14, maxWidth: 220, margin: '0 auto' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT PREVIEW / DASHBOARD ─────────────────── */}
      <section style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p className="lp-section-label">PRODUCT PREVIEW</p>
            <h2 className="lp-section-title">Simple & powerful dashboard</h2>
          </div>
          {/* Mock browser window */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.10)' }}>
            <div style={{ background: '#f3f4f6', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
              <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 8, padding: '5px 14px', fontSize: 13, color: '#9ca3af', marginLeft: 8 }}>mycafile.in</div>
            </div>
            <div style={{ background: '#fff', padding: 32 }}>
              {/* Stats Row */}
              <div className="lp-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
                {[{ n: '124', l: 'Active Clients' }, { n: '1,847', l: 'Documents' }, { n: '312', l: 'Filings Done' }, { n: '98%', l: 'Compliance' }].map(s => (
                  <div key={s.l} style={{ background: '#f9fafb', borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 30, fontWeight: 800, color: '#111827' }}>{s.n}</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {/* Tasks */}
              <div style={{ fontWeight: 600, fontSize: 15, color: '#374151', marginBottom: 16 }}>Recent Tasks</div>
              {[
                { task: 'GSTR-1 Filing — Due 11 Jul', badge: 'Urgent', badgeColor: '#ef4444' },
                { task: 'IT Return — Ravi Sharma', badge: 'In Progress', badgeColor: '#3b82f6' },
                { task: 'GST Audit — Patel Enterprises', badge: 'Pending', badgeColor: '#9ca3af' },
              ].map(t => (
                <div key={t.task} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', border: '1px solid #f3f4f6', borderRadius: 10, marginBottom: 10, background: '#fafafa' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{t.task}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, background: t.badgeColor, color: '#fff', borderRadius: 30, padding: '4px 12px' }}>{t.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(160deg, #ede9fe 0%, #e0e7ff 100%)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="lp-section-label">BENEFITS</p>
            <h2 className="lp-section-title">Why CA Firms Choose MyCAFile</h2>
          </div>
          <div className="lp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {benefits.map(b => (
              <div key={b.title} className="lp-benefit-card">
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  {b.icon}
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{b.title}</h3>
                  <p style={{ color: '#6b7280', lineHeight: 1.6, fontSize: 15 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="lp-section-label">TESTIMONIALS</p>
            <h2 className="lp-section-title">Loved by CA professionals</h2>
          </div>
          <div className="lp-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {testimonials.map(t => (
              <div key={t.name} className="lp-testimonial-card">
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} />)}
                </div>
                <p style={{ color: '#374151', lineHeight: 1.7, fontSize: 15, marginBottom: 24, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                  <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>{t.firm}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '112px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', maxWidth: 672, margin: '0 auto 40px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: 16 }}>Pricing</p>
            <h2 className="lp-section-title" style={{ marginBottom: 16 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 18, color: '#6b7280' }}>
              🔥 <strong style={{ color: '#111827', fontWeight: 600 }}>Limited offer</strong> for first 50 users
            </p>
          </div>

          {/* Toggle Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 56 }}>
            <div style={{ background: '#f3f4f6', borderRadius: 50, padding: 4, display: 'inline-flex', gap: 4 }}>
               <button onClick={() => setWithCloud(false)} style={{ background: !withCloud ? '#fff' : 'transparent', color: !withCloud ? '#111827' : '#6b7280', padding: '10px 24px', borderRadius: 50, border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: !withCloud ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>Without Cloud</button>
               <button onClick={() => setWithCloud(true)} style={{ background: withCloud ? '#fff' : 'transparent', color: withCloud ? '#7c3aed' : '#6b7280', padding: '10px 24px', borderRadius: 50, border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: withCloud ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>With Cloud ☁️</button>
            </div>
          </div>

          <div className="lp-pricing-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, alignItems: 'flex-start' }}>
            {[
                { name: 'Starter', target: 'Get started with the basics', price: 0, interval: 'forever', features: ['10 clients', '1 staff user', 'Task Management', 'Client Management'], highlight: false, withCloud: false },
                { name: 'Professional', target: 'For simple workflows', price: 4999, interval: '/year', features: ['300 clients', '2 staff users', 'Basic Billing', 'Limited Auto Task', 'Email Reminders'], highlight: false, withCloud: false },
                { name: 'Enterprise', target: 'Perfect for growing firms', price: 6999, interval: '/year', features: ['1000 clients', '10 staff users', 'Full Billing System', 'Auto Task Generator', 'SMS Reminders'], highlight: true, withCloud: false },
                { name: 'Pro Cloud', target: 'Cloud integrated tasks', price: 6499, interval: '/year', features: ['500 clients', '5 staff users', 'Cloud Storage (100GB)', 'Advanced Billing'], highlight: false, withCloud: true },
                { name: 'Enterprise Cloud', target: 'For large corporate scale', price: 9999, interval: '/year', features: ['1000 clients', '10 staff users', 'Cloud Storage (300GB)', 'Dedicated Database'], highlight: true, withCloud: true }
            ]
            .filter(plan => plan.withCloud === withCloud)
            .map(plan => (
                <div key={plan.name} style={{ 
                    flex: '1 1 300px', maxWidth: '340px',
                    ...(plan.highlight ? {
                      background: 'linear-gradient(135deg, #7c3aed, #9333ea)', borderRadius: 24, padding: 32, position: 'relative', transform: 'scale(1.04)', zIndex: 10, boxShadow: '0 20px 60px rgba(124,58,237,0.3)'
                    } : {
                      background: '#fff', border: '1px solid rgba(229,231,235,0.6)', borderRadius: 24, padding: 32, position: 'relative'
                    })
                }}>
                  {plan.highlight && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#fff', borderRadius: 50, padding: '4px 16px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                      <SparklesIcon /> Most Popular
                    </div>
                  )}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 20, color: plan.highlight ? '#fff' : '#111827', marginBottom: 4 }}>{plan.name}</h3>
                    <p style={{ color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: 14 }}>{plan.target}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: plan.highlight ? '#fff' : '#111827' }}>₹{plan.price.toLocaleString()}</span>
                    <span style={{ color: plan.highlight ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: 14 }}> {plan.interval}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: plan.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: plan.highlight ? '#fff' : '#7c3aed' }}>
                          <CheckIcon size={12} />
                        </div>
                        <span style={{ fontSize: 14, color: plan.highlight ? '#fff' : '#374151' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className={plan.highlight ? 'lp-pricing-btn-white' : 'lp-pricing-btn-outline'} onClick={() => window.location.href = '/login'}>{plan.price === 0 ? 'Get Started Free' : 'Choose Plan'}</button>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" style={{ padding: '96px 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="lp-section-label">FAQ</p>
            <h2 className="lp-section-title">Frequently asked questions</h2>
          </div>
          {faqs.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #9333ea 100%)', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: '#fff', marginBottom: 20 }}>Ready to simplify your CA work?</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, marginBottom: 36 }}>Join 50+ CA firms already using MyCAFile to save time and grow their practice.</p>
          <button className="lp-btn-secondary" style={{ fontSize: 16, padding: '16px 36px' }} onClick={() => window.location.href = '/contact'}>Start Free Trial <ArrowRightIcon /></button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer style={{ background: '#111827', color: '#9ca3af', padding: '60px 24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="lp-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
            <div>
              <div className="lp-footer-logo-box" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/faviconca.webp" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                </div>
                MyCAFile
              </div>
              <p className="lp-footer-desc" style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>Practice management software built for Indian CA firms. Simple, secure, and smart.</p>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Product</h4>
              {[
                { label: 'Features', action: () => scrollTo('features') },
                { label: 'Pricing', action: () => window.location.href = '/pricing' },
                { label: 'FAQ', action: () => scrollTo('faq') },
                { label: 'Login', action: () => window.location.href = '/login' },
              ].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}>
                  <button className="lp-footer-link" onClick={l.action}>{l.label}</button>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Company</h4>
              {[
                { label: 'About', href: '/about' },
                { label: 'Careers', href: '/careers' },
                { label: 'Contact', href: '/contact' },
                { label: 'Press', href: '/press' },
              ].map(l => (
                <div key={l.label} style={{ marginBottom: 10 }}>
                  <button className="lp-footer-link" onClick={() => window.location.href = l.href}>{l.label}</button>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Contact</h4>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <MailIcon /><span style={{ fontSize: 14 }}>support@mycafile.in</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <PhoneIcon /><span style={{ fontSize: 14 }}>+91 9537994439</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1f2937', paddingTop: 24, textAlign: 'center', fontSize: 14 }}>
            Copyright © 2024 MyCAFile. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
