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
  { k: "draft",          label: "Draft",          dot: "bg-zinc-400"    },
  { k: "sent",           label: "Sent",           dot: "bg-blue-500"    },
  { k: "partially_paid", label: "Partially Paid", dot: "bg-amber-500"   },
  { k: "paid",           label: "Paid",           dot: "bg-emerald-500" },
  { k: "overdue",        label: "Overdue",        dot: "bg-rose-500"    },
];

export const VENDOR_PAYMENT_STATUSES = [
  { k: "pending", label: "Pending", dot: "bg-amber-500"   },
  { k: "paid",    label: "Paid",    dot: "bg-emerald-500" },
];

export const REACHVEL_PAYMENT_TYPES = [
  { k: "credit", label: "Credit", dot: "bg-emerald-500" },
  { k: "debit",  label: "Debit",  dot: "bg-rose-500"    },
];

// ─────────── New dropdowns from spec ───────────
export const SERVICE_INTERESTS = [
  { k: "Website Development", label: "Website Development" },
  { k: "Mobile App",          label: "Mobile App"          },
  { k: "AI Automation",       label: "AI Automation"       },
  { k: "Full Stack",          label: "Full Stack"          },
  { k: "Others",              label: "Others"              },
];

export const LEAD_SOURCES = [
  { k: "Referral",       label: "Referral"       },
  { k: "Website",        label: "Website"        },
  { k: "Social Media",   label: "Social Media"   },
  { k: "Cold Outreach",  label: "Cold Outreach"  },
  { k: "Event",          label: "Event"          },
  { k: "Advertisement",  label: "Advertisement"  },
  { k: "Other",          label: "Other"          },
];

export const VENDOR_STATUSES = [
  { k: "active",   label: "Active",   dot: "bg-emerald-500" },
  { k: "inactive", label: "Inactive", dot: "bg-zinc-400"    },
];

export const PROJECT_GROUPS = [
  { k: "CRM",            label: "CRM"            },
  { k: "Website",        label: "Website"        },
  { k: "Mobile App",     label: "Mobile App"     },
  { k: "Full Stack",     label: "Full Stack"     },
  { k: "AI Automation",  label: "AI Automation"  },
  { k: "Others",         label: "Others"         },
];

export const BANKS = [
  { k: "SBI",   label: "SBI"   },
  { k: "Kotak", label: "Kotak" },
];

export const REACHVEL_CREDIT_CATEGORIES = [
  { k: "Revenue",        label: "Revenue"        },
  { k: "Client Payment", label: "Client Payment" },
  { k: "Refund",         label: "Refund"         },
  { k: "Investment",     label: "Investment"     },
  { k: "Loan",           label: "Loan"           },
  { k: "Grant",          label: "Grant"          },
  { k: "Others",         label: "Others"         },
];

export const REACHVEL_DEBIT_CATEGORIES = [
  { k: "General Expense",     label: "General Expense"     },
  { k: "Payroll",             label: "Payroll"             },
  { k: "Equipment",           label: "Equipment"           },
  { k: "Software services",   label: "Software services"   },
  { k: "Marketing",           label: "Marketing"           },
  { k: "Rent & Utilities",    label: "Rent & Utilities"    },
  { k: "Office Supplies",     label: "Office Supplies"     },
  { k: "Travel & Transport",  label: "Travel & Transport"  },
  { k: "Professional Fees",   label: "Professional Fees"   },
  { k: "Tax & Licenses",      label: "Tax & Licenses"      },
  { k: "Others",              label: "Others"              },
];

// ─────────── Color tokens for Status pills ───────────
// Used by <StatusPill> for vibrant chips (no dull dots).
export const PILL_TONES = {
  emerald: "bg-emerald-500/12 text-emerald-700 border-emerald-500/30",
  amber:   "bg-amber-500/12   text-amber-700   border-amber-500/30",
  rose:    "bg-rose-500/12    text-rose-700    border-rose-500/30",
  blue:    "bg-blue-500/12    text-blue-700    border-blue-500/30",
  indigo:  "bg-indigo-500/12  text-indigo-700  border-indigo-500/30",
  violet:  "bg-violet-500/12  text-violet-700  border-violet-500/30",
  zinc:    "bg-zinc-200       text-zinc-700    border-zinc-300",
  orange:  "bg-[#ff5722]/12   text-[#ff5722]   border-[#ff5722]/30",
};

export const STAGE_TONE = {
  new: "zinc", contacted: "blue", qualified: "indigo",
  proposal: "amber", won: "emerald", lost: "rose",
};
export const PROJECT_STATUS_TONE = {
  planning: "zinc", in_progress: "blue", on_hold: "amber",
  completed: "emerald", cancelled: "rose",
};
export const TASK_STATUS_TONE   = { todo: "zinc", in_progress: "blue", done: "emerald" };
export const INVOICE_TONE       = { draft: "zinc", sent: "blue", partially_paid: "amber", paid: "emerald", overdue: "rose" };
export const VENDOR_PAY_TONE    = { pending: "amber", paid: "emerald" };
export const VENDOR_TONE        = { active: "emerald", inactive: "zinc" };
export const PAYMENT_TYPE_TONE  = { credit: "emerald", debit: "rose" };

export const labelFrom = (arr, key) => (arr.find((x) => x.k === key) || { label: key }).label;
