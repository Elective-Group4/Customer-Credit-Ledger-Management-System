import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  UserPlus, ReceiptText, HandCoins, LayoutDashboard, History, Smartphone, NotebookPen, Users, Package,
  ShoppingCart, Wallet, BarChart3, FileSpreadsheet, ShieldCheck, Lock, Bell, Search, Store, Clock,
  CheckCircle2, Star, Heart, Zap, Globe, Mail, Phone, Settings, Download, Calculator, Tag, Plus, Trash2,
  ChevronUp, ChevronDown, Save, RotateCcw, Loader2, Eye, LayoutTemplate, ListOrdered, Info, CircleHelp,
  PanelBottom, Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { supabase } from "@/lib/supabase";

export const ICONS = {
  UserPlus, ReceiptText, HandCoins, LayoutDashboard, History, Smartphone, NotebookPen, Users, Package,
  ShoppingCart, Wallet, BarChart3, FileSpreadsheet, ShieldCheck, Lock, Bell, Search, Store, Clock,
  CheckCircle2, Star, Heart, Zap, Globe, Mail, Phone, Settings, Download, Calculator, Tag,
};

export const getIcon = (name) => ICONS[name] ?? Star;

const TABLE = "landing_page_content";
const ROW_ID = 1;

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const DEFAULT_CONTENT = {
  brand: { name: "SARI-SARI", loginLabel: "Log In" },
  hero: {
    badge: "Customer Credit Ledger Management System",
    title: "Replace your utang notebook with a digital ledger.",
    description:
      "CCLMS replaces the handwritten notebook sari-sari store owners use to track customer utang with a simple, web-based ledger. Record credit by product code, accept partial payments, and see every customer's running balance instantly, right from your phone at the counter.",
    note: "Owner accounts are created by your system admin.",
  },
  features: {
    heading: "Key features",
    items: [
      { id: "f1", icon: "UserPlus", title: "Customer records", text: "Add customers with auto-generated IDs." },
      { id: "f2", icon: "ReceiptText", title: "Quick credit recording", text: "Add items by product ID code and quantity." },
      { id: "f3", icon: "HandCoins", title: "Partial payments", text: "Record bayad any time, and the balance updates automatically." },
      { id: "f4", icon: "LayoutDashboard", title: "Dashboard", text: "See the overall balance, charts, and a ranking of customers by credit." },
      { id: "f5", icon: "History", title: "Transaction history", text: "Keep full records you can export." },
    ],
    footnote: {
      icon: "Smartphone",
      text: "Works on phones and desktop browsers, right at the counter.",
    },
  },
  steps: {
    heading: "How it works",
    items: [
      { id: "s1", text: "Add your products and customers" },
      { id: "s2", text: "Record credit and payments as they happen" },
      { id: "s3", text: "Check your dashboard for balances and top debtors" },
    ],
  },
  about: {
    heading: "About CCLMS",
    text: "CCLMS was built to solve a problem sari-sari store owners deal with every day: keeping track of who owes what, without relying on a notebook that's easy to lose or hard to search. It's designed around real small-business needs rather than as a generic demo app.",
  },
  faqs: {
    heading: "FAQs",
    items: [
      { id: "q1", q: "What is CCLMS?", a: "A web-based tool that helps sari-sari store owners digitally track customer utang (credit) and bayad (payments), replacing manual notebook tracking." },
      { id: "q2", q: "Who can use this system?", a: "Only registered store owners and system admins. Owner accounts are created by the admin, and customers are recorded in the system but don't log in themselves." },
      { id: "q3", q: "Is my store's data secure?", a: "Yes. Passwords are protected, and each store owner can only see their own store's data." },
      { id: "q4", q: "Can customers pay in parts?", a: "Yes. You can record a partial payment at any time, and the customer's balance updates automatically." },
      { id: "q5", q: "What if I forget my password?", a: "You can reset it using your email and a one-time code (OTP)." },
      { id: "q6", q: "Does this work on my phone?", a: "Yes. It works on phones and desktop browsers, so you can use it right at the counter." },
    ],
  },
  cta: { heading: "Ready to put your ledger online?" },
  footer: { text: "Customer Credit Ledger Management System." },
};

const withDefaults = (saved) => {
  if (!saved) return structuredClone(DEFAULT_CONTENT);
  const d = DEFAULT_CONTENT;
  return {
    brand: { ...d.brand, ...saved.brand },
    hero: { ...d.hero, ...saved.hero },
    features: {
      ...d.features,
      ...saved.features,
      items: saved.features?.items ?? d.features.items,
      footnote: { ...d.features.footnote, ...saved.features?.footnote },
    },
    steps: { ...d.steps, ...saved.steps, items: saved.steps?.items ?? d.steps.items },
    about: { ...d.about, ...saved.about },
    faqs: { ...d.faqs, ...saved.faqs, items: saved.faqs?.items ?? d.faqs.items },
    cta: { ...d.cta, ...saved.cta },
    footer: { ...d.footer, ...saved.footer },
  };
};

export function useLandingContent() {
  const [content, setContent] = useState(() => withDefaults(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from(TABLE)
      .select("content")
      .eq("id", ROW_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setContent(withDefaults(data?.content));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { content, loading };
}

function IconPicker({ value, onChange, id }) {
  const Current = getIcon(value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <div className="flex items-center gap-2">
          <Current className="h-4 w-4" />
          <SelectValue placeholder="Choose an icon" />
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {Object.keys(ICONS).map((name) => {
          const Icon = ICONS[name];
          return (
            <SelectItem key={name} value={name}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function ItemToolbar({ index, total, onMove, onRemove, label }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label={`Move ${label} up`}>
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === total - 1} onClick={() => onMove(index, 1)} aria-label={`Move ${label} down`}>
        <ChevronDown className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Delete ${label}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the landing page once you save. You can use "Discard changes" to undo before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onRemove(index)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({ label, htmlFor, hint, max, value, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-sm font-medium">{label}</Label>
        {max && (
          <span className={`text-xs tabular-nums ${(value?.length ?? 0) > max ? "text-destructive" : "text-muted-foreground"}`}>
            {value?.length ?? 0}/{max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children, className = "" }) {
  return (
    <Card className={`overflow-hidden border-stone-200 bg-white shadow-sm ${className}`}>
      <CardHeader className="border-b border-stone-100 bg-white py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EEE9] text-[#8B4E2F]">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">{children}</CardContent>
    </Card>
  );
}

function ListHeader({ title, count, addLabel, onAdd }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {title}
        <Badge variant="secondary" className="rounded-full bg-[#F5EEE9] px-2 tabular-nums text-[#8B4E2F] hover:bg-[#F5EEE9]">{count}</Badge>
      </h2>
      <Button className="bg-[#8B4E2F] text-white hover:bg-[#7A4327]" onClick={onAdd}>
        <Plus className="mr-1.5 h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}

function EmptyList({ text }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 bg-white p-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100"><Layers className="h-5 w-5 text-stone-400" /></span>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Preview({ content, tab }) {
  const { brand, hero, features, steps, about, faqs, cta, footer } = content;
  const FootIcon = getIcon(features.footnote.icon);
  const H = ({ children }) => <h3 className="text-sm font-semibold">{children}</h3>;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-stone-100 bg-stone-50 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 flex-1 truncate rounded-md bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
          your-store.app
        </span>
      </div>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#8B4E2F]">{brand.name}</span>
          <span className="rounded-md bg-[#8B4E2F] px-2.5 py-1 text-xs font-medium text-white">
            {brand.loginLabel}
          </span>
        </div>

        {tab === "hero" && (
          <div className="space-y-3 py-2">
            <Badge variant="secondary" className="whitespace-normal text-[11px]">{hero.badge}</Badge>
            <h2 className="text-xl font-bold leading-tight tracking-tight">{hero.title}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{hero.description}</p>
            <p className="text-[11px] text-muted-foreground">{hero.note}</p>
          </div>
        )}

        {tab === "features" && (
          <div className="space-y-3">
            <H>{features.heading}</H>
            <div className="grid grid-cols-2 gap-2">
              {features.items.map((it) => {
                const I = getIcon(it.icon);
                return (
                  <div key={it.id} className="rounded-lg border p-2.5">
                    <I className="mb-1.5 h-4 w-4 text-[#8B4E2F]" />
                    <p className="text-xs font-medium">{it.title}</p>
                    <p className="text-[11px] text-muted-foreground">{it.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground">
              <FootIcon className="h-4 w-4 shrink-0 text-[#8B4E2F]" />
              {features.footnote.text}
            </div>
          </div>
        )}

        {tab === "steps" && (
          <div className="space-y-3">
            <H>{steps.heading}</H>
            {steps.items.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B4E2F] text-[11px] font-semibold text-white">
                  {i + 1}
                </span>
                <span className="text-xs">{s.text}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "about" && (
          <div className="space-y-2">
            <H>{about.heading}</H>
            <p className="text-xs leading-relaxed text-muted-foreground">{about.text}</p>
          </div>
        )}

        {tab === "faqs" && (
          <div className="space-y-2">
            <H>{faqs.heading}</H>
            {faqs.items.map((f) => (
              <div key={f.id} className="rounded-lg border p-2.5">
                <p className="text-xs font-medium">{f.q}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "other" && (
          <div className="space-y-3 rounded-lg bg-muted/40 p-3 text-center">
            <p className="text-sm font-semibold">{cta.heading}</p>
            <p className="text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} {brand.name}. {footer.text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const TAB_META = [
  { value: "hero", label: "Hero", icon: LayoutTemplate },
  { value: "features", label: "Features", icon: Star },
  { value: "steps", label: "How it works", icon: ListOrdered },
  { value: "about", label: "About", icon: Info },
  { value: "faqs", label: "FAQs", icon: CircleHelp },
  { value: "other", label: "Navbar & footer", icon: PanelBottom },
];

export default function LandingPageManagement() {
  const [content, setContent] = useState(() => withDefaults(null));
  const [saved, setSaved] = useState(() => JSON.stringify(withDefaults(null)));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("hero");

  const isDirty = useMemo(() => JSON.stringify(content) !== saved, [content, saved]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from(TABLE).select("content").eq("id", ROW_ID).maybeSingle();
      if (!active) return;
      if (error) toast.error("Could not load landing page content.");
      const next = withDefaults(data?.content);
      setContent(next);
      setSaved(JSON.stringify(next));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

    const setField = useCallback((section, field, value) => {
    setContent((c) => ({ ...c, [section]: { ...c[section], [field]: value } }));
  }, []);
  const setFootnote = useCallback((field, value) => {
    setContent((c) => ({ ...c, features: { ...c.features, footnote: { ...c.features.footnote, [field]: value } } }));
  }, []);
  const updateItem = useCallback((section, index, patch) => {
    setContent((c) => ({ ...c, [section]: { ...c[section], items: c[section].items.map((it, i) => (i === index ? { ...it, ...patch } : it)) } }));
  }, []);
  const addItem = useCallback((section, item) => {
    setContent((c) => ({ ...c, [section]: { ...c[section], items: [...c[section].items, { id: uid(), ...item }] } }));
  }, []);
  const removeItem = useCallback((section, index) => {
    setContent((c) => ({ ...c, [section]: { ...c[section], items: c[section].items.filter((_, i) => i !== index) } }));
  }, []);
  const moveItem = useCallback((section, index, dir) => {
    setContent((c) => {
      const items = [...c[section].items];
      const t = index + dir;
      if (t < 0 || t >= items.length) return c;
      [items[index], items[t]] = [items[t], items[index]];
      return { ...c, [section]: { ...c[section], items } };
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from(TABLE).upsert({ id: ROW_ID, content, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error("Could not save changes. Please try again.");
    setSaved(JSON.stringify(content));
    toast.success("Landing page updated.");
  };
  const handleDiscard = () => { setContent(JSON.parse(saved)); toast.message("Changes discarded."); };
  const handleResetDefaults = () => { setContent(withDefaults(null)); toast.message("Default content loaded. Save to apply it."); };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading landing page content...
      </div>
    );
  }

  const { brand, hero, features, steps, about, faqs, cta, footer } = content;
  const counts = { features: features.items.length, steps: steps.items.length, faqs: faqs.items.length };

  return (
    <div className="admin-theme-surface flex flex-1 flex-col gap-7 bg-background p-5 md:p-7">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#171717] md:text-3xl">Landing page</h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  isDirty ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isDirty ? "bg-amber-500" : "bg-emerald-500"}`} />
                {isDirty ? "Unsaved changes" : "All changes saved"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              Edit the content visitors see on your public landing page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Load defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Load the default content?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This replaces everything in the editor with the original text. The live page doesn't change until you save.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleResetDefaults}
                    className="!bg-[#8B4E2F] !text-white hover:!bg-[#7A4327]"
                  >Load defaults</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" className="border-stone-200 bg-white" onClick={handleDiscard} disabled={!isDirty || saving}>
              Discard changes
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || saving} className="min-w-[140px] bg-[#8B4E2F] text-white hover:bg-[#7A4327]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Tabs value={tab} onValueChange={setTab} className="min-w-0 space-y-5">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 border border-stone-200 bg-white p-1 shadow-sm">
            {TAB_META.map(({ value, label, icon: I }) => (
              <TabsTrigger key={value} value={value} className="gap-2 data-[state=active]:bg-[#8B4E2F] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <I className="h-4 w-4" />
                {label}
                {counts[value] !== undefined && (
                  <span className="rounded-full bg-stone-100 px-1.5 text-xs tabular-nums text-stone-600">
                    {counts[value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

                    <TabsContent value="hero" className="mt-0">
            <SectionCard icon={LayoutTemplate} title="Hero section" description="The first thing visitors see at the top of the page.">
              <Field label="Badge text" htmlFor="hero-badge" hint="The small label above the headline." max={60} value={hero.badge}>
                <Input id="hero-badge" value={hero.badge} onChange={(e) => setField("hero", "badge", e.target.value)} />
              </Field>
              <Field label="Headline" htmlFor="hero-title" max={90} value={hero.title}>
                <Textarea id="hero-title" rows={2} value={hero.title} onChange={(e) => setField("hero", "title", e.target.value)} />
              </Field>
              <Field label="Description" htmlFor="hero-description" max={400} value={hero.description}>
                <Textarea id="hero-description" rows={5} value={hero.description} onChange={(e) => setField("hero", "description", e.target.value)} />
              </Field>
              <Field label="Note next to the login button" htmlFor="hero-note" max={80} value={hero.note}>
                <Input id="hero-note" value={hero.note} onChange={(e) => setField("hero", "note", e.target.value)} />
              </Field>
            </SectionCard>
          </TabsContent>

                    <TabsContent value="features" className="mt-0 space-y-5">
            <SectionCard icon={Star} title="Section heading">
              <Field label="Heading" htmlFor="features-heading">
                <Input id="features-heading" value={features.heading} onChange={(e) => setField("features", "heading", e.target.value)} />
              </Field>
            </SectionCard>

            <ListHeader
              title="Feature cards"
              count={features.items.length}
              addLabel="Add card"
              onAdd={() => addItem("features", { icon: "Star", title: "New feature", text: "Describe this feature." })}
            />
            {features.items.length === 0 && <EmptyList text="No feature cards yet. Click “Add card” to create one." />}

            <div className="grid gap-4 md:grid-cols-2">
              {features.items.map((item, i) => {
                const Icon = getIcon(item.icon);
                return (
                  <Card key={item.id} className="border-stone-200 bg-white shadow-sm">
                    <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-stone-100 bg-white py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5EEE9]">
                          <Icon className="h-4 w-4 text-[#8B4E2F]" />
                        </span>
                        <span className="text-sm font-medium">Card {i + 1}</span>
                      </div>
                      <ItemToolbar
                        index={i}
                        total={features.items.length}
                        label={`card ${i + 1}`}
                        onMove={(idx, dir) => moveItem("features", idx, dir)}
                        onRemove={(idx) => removeItem("features", idx)}
                      />
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <Field label="Icon" htmlFor={`f-icon-${item.id}`}>
                        <IconPicker id={`f-icon-${item.id}`} value={item.icon} onChange={(v) => updateItem("features", i, { icon: v })} />
                      </Field>
                      <Field label="Heading" htmlFor={`f-title-${item.id}`} max={40} value={item.title}>
                        <Input id={`f-title-${item.id}`} value={item.title} onChange={(e) => updateItem("features", i, { title: e.target.value })} />
                      </Field>
                      <Field label="Text" htmlFor={`f-text-${item.id}`} max={120} value={item.text}>
                        <Textarea id={`f-text-${item.id}`} rows={3} value={item.text} onChange={(e) => updateItem("features", i, { text: e.target.value })} />
                      </Field>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <SectionCard icon={Zap} title="Highlight card" description="The dashed card shown after the feature cards." className="border-dashed">
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <Field label="Icon" htmlFor="footnote-icon">
                  <IconPicker id="footnote-icon" value={features.footnote.icon} onChange={(v) => setFootnote("icon", v)} />
                </Field>
                <Field label="Text" htmlFor="footnote-text">
                  <Input id="footnote-text" value={features.footnote.text} onChange={(e) => setFootnote("text", e.target.value)} />
                </Field>
              </div>
            </SectionCard>
          </TabsContent>

                    <TabsContent value="steps" className="mt-0 space-y-5">
            <SectionCard icon={ListOrdered} title="Section heading">
              <Field label="Heading" htmlFor="steps-heading">
                <Input id="steps-heading" value={steps.heading} onChange={(e) => setField("steps", "heading", e.target.value)} />
              </Field>
            </SectionCard>

            <ListHeader title="Steps" count={steps.items.length} addLabel="Add step" onAdd={() => addItem("steps", { text: "New step" })} />
            {steps.items.length === 0 && <EmptyList text="No steps yet. Click “Add step” to create one." />}

            <div className="space-y-3">
              {steps.items.map((item, i) => (
                <Card key={item.id} className="border-stone-200 bg-white shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B4E2F] text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <Input aria-label={`Step ${i + 1} text`} value={item.text} onChange={(e) => updateItem("steps", i, { text: e.target.value })} />
                    <ItemToolbar
                      index={i}
                      total={steps.items.length}
                      label={`step ${i + 1}`}
                      onMove={(idx, dir) => moveItem("steps", idx, dir)}
                      onRemove={(idx) => removeItem("steps", idx)}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

                    <TabsContent value="about" className="mt-0">
            <SectionCard icon={Info} title="About section">
              <Field label="Heading" htmlFor="about-heading">
                <Input id="about-heading" value={about.heading} onChange={(e) => setField("about", "heading", e.target.value)} />
              </Field>
              <Field label="Text" htmlFor="about-text" max={600} value={about.text}>
                <Textarea id="about-text" rows={7} value={about.text} onChange={(e) => setField("about", "text", e.target.value)} />
              </Field>
            </SectionCard>
          </TabsContent>

                    <TabsContent value="faqs" className="mt-0 space-y-5">
            <SectionCard icon={CircleHelp} title="Section heading">
              <Field label="Heading" htmlFor="faqs-heading">
                <Input id="faqs-heading" value={faqs.heading} onChange={(e) => setField("faqs", "heading", e.target.value)} />
              </Field>
            </SectionCard>

            <ListHeader title="Questions" count={faqs.items.length} addLabel="Add FAQ" onAdd={() => addItem("faqs", { q: "New question", a: "Write the answer here." })} />
            {faqs.items.length === 0 && <EmptyList text="No FAQs yet. Click “Add FAQ” to create one." />}

            <div className="space-y-4">
              {faqs.items.map((item, i) => (
                <Card key={item.id} className="border-stone-200 bg-white shadow-sm">
                  <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-stone-100 bg-white py-3">
                    <span className="text-sm font-medium">FAQ {i + 1}</span>
                    <ItemToolbar
                      index={i}
                      total={faqs.items.length}
                      label={`FAQ ${i + 1}`}
                      onMove={(idx, dir) => moveItem("faqs", idx, dir)}
                      onRemove={(idx) => removeItem("faqs", idx)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <Field label="Question" htmlFor={`q-${item.id}`}>
                      <Input id={`q-${item.id}`} value={item.q} onChange={(e) => updateItem("faqs", i, { q: e.target.value })} />
                    </Field>
                    <Field label="Answer" htmlFor={`a-${item.id}`}>
                      <Textarea id={`a-${item.id}`} rows={3} value={item.a} onChange={(e) => updateItem("faqs", i, { a: e.target.value })} />
                    </Field>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

                    <TabsContent value="other" className="mt-0 space-y-5">
            <SectionCard icon={PanelBottom} title="Navbar" description="The logo image itself is still changed in your assets folder.">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Brand name" htmlFor="brand-name">
                  <Input id="brand-name" value={brand.name} onChange={(e) => setField("brand", "name", e.target.value)} />
                </Field>
                <Field label="Login button label" htmlFor="brand-login">
                  <Input id="brand-login" value={brand.loginLabel} onChange={(e) => setField("brand", "loginLabel", e.target.value)} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard icon={Zap} title="Closing call to action">
              <Field label="Heading" htmlFor="cta-heading">
                <Input id="cta-heading" value={cta.heading} onChange={(e) => setField("cta", "heading", e.target.value)} />
              </Field>
            </SectionCard>

            <SectionCard icon={PanelBottom} title="Footer" description="The year and brand name are added automatically before this text.">
              <Field label="Footer text" htmlFor="footer-text">
                <Input id="footer-text" value={footer.text} onChange={(e) => setField("footer", "text", e.target.value)} />
              </Field>
            </SectionCard>
          </TabsContent>
        </Tabs>

                <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Eye className="h-4 w-4" />
              Live preview
            </div>
            <Preview content={content} tab={tab} />
            <p className="text-xs text-muted-foreground">
              Shows your edits as you type. Visitors only see them after you save.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}