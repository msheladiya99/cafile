import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import {
  ArrowUpRight, Check, Users, FileText, Calculator, ListChecks, ShieldCheck,
  Cloud, Sparkles, Star, Plus, Minus, FileSpreadsheet,
} from "lucide-react";
import "./LandingPage.css";

const Container = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>
);

const SectionLabel = ({ n, children }: { n: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
    <span className="font-display text-primary">{n}</span>
    <span className="h-px w-8 bg-border" />
    <span>{children}</span>
  </div>
);

function Nav() {
  return (
    <header className="border-b border-border/70">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <FileSpreadsheet className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">MyCAFile</span>
        </Link>
        <nav className="hidden items-center gap-9 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#workflow" className="hover:text-foreground">Workflow</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <a href="#pricing" className="group inline-flex items-center gap-1 border-b border-foreground pb-0.5 text-sm font-medium text-foreground">
          Start free trial
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Container className="grid gap-14 pt-20 pb-24 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-7">
          <SectionLabel n="01">For Chartered Accountants</SectionLabel>
          <h1 className="mt-6 font-display text-[3.25rem] font-semibold leading-[1.02] tracking-tight md:text-[4.5rem]">
            A <em className="font-normal italic text-primary">calmer</em>{" "}way to run your CA practice.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Clients, documents, GST and team tasks — held together in one quiet workspace
            so deadlines stop chasing you and you can do the work that actually matters.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#pricing" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-90">
              Begin 14-day trial <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href="#workflow" className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
              See how it works →
            </a>
          </div>
          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-2">
              {["bg-accent", "bg-primary", "bg-warning", "bg-secondary-foreground"].map((c, i) => (
                <span key={i} className={`h-8 w-8 rounded-full border-2 border-background ${c}`} />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              <div className="flex gap-0.5 text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
              <div className="mt-1">Trusted by 2,400+ Indian CA firms</div>
            </div>
          </div>
        </div>

        <div className="relative md:col-span-5">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary-soft/60 blur-2xl" />
          <div className="rotate-[-1.5deg] rounded-2xl border border-border bg-card p-5 shadow-(--shadow-elevated)">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today's Filings</span>
              <span className="text-xs text-primary">8 due</span>
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              {[
                { c: "Acme Pvt Ltd", k: "GSTR-3B", s: "Due", t: "text-destructive bg-destructive/10" },
                { c: "R Sharma & Sons", k: "ITR Filing", s: "Review", t: "text-primary bg-primary/10" },
                { c: "Krish Industries", k: "TDS Q3", s: "Filed", t: "text-[oklch(0.4_0.12_155)] bg-success/15" },
                { c: "Nair Exports", k: "GSTR-1", s: "Draft", t: "text-accent-foreground bg-accent/40" },
              ].map((r) => (
                <li key={r.c} className="flex items-center justify-between gap-3 pb-3 last:pb-0">
                  <div>
                    <div className="font-medium">{r.c}</div>
                    <div className="text-xs text-muted-foreground">{r.k}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.t}`}>{r.s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute -bottom-6 -left-6 rotate-3 rounded-xl border border-border bg-card px-4 py-3 shadow-(--shadow-card)">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">On-time Rate</div>
            <div className="font-display text-2xl font-semibold text-primary">98.4%</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Marquee() {
  const items = ["ICAI Compliant", "ISO 27001", "AES-256 Encrypted", "Made in India", "GST Ready", "Multi-User"];
  return (
    <div className="border-y border-border bg-secondary/50 py-5">
      <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {items.map((i, idx) => (
          <span key={i} className="flex items-center gap-3">
            {idx > 0 && <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />}
            {i}
          </span>
        ))}
      </Container>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="py-28">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <SectionLabel n="02">What's inside</SectionLabel>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-5xl">
              Tools that <em className="italic text-primary">disappear</em>{" "}into your work.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Every feature designed alongside practising CAs. No clutter,
              no upsells in your face — only what a serious firm actually needs.
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
              {[
                { i: Users, t: "Client Management", d: "PAN, GSTIN, engagements and contacts in one organised place." },
                { i: FileText, t: "Secure Documents", d: "Request, store and share files with bank-grade encryption." },
                { i: Calculator, t: "GST Tracking", d: "All returns and due dates across every client at a glance." },
                { i: ListChecks, t: "Task Tracking", d: "Assign work, set deadlines and watch the team in real time." },
                { i: Cloud, t: "Cloud Access", d: "Office, home or court — your firm follows you everywhere." },
                { i: ShieldCheck, t: "Audit Trail", d: "Every action logged. Granular role-based permissions built-in." },
              ].map(({ i: Icon, t, d }) => (
                <div key={t} className="group bg-card p-6 transition hover:bg-secondary/50">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 font-display text-lg font-semibold">{t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Workflow() {
  const steps = [
    { n: "I", t: "Bring your clients in", d: "Import from CSV or add manually. Existing tools migrate during onboarding." },
    { n: "II", t: "Collect documents calmly", d: "Send a single secure link. Clients upload, you stay focused." },
    { n: "III", t: "File on time, every time", d: "GSTR, ITR, TDS — tracked, assigned and filed without the panic." },
  ];
  return (
    <section id="workflow" className="border-y border-border bg-linear-to-b from-secondary/40 to-background py-28">
      <Container>
        <div className="text-center">
          <SectionLabel n="03"><span className="mx-auto">The Workflow</span></SectionLabel>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-semibold leading-tight md:text-5xl">
            Three quiet steps to a <em className="italic text-primary">calmer</em>{" "}firm.
          </h2>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="font-display text-7xl font-semibold text-primary/20">{s.n}</div>
              <h3 className="mt-3 font-display text-2xl font-semibold">{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              {i < 2 && <span className="absolute right-0 top-12 hidden h-px w-10 bg-border md:block" />}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Quote() {
  return (
    <section className="py-28">
      <Container className="max-w-3xl text-center">
        <SectionLabel n="04"><span className="mx-auto">In their words</span></SectionLabel>
        <blockquote className="mt-8 font-display text-3xl font-medium leading-snug md:text-4xl">
          “We replaced four tools with MyCAFile. Filing season used to be war.
          <em className="italic text-primary"> Now it just feels like work.</em>”
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">AM</span>
          <div className="text-left">
            <div className="text-sm font-semibold">CA Anjali Mehta</div>
            <div className="text-xs text-muted-foreground">Partner, Mehta & Co.</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Testimonials() {
  const t = [
    { q: "Document collection went from a 3-day chase to a single link.", n: "CA Rohan Iyer", r: "Founder, Iyer Advisory" },
    { q: "GST filings are calm now. I see everything at a glance.", n: "CA Priya Nair", r: "Senior Partner, Nair & Associates" },
    { q: "Onboarded my whole team in an afternoon. That tells you something.", n: "CA Vikram Joshi", r: "Joshi & Patel" },
  ];
  return (
    <section className="border-y border-border bg-secondary/40 py-24">
      <Container>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {t.map((x) => (
            <figure key={x.n} className="bg-card p-7">
              <div className="flex gap-0.5 text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
              <blockquote className="mt-4 font-display text-lg leading-snug">"{x.q}"</blockquote>
              <figcaption className="mt-6">
                <div className="text-sm font-semibold">{x.n}</div>
                <div className="text-xs text-muted-foreground">{x.r}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Solo", price: "₹0", per: "forever", desc: "For independent CAs starting out.", features: ["Up to 10 clients", "1GB storage", "GST tracking", "Email support"], cta: "Start free" },
    { name: "Practice", price: "₹4,999", per: "per month", desc: "For growing firms with a small team.", features: ["Up to 200 clients", "50GB storage", "Team collaboration", "Priority support"], cta: "Choose Practice", popular: true },
    { name: "Firm", price: "₹9,999", per: "per month", desc: "For established multi-partner firms.", features: ["Unlimited clients", "500GB storage", "Custom workflows", "Dedicated manager"], cta: "Contact sales" },
  ];
  return (
    <section id="pricing" className="py-28">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionLabel n="05">Pricing</SectionLabel>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-5xl">
              Honest pricing. <em className="italic text-primary">No surprises.</em>
            </h2>
            <p className="mt-5 text-muted-foreground">
              Every plan includes a 14-day free trial. No card required to start. Cancel anytime.
            </p>
          </div>
          <div className="md:col-span-8">
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((p) => (
                <div key={p.name} className={`relative flex flex-col rounded-2xl border p-6 ${p.popular ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                  {p.popular && (
                    <span className="absolute -top-3 left-6 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
                      Most chosen
                    </span>
                  )}
                  <div className="font-display text-xl font-semibold">{p.name}</div>
                  <p className={`mt-1 text-xs ${p.popular ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{p.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1.5">
                    <span className="font-display text-3xl font-semibold">{p.price}</span>
                    <span className={`text-xs ${p.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.per}</span>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.popular ? "text-primary-foreground" : "text-primary"}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`mt-6 w-full rounded-full py-2.5 text-sm font-medium transition ${p.popular ? "bg-card text-primary hover:bg-card/90" : "bg-foreground text-background hover:opacity-90"}`}>
                    {p.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "Is my client data secure?", a: "Yes. All data is encrypted in transit and at rest with AES-256, hosted in ISO 27001 certified data centres in India." },
    { q: "Can I import data from my current tools?", a: "We support CSV import for clients and bulk upload for documents. Our team helps with migration during onboarding." },
    { q: "Do you support multi-user firms?", a: "Yes. Invite partners and staff with role-based permissions on the Practice and Firm plans." },
    { q: "How does the trial work?", a: "Every plan includes a 14-day free trial — no credit card required. Cancel any time without questions." },
    { q: "Do you offer onboarding help?", a: "Yes. Practice and Firm plans include white-glove onboarding and live training for your team." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-28">
      <Container className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <SectionLabel n="06">FAQ</SectionLabel>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-tight md:text-5xl">
            Questions, <br /><em className="italic text-primary">answered.</em>
          </h2>
        </div>
        <div className="md:col-span-8">
          <div className="divide-y divide-border border-y border-border">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button 
                  onClick={() => setOpen(open === i ? null : i)} 
                  className="flex w-full cursor-pointer appearance-none items-center justify-between gap-4 border-none bg-transparent p-0 py-5 text-left outline-none"
                >
                  <span className={`font-display text-lg font-medium transition-colors ${open === i ? "text-primary" : "text-foreground"}`}>{f.q}</span>
                  {open === i ? <Minus className="h-4 w-4 shrink-0 text-primary" /> : <Plus className="h-4 w-4 shrink-0 text-primary" />}
                </button>
                {open === i && <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-28">
      <Container className="text-center">
        <Sparkles className="mx-auto h-6 w-6 text-primary" />
        <h2 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
          Ready for a <em className="italic text-primary">calmer</em>{" "}filing season?
        </h2>
        <p className="mx-auto mt-5 max-w-md text-muted-foreground">
          Join 2,400+ firms already running a quieter, more focused practice with MyCAFile.
        </p>
        <a href="#pricing" className="mt-9 inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background hover:opacity-90">
          Begin your free trial <ArrowUpRight className="h-4 w-4" />
        </a>
      </Container>
    </section>
  );
}

function Footer() {
  const cols = [
    { h: "Product", l: ["Features", "Pricing", "Security", "Changelog"] },
    { h: "Company", l: ["About", "Customers", "Careers", "Contact"] },
    { h: "Resources", l: ["GST Guides", "Blog", "Help Centre", "API Docs"] },
  ];
  return (
    <footer className="border-t border-border bg-card">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <span className="font-display text-xl font-semibold">MyCAFile</span>
            </Link>
            <p className="mt-5 max-w-sm font-display text-2xl font-medium leading-snug">
              The calm operating system for modern Chartered Accountants.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h} className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{c.h}</div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {c.l.map((x) => <li key={x}><a href="#" className="text-foreground/80 hover:text-foreground">{x}</a></li>)}
              </ul>
            </div>
          ))}
          <div className="md:col-span-1" />
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} MyCAFile · Built in India</span>
          <span className="flex gap-5">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Status</a>
          </span>
        </div>
      </Container>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>MyCAFile — A calmer way to run your CA practice</title>
        <meta name="description" content="Editorial, focused workspace for Chartered Accountants. Clients, documents, GST and tasks — handled with quiet precision." />
      </Helmet>
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
}
