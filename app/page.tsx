"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import * as Select from "@radix-ui/react-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Mail,
  MapPin,
  Phone,
  Printer,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

const PRICING = {
  member: 11600,
  nonMember: 13350,
  student: 7800,
  joint: 2400,
  companion: 8700,
};
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const schema = z
  .object({
    title: z.string().min(1, "Please select a title"),
    name: z.string().min(3, "Enter your full name"),
    mci: z.string().min(2, "Enter your medical council registration number"),
    joint: z.enum(["Yes", "No"]),
    institute: z.string().min(2, "Enter your institute or hospital"),
    badge: z.string().min(1, "Select a badge category"),
    passing: z.string().min(4, "Enter year of passing"),
    designation: z.string().min(2, "Enter your designation"),
    city: z.string().min(2, "Enter your city"),
    address: z.string().min(8, "Enter your full address"),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
    email: z.string().email("Enter a valid email address"),
    accompanying: z.enum(["Yes", "No"]),
    companions: z.string().optional(),
    category: z.enum(["member", "nonMember", "student"], {
      message: "Choose a registration category",
    }),
    terms: z.boolean().refine(Boolean, "Please accept the terms to continue"),
  })
  .superRefine((v, ctx) => {
    if (v.accompanying === "Yes" && (!v.companions || Number(v.companions) < 1))
      ctx.addIssue({
        code: "custom",
        path: ["companions"],
        message: "Add at least one accompanying person",
      });
  });
type FormValues = z.infer<typeof schema>;
type RecordData = {
  name: string;
  id: string;
  email: string;
  mobile: string;
  amount: number;
  category: string;
};

function BrandHeader() {
  return (
    <header className="topbar">
      <a href="/" className="brand" aria-label="AROICON 2026 home">
        <span className="brand-mark">A</span>
        <span>
          <b>
            AROICON <em>2026</em>
          </b>
          <small>46th Annual Conference</small>
        </span>
      </a>
      <div className="top-event">
        <span>
          <CalendarDays size={15} /> 3–6 December 2026
        </span>
        <span>
          <MapPin size={15} /> Hyderabad, India
        </span>
      </div>
      <a className="help-link" href="mailto:registration@aroicon2026.com">
        <Mail size={16} /> Need help?
      </a>
    </header>
  );
}
function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">
        {label}
        <i>*</i>
      </span>
      {children}
      {error && <small className="error">{error}</small>}
    </label>
  );
}
function TitleSelect({
  control,
  error,
}: {
  control: Control<FormValues>;
  error?: string;
}) {
  const titles = ["Dr.", "Prof.", "Mr.", "Ms.", "Mrs."];
  return (
    <Field label="Title" error={error}>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <Select.Root value={field.value} onValueChange={field.onChange}>
            <Select.Trigger className="select-trigger" aria-label="Title">
              <Select.Value placeholder="Select title" />
              <Select.Icon asChild>
                <ChevronDown size={16} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                className="select-content"
                position="popper"
                sideOffset={5}
              >
                <Select.Viewport>
                  {titles.map((title) => (
                    <Select.Item
                      className="select-item"
                      key={title}
                      value={title}
                    >
                      <Select.ItemText>{title}</Select.ItemText>
                      <Select.ItemIndicator className="select-indicator">
                        <Check size={14} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        )}
      />
    </Field>
  );
}
function BadgeCategorySelect({
  control,
  error,
}: {
  control: Control<FormValues>;
  error?: string;
}) {
  const categories = ["Delegate", "Faculty", "Committee"];
  return (
    <Field label="Badge category" error={error}>
      <Controller
        control={control}
        name="badge"
        render={({ field }) => (
          <Select.Root value={field.value} onValueChange={field.onChange}>
            <Select.Trigger
              className="select-trigger"
              aria-label="Badge category"
            >
              <Select.Value placeholder="Select category" />
              <Select.Icon asChild>
                <ChevronDown size={16} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                className="select-content"
                position="popper"
                sideOffset={5}
              >
                <Select.Viewport>
                  {categories.map((category) => (
                    <Select.Item
                      className="select-item"
                      key={category}
                      value={category}
                    >
                      <Select.ItemText>{category}</Select.ItemText>
                      <Select.ItemIndicator className="select-indicator">
                        <Check size={14} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        )}
      />
    </Field>
  );
}
function Badge({ data, onBack }: { data: RecordData; onBack: () => void }) {
  const qrValue = `AROICON 2026|${data.id}|${data.name}|${data.email}`;
  const download = () => {
    const svg = document.querySelector("#badge-qr svg") as SVGSVGElement | null;
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(
      new Blob([source], { type: "image/svg+xml" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.id}-badge.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="success-card">
      <div className="success-icon">
        <Check size={28} />
      </div>
      <p className="eyebrow">YOU’RE ALL SET</p>
      <h2>Registration successful</h2>
      <p className="muted">
        Your place at AROICON 2026 is confirmed. We look forward to welcoming
        you.
      </p>
      <div className="badge-preview">
        <div className="badge-top">
          <span>
            AROICON <b>2026</b>
          </span>
          <span className="badge-chip">DELEGATE</span>
        </div>
        <div className="badge-body">
          <div>
            <small>ATTENDEE</small>
            <h3>{data.name}</h3>
            <p>{data.category} · Hyderabad, India</p>
            <small>REGISTRATION ID</small>
            <strong>{data.id}</strong>
            <small>3–6 DECEMBER 2026</small>
          </div>
          <div className="qr-wrap" id="badge-qr">
            <QRCodeSVG
              value={qrValue}
              size={106}
              bgColor="#ffffff"
              fgColor="#172b4d"
              level="M"
            />
          </div>
        </div>
        <div className="badge-bottom">
          ASSOCIATION OF RADIATION ONCOLOGISTS OF INDIA
        </div>
      </div>
      <div className="paid-row">
        <span>
          Amount paid <b>{money(data.amount)}</b>
        </span>
        <span>
          <BadgeCheck size={16} /> Mock payment confirmed
        </span>
      </div>
      <div className="action-row">
        <button className="button primary" onClick={download}>
          <Download size={17} /> Download badge
        </button>
        <button className="button outline" onClick={() => window.print()}>
          <Printer size={17} /> Print registration
        </button>
      </div>
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={15} /> Back to home
      </button>
    </section>
  );
}

export default function Home() {
  const [step, setStep] = useState<"lookup" | "form" | "success">("lookup");
  const [lookup, setLookup] = useState({ email: "", mobile: "" });
  const [lookupState, setLookupState] = useState<
    "idle" | "loading" | "found" | "missing"
  >("idle");
  const [existing, setExisting] = useState<RecordData | null>(null);
  const [record, setRecord] = useState<RecordData | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      name: "",
      mci: "",
      joint: "No",
      institute: "",
      badge: "Delegate",
      passing: "",
      designation: "",
      city: "",
      address: "",
      mobile: "",
      email: "",
      accompanying: "No",
      companions: "",
      category: "member",
      terms: false,
    },
  });
  const joint = form.watch("joint"),
    accompanying = form.watch("accompanying"),
    companions = form.watch("companions"),
    category = form.watch("category");
  const totals = useMemo(() => {
    const base = PRICING[category ?? "member"] ?? PRICING.member;
    const jointPrice = joint === "Yes" ? PRICING.joint : 0;
    const companionCount = accompanying === "Yes" ? Number(companions || 0) : 0;
    const extra = companionCount * PRICING.companion;
    return {
      base,
      jointPrice,
      companionCount,
      extra,
      total: base + jointPrice + extra,
    };
  }, [category, joint, accompanying, companions]);
  const lookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupState("loading");
    setTimeout(() => {
      if (
        lookup.email.toLowerCase() === "registered@aroicon.org" ||
        lookup.mobile === "9876543210"
      ) {
        const found = {
          name: "Dr. Ananya Rao",
          id: "ARO26-01842",
          email: lookup.email,
          mobile: lookup.mobile,
          amount: 11600,
          category: "AROI Member",
        };
        setExisting(found);
        setLookupState("found");
      } else {
        setLookupState("missing");
        setStep("form");
        form.setValue("email", lookup.email);
        form.setValue("mobile", lookup.mobile);
      }
    }, 650);
  };
  const submit = form.handleSubmit((v) => {
    const id = `ARO26-${Math.floor(10000 + Math.random() * 89999)}`;
    const categoryName =
      v.category === "member"
        ? "AROI Member"
        : v.category === "nonMember"
          ? "AROI Non Member"
          : "PG Students";
    const payload = {
      name: `${v.title} ${v.name}`,
      id,
      email: v.email,
      mobile: v.mobile,
      amount: totals.total,
      category: categoryName,
    };
    setRecord(payload);
    try {
      localStorage.setItem("aroicon-registration", JSON.stringify(payload));
    } catch {}
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  return (
    <main id="top">
      <BrandHeader />
      <div className="page-shell">
        <div className="hero-banner">
          <Image
            src="/aroicon-banner.jpg"
            alt="46th Annual Conference AROICON 2026, 3rd–6th December in Hyderabad"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1200px"
          />
        </div>
        {/* <div className="intro-row">
          <div>
            <div className="kicker">
              <span /> REGISTRATION PORTAL{" "}
              <span className="kicker-year">2026</span>
            </div>
            <h1>
              {step === "success"
                ? "Welcome to AROICON 2026"
                : "Be part of the conversation."}
            </h1>
            <p>
              Connect with the brightest minds in radiation oncology. Secure
              your place at India’s premier oncology conference.
            </p>
          </div>
          <div className="date-note">
            <CalendarDays size={18} />
            <span>
              <b>3–6 December 2026</b>
              <small>Hyderabad, India</small>
            </span>
          </div>
        </div> */}
        {step === "lookup" && (
          <div className="lookup-layout">
            <section className="lookup-card">
              <div className="step-line">
                {/* <span className="step-num">01</span> */}
                <div>
                  {/* <p className="eyebrow">WELCOME BACK</p> */}
                  <h2>Find your registration</h2>
                </div>
              </div>
              <p className="muted">
                Already registered? Enter the same email and mobile number used
                during registration.
              </p>
              <form onSubmit={lookupSubmit} className="lookup-form">
                <Field label="Email address">
                  <div className="input-icon">
                    <Mail size={17} />
                    <input
                      type="email"
                      placeholder="you@hospital.com"
                      value={lookup.email}
                      onChange={(e) =>
                        setLookup({ ...lookup, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </Field>
                <Field label="Mobile number">
                  <div className="input-icon">
                    <Phone size={17} />
                    <span className="country-code">+91</span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      maxLength={10}
                      value={lookup.mobile}
                      onChange={(e) =>
                        setLookup({
                          ...lookup,
                          mobile: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      required
                    />
                  </div>
                </Field>
                <button
                  className="button primary full"
                  disabled={lookupState === "loading"}
                >
                  {lookupState === "loading" ? (
                    <>
                      <span className="spinner" /> Searching…
                    </>
                  ) : (
                    <>
                      Search registration <Search size={17} />
                    </>
                  )}
                </button>
              </form>
              {lookupState === "missing" && (
                <div className="notice missing">
                  <X size={17} />
                  <span>
                    <b>No registration found</b>
                    <small>
                      We’ll get you started with a new registration.
                    </small>
                  </span>
                </div>
              )}
              {lookupState === "found" && existing && (
                <div className="notice found">
                  <CheckCircle2 size={19} />
                  <div>
                    <b>Registration found · {existing.id}</b>
                    <small>
                      {existing.name} · {money(existing.amount)}
                    </small>
                    <div className="inline-actions">
                      <button
                        onClick={() => {
                          setRecord(existing);
                          setStep("success");
                        }}
                      >
                        View registration &amp; badge
                      </button>
                      <button
                        onClick={() =>
                          window.alert(
                            `Demo only — registration details are ready to send to ${existing.email}.`,
                          )
                        }
                      >
                        Send my registration
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
            <aside className="new-card">
              <div className="new-icon">
                <UserRound size={20} />
              </div>
              <p className="eyebrow">FIRST TIME HERE?</p>
              <h3>Join us in Hyderabad</h3>
              {/* <p>
                Begin your registration for four days of learning, collaboration
                and connection.
              </p> */}
              <button
                className="button dark"
                onClick={() => {
                  setStep("form");
                  setLookupState("idle");
                }}
              >
                Start new registration <ArrowRight size={17} />
              </button>
              {/* <div className="trust">
                <ShieldCheck size={17} /> Your information is kept secure
              </div> */}
            </aside>
          </div>
        )}
        {step === "form" && (
          <>
            {/* <div className="progress">
              <button className="text-button" onClick={() => setStep("lookup")}>
                <ArrowLeft size={15} /> Back to search
              </button>
              <span>
                <i /> Personal details <b>1 of 1</b>
              </span>
            </div> */}
            <div className="registration-layout">
              <form className="form-card" onSubmit={submit} noValidate>
                {/* <div className="section-head">
                  <span className="section-icon">
                    <UserRound size={18} />
                  </span>
                  <div>
                    <h2>Attendee information</h2>
                    <p>
                      Enter your details as they should appear on your
                      conference badge.
                    </p>
                  </div>
                </div> */}
                <div className="form-grid">
                  <TitleSelect
                    control={form.control}
                    error={form.formState.errors.title?.message}
                  />
                  <Field
                    label="Full name (as per NMC)"
                    error={form.formState.errors.name?.message}
                    className="span-2"
                  >
                    <input
                      {...form.register("name")}
                      placeholder="e.g. Ananya Rao"
                      autoComplete="name"
                    />
                  </Field>
                  <Field
                    label="Medical council registration no."
                    error={form.formState.errors.mci?.message}
                  >
                    <input
                      {...form.register("mci")}
                      placeholder="Your registration number"
                    />
                  </Field>
                  <Field
                    label="Institute / hospital"
                    error={form.formState.errors.institute?.message}
                    className="span-2"
                  >
                    <input
                      {...form.register("institute")}
                      placeholder="Hospital or institution name"
                    />
                  </Field>
                  <BadgeCategorySelect
                    control={form.control}
                    error={form.formState.errors.badge?.message}
                  />
                  <Field
                    label="Year of passing (MBBS / PG / MD / MS)"
                    error={form.formState.errors.passing?.message}
                  >
                    <input
                      {...form.register("passing")}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="e.g. 2014"
                    />
                  </Field>
                  <Field
                    label="Designation"
                    error={form.formState.errors.designation?.message}
                  >
                    <input
                      {...form.register("designation")}
                      placeholder="e.g. Consultant"
                    />
                  </Field>
                  <Field
                    label="City"
                    error={form.formState.errors.city?.message}
                  >
                    <input {...form.register("city")} placeholder="Your city" />
                  </Field>
                  <Field
                    label="Full address"
                    error={form.formState.errors.address?.message}
                    className="span-2"
                  >
                    <textarea
                      {...form.register("address")}
                      placeholder="Street address, area, pin code"
                      rows={3}
                    />
                  </Field>
                  <Field
                    label="Mobile number"
                    error={form.formState.errors.mobile?.message}
                  >
                    <div className="input-icon">
                      <span className="country-code">+91</span>
                      <input
                        {...form.register("mobile")}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="98765 43210"
                      />
                    </div>
                  </Field>
                  <Field
                    label="Email address"
                    error={form.formState.errors.email?.message}
                  >
                    <input
                      {...form.register("email")}
                      type="email"
                      placeholder="you@hospital.com"
                    />
                  </Field>
                </div>
                <div className="section-divider" />
                {/* <div className="section-head compact">
                  <span className="section-icon purple">
                    <Users size={18} />
                  </span>
                  <div>
                    <h2>Conference options</h2>
                    <p>Choose your sessions and registration category.</p>
                  </div>
                </div> */}
                <div className="form-grid options-grid">
                  <Field
                    label="AROI (ICRO) ASCO joint session"
                    error={form.formState.errors.joint?.message}
                    className="conference-option-field"
                  >
                    <div className="radio-pair">
                      <label>
                        <input
                          type="radio"
                          value="Yes"
                          {...form.register("joint")}
                        />{" "}
                        Yes <small>+{money(PRICING.joint)}</small>
                      </label>
                      <label>
                        <input
                          type="radio"
                          value="No"
                          {...form.register("joint")}
                        />{" "}
                        No
                      </label>
                    </div>
                  </Field>
                  <Field
                    label="Accompanying persons"
                    error={form.formState.errors.accompanying?.message}
                    className="conference-option-field"
                  >
                    <div className="radio-pair">
                      <label>
                        <input
                          type="radio"
                          value="Yes"
                          {...form.register("accompanying")}
                        />{" "}
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          value="No"
                          {...form.register("accompanying")}
                        />{" "}
                        No
                      </label>
                    </div>
                  </Field>
                  {accompanying === "Yes" && (
                    <Field
                      label="Number of accompanying persons"
                      error={form.formState.errors.companions?.message}
                    >
                      <input
                        {...form.register("companions")}
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Number of persons"
                      />
                    </Field>
                  )}
                  <Field
                    label="Registration category"
                    error={form.formState.errors.category?.message}
                    className="span-2"
                  >
                    <div className="category-options">
                      {[
                        ["member", "AROI Member", "For current AROI members"],
                        [
                          "nonMember",
                          "AROI Non Member",
                          "For non-member delegates",
                        ],
                        ["student", "PG Students", "Postgraduate students"],
                      ].map(([value, label, detail]) => (
                        <label
                          className={`category-option ${category === value ? "selected" : ""}`}
                          key={value}
                        >
                          <input
                            type="radio"
                            value={value}
                            {...form.register("category")}
                          />
                          <span>
                            <b>{label}</b>
                            <small>{detail}</small>
                          </span>
                          <strong>
                            {money(PRICING[value as keyof typeof PRICING])}
                          </strong>
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
                <div className="terms-row">
                  <label>
                    <input type="checkbox" {...form.register("terms")} />{" "}
                    <span>
                      I agree to the <a href="#terms">Terms &amp; Conditions</a>{" "}
                      and cancellation policy.
                    </span>
                  </label>
                  {form.formState.errors.terms && (
                    <small className="error">
                      {form.formState.errors.terms.message}
                    </small>
                  )}
                </div>
                <button
                  className="button primary full payment-button"
                  type="submit"
                >
                  Proceed to mock payment <ArrowRight size={17} />
                </button>
                <p className="secure-note">
                  <ShieldCheck size={15} /> Secure registration · Payment
                  gateway integration coming soon
                </p>
              </form>
              <aside className="summary-card">
                <div className="summary-heading">
                  <div>
                    {/* <p className="eyebrow">YOUR REGISTRATION</p> */}
                    <h3>Registration summary</h3>
                  </div>
                  <span className="summary-icon">
                    <CheckCircle2 size={19} />
                  </span>
                </div>
                <div className="summary-event">
                  <div className="summary-thumb">
                    <Image
                      src="/aroicon-banner.jpg"
                      alt=""
                      fill
                      sizes="100px"
                    />
                  </div>
                  <span>
                    <b>AROICON 2026</b>
                    <small>46th Annual Conference</small>
                    <small>3–6 Dec · Hyderabad</small>
                  </span>
                </div>
                <div className="price-lines">
                  <div>
                    <span>
                      {category === "member"
                        ? "AROI Member"
                        : category === "nonMember"
                          ? "AROI Non Member"
                          : "PG Students"}
                    </span>
                    <b>{money(totals.base)}</b>
                  </div>
                  {totals.jointPrice > 0 && (
                    <div>
                      <span>Joint session</span>
                      <b>{money(totals.jointPrice)}</b>
                    </div>
                  )}
                  {totals.companionCount > 0 && (
                    <div>
                      <span>
                        Accompanying persons × {totals.companionCount}
                      </span>
                      <b>{money(totals.extra)}</b>
                    </div>
                  )}
                </div>
                <div className="total-line">
                  <span>Total amount</span>
                  <b>{money(totals.total)}</b>
                </div>
                <p className="tax-note">
                  All prices inclusive of applicable taxes
                </p>
                {/* <div className="price-callout">
                  <span className="callout-spark">✦</span>
                  <span>
                    Four days of insight,
                    <br />
                    innovation &amp; impact.
                  </span>
                </div> */}
                {/* <div className="summary-help">
                  <Mail size={16} />
                  <span>
                    Questions about registration?
                    <br />
                    <a href="mailto:registration@aroicon2026.com">
                      Contact our team
                    </a>
                  </span>
                </div> */}
              </aside>
            </div>
          </>
        )}
        {step === "success" && record && (
          <Badge
            data={record}
            onBack={() => {
              setStep("lookup");
              setLookupState("idle");
              setExisting(null);
              form.reset();
            }}
          />
        )}
        <footer className="footer">
          <span>
            © 2026 AROI · Association of Radiation Oncologists of India
          </span>
          <span>
            Made for the future of cancer care <b>✦</b>
          </span>
        </footer>
      </div>
    </main>
  );
}
