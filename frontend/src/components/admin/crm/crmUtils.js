// Shared helpers for CRM pages

export const INR = (n) => {
  const v = Number(n || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `₹${v.toLocaleString("en-IN")}`;
  }
};

export const INR_PRECISE = (n) => {
  const v = Number(n || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `₹${v.toFixed(2)}`;
  }
};

export const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    // Accept YYYY-MM-DD or full ISO
    const d = new Date(iso.length <= 10 ? `${iso}T00:00:00Z` : iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const LEAD_STAGES = [
  { k: "new",        label: "New",        dot: "bg-zinc-400"    },
  { k: "contacted",  label: "Contacted",  dot: "bg-blue-500"    },
  { k: "qualified",  label: "Qualified",  dot: "bg-indigo-500"  },
  { k: "proposal",   label: "Proposal",   dot: "bg-amber-500"   },
  { k: "won",        label: "Won",        dot: "bg-emerald-500" },
  { k: "lost",       label: "Lost",       dot: "bg-rose-500"    },
];

export const PROJECT_STATUSES = [
  { k: "planning",     label: "Planning",     dot: "bg-zinc-400"    },
  { k: "in_progress",  label: "In Progress",  dot: "bg-blue-500"    },
  { k: "on_hold",      label: "On Hold",      dot: "bg-amber-500"   },
  { k: "completed",    label: "Completed",    dot: "bg-emerald-500" },
  { k: "cancelled",    label: "Cancelled",    dot: "bg-rose-500"    },
];

export const TASK_STATUSES = [
  { k: "todo",        label: "To Do",        dot: "bg-zinc-400"   },
  { k: "in_progress", label: "In Progress",  dot: "bg-blue-500"   },
  { k: "done",        label: "Done",         dot: "bg-emerald-500"},
];

export const TASK_PRIORITIES = [
  { k: "low",     label: "Low",     color: "text-zinc-500"   },
  { k: "medium",  label: "Medium",  color: "text-blue-500"   },
  { k: "high",    label: "High",    color: "text-amber-500"  },
  { k: "urgent",  label: "Urgent",  color: "text-rose-500"   },
];

export const INVOICE_STATUSES = [
  { k: "draft",   label: "Draft",   dot: "bg-zinc-400"    },
  { k: "sent",    label: "Sent",    dot: "bg-blue-500"    },
  { k: "paid",    label: "Paid",    dot: "bg-emerald-500" },
  { k: "overdue", label: "Overdue", dot: "bg-rose-500"    },
];

export const VENDOR_PAYMENT_STATUSES = [
  { k: "pending", label: "Pending", dot: "bg-amber-500"   },
  { k: "paid",    label: "Paid",    dot: "bg-emerald-500" },
];

export const REACHVEL_PAYMENT_TYPES = [
  { k: "credit", label: "Credit", dot: "bg-emerald-500" },
  { k: "debit",  label: "Debit",  dot: "bg-rose-500"    },
];

export const labelFrom = (arr, key) => (arr.find((x) => x.k === key) || { label: key }).label;
