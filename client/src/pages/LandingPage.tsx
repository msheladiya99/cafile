import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowUpRight,
  Calculator,
  Check,
  Cloud,
  FileText,
  ListChecks,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`calm-container ${className}`}>{children}</div>
);

const SectionLabel = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <div className="calm-section-label">
    <span className="calm-label-number">{n}</span>
    <span className="calm-label-line" />
    <span>{children}</span>
  </div>
);

function Nav() {
  return (
    <header className="calm-nav">
      <Container className="calm-nav-inner">
        <a href="/" className="calm-brand">
          <span className="calm-brand-mark">
            <img src="/faviconca.webp" alt="" />
          </span>
          <span>MyCAFile</span>
        </a>
        <nav className="calm-nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="calm-nav-actions">
          <a href="/login" className="calm-nav-login">Login</a>
          <a href="/contact" className="calm-nav-cta">
            Start free trial
            <ArrowUpRight size={16} />
          </a>
        </div>
      </Container>
    </header>
  );
}

function Hero() {
  const filings = [
    { client: 'Acme Pvt Ltd', work: 'GSTR-3B', status: 'Due', tone: 'danger' },
    { client: 'R Sharma & Sons', work: 'ITR Filing', status: 'Review', tone: 'primary' },
    { client: 'Krish Industries', work: 'TDS Q3', status: 'Filed', tone: 'success' },
    { client: 'Nair Exports', work: 'GSTR-1', status: 'Draft', tone: 'accent' },
  ];

  return (
    <section className="calm-hero">
      <Container className="calm-hero-grid">
        <div>
          <SectionLabel n="01">For Chartered Accountants</SectionLabel>
          <h1>
            A <em>calmer</em> way to run your CA practice.
          </h1>
          <p className="calm-hero-copy">
            Clients, documents, GST and team tasks held together in one quiet workspace so deadlines
            stop chasing you and you can do the work that actually matters.
          </p>
          <div className="calm-hero-actions">
            <a href="/contact" className="calm-button calm-button-dark">
              Begin 14-day trial <ArrowUpRight size={16} />
            </a>
            <a href="#workflow" className="calm-text-link">
              See how it works <span aria-hidden="true">-&gt;</span>
            </a>
          </div>
          <div className="calm-social-proof">
            <div className="calm-avatars" aria-hidden="true">
              <img src="/avatars/avatar1.png" alt="" />
              <img src="/avatars/avatar2.png" alt="" />
              <img src="/avatars/avatar3.png" alt="" />
              <img src="/avatars/avatar4.png" alt="" />
            </div>
            <div>
              <div className="calm-stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
              </div>
              <p>Trusted by 2,400+ Indian CA firms</p>
            </div>
          </div>
        </div>

        <div className="calm-hero-panel-wrap">
          <div className="calm-hero-glow" />
          <div className="calm-filing-card">
            <div className="calm-card-head">
              <span>Today's Filings</span>
              <strong>8 due</strong>
            </div>
            <ul>
              {filings.map((filing) => (
                <li key={filing.client}>
                  <span>
                    <strong>{filing.client}</strong>
                    <small>{filing.work}</small>
                  </span>
                  <em className={`calm-pill calm-pill-${filing.tone}`}>{filing.status}</em>
                </li>
              ))}
            </ul>
          </div>
          <div className="calm-rate-card">
            <span>On-time Rate</span>
            <strong>98.4%</strong>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Marquee() {
  return (
    <div className="calm-marquee">
      <Container className="calm-marquee-inner">
        {['ICAI Compliant', 'ISO 27001', 'AES-256 Encrypted', 'Made in India', 'GST Ready', 'Multi-User'].map(
          (item, index) => (
            <span key={item}>
              {index > 0 && <i aria-hidden="true" />}
              {item}
            </span>
          ),
        )}
      </Container>
    </div>
  );
}

function Features() {
  const features = [
    { icon: Users, title: 'Client Management', desc: 'PAN, GSTIN, engagements and contacts in one organised place.' },
    { icon: FileText, title: 'Secure Documents', desc: 'Request, store and share files with bank-grade encryption.' },
    { icon: Calculator, title: 'GST Tracking', desc: 'All returns and due dates across every client at a glance.' },
    { icon: ListChecks, title: 'Task Tracking', desc: 'Assign work, set deadlines and watch the team in real time.' },
    { icon: Cloud, title: 'Cloud Access', desc: 'Office, home or court, your firm follows you everywhere.' },
    { icon: ShieldCheck, title: 'Audit Trail', desc: 'Every action logged. Granular role-based permissions built-in.' },
  ];

  return (
    <section id="features" className="calm-section">
      <Container>
        <div className="calm-split">
          <div>
            <SectionLabel n="02">What's inside</SectionLabel>
            <h2>
              Tools that <em>disappear</em> into your work.
            </h2>
            <p className="calm-section-copy">
              Every feature designed alongside practising CAs. No clutter, no upsells in your face,
              only what a serious firm actually needs.
            </p>
          </div>
          <div className="calm-feature-grid">
            {features.map(({ icon: Icon, title, desc }) => (
              <article key={title}>
                <Icon size={21} />
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Workflow() {
  const steps = [
    { n: 'I', title: 'Bring your clients in', desc: 'Import from CSV or add manually. Existing tools migrate during onboarding.' },
    { n: 'II', title: 'Collect documents calmly', desc: 'Send a single secure link. Clients upload, you stay focused.' },
    { n: 'III', title: 'File on time, every time', desc: 'GSTR, ITR, TDS tracked, assigned and filed without the panic.' },
  ];

  return (
    <section id="workflow" className="calm-section calm-band">
      <Container>
        <div className="calm-centered calm-workflow-head">
          <SectionLabel n="03">The Workflow</SectionLabel>
          <h2>
            Three quiet steps to a <em>calmer</em> firm.
          </h2>
        </div>
        <div className="calm-workflow-grid">
          {steps.map((step, index) => (
            <article key={step.n}>
              <div>{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              {index < steps.length - 1 && <span aria-hidden="true" />}
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Quote() {
  return (
    <section className="calm-section">
      <Container className="calm-quote">
        <SectionLabel n="04">In their words</SectionLabel>
        <blockquote>
          "We replaced four tools with MyCAFile. Filing season used to be war.
          <em> Now it just feels like work.</em>"
        </blockquote>
        <div className="calm-person">
          <span>AM</span>
          <p>
            <strong>CA Anjali Mehta</strong>
            <small>Partner, Mehta & Co.</small>
          </p>
        </div>
      </Container>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    { quote: 'Document collection went from a 3-day chase to a single link.', name: 'CA Rohan Iyer', role: 'Founder, Iyer Advisory' },
    { quote: 'GST filings are calm now. I see everything at a glance.', name: 'CA Priya Nair', role: 'Senior Partner, Nair & Associates' },
    { quote: 'Onboarded my whole team in an afternoon. That tells you something.', name: 'CA Vikram Joshi', role: 'Joshi & Patel' },
  ];

  return (
    <section className="calm-section calm-testimonial-band">
      <Container>
        <div className="calm-testimonial-grid">
          {testimonials.map((item) => (
            <figure key={item.name}>
              <div className="calm-stars">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
              </div>
              <blockquote>"{item.quote}"</blockquote>
              <figcaption>
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Pricing() {
  const [withCloud, setWithCloud] = useState(false);

  const plans = !withCloud ? [
    {
      name: 'Starter',
      price: '₹0',
      per: 'forever',
      desc: 'Get started with the basics.',
      features: ['Up to 10 clients', '1 staff user', 'Task Management', 'Basic Portal'],
      cta: 'Get Started Free',
    },
    {
      name: 'Professional',
      price: '₹4,999',
      per: 'per year',
      desc: 'For simple workflows.',
      features: ['Up to 300 clients', '2 staff users', 'Basic Billing', 'Limited Auto Task'],
      cta: 'Choose Plan',
    },
    {
      name: 'Enterprise',
      price: '₹6,999',
      per: 'per year',
      desc: 'Perfect for growing firms.',
      features: ['Up to 1000 clients', '10 staff users', 'Full Billing System', 'Auto Task Generator'],
      cta: 'Choose Plan',
      popular: true,
    },
  ] : [
    {
      name: 'Pro Cloud',
      price: '₹6,499',
      per: 'per year',
      desc: 'For simple workflows on cloud.',
      features: ['Up to 500 clients', '5 staff users', '100GB Cloud Storage', 'Advanced Billing'],
      cta: 'Choose Plan',
    },
    {
      name: 'Enterprise Cloud',
      price: '₹9,999',
      per: 'per year',
      desc: 'Perfect for growing firms.',
      features: ['Up to 1000 clients', '10 staff users', '300GB Cloud Storage', 'Full Automation'],
      cta: 'Choose Plan',
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="calm-section calm-pricing-section">
      <Container>
        <div className="calm-pricing-layout">
          <div>
            <SectionLabel n="05">Pricing</SectionLabel>
            <h2>
              Honest pricing. <em>No surprises.</em>
            </h2>
            <p className="calm-section-copy">
              Every plan includes a 14-day free trial. No card required to start. Cancel anytime.
            </p>

            <div className="calm-pricing-toggle">
              <button 
                type="button" 
                className={!withCloud ? 'active' : ''} 
                onClick={() => setWithCloud(false)}
              >
                Without Cloud
              </button>
              <button 
                type="button" 
                className={withCloud ? 'active' : ''} 
                onClick={() => setWithCloud(true)}
              >
                With Cloud
              </button>
            </div>
          </div>
          <div className={`calm-pricing-grid ${withCloud ? 'calm-pricing-grid-cloud' : ''}`}>
            {plans.map((plan) => (
              <article key={plan.name} className={plan.popular ? 'calm-plan calm-plan-popular' : 'calm-plan'}>
                {plan.popular && <span className="calm-plan-badge">Most chosen</span>}
                <h3>{plan.name}</h3>
                <p>{plan.desc}</p>
                <div className="calm-price">
                  <strong>{plan.price}</strong>
                  <span>{plan.per}</span>
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => { window.location.href = '/contact'; }}>
                  {plan.cta}
                </button>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: 'Is my client data secure?', a: 'Yes. All data is encrypted in transit and at rest with AES-256, hosted in ISO 27001 certified data centres in India.' },
    { q: 'Can I import data from my current tools?', a: 'We support CSV import for clients and bulk upload for documents. Our team helps with migration during onboarding.' },
    { q: 'Do you support multi-user firms?', a: 'Yes. Invite partners and staff with role-based permissions on the Practice and Firm plans.' },
    { q: 'How does the trial work?', a: 'Every plan includes a 14-day free trial with no credit card required. Cancel any time without questions.' },
    { q: 'Do you offer onboarding help?', a: 'Yes. Practice and Firm plans include white-glove onboarding and live training for your team.' },
  ];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="calm-section calm-band calm-faq-section">
      <Container className="calm-faq-layout">
        <div>
          <SectionLabel n="06">FAQ</SectionLabel>
          <h2>
            Questions, <em>answered.</em>
          </h2>
        </div>
        <div className="calm-faq-list">
          {faqs.map((faq, index) => (
            <div key={faq.q}>
              <button type="button" onClick={() => setOpen(open === index ? null : index)}>
                <span>{faq.q}</span>
                {open === index ? <Minus size={16} /> : <Plus size={16} />}
              </button>
              {open === index && <p>{faq.a}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CTA() {
  return (
    <section className="calm-section">
      <Container className="calm-cta">
        <Sparkles size={25} />
        <h2>
          Ready for a <em>calmer</em> filing season?
        </h2>
        <p>Join 2,400+ firms already running a quieter, more focused practice with MyCAFile.</p>
        <a href="/contact" className="calm-button calm-button-dark">
          Begin your free trial <ArrowUpRight size={16} />
        </a>
      </Container>
    </section>
  );
}

function Footer() {
  const columns = [
    {
      heading: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Workflow', href: '#workflow' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'FAQ', href: '#faq' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press', href: '/press' },
      ],
    },
    {
      heading: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms of Service', href: '/terms-of-service' },
        { label: 'Refund Policy', href: '/refund-policy' },
      ],
    },
  ];

  return (
    <footer className="calm-footer">
      <Container>
        <div className="calm-footer-grid">
          <div>
            <a href="/" className="calm-brand">
              <span className="calm-brand-mark">
                <img src="/faviconca.webp" alt="" />
              </span>
              <span>MyCAFile</span>
            </a>
            <p>The calm operating system for modern Chartered Accountants.</p>
          </div>
          {columns.map((column) => (
            <nav key={column.heading}>
              <strong>{column.heading}</strong>
              {column.links.map((link) => (
                <a key={link.label} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="calm-footer-bottom">
          <span>Copyright (c) {new Date().getFullYear()} MyCAFile. Built in India</span>
          <span>
            <a href="/privacy-policy">Privacy</a>
            <a href="/terms-of-service">Terms</a>
            <a href="/">Status</a>
          </span>
        </div>
      </Container>
    </footer>
  );
}

export const LandingPage = () => (
  <div className="calm-page">
    <Helmet>
      <title>MyCAFile - A calmer way to run your CA practice</title>
      <meta
        name="description"
        content="Editorial, focused workspace for Chartered Accountants. Clients, documents, GST and tasks handled with quiet precision."
      />
      <link rel="canonical" href="https://www.mycafile.in/" />
    </Helmet>
    <style>{calmLandingCss}</style>
    <Nav />
    <main>
      <Hero />
      <Marquee />
      <Features />
      <Workflow />
      <Quote />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
    </main>
    <Footer />
  </div>
);

const calmLandingCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');

.calm-page {
  --calm-bg: oklch(0.99 0.005 285);
  --calm-fg: oklch(0.22 0.05 285);
  --calm-card: #fff;
  --calm-primary: oklch(0.55 0.22 285);
  --calm-primary-soft: oklch(0.92 0.06 285);
  --calm-primary-contrast: oklch(0.99 0.005 285);
  --calm-muted: oklch(0.5 0.04 285);
  --calm-border: oklch(0.929 0.013 255.508);
  --calm-accent: oklch(0.85 0.1 285);
  --calm-warning: oklch(0.78 0.15 70);
  --calm-shadow-card: 0 1px 2px oklch(0.55 0.22 285 / 0.06), 0 8px 24px -12px oklch(0.55 0.22 285 / 0.18);
  --calm-shadow-elevated: 0 14px 50px -14px oklch(0.55 0.22 285 / 0.32);
  min-height: 100vh;
  background: var(--calm-bg);
  color: var(--calm-fg);
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  overflow-x: hidden;
}

.calm-page * { box-sizing: border-box; }
.calm-page a { color: inherit; text-decoration: none; }
.calm-page h1,
.calm-page h2,
.calm-page h3,
.calm-page blockquote,
.calm-brand,
.calm-label-number {
  font-family: 'Fraunces', Georgia, serif;
}
.calm-page h1,
.calm-page h2,
.calm-page h3,
.calm-page p,
.calm-page blockquote,
.calm-page ul,
.calm-page figure { margin: 0; }
.calm-page em { color: var(--calm-primary); font-style: italic; font-weight: 500; }
.calm-container { width: min(100%, 72rem); margin: 0 auto; padding: 0 1.5rem; }
.calm-section { padding: 7rem 0; }
.calm-band { border-block: 1px solid var(--calm-border); background: linear-gradient(180deg, var(--calm-bg), var(--calm-bg)); }
.calm-section-label { display: flex; align-items: center; gap: .75rem; color: var(--calm-primary); font-size: .72rem; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; }
.calm-label-number { letter-spacing: 0; }
.calm-label-line { display: block; width: 2rem; height: 1px; background: color-mix(in oklch, var(--calm-primary), transparent 70%); }
.calm-nav { border-bottom: 1px solid color-mix(in oklch, var(--calm-border), transparent 30%); background: color-mix(in oklch, var(--calm-bg), white 20%); }
.calm-nav-inner { min-height: 4rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
.calm-brand { display: inline-flex; align-items: center; gap: .65rem; font-size: 1.25rem; font-weight: 700; letter-spacing: -.01em; white-space: nowrap; }
.calm-brand > span:last-child { transform: translateY(0.15rem); }
.calm-brand-mark { width: 2rem; height: 2rem; display: grid; place-items: center; flex: 0 0 auto; }
.calm-brand-mark img { width: 2.35rem; height: 2.35rem; max-width: none; object-fit: contain; display: block; }
.calm-nav-links { display: flex; align-items: center; gap: 2.25rem; color: var(--calm-muted); font-size: .9rem; }
.calm-nav-links a:hover { color: var(--calm-fg); }
.calm-nav-actions { display: flex; align-items: center; gap: 1.5rem; }
.calm-nav-login { font-size: .9rem; font-weight: 600; color: var(--calm-muted); transition: color .2s ease; }
.calm-nav-login:hover { color: var(--calm-fg); }
.calm-nav-cta { display: inline-flex; align-items: center; gap: .25rem; border-bottom: 1px solid var(--calm-fg); padding-bottom: .15rem; font-size: .9rem; font-weight: 600; }
.calm-nav-cta svg { transition: transform .2s ease; }
.calm-nav-cta:hover svg { transform: translate(.1rem, -.1rem); }
.calm-hero { position: relative; }
.calm-hero-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(19rem, 5fr); gap: 2.5rem; padding-top: 5rem; padding-bottom: 4.25rem; align-items: start; }
.calm-hero h1 { margin-top: 1.5rem; max-width: 44rem; font-size: clamp(3.25rem, 7vw, 4.5rem); line-height: 1.08; letter-spacing: -.03em; font-weight: 620; }
.calm-page .calm-hero-copy { margin-top: 1rem; max-width: 36rem; color: var(--calm-muted); font-size: 1.1rem; line-height: 1.62; }
.calm-hero-actions { margin-top: 2.25rem; display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; }
.calm-button { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: 3rem; border-radius: 999px; padding: .75rem 1.5rem; font-size: .9rem; font-weight: 600; transition: opacity .2s ease, transform .2s ease; }
.calm-button:hover { opacity: .9; transform: translateY(-1px); }
.calm-page .calm-button-dark { background: var(--calm-fg); color: var(--calm-bg); }
.calm-text-link { font-size: .9rem; font-weight: 600; text-underline-offset: .25rem; }
.calm-text-link:hover { text-decoration: underline; }
.calm-social-proof { margin-top: 3rem; display: flex; align-items: center; gap: 1.5rem; }
.calm-avatars { display: flex; }
.calm-avatars img { width: 3rem; height: 3rem; border-radius: 999px; border: 2.5px solid var(--calm-bg); margin-left: -.85rem; object-fit: cover; background: var(--calm-primary-soft); }
.calm-avatars img:first-child { margin-left: 0; }
.calm-stars { display: flex; gap: .125rem; color: var(--calm-warning); }
.calm-social-proof p { margin-top: .25rem; color: var(--calm-muted); font-size: .76rem; }
.calm-hero-panel-wrap { position: relative; min-height: 30.5rem; display: grid; align-items: start; padding-top: .1rem; }
.calm-hero-glow { position: absolute; inset: 1rem -1.5rem; border-radius: 2rem; background: color-mix(in oklch, var(--calm-primary-soft), transparent 40%); filter: blur(32px); }
.calm-filing-card { position: relative; transform: rotate(-1.5deg); border: 1px solid var(--calm-border); border-radius: 1rem; background: var(--calm-card); padding: 1.35rem 1.25rem 1.2rem; box-shadow: var(--calm-shadow-elevated); }
.calm-card-head { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--calm-border); padding-bottom: .85rem; color: var(--calm-muted); font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; }
.calm-card-head strong { color: var(--calm-primary); letter-spacing: 0; text-transform: none; }
.calm-filing-card ul { list-style: none; padding: .85rem 0 0; display: grid; gap: .86rem; }
.calm-filing-card li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; font-size: .92rem; }
.calm-filing-card small { display: block; margin-top: .12rem; color: var(--calm-muted); font-size: .75rem; }
.calm-page .calm-pill { border-radius: 999px; padding: .2rem .65rem; font-size: .75rem; font-style: normal; font-weight: 700; }
.calm-page .calm-pill-danger { background: oklch(0.577 0.245 27.325 / .1); color: oklch(0.5 0.2 27); }
.calm-page .calm-pill-primary { background: oklch(0.55 0.22 285 / .1); color: var(--calm-primary); }
.calm-page .calm-pill-success { background: oklch(0.65 0.15 155 / .15); color: oklch(0.4 0.12 155); }
.calm-page .calm-pill-accent { background: color-mix(in oklch, var(--calm-accent), transparent 60%); color: oklch(0.28 0.12 285); }
.calm-rate-card { position: absolute; left: -1.5rem; bottom: -1.15rem; transform: rotate(3deg); border: 1px solid var(--calm-border); border-radius: .8rem; background: var(--calm-card); padding: .8rem 1rem; box-shadow: var(--calm-shadow-card); }
.calm-rate-card span { display: block; color: var(--calm-muted); font-size: .62rem; letter-spacing: .12em; text-transform: uppercase; }
.calm-rate-card strong { display: block; margin-top: .1rem; color: var(--calm-primary); font-family: 'Fraunces', Georgia, serif; font-size: 1.55rem; }
.calm-marquee { border-block: 1px solid var(--calm-border); background: var(--calm-bg); padding: 1.25rem 0; }
.calm-marquee-inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .7rem 2.5rem; color: var(--calm-primary); font-size: .72rem; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; }
.calm-marquee span { display: inline-flex; align-items: center; gap: .75rem; }
.calm-marquee i { width: .25rem; height: .25rem; border-radius: 999px; background: color-mix(in oklch, var(--calm-muted), transparent 60%); }
.calm-split { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 2.5rem; align-items: start; }
.calm-page h2 { margin-top: 1.25rem; font-size: clamp(2.25rem, 5vw, 3rem); line-height: 1.08; letter-spacing: -.025em; font-weight: 650; }
.calm-section-copy { margin-top: 1.25rem; color: var(--calm-muted); line-height: 1.7; }
.calm-feature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--calm-border); border-radius: 1rem; background: var(--calm-border); }
.calm-feature-grid article { background: var(--calm-card); padding: 1.5rem; transition: background .2s ease; }
.calm-feature-grid article:hover { background: var(--calm-bg); }
.calm-feature-grid svg { color: var(--calm-primary); }
.calm-feature-grid h3 { margin-top: 1rem; font-size: 1.1rem; font-weight: 650; }
.calm-feature-grid p { margin-top: .5rem; color: var(--calm-muted); font-size: .9rem; line-height: 1.55; }
.calm-centered { display: grid; justify-items: center; text-align: center; }
.calm-centered h2 { max-width: 42rem; }
.calm-workflow-head { justify-items: start; text-align: left; }
.calm-workflow-head h2 { justify-self: center; text-align: center; }
.calm-workflow-grid { margin-top: 4rem; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2.5rem; }
.calm-workflow-grid article { position: relative; }
.calm-workflow-grid article > div { color: color-mix(in oklch, var(--calm-primary), transparent 80%); font-family: 'Fraunces', Georgia, serif; font-size: 4.5rem; font-weight: 700; line-height: 1; }
.calm-workflow-grid h3 { margin-top: .75rem; font-size: 1.55rem; }
.calm-workflow-grid p { margin-top: .75rem; color: var(--calm-muted); font-size: .9rem; line-height: 1.7; }
.calm-workflow-grid article > span { position: absolute; right: 0; top: 3rem; width: 2.5rem; height: 1px; background: var(--calm-border); }
.calm-quote { max-width: 72rem; display: grid; justify-items: start; text-align: center; }
.calm-quote blockquote { width: 100%; margin-top: 2rem; font-size: clamp(2rem, 5vw, 2.5rem); line-height: 1.2; font-weight: 550; }
.calm-person { margin-top: 2rem; display: flex; align-items: center; gap: 1rem; text-align: left; }
.calm-quote .calm-person { justify-self: center; }
.calm-person > span { width: 2.75rem; height: 2.75rem; border-radius: 999px; display: grid; place-items: center; background: var(--calm-primary); color: var(--calm-primary-contrast); font-size: .85rem; font-weight: 700; }
.calm-person small { display: block; margin-top: .25rem; color: var(--calm-muted); font-size: .75rem; }
.calm-testimonial-band { border-block: 1px solid var(--calm-border); background: #f8f8fc; padding: 6rem 0; }
.calm-testimonial-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid var(--calm-border); border-radius: 1rem; background: var(--calm-border); }
.calm-testimonial-grid figure { background: var(--calm-card); padding: 1.75rem; }
.calm-testimonial-grid blockquote { margin-top: 1rem; font-size: 1.15rem; line-height: 1.35; }
.calm-testimonial-grid figcaption { margin-top: 1.5rem; }
.calm-testimonial-grid small { display: block; margin-top: .2rem; color: var(--calm-muted); font-size: .75rem; }
.calm-pricing-section { background: #f8f8fc; }
.calm-pricing-layout { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 2.5rem; align-items: start; }
.calm-pricing-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.calm-pricing-grid-cloud { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 30rem; }
.calm-pricing-toggle { margin-top: 2.5rem; display: inline-flex; background: #eeeef4; padding: .3rem; border-radius: 999px; gap: .25rem; }
.calm-pricing-toggle button { border: 0; background: transparent; padding: .65rem 1.5rem; border-radius: 999px; font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s ease; color: var(--calm-muted); }
.calm-pricing-toggle button.active { background: var(--calm-card); color: var(--calm-fg); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.calm-plan { position: relative; display: flex; flex-direction: column; min-height: 100%; border: 1px solid var(--calm-border); border-radius: 1rem; background: var(--calm-card); padding: 1.5rem; }
.calm-plan-popular { border-color: var(--calm-primary); background: var(--calm-primary); color: var(--calm-primary-contrast); }
.calm-plan-badge { position: absolute; top: -.75rem; left: 1.5rem; border-radius: 999px; background: var(--calm-accent); color: oklch(0.28 0.12 285); padding: .2rem .65rem; font-size: .68rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.calm-plan h3 { font-size: 1.25rem; }
.calm-plan > p { margin-top: .3rem; min-height: 2.2rem; color: var(--calm-muted); font-size: .78rem; line-height: 1.45; }
.calm-plan-popular > p { color: color-mix(in oklch, var(--calm-primary-contrast), transparent 25%); }
.calm-price { margin-top: 1rem; display: flex; align-items: baseline; gap: .35rem; }
.calm-price strong { font-family: 'Fraunces', Georgia, serif; font-size: 1.85rem; }
.calm-price span { color: var(--calm-muted); font-size: .75rem; }
.calm-plan-popular .calm-price span { color: color-mix(in oklch, var(--calm-primary-contrast), transparent 30%); }
.calm-plan ul { list-style: none; padding: .85rem 0 0; display: grid; gap: .6rem; flex: 1; font-size: .9rem; }
.calm-plan li { display: flex; align-items: flex-start; gap: .5rem; }
.calm-plan li svg { flex: 0 0 auto; margin-top: .15rem; color: var(--calm-primary); }
.calm-plan-popular li svg { color: var(--calm-primary-contrast); }
.calm-plan button { margin-top: 1.25rem; width: 100%; border: 0; border-radius: 999px; background: var(--calm-fg); color: var(--calm-bg); padding: .8rem 1rem; font: inherit; font-size: .9rem; font-weight: 700; cursor: pointer; }
.calm-plan-popular button { background: var(--calm-card); color: var(--calm-primary); }
.calm-faq-section { background: #f8f7fd; }
.calm-faq-layout { display: grid; grid-template-columns: minmax(0, 4fr) minmax(0, 8fr); gap: 3rem; }
.calm-faq-list { border-block: 1px solid var(--calm-border); }
.calm-faq-list > div + div { border-top: 1px solid var(--calm-border); }
.calm-faq-list button { width: 100%; border: 0; background: transparent; color: var(--calm-fg); display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 0; text-align: left; font: inherit; cursor: pointer; }
.calm-faq-list button span { font-family: 'Fraunces', Georgia, serif; font-size: 1.1rem; font-weight: 550; }
.calm-faq-list button svg { color: var(--calm-primary); flex: 0 0 auto; }
.calm-faq-list p { padding: 0 0 1.25rem; color: var(--calm-muted); font-size: .9rem; line-height: 1.7; }
.calm-cta { display: grid; justify-items: center; text-align: center; }
.calm-cta > svg { color: var(--calm-primary); }
.calm-cta h2 { max-width: 48rem; font-size: clamp(3rem, 7vw, 3.75rem); line-height: 1.05; }
.calm-cta p { margin-top: 1.25rem; max-width: 28rem; color: var(--calm-muted); line-height: 1.65; }
.calm-cta .calm-button { margin-top: 2.25rem; }
.calm-footer { border-top: 1px solid var(--calm-border); background: var(--calm-card); padding: 4rem 0 2rem; }
.calm-footer-grid { display: grid; grid-template-columns: minmax(0, 5fr) repeat(3, minmax(0, 2fr)); gap: 2.5rem; }
.calm-footer-grid p { margin-top: 1.25rem; max-width: 23rem; font-family: 'Fraunces', Georgia, serif; font-size: 1.5rem; line-height: 1.25; }
.calm-footer nav { display: grid; align-content: start; gap: .75rem; font-size: .9rem; }
.calm-footer nav strong { color: var(--calm-primary); font-size: .72rem; letter-spacing: .22em; text-transform: uppercase; }
.calm-footer nav a { color: color-mix(in oklch, var(--calm-fg), transparent 20%); }
.calm-footer nav a:hover { color: var(--calm-fg); }
.calm-footer-bottom { margin-top: 3.5rem; border-top: 1px solid var(--calm-border); padding-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; color: var(--calm-muted); font-size: .78rem; }
.calm-footer-bottom span:last-child { display: flex; gap: 1.25rem; }

@media (max-width: 900px) {
  .calm-nav-links { display: none; }
  .calm-hero-grid,
  .calm-split,
  .calm-pricing-layout,
  .calm-faq-layout { grid-template-columns: 1fr; }
  .calm-hero-grid { padding-top: 4rem; }
  .calm-pricing-grid,
  .calm-testimonial-grid,
  .calm-workflow-grid { grid-template-columns: 1fr; }
  .calm-workflow-grid article > span { display: none; }
  .calm-footer-grid { grid-template-columns: 1fr 1fr; }
  .calm-footer-grid > div:first-child { grid-column: 1 / -1; }
}

@media (max-width: 640px) {
  .calm-container { padding: 0 1.1rem; }
  .calm-section { padding: 5rem 0; }
  .calm-nav-inner { gap: 1rem; }
  .calm-nav-cta { font-size: .8rem; }
  .calm-hero h1 { font-size: 3.15rem; }
  .calm-hero-copy { font-size: 1rem; }
  .calm-hero-actions { align-items: stretch; }
  .calm-button { width: 100%; }
  .calm-feature-grid { grid-template-columns: 1fr; }
  .calm-rate-card { left: .5rem; }
  .calm-footer-grid { grid-template-columns: 1fr; }
  .calm-footer-bottom { align-items: flex-start; flex-direction: column; }
}
`;

export default LandingPage;
