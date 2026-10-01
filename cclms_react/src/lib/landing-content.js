import { useEffect, useState } from "react";
import {
  UserPlus,
  ReceiptText,
  HandCoins,
  LayoutDashboard,
  History,
  Smartphone,
  NotebookPen,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  Bell,
  Search,
  Store,
  Clock,
  CheckCircle2,
  Star,
  Heart,
  Zap,
  Globe,
  Mail,
  Phone,
  Settings,
  Download,
  Calculator,
  Tag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export const LANDING_PAGE_TABLE = "landing_page_content";
export const LANDING_PAGE_ROW_ID = 1;

export const ICONS = {
  UserPlus,
  ReceiptText,
  HandCoins,
  LayoutDashboard,
  History,
  Smartphone,
  NotebookPen,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  Bell,
  Search,
  Store,
  Clock,
  CheckCircle2,
  Star,
  Heart,
  Zap,
  Globe,
  Mail,
  Phone,
  Settings,
  Download,
  Calculator,
  Tag,
};

export const getIcon = (name) => ICONS[name] ?? Star;

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
      {
        id: "f1",
        icon: "UserPlus",
        title: "Customer records",
        text: "Add customers with auto-generated IDs.",
      },
      {
        id: "f2",
        icon: "ReceiptText",
        title: "Quick credit recording",
        text: "Add items by product ID code and quantity.",
      },
      {
        id: "f3",
        icon: "HandCoins",
        title: "Partial payments",
        text: "Record bayad any time, and the balance updates automatically.",
      },
      {
        id: "f4",
        icon: "LayoutDashboard",
        title: "Dashboard",
        text: "See the overall balance, charts, and a ranking of customers by credit.",
      },
      {
        id: "f5",
        icon: "History",
        title: "Transaction history",
        text: "Keep full records you can export.",
      },
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
      {
        id: "q1",
        q: "What is CCLMS?",
        a: "A web-based tool that helps sari-sari store owners digitally track customer utang (credit) and bayad (payments), replacing manual notebook tracking.",
      },
      {
        id: "q2",
        q: "Who can use this system?",
        a: "Only registered store owners and system admins. Owner accounts are created by the admin, and customers are recorded in the system but don't log in themselves.",
      },
      {
        id: "q3",
        q: "Is my store's data secure?",
        a: "Yes. Passwords are protected, and each store owner can only see their own store's data.",
      },
      {
        id: "q4",
        q: "Can customers pay in parts?",
        a: "Yes. You can record a partial payment at any time, and the customer's balance updates automatically.",
      },
      {
        id: "q5",
        q: "What if I forget my password?",
        a: "You can reset it using your email and a one-time code (OTP).",
      },
      {
        id: "q6",
        q: "Does this work on my phone?",
        a: "Yes. It works on phones and desktop browsers, so you can use it right at the counter.",
      },
    ],
  },
  cta: { heading: "Ready to put your ledger online?" },
  footer: { text: "Customer Credit Ledger Management System." },
};

export const withDefaults = (saved) => {
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
    steps: {
      ...d.steps,
      ...saved.steps,
      items: saved.steps?.items ?? d.steps.items,
    },
    about: { ...d.about, ...saved.about },
    faqs: {
      ...d.faqs,
      ...saved.faqs,
      items: saved.faqs?.items ?? d.faqs.items,
    },
    cta: { ...d.cta, ...saved.cta },
    footer: { ...d.footer, ...saved.footer },
  };
};

export function useLandingContent() {
  const [content, setContent] = useState(() => withDefaults(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error: loadError } = await supabase
        .from(LANDING_PAGE_TABLE)
        .select("content")
        .eq("id", LANDING_PAGE_ROW_ID)
        .maybeSingle();
      if (!active) return;
      if (loadError) {
        setError(loadError);
      } else {
        setContent(withDefaults(data?.content));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { content, loading, error };
}
