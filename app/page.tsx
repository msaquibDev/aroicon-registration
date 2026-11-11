"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller, useForm, type Control } from "react-hook-form";
import * as Select from "@radix-ui/react-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Mail,
  Phone,
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
    companionNames: z.array(z.string()).optional(),
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
    if (v.accompanying === "Yes") {
      const names = v.companionNames ?? [];
      for (let index = 0; index < Number(v.companions || 0); index += 1) {
        if (!names[index]?.trim())
          ctx.addIssue({ code: "custom", path: ["companionNames", index], message: "Enter this person's name" });
      }
    }
  });
type FormValues = z.infer<typeof schema>;
type RecordData = {
  name: string;
  id: string;
  email: string;
  mobile: string;
  amount: number;
  category: string;
  badgeType?: string;
  companions?: string[];
};

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
    const svg = document.querySelector("#printable-badge-qr svg") as SVGSVGElement | null;
    if (!svg) return;
    const qrSvg = new XMLSerializer().serializeToString(svg);
    const qrViewBox = qrSvg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 33 33";
    const qrContents = qrSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    const xml = (value: string) => value.replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" })[char] ?? char);
    const badgeType = xml((data.badgeType ?? "Delegate").toUpperCase());
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="556" viewBox="0 0 700 1080"><defs><linearGradient id="orange" x1="0" x2="1"><stop stop-color="#1877a9"/><stop offset="1" stop-color="#155e8a"/></linearGradient></defs><rect x="2" y="2" width="696" height="1076" rx="24" fill="#fff" stroke="#d3d7df" stroke-width="2"/><text x="350" y="98" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="700" fill="#151d2d">${xml(data.name)}</text><text x="350" y="151" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" letter-spacing="2" fill="#70798a">REGISTRATION NUMBER</text><rect x="220" y="174" width="260" height="82" rx="18" fill="url(#orange)"/><text x="350" y="228" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#fff">${xml(data.id)}</text><rect x="150" y="292" width="400" height="400" rx="24" fill="#fff" stroke="#d3d7df" stroke-width="2"/><svg x="200" y="342" width="300" height="300" viewBox="${qrViewBox}">${qrContents}</svg><text x="350" y="754" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="600" fill="#151d2d">46th Annual Conference - AROICON 2026</text><text x="350" y="796" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#70798a">3-6 December 2026 - Hyderabad</text><rect x="60" y="828" width="580" height="82" rx="20" fill="url(#orange)"/><text x="350" y="882" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#fff">${badgeType}</text><text x="350" y="956" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" fill="#70798a">Scan QR code for verification</text><text x="350" y="990" text-anchor="middle" font-family="Arial,sans-serif" font-size="19" fill="#70798a">Valid for event entry only</text></svg>`;
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 556;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.id}-badge.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/jpeg", 0.96);
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  };
  const downloadReceipt = () => {
    const receipt = new jsPDF();
    receipt.setFont("helvetica", "bold");
    receipt.setFontSize(22);
    receipt.text("AROICON 2026", 20, 24);
    receipt.setFont("helvetica", "normal");
    receipt.setFontSize(12);
    receipt.setTextColor(100, 112, 130);
    receipt.text("Registration payment receipt", 20, 33);
    receipt.setDrawColor(220, 225, 232);
    receipt.line(20, 42, 190, 42);
    receipt.setTextColor(35, 48, 70);
    receipt.setFontSize(11);
    receipt.text(`Attendee: ${data.name}`, 20, 56);
    receipt.text(`Registration ID: ${data.id}`, 20, 67);
    receipt.text(`Registration category: ${data.category}`, 20, 78);
    receipt.text("Event: 3-6 December 2026, Hyderabad, India", 20, 89);
    receipt.line(20, 101, 190, 101);
    receipt.setFont("helvetica", "bold");
    receipt.setFontSize(15);
    receipt.text("Amount paid", 20, 115);
    receipt.text(`INR ${data.amount.toLocaleString("en-IN")}`, 190, 115, { align: "right" });
    receipt.setFont("helvetica", "normal");
    receipt.setFontSize(10);
    receipt.setTextColor(100, 112, 130);
    receipt.text("Mock payment confirmed - frontend demonstration", 20, 130);
    receipt.save(`${data.id}-receipt.pdf`);
  };
  return (
    <section className="success-card">
      <div className="success-details">
      <div className="success-icon">
        <Check size={28} />
      </div>
      <p className="eyebrow">YOU’RE ALL SET</p>
      <h2>Registration successful</h2>
      <p className="muted">
        Your place at AROICON 2026 is confirmed. We look forward to welcoming
        you.
      </p>
            <div className="badge-preview badge-confirmation">
        <div className="badge-top">
          <span>AROICON <b>2026</b></span>
          <span className="badge-chip">REGISTRATION CONFIRMED</span>
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
          <div className="qr-wrap">
            <QRCodeSVG value={qrValue} size={106} bgColor="#ffffff" fgColor="#172b4d" level="M" />
          </div>
        </div>
        <div className="badge-bottom">ASSOCIATION OF RADIATION ONCOLOGISTS OF INDIA</div>
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
        <button className="button outline" onClick={downloadReceipt}>
          <Download size={17} /> Download receipt
        </button>
      </div>
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={15} /> Back to home
      </button>
      </div>
      <div className="printable-badge">
        <h2 className="print-badge-name">{data.name}</h2>
        <p className="print-reg-label">REGISTRATION NUMBER</p>
        <div className="print-reg-number">{data.id}</div>
        <div className="print-badge-qr" id="printable-badge-qr">
          <QRCodeSVG value={qrValue} size={180} bgColor="#ffffff" fgColor="#111111" level="M" />
        </div>
        <h3 className="print-badge-event">46th Annual Conference - AROICON 2026</h3>
        <p className="print-badge-date">3–6 December 2026 · Hyderabad</p>
        <div className="print-badge-category">{(data.badgeType ?? "Delegate").toUpperCase()}</div>
        <p className="print-badge-note">Scan QR code for verification<br/>Valid for event entry only</p>
      </div>
    </section>
  );
}

export default function Home() {
  const [step, setStep] = useState<"lookup" | "form" | "success">("lookup");
  const [lookupValue, setLookupValue] = useState("");
  const [lookupState, setLookupState] = useState<
    "idle" | "loading" | "otpSent" | "missing"
  >("idle");
  const [existing, setExisting] = useState<RecordData | null>(null);
  const [record, setRecord] = useState<RecordData | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpDestination, setOtpDestination] = useState("");
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
      companionNames: [],
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
    const query = lookupValue.trim();
    const isEmail = query.includes("@");
    const email = isEmail ? query.toLowerCase() : "";
    const mobile = isEmail ? "" : query.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!query) {
      setLookupError("Enter your email address or mobile number to continue.");
      return;
    }
    if ((isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || (!isEmail && !/^[6-9]\d{9}$/.test(mobile))) {
      setLookupError("Enter a valid email address or 10-digit mobile number.");
      return;
    }
    setLookupError("");
    setLookupState("loading");
    setTimeout(() => {
      const emailMatch = email === "registered@aroicon.org";
      const mobileMatch = mobile === "9876543210";
      let savedRecord: RecordData | null = null;
      try {
        const savedList = JSON.parse(
          localStorage.getItem("aroicon-registrations") ?? "[]",
        ) as RecordData[];
        const savedSingle = localStorage.getItem("aroicon-registration");
        const records = Array.isArray(savedList) ? [...savedList] : [];
        if (savedSingle) records.push(JSON.parse(savedSingle) as RecordData);
        savedRecord = records.find(
          (candidate) =>
            (email && candidate.email?.toLowerCase() === email) ||
            (mobile && candidate.mobile === mobile),
        ) ?? null;
      } catch {
        savedRecord = null;
      }
      if (savedRecord || emailMatch || mobileMatch) {
        const found = savedRecord ?? {
          name: "Dr. Ananya Rao",
          id: "ARO26-01842",
          email: "registered@aroicon.org",
          mobile: "9876543210",
          amount: 11600,
          category: "AROI Member",
          badgeType: "Delegate",
        };
        setExisting(found);
        setOtpDestination("your registered email and WhatsApp number");
        setOtp("");
        setOtpError("");
        setLookupState("otpSent");
      } else {
        setLookupState("missing");
        setStep("form");
        form.setValue("email", email);
        form.setValue("mobile", mobile);
      }
    }, 650);
  };
  const verifyLookupOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "123456" || !existing) {
      setOtpError("That code did not match. For this demo, enter 123456.");
      return;
    }
    setOtpError("");
    setRecord(existing);
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      badgeType: v.badge,
    companions: v.accompanying === "Yes" ? (v.companionNames ?? []).slice(0, Number(v.companions || 0)) : [],
    };
    setRecord(payload);
    try {
      const stored = JSON.parse(
        localStorage.getItem("aroicon-registrations") ?? "[]",
      ) as RecordData[];
      const registrations = Array.isArray(stored) ? stored : [];
      registrations.push(payload);
      localStorage.setItem("aroicon-registrations", JSON.stringify(registrations));
      localStorage.setItem("aroicon-registration", JSON.stringify(payload));
    } catch {}
    setStep("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  return (
    <main id="top">
      <div className="page-shell">
        {step !== "success" && <div className="hero-banner">
          <Image
            src="/banner-01.webp"
            alt="46th Annual Conference AROICON 2026, 3rd–6th December in Hyderabad"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1200px"
          />
        </div>}
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
                Search with your registered email or mobile number. If we find a
                registration, we’ll send a one-time code to verify it.
              </p>
              {lookupState !== "otpSent" && (
                <form onSubmit={lookupSubmit} className="lookup-form">
                  <Field label="Email or mobile number">
                    <div className="input-icon">
                      <Search size={17} />
                      <input
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        placeholder="name@example.com or 98765 43210"
                        value={lookupValue}
                        onChange={(e) => setLookupValue(e.target.value)}
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
              )}
              {lookupError && (
                <small className="error lookup-error">{lookupError}</small>
              )}
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
              {lookupState === "otpSent" && existing && (
                <form className="otp-panel" onSubmit={verifyLookupOtp}>
                  <div className="notice found">
                    <CheckCircle2 size={19} />
                    <span>
                      <b>Registration found · {existing.id}</b>
                      <small>
                        A mock verification code was sent to {otpDestination}.
                      </small>
                    </span>
                  </div>
                  <Field label="One-time verification code" error={otpError}>
                    <input
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </Field>
                  <button className="button primary full" type="submit">
                    Verify and view registration <ArrowRight size={17} />
                  </button>
                  <small className="otp-demo-note">
                    Frontend demo code: 123456. OTP delivery will connect to
                    email / WhatsApp later.
                  </small>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      setLookupState("idle");
                      setExisting(null);
                      setOtpError("");
                    }}
                  >
                    Use another contact
                  </button>
                </form>
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
                {lookupState === "missing" && (
                  <div className="notice missing form-notice">
                    <span>
                      <b>No existing registration found</b>
                      <small>Complete the form below to register for AROICON 2026.</small>
                    </span>
                    <button
                      className="notice-close"
                      type="button"
                      aria-label="Dismiss registration notice"
                      onClick={() => setLookupState("idle")}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
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
                    <>
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
                      {Array.from({ length: Math.min(Number(companions || 0), 10) }, (_, index) => (
                        <Field
                          key={index}
                          label={`Accompanying person ${index + 1} name`}
                          error={form.formState.errors.companionNames?.[index]?.message}
                        >
                          <input
                            {...form.register(`companionNames.${index}`)}
                            placeholder="Full name"
                          />
                        </Field>
                      ))}
                    </>
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
                    <Image src="/banner-01.webp" alt="" fill sizes="100px" />
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
                      Registration · {category === "member"
                        ? "AROI Member"
                        : category === "nonMember"
                          ? "AROI Non Member"
                          : "PG Students"}
                    </span>
                    <b>{money(totals.base)}</b>
                  </div>
                  {totals.jointPrice > 0 && (
                    <div>
                      <span>Joint Session</span>
                      <b>{money(totals.jointPrice)}</b>
                    </div>
                  )}
                  {totals.companionCount > 0 && (
                    <div>
                      <span>
                        Accompany × {totals.companionCount}
                      </span>
                      <b>{money(totals.extra)}</b>
                    </div>
                  )}
                </div>
                <div className="total-line">
                  <span>TOTAL</span>
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
          2026 | All rights reserved | RegistrationTeam.in by SaaScraft Studio
          (India) Pvt. Ltd.
        </footer>
      </div>
    </main>
  );
}
