import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { db, logAuditTrail, moveToRecycleBin } from "@/lib/firebase";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  DollarSign,
  TrendingUp,
  Activity,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Loader2,
  Search,
  Calendar,
  Filter,
  Download,
  Printer,
  PieChart as PieIcon,
  TrendingDown,
  User,
  Users,
  Award,
  BookOpen,
  ArrowRightLeft,
  Copy,
  FolderMinus,
  CheckCircle,
  Archive,
  RefreshCw,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type ExpenseEntry = {
  id: string;
  type?: "income" | "expense";
  date: string;
  category: string;
  title: string;
  description: string;
  vendor: string;
  payment: string;
  amount: number;
  image?: string;
  reference?: string;
  notes?: string;
  status: "Paid" | "Pending" | "Cancelled";
  archived?: boolean;
  createdAt?: number;
};

type AppointmentRevenue = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  stylist?: string;
  date: string;
  time: string;
  notes?: string;
  payment: string;
  status: string;
  createdAt?: any;
};

type AuditLog = {
  id: string;
  operator: string;
  action: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  createdAt: number;
};

const DEFAULT_CATEGORIES = [
  "Rent",
  "Electricity",
  "Water Bill",
  "Internet",
  "Staff Salary",
  "Beauty Products",
  "Cosmetics",
  "Marketing",
  "Advertisement",
  "Maintenance",
  "Equipment",
  "Furniture",
  "Travel",
  "Training",
  "Miscellaneous",
];

const DEFAULT_INCOME_CATEGORIES = [
  "Product Sales",
  "Service Booking",
  "Package Sales",
  "Gift Card",
  "Training/Workshop",
  "Miscellaneous Income",
];

const ALL_ACCOUNTS = [
  "Cash",
  "Bank",
  "Service Revenue",
  "Rent Expense",
  "Electricity Expense",
  "Water Expense",
  "Internet Expense",
  "Staff Salary Expense",
  "Beauty Products Expense",
  "Cosmetics Expense",
  "Marketing Expense",
  "Advertisement Expense",
  "Maintenance Expense",
  "Equipment Expense",
  "Furniture Expense",
  "Travel Expense",
  "Training Expense",
  "Miscellaneous Expense",
  "Prepaid Expenses",
  "Accrued Liabilities",
  "Retained Earnings",
];

const COLORS = [
  "oklch(0.65 0.24 350)",
  "oklch(0.7 0.19 140)",
  "oklch(0.55 0.18 240)",
  "oklch(0.75 0.15 80)",
  "oklch(0.6 0.2 300)",
  "oklch(0.5 0.15 20)",
  "oklch(0.65 0.13 180)",
];

export function FinancialsManager() {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "journal"
    | "ledger"
    | "trial"
    | "adjustments"
    | "adjusted"
    | "statements"
    | "closing"
    | "postclosing"
    | "expenses"
    | "staff"
    | "customers"
    | "audit"
    | "backup"
  >("overview");

  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState("Bank");
  const [ledgerSubTab, setLedgerSubTab] = useState<"general" | "taccount">("general");

  // Operator profile
  const [operator, setOperator] = useState(
    () => sessionStorage.getItem("admin-operator") || "Simran Sen"
  );

  // Firestore lists
  const [appointments, setAppointments] = useState<AppointmentRevenue[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [recycleBin, setRecycleBin] = useState<any[]>([]);
  const [backupHistory, setBackupHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ backupSchedule: "Off" });

  // Search & Filtering
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState<"all" | "revenue" | "expense">("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // For bulk expense actions

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    type: "expense" as "expense" | "income",
    date: new Date().toISOString().split("T")[0],
    category: "Beauty Products",
    title: "",
    description: "",
    vendor: "",
    payment: "UPI / Google Pay",
    amount: "",
    image: "",
    reference: "",
    notes: "",
    status: "Paid" as ExpenseEntry["status"],
  });

  const handleTypeChange = (type: "expense" | "income") => {
    setExpenseForm((prev) => ({
      ...prev,
      type,
      category: type === "income" ? "Product Sales" : "Beauty Products",
    }));
  };

  const [customCat, setCustomCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Page index for ledger pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Track current operator name in Session
  useEffect(() => {
    sessionStorage.setItem("admin-operator", operator);
  }, [operator]);

  // Subscriptions
  useEffect(() => {
    // Read Appointments (Revenue)
    const unsubAppts = onSnapshot(collection(db, "appointments"), (snap) => {
      setAppointments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppointmentRevenue))
      );
    });

    // Read Expenses
    const unsubExp = onSnapshot(
      query(collection(db, "expenses"), orderBy("createdAt", "desc")),
      (snap) => {
        setExpenses(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExpenseEntry))
        );
      }
    );

    // Read Custom Categories
    const unsubCats = onSnapshot(collection(db, "expense_categories"), (snap) => {
      if (!snap.empty) {
        const custom = snap.docs.map((d) => d.data().name as string);
        setCategories([...DEFAULT_CATEGORIES, ...custom]);
      }
    });

    // Read Audit Logs
    const unsubAudit = onSnapshot(
      query(collection(db, "audit_logs"), orderBy("createdAt", "desc")),
      (snap) => {
        setAuditLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog)));
      }
    );

    // Read Adjustments
    const unsubAdj = onSnapshot(
      query(collection(db, "adjustments"), orderBy("date", "desc")),
      (snap) => {
        setAdjustments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    // Read Recycle Bin
    const unsubBin = onSnapshot(
      query(collection(db, "recycle_bin"), orderBy("deletedAt", "desc")),
      (snap) => {
        setRecycleBin(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    // Read Backups History
    const unsubBackups = onSnapshot(
      query(collection(db, "backups"), orderBy("createdAt", "desc")),
      (snap) => {
        setBackupHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    // Read Settings
    const unsubSettings = onSnapshot(collection(db, "settings"), (snap) => {
      if (!snap.empty) {
        setSettings(snap.docs[0].data());
      }
    });

    return () => {
      unsubAppts();
      unsubExp();
      unsubCats();
      unsubAudit();
      unsubAdj();
      unsubBin();
      unsubBackups();
      unsubSettings();
    };
  }, []);

  // Scheduled Backups Check
  useEffect(() => {
    const checkScheduledBackup = async () => {
      const schedule = settings?.backupSchedule || "Off";
      if (schedule === "Off") return;

      const lastBackupTime = Number(localStorage.getItem("last-scheduled-backup") || "0");
      const timeDiff = Date.now() - lastBackupTime;
      let shouldBackup = false;

      if (schedule === "Daily" && timeDiff > 24 * 60 * 60 * 1000) shouldBackup = true;
      if (schedule === "Weekly" && timeDiff > 7 * 24 * 60 * 60 * 1000) shouldBackup = true;
      if (schedule === "Monthly" && timeDiff > 30 * 24 * 60 * 60 * 1000) shouldBackup = true;

      if (shouldBackup) {
        localStorage.setItem("last-scheduled-backup", String(Date.now()));
        const backupData = await buildBackupData();
        await addDoc(collection(db, "backups"), {
          name: `AUTO_SCHEDULED_BACKUP_${new Date().toISOString().split("T")[0]}.json`,
          size: `${Math.round(JSON.stringify(backupData).length / 1024)} KB`,
          createdAt: Date.now(),
          createdBy: "Auto-Scheduler",
          data: JSON.stringify(backupData),
        });
        logAuditTrail("Automated backup created", `Schedule: ${schedule}`);
      }
    };
    if (activeTab === "overview" && appointments.length > 0) checkScheduledBackup();
  }, [activeTab, appointments, settings]);

  // Helpers
  const parsePrice = (priceStr: string): number => {
    const match = (priceStr || "").match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getWeekNumber = (d: Date) => {
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  };

  // Financial Summary Computations
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const thisYearStr = todayStr.substring(0, 4); // YYYY
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

  // Filter completed appointments for revenue calculations
  const completedBookings = appointments.filter((a) => a.status === "completed");
  const cancelledBookingsCount = appointments.filter((a) => a.status === "cancelled").length;
  const pendingBookingsCount = appointments.filter((a) => a.status === "pending" || !a.status).length;

  // Active revenue calculations
  const getRevenueFor = (list: AppointmentRevenue[]) =>
    list.reduce((sum, curr) => sum + parsePrice(curr.service), 0);

  const manualIncomes = expenses.filter((e) => !e.archived && e.status === "Paid" && e.type === "income");
  const activeExpenses = expenses.filter((e) => !e.archived && e.status === "Paid" && e.type !== "income");

  const getManualIncomeSum = (list: ExpenseEntry[]) =>
    list.reduce((sum, curr) => sum + Number(curr.amount), 0);

  const totalRevenue = getRevenueFor(completedBookings) + getManualIncomeSum(manualIncomes);
  const todayRevenue = getRevenueFor(completedBookings.filter((a) => a.date === todayStr)) + getManualIncomeSum(manualIncomes.filter((e) => e.date === todayStr));
  const monthRevenue = getRevenueFor(completedBookings.filter((a) => a.date.startsWith(thisMonthStr))) + getManualIncomeSum(manualIncomes.filter((e) => e.date.startsWith(thisMonthStr)));
  const yearRevenue = getRevenueFor(completedBookings.filter((a) => a.date.startsWith(thisYearStr))) + getManualIncomeSum(manualIncomes.filter((e) => e.date.startsWith(thisYearStr)));
  const weekRevenue = getRevenueFor(
    completedBookings.filter((a) => new Date(a.date) >= startOfWeek)
  ) + getManualIncomeSum(manualIncomes.filter((e) => new Date(e.date) >= startOfWeek));

  const totalExpense = activeExpenses.reduce((sum, curr) => sum + Number(curr.amount), 0);
  const todayExpense = activeExpenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, curr) => sum + Number(curr.amount), 0);
  const monthExpense = activeExpenses
    .filter((e) => e.date.startsWith(thisMonthStr))
    .reduce((sum, curr) => sum + Number(curr.amount), 0);
  const yearExpense = activeExpenses
    .filter((e) => e.date.startsWith(thisYearStr))
    .reduce((sum, curr) => sum + Number(curr.amount), 0);
  const weekExpense = activeExpenses
    .filter((e) => new Date(e.date) >= startOfWeek)
    .reduce((sum, curr) => sum + Number(curr.amount), 0);

  // Ledger Combined List
  const ledgerEntries = [
    ...completedBookings.map((a) => ({
      id: a.id,
      date: a.date,
      type: "revenue" as const,
      category: a.service.split("/")[0]?.trim() || "Service",
      amount: parsePrice(a.service),
      reference: a.id.substring(0, 6).toUpperCase(),
      description: `${a.name} - ${a.service.split("/").pop()?.trim()}`,
      status: "Completed",
      payment: a.payment,
      createdBy: "System",
      createdAt: a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.now(),
    })),
    ...expenses.map((e) => ({
      id: e.id,
      date: e.date,
      type: (e.type === "income" ? "revenue" : "expense") as "revenue" | "expense",
      category: e.category,
      amount: Number(e.amount),
      reference: e.reference || e.id.substring(0, 6).toUpperCase(),
      description: e.type === "income" ? `${e.title} (Manual Income - ${e.vendor || "N/A"})` : `${e.title} (${e.vendor || "N/A"})`,
      status: e.status,
      payment: e.payment,
      createdBy: "Operator",
      createdAt: e.createdAt || Date.now(),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  // Filtering ledger items
  const filteredLedger = ledgerEntries.filter((item) => {
    const matchesSearch =
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.reference.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || item.category.toUpperCase() === filterCategory.toUpperCase();

    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesPayment = filterPayment === "all" || item.payment.toLowerCase().includes(filterPayment.toLowerCase());

    const inDateRange =
      (!dateRange.start || item.date >= dateRange.start) &&
      (!dateRange.end || item.date <= dateRange.end);

    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesPayment && inDateRange;
  });

  // Profit and Loss calculations based on date ranges
  const getPAndLStats = (start: string, end: string) => {
    const rev = completedBookings
      .filter((a) => a.date >= start && a.date <= end)
      .reduce((sum, curr) => sum + parsePrice(curr.service), 0) +
      manualIncomes
      .filter((e) => e.date >= start && e.date <= end)
      .reduce((sum, curr) => sum + Number(curr.amount), 0);
    const exp = activeExpenses
      .filter((e) => e.date >= start && e.date <= end)
      .reduce((sum, curr) => sum + Number(curr.amount), 0);
    return { revenue: rev, expense: exp, profit: rev - exp };
  };

  // Custom Category additions
  const addCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCat.trim()) return;
    try {
      await addDoc(collection(db, "expense_categories"), {
        name: customCat.trim(),
        createdAt: serverTimestamp(),
      });
      toast.success(`Category "${customCat}" added!`);
      setCustomCat("");
    } catch {
      toast.error("Failed to add custom category");
    }
  };

  // Add or Edit Expense Handler
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      return toast.error("Title and Amount are required fields.");
    }

    setSaving(true);
    try {
      const dataObj = {
        type: expenseForm.type || "expense",
        date: expenseForm.date,
        category: expenseForm.category,
        title: expenseForm.title.trim(),
        description: expenseForm.description.trim(),
        vendor: expenseForm.vendor.trim(),
        payment: expenseForm.payment,
        amount: Number(expenseForm.amount),
        image: expenseForm.image || null,
        reference: expenseForm.reference.trim() || null,
        notes: expenseForm.notes.trim() || null,
        status: expenseForm.status,
        archived: false,
        updatedAt: Date.now(),
      };

      if (editingId) {
        // Edit Mode
        const oldEntry = expenses.find((x) => x.id === editingId);
        await updateDoc(doc(db, "expenses", editingId), dataObj);
        logAuditTrail(
          expenseForm.type === "income" ? "Income edited" : "Expense edited",
          `Updated ${expenseForm.type} entry "${expenseForm.title}" for ₹${expenseForm.amount}`,
          oldEntry ? `₹${oldEntry.amount} - ${oldEntry.title}` : null,
          `₹${expenseForm.amount} - ${expenseForm.title}`
        );
        toast.success(`${expenseForm.type === "income" ? "Income" : "Expense"} entry updated successfully!`);
        setEditingId(null);
      } else {
        // Add Mode
        await addDoc(collection(db, "expenses"), {
          ...dataObj,
          createdAt: Date.now(),
        });
        logAuditTrail(
          expenseForm.type === "income" ? "Income added" : "Expense added",
          `Added new ${expenseForm.type} entry "${expenseForm.title}" of ₹${expenseForm.amount} in ${expenseForm.category}`
        );
        toast.success(`${expenseForm.type === "income" ? "Income" : "Expense"} logged successfully!`);
      }

      setExpenseForm({
        type: "expense",
        date: new Date().toISOString().split("T")[0],
        category: "Beauty Products",
        title: "",
        description: "",
        vendor: "",
        payment: "UPI / Google Pay",
        amount: "",
        image: "",
        reference: "",
        notes: "",
        status: "Paid",
      });
      setActiveTab("ledger");
    } catch {
      toast.error("Failed to save expense details.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTrigger = (exp: ExpenseEntry) => {
    setEditingId(exp.id);
    setExpenseForm({
      type: exp.type || "expense",
      date: exp.date,
      category: exp.category,
      title: exp.title,
      description: exp.description || "",
      vendor: exp.vendor || "",
      payment: exp.payment,
      amount: String(exp.amount),
      image: exp.image || "",
      reference: exp.reference || "",
      notes: exp.notes || "",
      status: exp.status,
    });
    setActiveTab("expenses");
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const entry = expenses.find((x) => x.id === id);
      if (entry) await moveToRecycleBin("expenses", id, entry);
      await deleteDoc(doc(db, "expenses", id));
      logAuditTrail("Expense deleted", `Removed expense record "${entry?.title}" of ₹${entry?.amount}`);
      toast.success("Expense record removed.");
    } catch {
      toast.error("Failed to delete record.");
    }
  };

  const handleDuplicateExpense = async (exp: ExpenseEntry) => {
    try {
      await addDoc(collection(db, "expenses"), {
        ...exp,
        id: undefined,
        reference: exp.reference ? `${exp.reference}-DUP` : null,
        createdAt: Date.now(),
      });
      logAuditTrail("Expense duplicated", `Duplicated expense entry "${exp.title}" of ₹${exp.amount}`);
      toast.success("Record duplicated successfully.");
    } catch {
      toast.error("Failed to duplicate record.");
    }
  };

  const handleArchiveExpense = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "expenses", id), { archived: !current });
      logAuditTrail(
        current ? "Expense restored" : "Expense archived",
        `Changed archive state for expense record`
      );
      toast.success(current ? "Record restored!" : "Record archived!");
    } catch {
      toast.error("Failed to archive record.");
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Confirm bulk deleting ${selectedIds.length} expense entries?`)) return;
    try {
      for (const id of selectedIds) {
        const entry = expenses.find((x) => x.id === id);
        if (entry) await moveToRecycleBin("expenses", id, entry);
        await deleteDoc(doc(db, "expenses", id));
      }
      logAuditTrail("Expenses bulk deleted", `Removed ${selectedIds.length} expense logs`);
      toast.success(`Deleted ${selectedIds.length} logs.`);
      setSelectedIds([]);
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  // CSV Report Generator
  const triggerCSVExport = () => {
    const headers = [
      "Date",
      "Type",
      "Category",
      "Description",
      "Amount (INR)",
      "Reference",
      "Payment Method",
      "Status",
    ];
    const rows = filteredLedger.map((e) => [
      e.date,
      e.type.toUpperCase(),
      e.category,
      e.description,
      e.amount,
      e.reference,
      e.payment,
      e.status,
    ]);
    const filename = `SD_Financial_Ledger_${new Date().toISOString().split("T")[0]}.csv`;

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAuditTrail("Financial report exported", "Downloaded CSV Ledger Ledger summary file");
  };

  // Printable layout window trigger
  const triggerPrintReport = () => {
    const headers = ["Date", "Type", "Category", "Details", "Amount", "Ref", "Method", "Status"];
    const rows = filteredLedger.map((e) => [
      e.date,
      e.type.toUpperCase(),
      e.category,
      e.description,
      `₹${e.amount}`,
      e.reference,
      e.payment,
      e.status,
    ]);

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>SD Beauty Parlour - Accounting Ledger</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #333; }
            h1 { font-size: 24px; margin-bottom: 2px; font-weight: bold; }
            p { font-size: 11px; color: #666; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #eee; padding: 10px; text-align: left; font-size: 11px; }
            th { background-color: #f8f8f8; font-weight: 700; text-transform: uppercase; color: #555; }
            tr:nth-child(even) { background-color: #fbfbfb; }
            .totals { margin-top: 30px; border-top: 2px solid #333; padding-top: 15px; font-size: 13px; text-align: right; }
            .totals span { font-weight: bold; margin-left: 20px; }
            .footer { margin-top: 40px; font-size: 9px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>SD Beauty Parlour Ledger</h1>
          <p>Generated on ${new Date().toLocaleString()} by Operator: ${operator}</p>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
          <div class="totals">
            <span>Total Entries: ${filteredLedger.length}</span>
            <span>Est. Revenue: ₹${filteredLedger
              .filter((x) => x.type === "revenue")
              .reduce((s, c) => s + c.amount, 0)}</span>
            <span>Total Expense: ₹${filteredLedger
              .filter((x) => x.type === "expense")
              .reduce((s, c) => s + c.amount, 0)}</span>
          </div>
          <div class="footer">SD Beauty Parlour Accounting and Financials System Ledger</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    logAuditTrail("Financial report exported", "Printed/Exported PDF Ledger Ledger report summary");
  };

  // Adjustments form states
  const [adjustmentForm, setAdjustmentForm] = useState({
    date: new Date().toISOString().split("T")[0],
    debitAcc: "Prepaid Expenses",
    creditAcc: "Rent Expense",
    amount: "",
    explanation: "",
  });

  const [selectedStatement, setSelectedStatement] = useState<"pl" | "bs" | "cf">("pl");

  // Double-Entry Book Calculator
  const doubleEntryBook = () => {
    const ledgerBalances: Record<string, { debits: number; credits: number; entries: any[] }> = {};
    ALL_ACCOUNTS.forEach((acc) => {
      ledgerBalances[acc] = { debits: 0, credits: 0, entries: [] };
    });

    const journalEntries: {
      id: string;
      date: string;
      description: string;
      ref: string;
      debitAcc: string;
      creditAcc: string;
      amount: number;
    }[] = [];

    const postEntry = (
      id: string,
      date: string,
      description: string,
      ref: string,
      debitAcc: string,
      creditAcc: string,
      amount: number
    ) => {
      journalEntries.push({ id, date, description, ref, debitAcc, creditAcc, amount });

      if (ledgerBalances[debitAcc]) {
        ledgerBalances[debitAcc].debits += amount;
        ledgerBalances[debitAcc].entries.push({
          date,
          description,
          ref,
          type: "debit",
          amount,
          oppositeAccount: creditAcc,
        });
      }
      if (ledgerBalances[creditAcc]) {
        ledgerBalances[creditAcc].credits += amount;
        ledgerBalances[creditAcc].entries.push({
          date,
          description,
          ref,
          type: "credit",
          amount,
          oppositeAccount: debitAcc,
        });
      }
    };

    // Process all completed bookings (Revenue)
    completedBookings.forEach((a) => {
      const amount = parsePrice(a.service);
      if (amount <= 0) return;
      const ref = a.id.substring(0, 6).toUpperCase();
      const method = (a.payment || "").toLowerCase().includes("cash") ? "Cash" : "Bank";
      const desc = `${a.name} - Service Booking (${a.service.split("/").pop()?.trim()})`;
      postEntry(a.id, a.date, desc, ref, method, "Service Revenue", amount);
    });

    // Process Manual Income & Expenses from expenses state
    expenses.forEach((e) => {
      if (e.archived || e.status !== "Paid") return;
      const amount = Number(e.amount);
      if (isNaN(amount) || amount <= 0) return;
      const ref = e.reference || e.id.substring(0, 6).toUpperCase();
      const method = (e.payment || "").toLowerCase().includes("cash") ? "Cash" : "Bank";

      if (e.type === "income") {
        const desc = `${e.title} (Manual Income - ${e.vendor || "N/A"})`;
        postEntry(e.id, e.date, desc, ref, method, "Service Revenue", amount);
      } else {
        let expenseAcc = `${e.category} Expense`;
        if (!ALL_ACCOUNTS.includes(expenseAcc)) {
          expenseAcc = "Miscellaneous Expense";
        }
        const desc = `${e.title} (${e.vendor || "N/A"})`;
        postEntry(e.id, e.date, desc, ref, expenseAcc, method, amount);
      }
    });

    // Process Adjustments
    adjustments.forEach((adj) => {
      const amount = Number(adj.amount);
      if (isNaN(amount) || amount <= 0) return;
      const ref = adj.id.substring(0, 6).toUpperCase();
      const desc = `Adjustment: ${adj.explanation || adj.title}`;
      postEntry(adj.id, adj.date, desc, ref, adj.debitAcc, adj.creditAcc, amount);
    });

    // Calculate Trial Balance
    const trialBalance = ALL_ACCOUNTS.map((acc) => {
      const { debits, credits } = ledgerBalances[acc];
      const isAssetOrExpense =
        acc === "Cash" ||
        acc === "Bank" ||
        acc === "Prepaid Expenses" ||
        acc.endsWith("Expense");

      let debitVal = 0;
      let creditVal = 0;
      const balance = debits - credits;

      if (isAssetOrExpense) {
        if (balance >= 0) debitVal = balance;
        else creditVal = Math.abs(balance);
      } else {
        if (balance <= 0) creditVal = Math.abs(balance);
        else debitVal = balance;
      }

      return {
        account: acc,
        debit: debitVal,
        credit: creditVal,
      };
    });

    // Calculate closing entries
    const serviceRevBal = ledgerBalances["Service Revenue"].credits - ledgerBalances["Service Revenue"].debits;
    const closingEntries: any[] = [];
    let closingEarningsDebit = 0;
    let closingEarningsCredit = 0;

    if (serviceRevBal > 0) {
      closingEntries.push({
        date: todayStr,
        debitAcc: "Service Revenue",
        creditAcc: "Retained Earnings",
        amount: serviceRevBal,
        description: "Close Service Revenue to Retained Earnings",
      });
      closingEarningsCredit += serviceRevBal;
    }

    ALL_ACCOUNTS.forEach((acc) => {
      if (acc.endsWith("Expense")) {
        const bal = ledgerBalances[acc].debits - ledgerBalances[acc].credits;
        if (bal > 0) {
          closingEntries.push({
            date: todayStr,
            debitAcc: "Retained Earnings",
            creditAcc: acc,
            amount: bal,
            description: `Close ${acc} to Retained Earnings`,
          });
          closingEarningsDebit += bal;
        }
      }
    });

    // Post-Closing Trial Balance
    const postClosingTrialBalance = trialBalance.map((item) => {
      let { account, debit, credit } = item;
      if (account === "Service Revenue") {
        return { account, debit: 0, credit: 0 };
      }
      if (account.endsWith("Expense")) {
        return { account, debit: 0, credit: 0 };
      }
      if (account === "Retained Earnings") {
        const finalRetainedEarnings = credit - debit + (closingEarningsCredit - closingEarningsDebit);
        return {
          account,
          debit: finalRetainedEarnings < 0 ? Math.abs(finalRetainedEarnings) : 0,
          credit: finalRetainedEarnings >= 0 ? finalRetainedEarnings : 0,
        };
      }
      return { account, debit, credit };
    });

    return {
      journalEntries,
      ledgerBalances,
      trialBalance,
      closingEntries,
      postClosingTrialBalance,
    };
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentForm.amount || Number(adjustmentForm.amount) <= 0) {
      return toast.error("Please enter a valid adjustment amount.");
    }
    setSaving(true);
    try {
      const dataObj = {
        date: adjustmentForm.date,
        debitAcc: adjustmentForm.debitAcc,
        creditAcc: adjustmentForm.creditAcc,
        amount: Number(adjustmentForm.amount),
        explanation: adjustmentForm.explanation.trim(),
        createdAt: Date.now(),
      };
      await addDoc(collection(db, "adjustments"), dataObj);
      logAuditTrail("Adjustment created", `Adjusted Debit ${adjustmentForm.debitAcc} and Credit ${adjustmentForm.creditAcc} of ₹${adjustmentForm.amount}`);
      toast.success("Adjusting entry posted successfully!");
      setAdjustmentForm({
        date: new Date().toISOString().split("T")[0],
        debitAcc: "Prepaid Expenses",
        creditAcc: "Rent Expense",
        amount: "",
        explanation: "",
      });
    } catch {
      toast.error("Failed to post adjustment entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdjustment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this adjusting entry?")) return;
    try {
      const entry = adjustments.find((x) => x.id === id);
      if (entry) await moveToRecycleBin("adjustments", id, entry);
      await deleteDoc(doc(db, "adjustments", id));
      logAuditTrail("Adjustment deleted", `Deleted adjustment entry of ₹${entry?.amount}`);
      toast.success("Adjustment entry deleted successfully.");
    } catch {
      toast.error("Failed to delete adjustment entry.");
    }
  };

  const downloadChart = (containerId: string, format: "png" | "svg") => {
    const container = document.getElementById(containerId);
    const svgEl = container?.querySelector("svg");
    if (!svgEl) return toast.error("Chart SVG element not found.");

    const svgString = new XMLSerializer().serializeToString(svgEl);
    if (format === "svg") {
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${containerId}_chart.svg`;
      a.click();
      URL.revokeObjectURL(url);
      logAuditTrail("Chart exported", `Downloaded chart ${containerId} as SVG`);
      toast.success("SVG Chart downloaded!");
    } else {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      
      const rect = svgEl.getBoundingClientRect();
      canvas.width = rect.width || 800;
      canvas.height = rect.height || 400;

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `${containerId}_chart.png`;
          a.click();
          URL.revokeObjectURL(url);
          logAuditTrail("Chart exported", `Downloaded chart ${containerId} as PNG`);
          toast.success("PNG Chart downloaded!");
        }
      };
      img.src = url;
    }
  };

  const buildBackupData = async () => {
    const collectionsToBackup = [
      "appointments",
      "expenses",
      "adjustments",
      "expense_categories",
      "services",
      "team",
      "offers",
      "faqs",
      "blog",
      "settings",
      "audit_logs",
    ];

    const backupDump: Record<string, any[]> = {};
    for (const name of collectionsToBackup) {
      try {
        const snap = await getDocs(collection(db, name));
        backupDump[name] = snap.docs.map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        }));
      } catch (err) {
        console.error(`Backup failed for collection ${name}:`, err);
      }
    }
    return backupDump;
  };

  const handleExecuteRestore = async (backupData: any, mode: "merge" | "replace") => {
    setSaving(true);
    try {
      const collectionsToRestore = Object.keys(backupData);
      
      for (const name of collectionsToRestore) {
        const newDocs = backupData[name];
        if (!Array.isArray(newDocs)) continue;

        if (mode === "replace") {
          const currentSnap = await getDocs(collection(db, name));
          for (const docObj of currentSnap.docs) {
            await deleteDoc(doc(db, name, docObj.id));
          }
        }

        for (const docItem of newDocs) {
          const cleanItem = { ...docItem };
          const docId = cleanItem._id;
          delete cleanItem._id;

          if (docId) {
            await setDoc(doc(db, name, docId), cleanItem);
          } else {
            await addDoc(collection(db, name), cleanItem);
          }
        }
      }
      logAuditTrail("Database restore executed", `Mode: ${mode}, Collections: ${collectionsToRestore.join(", ")}`);
      toast.success("Database restored successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Database restore failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>, mode: "merge" | "replace") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (confirm(`Are you sure you want to restore database in ${mode} mode? This action is critical.`)) {
          await handleExecuteRestore(json, mode);
        }
      } catch (err) {
        toast.error("Invalid backup file format.");
      }
    };
    reader.readAsText(file);
  };

  const triggerBulkBackup = async () => {
    setSaving(true);
    try {
      const backupData = await buildBackupData();
      const zip = new JSZip();

      zip.file("database_raw_dump.json", JSON.stringify(backupData, null, 2));

      const wb = XLSX.utils.book_new();
      const { journalEntries, trialBalance, closingEntries, postClosingTrialBalance } = doubleEntryBook();

      // Sheet 1: Journal
      const journalWS = XLSX.utils.json_to_sheet(
        journalEntries.map((e) => ({
          Date: e.date,
          Reference: e.ref,
          Description: e.description,
          "Debit Account": e.debitAcc,
          "Credit Account": e.creditAcc,
          Amount: e.amount,
        }))
      );
      XLSX.utils.book_append_sheet(wb, journalWS, "Journal");

      // Sheet 2: Ledger Accounts
      const ledgerRows: any[] = [];
      ALL_ACCOUNTS.forEach((acc) => {
        ledgerRows.push({ Account: `--- ${acc.toUpperCase()} ---` });
        const { entries } = doubleEntryBook().ledgerBalances[acc] || { entries: [] };
        let runningBal = 0;
        entries.forEach((e: any) => {
          const isAssetOrExpense = acc === "Cash" || acc === "Bank" || acc === "Prepaid Expenses" || acc.endsWith("Expense");
          if (e.type === "debit") {
            runningBal += isAssetOrExpense ? e.amount : -e.amount;
          } else {
            runningBal += isAssetOrExpense ? -e.amount : e.amount;
          }
          ledgerRows.push({
            Date: e.date,
            Description: e.description,
            Ref: e.ref,
            Type: e.type.toUpperCase(),
            Amount: e.amount,
            "Opposite Account": e.oppositeAccount,
            "Running Balance": runningBal,
          });
        });
      });
      const ledgerWS = XLSX.utils.json_to_sheet(ledgerRows);
      XLSX.utils.book_append_sheet(wb, ledgerWS, "Ledgers");

      // Sheet 3: Trial Balance
      const trialWS = XLSX.utils.json_to_sheet(
        trialBalance.map((t) => ({
          Account: t.account,
          Debit: t.debit || "",
          Credit: t.credit || "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, trialWS, "Trial Balance");

      // Sheet 4: Adjustments
      const adjWS = XLSX.utils.json_to_sheet(
        adjustments.map((a) => ({
          Date: a.date,
          Explanation: a.explanation || "",
          "Debit Account": a.debitAcc,
          "Credit Account": a.creditAcc,
          Amount: a.amount,
        }))
      );
      XLSX.utils.book_append_sheet(wb, adjWS, "Adjustments");

      // Sheet 5: Adjusted Trial Balance
      const adjustedTrialWS = XLSX.utils.json_to_sheet(
        trialBalance.map((item) => {
          const { account, debit: unDr, credit: unCr } = item;
          let adjDr = 0;
          let adjCr = 0;
          adjustments.forEach((a) => {
            if (a.debitAcc === account) adjDr += Number(a.amount);
            if (a.creditAcc === account) adjCr += Number(a.amount);
          });

          const isAssetOrExpense = account === "Cash" || account === "Bank" || account === "Prepaid Expenses" || account.endsWith("Expense");
          const netAdjustment = isAssetOrExpense ? (adjDr - adjCr) : (adjCr - adjDr);
          const unadjustedNet = isAssetOrExpense ? (unDr - unCr) : (unCr - unDr);
          const finalNet = unadjustedNet + netAdjustment;

          return {
            Account: account,
            "Unadjusted Debit": unDr || "",
            "Unadjusted Credit": unCr || "",
            "Adjustment Debit": adjDr || "",
            "Adjustment Credit": adjCr || "",
            "Adjusted Debit": (isAssetOrExpense ? (finalNet >= 0 ? finalNet : 0) : (finalNet < 0 ? Math.abs(finalNet) : 0)) || "",
            "Adjusted Credit": (isAssetOrExpense ? (finalNet < 0 ? Math.abs(finalNet) : 0) : (finalNet >= 0 ? finalNet : 0)) || "",
          };
        })
      );
      XLSX.utils.book_append_sheet(wb, adjustedTrialWS, "Adjusted Trial Balance");

      // Sheet 6: Closing Entries
      const closingWS = XLSX.utils.json_to_sheet(
        closingEntries.map((c) => ({
          Date: c.date,
          Description: c.description,
          "Debit Account": c.debitAcc,
          "Credit Account": c.creditAcc,
          Amount: c.amount,
        }))
      );
      XLSX.utils.book_append_sheet(wb, closingWS, "Closing Entries");

      // Sheet 7: Post Closing Trial Balance
      const postClosingWS = XLSX.utils.json_to_sheet(
        postClosingTrialBalance.map((p) => ({
          Account: p.account,
          Debit: p.debit || "",
          Credit: p.credit || "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, postClosingWS, "Post Closing Trial Balance");

      // Sheet 8: Audit Logs
      const auditWS = XLSX.utils.json_to_sheet(
        auditLogs.map((l) => ({
          Timestamp: new Date(l.createdAt).toLocaleString(),
          Operator: l.operator,
          Action: l.action,
          Details: l.details,
          "Old Value": l.oldValue || "",
          "New Value": l.newValue || "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, auditWS, "Audit Logs");

      const xlsxBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      zip.file("SD_Books_All_Sheets.xlsx", xlsxBuffer);

      const content = await zip.generateAsync({ type: "blob" });
      const filename = `SD_BEAUTY_PARLOUR_BACKUP_${new Date().toISOString().split("T")[0]}.zip`;

      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await addDoc(collection(db, "backups"), {
        name: filename,
        size: `${Math.round(content.size / 1024)} KB`,
        createdAt: Date.now(),
        createdBy: operator,
        data: JSON.stringify(backupData),
      });

      logAuditTrail("Database ZIP backup created", `Downloaded zip with sheet and JSON dump. Size: ${Math.round(content.size / 1024)} KB`);
      toast.success("ZIP Backup compiled and downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate ZIP backup.");
    } finally {
      setSaving(false);
    }
  };

  const exportExcelTab = (tabId: string) => {
    const wb = XLSX.utils.book_new();
    let ws;
    let filename = `SD_Export_${tabId}_${new Date().toISOString().split("T")[0]}.xlsx`;

    const { journalEntries, trialBalance, closingEntries, postClosingTrialBalance } = doubleEntryBook();

    if (tabId === "journal") {
      ws = XLSX.utils.json_to_sheet(
        journalEntries.map((e) => ({
          Date: e.date,
          Reference: e.ref,
          Description: e.description,
          "Debit Account": e.debitAcc,
          "Credit Account": e.creditAcc,
          Amount: e.amount,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Journal");
    } else if (tabId === "ledger") {
      const entries = doubleEntryBook().ledgerBalances[selectedLedgerAccount]?.entries || [];
      let runningBal = 0;
      const rows = entries.map((e: any) => {
        const isAssetOrExpense = selectedLedgerAccount === "Cash" || selectedLedgerAccount === "Bank" || selectedLedgerAccount === "Prepaid Expenses" || selectedLedgerAccount.endsWith("Expense");
        if (e.type === "debit") {
          runningBal += isAssetOrExpense ? e.amount : -e.amount;
        } else {
          runningBal += isAssetOrExpense ? -e.amount : e.amount;
        }
        return {
          Date: e.date,
          Description: e.description,
          Ref: e.ref,
          Type: e.type.toUpperCase(),
          Amount: e.amount,
          "Opposite Account": e.oppositeAccount,
          "Running Balance": runningBal,
        };
      });
      ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, `Ledger-${selectedLedgerAccount}`);
    } else if (tabId === "trial") {
      ws = XLSX.utils.json_to_sheet(
        trialBalance.map((t) => ({
          Account: t.account,
          Debit: t.debit || "",
          Credit: t.credit || "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
    } else if (tabId === "adjustments") {
      ws = XLSX.utils.json_to_sheet(
        adjustments.map((a) => ({
          Date: a.date,
          Explanation: a.explanation || "",
          "Debit Account": a.debitAcc,
          "Credit Account": a.creditAcc,
          Amount: a.amount,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Adjustments");
    } else if (tabId === "adjusted") {
      ws = XLSX.utils.json_to_sheet(
        trialBalance.map((item) => {
          const { account, debit: unDr, credit: unCr } = item;
          let adjDr = 0;
          let adjCr = 0;
          adjustments.forEach((a) => {
            if (a.debitAcc === account) adjDr += Number(a.amount);
            if (a.creditAcc === account) adjCr += Number(a.amount);
          });
          const isAssetOrExpense = account === "Cash" || account === "Bank" || account === "Prepaid Expenses" || account.endsWith("Expense");
          const netAdjustment = isAssetOrExpense ? (adjDr - adjCr) : (adjCr - adjDr);
          const unadjustedNet = isAssetOrExpense ? (unDr - unCr) : (unCr - unDr);
          const finalNet = unadjustedNet + netAdjustment;
          return {
            Account: account,
            "Unadjusted Debit": unDr || "",
            "Unadjusted Credit": unCr || "",
            "Adjustment Debit": adjDr || "",
            "Adjustment Credit": adjCr || "",
            "Adjusted Debit": (isAssetOrExpense ? (finalNet >= 0 ? finalNet : 0) : (finalNet < 0 ? Math.abs(finalNet) : 0)) || "",
            "Adjusted Credit": (isAssetOrExpense ? (finalNet < 0 ? Math.abs(finalNet) : 0) : (finalNet >= 0 ? finalNet : 0)) || "",
          };
        })
      );
      XLSX.utils.book_append_sheet(wb, ws, "Adjusted Trial Balance");
    } else if (tabId === "closing") {
      ws = XLSX.utils.json_to_sheet(
        closingEntries.map((c) => ({
          Date: c.date,
          Description: c.description,
          "Debit Account": c.debitAcc,
          "Credit Account": c.creditAcc,
          Amount: c.amount,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Closing Entries");
    } else if (tabId === "postclosing") {
      ws = XLSX.utils.json_to_sheet(
        postClosingTrialBalance.map((p) => ({
          Account: p.account,
          Debit: p.debit || "",
          Credit: p.credit || "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Post Closing Trial Balance");
    } else {
      ws = XLSX.utils.json_to_sheet(
        filteredLedger.map((e) => ({
          Date: e.date,
          Type: e.type.toUpperCase(),
          Category: e.category,
          Description: e.description,
          Amount: e.amount,
          Reference: e.reference,
          Payment: e.payment,
          Status: e.status,
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Ledger Overview");
    }

    XLSX.writeFile(wb, filename);
    logAuditTrail("Excel report exported", `Downloaded Excel report for tab ${tabId}`);
    toast.success(`Excel file "${filename}" downloaded!`);
  };

  const handleSaveSettings = async (val: string) => {
    try {
      await setDoc(doc(db, "settings", "global_preferences"), {
        backupSchedule: val,
        updatedAt: Date.now(),
      }, { merge: true });
      logAuditTrail("Backup scheduler modified", `Changed backup schedule to: ${val}`);
      toast.success(`Backup schedule updated to ${val}`);
    } catch (err) {
      toast.error("Failed to update schedule.");
    }
  };

  const handleRestoreFromBin = async (binItem: any) => {
    try {
      await setDoc(doc(db, binItem.originalCollection, binItem.originalId), binItem.data);
      await deleteDoc(doc(db, "recycle_bin", binItem.id));
      logAuditTrail("Recycle Bin Restore", `Restored item from ${binItem.originalCollection}`);
      toast.success("Item restored successfully!");
    } catch (err) {
      toast.error("Failed to restore item.");
    }
  };

  const handlePermanentDeleteFromBin = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this item? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "recycle_bin", id));
      logAuditTrail("Recycle Bin Permanent Delete", `Permanently removed item from recycle bin`);
      toast.success("Item permanently removed.");
    } catch (err) {
      toast.error("Failed to delete item.");
    }
  };

  // Recharts aggregated values for charts
  // Monthly calculations
  const monthlyDataMap: Record<string, { month: string; revenue: number; expense: number }> = {};
  ledgerEntries.forEach((it) => {
    const month = it.date.substring(0, 7); // YYYY-MM
    monthlyDataMap[month] ??= { month, revenue: 0, expense: 0 };
    if (it.type === "revenue") {
      monthlyDataMap[month].revenue += it.amount;
    } else if (it.status === "Paid") {
      monthlyDataMap[month].expense += it.amount;
    }
  });

  const chartMonthlyData = Object.values(monthlyDataMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Last 6 months

  // Category expense calculations (Pie Chart)
  const categoryMap: Record<string, number> = {};
  activeExpenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
  });
  const chartCategoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Top services contribution
  const serviceRevenueMap: Record<string, number> = {};
  completedBookings.forEach((a) => {
    const sName = a.service.split("/").pop()?.split("(")[0]?.trim() || "Others";
    serviceRevenueMap[sName] = (serviceRevenueMap[sName] || 0) + parsePrice(a.service);
  });
  const chartServiceData = Object.entries(serviceRevenueMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 services

  // Staff Performance list calculations
  const staffPerformance: Record<
    string,
    { name: string; bookings: number; revenue: number; commission: number }
  > = {};
  completedBookings.forEach((a) => {
    const stylist = a.stylist || "Any Stylist";
    staffPerformance[stylist] ??= { name: stylist, bookings: 0, revenue: 0, commission: 0 };
    const rev = parsePrice(a.service);
    staffPerformance[stylist].bookings += 1;
    staffPerformance[stylist].revenue += rev;
    staffPerformance[stylist].commission += Math.round(rev * 0.1); // 10% commission template
  });
  const staffList = Object.values(staffPerformance).sort((a, b) => b.revenue - a.revenue);

  // Customer Analytics list calculations
  const customerAnalytics: Record<
    string,
    { name: string; phone: string; visits: number; spend: number; lastVisit: string; preferredService: string }
  > = {};
  completedBookings.forEach((a) => {
    const phone = a.phone;
    customerAnalytics[phone] ??= {
      name: a.name,
      phone,
      visits: 0,
      spend: 0,
      lastVisit: a.date,
      preferredService: a.service.split("/").pop()?.split("(")[0]?.trim() || "Service",
    };
    customerAnalytics[phone].visits += 1;
    customerAnalytics[phone].spend += parsePrice(a.service);
    if (a.date > customerAnalytics[phone].lastVisit) {
      customerAnalytics[phone].lastVisit = a.date;
    }
  });
  const customerList = Object.values(customerAnalytics).sort((a, b) => b.spend - a.spend).slice(0, 15);

  // Insights computations
  const getInsights = () => {
    const insights: string[] = [];
    // 1. Service contribution
    if (chartServiceData.length > 0 && totalRevenue > 0) {
      const topSvc = chartServiceData[0];
      const pct = Math.round((topSvc.value / totalRevenue) * 100);
      insights.push(`"${topSvc.name}" contributed ${pct}% of total completed booking revenue.`);
    }
    // 2. Highest expense
    if (chartCategoryData.length > 0) {
      const sortedCats = [...chartCategoryData].sort((a, b) => b.value - a.value);
      insights.push(`"${sortedCats[0].name}" is the parlour's highest outgoing expense category.`);
    }
    // 3. Month over Month growth
    if (chartMonthlyData.length >= 2) {
      const len = chartMonthlyData.length;
      const prevMonth = chartMonthlyData[len - 2];
      const currMonth = chartMonthlyData[len - 1];
      if (prevMonth.revenue > 0) {
        const diff = currMonth.revenue - prevMonth.revenue;
        const pct = Math.round((diff / prevMonth.revenue) * 100);
        if (pct > 0) {
          insights.push(`Revenue increased by ${pct}% compared to the previous month.`);
        } else if (pct < 0) {
          insights.push(`Revenue dropped by ${Math.abs(pct)}% compared to the previous month.`);
        }
      }
    }
    // Fallback if low dataset
    if (insights.length === 0) {
      insights.push("Accounting Ledger started successfully. No trends anomalies detected yet.");
    }
    return insights;
  };

  // Pagination bounds
  const totalPages = Math.ceil(filteredLedger.length / itemsPerPage);
  const paginatedLedger = filteredLedger.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Financials Header Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card border border-border p-5 rounded-3xl shadow-soft">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-display flex items-center gap-2 text-foreground">
            <DollarSign className="h-5 w-5 text-primary" /> SD Books Ledger & Accounting
          </h2>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Vyapar & Zoho inspired parlour bookkeeping ledger
          </p>
        </div>

        {/* Operator Profile Register Selector */}
        <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-2xl border border-border">
          <User className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none">
              Register Operator
            </span>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-xs font-semibold text-foreground mt-1 p-0 w-32"
              placeholder="Operator name"
            />
          </div>
        </div>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="space-y-4 bg-card/60 p-4 border border-border rounded-2xl shadow-soft">
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-2.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block w-full mb-1">
            General Ledger & Operations
          </span>
          {[
            { id: "overview", label: "Dashboard", icon: DollarSign },
            { id: "expenses", label: "Add Transaction", icon: Plus },
            { id: "ledger", label: "Revenue & Expense Ledger", icon: ArrowRightLeft },
            { id: "staff", label: "Staff Ledger", icon: Award },
            { id: "customers", label: "Customers Value", icon: Users },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === t.id
                  ? "gradient-rose text-white shadow-soft"
                  : "bg-card hover:bg-accent text-muted-foreground border border-border"
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-border pb-2.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block w-full mb-1">
            Double-Entry Accounting Books
          </span>
          {[
            { id: "journal", label: "Journal Entries", icon: BookOpen },
            { id: "trial", label: "Trial Balance", icon: Activity },
            { id: "adjustments", label: "Adjusting Entries", icon: Edit2 },
            { id: "adjusted", label: "Adjusted Trial Balance", icon: TrendingUp },
            { id: "closing", label: "Closing Entries", icon: Archive },
            { id: "postclosing", label: "Post Closing Trial", icon: CheckCircle },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === t.id
                  ? "gradient-rose text-white shadow-soft"
                  : "bg-card hover:bg-accent text-muted-foreground border border-border"
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block w-full mb-1">
            Financial Statements & Utilities
          </span>
          {[
            { id: "statements", label: "Financial Statements", icon: TrendingUp },
            { id: "audit", label: "Audit Trails", icon: BookOpen },
            { id: "backup", label: "Backup & Recovery Center", icon: RefreshCw },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === t.id
                  ? "gradient-rose text-white shadow-soft"
                  : "bg-card hover:bg-accent text-muted-foreground border border-border"
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW FINANCIAL DASHBOARD */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Monthly Profit Card */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-soft relative overflow-hidden flex flex-col justify-between h-[130px]">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  This Month Net Profit
                </span>
                <span className="text-2xl font-bold font-mono text-gradient-rose block mt-1">
                  ₹{monthRevenue - monthExpense}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2">
                <span className="flex items-center gap-0.5 text-green-600">
                  <TrendingUp className="h-3 w-3" /> Rev: ₹{monthRevenue}
                </span>
                <span className="flex items-center gap-0.5 text-destructive">
                  <TrendingDown className="h-3 w-3" /> Exp: ₹{monthExpense}
                </span>
              </div>
            </div>

            {/* Total Ledger Turnover */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-soft relative overflow-hidden flex flex-col justify-between h-[130px]">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Total Ledger Turnover
                </span>
                <span className="text-2xl font-bold font-mono text-foreground block mt-1">
                  ₹{totalRevenue}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground border-t pt-2 flex justify-between">
                <span>Completed: {completedBookings.length}</span>
                <span>Cancelled: {cancelledBookingsCount}</span>
              </div>
            </div>

            {/* Outgoing Expenses */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-soft relative overflow-hidden flex flex-col justify-between h-[130px]">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Total Outgoing Expenses
                </span>
                <span className="text-2xl font-bold font-mono text-destructive block mt-1">
                  ₹{totalExpense}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground border-t pt-2 flex justify-between">
                <span>Today: ₹{todayExpense}</span>
                <span>Weekly: ₹{weekExpense}</span>
              </div>
            </div>

            {/* Total Balance Margin */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-soft relative overflow-hidden flex flex-col justify-between h-[130px]">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Net Balance Margin
                </span>
                <span
                  className={`text-2xl font-bold font-mono block mt-1 ${
                    totalRevenue - totalExpense >= 0 ? "text-green-600" : "text-destructive"
                  }`}
                >
                  ₹{totalRevenue - totalExpense}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground border-t pt-2 flex justify-between">
                <span>Margin: {totalRevenue > 0 ? Math.round(((totalRevenue - totalExpense) / totalRevenue) * 100) : 0}%</span>
                <span>Audit Logs: {auditLogs.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Business Insights Widget */}
          <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
              Automated Business Insights
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getInsights().map((ins, i) => (
                <div
                  key={i}
                  className="bg-secondary/40 border border-border p-3.5 rounded-2xl text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5"
                >
                  <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Graphical Trends */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Revenue vs Expense Chart */}
            <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-foreground">Turnover Trends (Last 6 Months)</h3>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => downloadChart("monthly_trends", "png")}
                    className="px-2 py-1 rounded bg-secondary hover:bg-accent text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" /> PNG
                  </button>
                  <button
                    onClick={() => downloadChart("monthly_trends", "svg")}
                    className="px-2 py-1 rounded bg-secondary hover:bg-accent text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" /> SVG
                  </button>
                </div>
              </div>
              <div className="h-64 w-full" id="monthly_trends">
                {chartMonthlyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                    Log completed bookings or expenses to plot financial charts.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartMonthlyData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.65 0.24 350)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.65 0.24 350)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.6 0.2 300)" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="oklch(0.6 0.2 300)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#888" fontSize={9} tickLine={false} />
                      <YAxis stroke="#888" fontSize={9} tickLine={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area
                        type="monotone"
                        name="Gross Revenue"
                        dataKey="revenue"
                        stroke="oklch(0.65 0.24 350)"
                        strokeWidth={2}
                        fill="url(#colorRev)"
                      />
                      <Area
                        type="monotone"
                        name="Paid Expenses"
                        dataKey="expense"
                        stroke="oklch(0.6 0.2 300)"
                        strokeWidth={1.5}
                        fill="url(#colorExp)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Category Expenses Breakdown */}
            <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-foreground">Expense Distribution</h3>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => downloadChart("expense_distribution", "png")}
                    className="px-2 py-1 rounded bg-secondary hover:bg-accent text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" /> PNG
                  </button>
                  <button
                    onClick={() => downloadChart("expense_distribution", "svg")}
                    className="px-2 py-1 rounded bg-secondary hover:bg-accent text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" /> SVG
                  </button>
                </div>
              </div>
              <div className="h-44 w-full flex items-center justify-center" id="expense_distribution font-semibold">
                {chartCategoryData.length === 0 ? (
                  <div className="text-muted-foreground text-xs italic">No expense distribution data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend checklist */}
              <div className="max-h-24 overflow-y-auto space-y-1.5 text-[10px] text-muted-foreground pr-1">
                {chartCategoryData.slice(0, 4).map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      {entry.name}
                    </span>
                    <span className="font-bold font-mono">₹{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products/Services & Pending Payments Table */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-4">
              <h3 className="font-bold text-sm text-foreground">Top Performing Beauty Services</h3>
              <div className="space-y-3">
                {chartServiceData.map((svc, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b pb-2">
                    <span className="font-semibold text-muted-foreground">{svc.name}</span>
                    <span className="font-mono font-bold text-foreground">₹{svc.value}</span>
                  </div>
                ))}
                {chartServiceData.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground italic py-6">
                    No completed service statistics yet.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-4">
              <h3 className="font-bold text-sm text-foreground">Register Operators</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs bg-secondary/35 p-3 rounded-xl border border-border">
                  <span className="font-bold">{operator} (You)</span>
                  <span className="font-medium text-primary">Active Drawer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE & EXPENSE LEDGER */}
      {activeTab === "ledger" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex gap-2 bg-secondary/30 p-1.5 rounded-2xl border border-border w-fit">
            <button
              onClick={() => setLedgerSubTab("general")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                ledgerSubTab === "general" ? "bg-primary text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              General Transactions List
            </button>
            <button
              onClick={() => setLedgerSubTab("taccount")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                ledgerSubTab === "taccount" ? "bg-primary text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              T-Account Ledger Book
            </button>
          </div>

          {ledgerSubTab === "general" ? (
            <>
              {/* Advanced Filter Box */}
              <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Filter className="h-4 w-4" /> Filter Options
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {/* Type selector */}
                  <label className="block">
                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Type</span>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-xs"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                    >
                      <option value="all">All Transactions</option>
                      <option value="revenue">Only Revenue</option>
                      <option value="expense">Only Expense</option>
                    </select>
                  </label>

                  {/* Category */}
                  <label className="block">
                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Category</span>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-xs"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Status */}
                  <label className="block">
                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Status</span>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-xs"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed / Paid</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>

                  {/* Payment Method */}
                  <label className="block">
                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Payment</span>
                    <select
                      className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-xs"
                      value={filterPayment}
                      onChange={(e) => setFilterPayment(e.target.value)}
                    >
                      <option value="all">All Methods</option>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / Google Pay</option>
                      <option value="card">Card</option>
                    </select>
                  </label>

                  {/* Date Start */}
                  <label className="block col-span-1">
                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">From</span>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                  </label>

                  {/* Date End */}
                  <label className="block col-span-1">
                    <span className="text-[10px] font-semibold text-muted-foreground block mb-1">To</span>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                  </label>
                </div>

                {/* Search and Action Bar */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border justify-between items-center">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search description, reference, or details..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-full bg-secondary/50 border border-input focus:outline-none focus:border-primary text-xs"
                    />
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    {selectedIds.length > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 rounded-full bg-destructive text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" /> Bulk Delete ({selectedIds.length})
                      </button>
                    )}
                    <button
                      onClick={triggerCSVExport}
                      className="px-4 py-2.5 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      title="Export report to CSV"
                    >
                      <Download className="h-4 w-4" /> CSV Report
                    </button>
                    <button
                      onClick={triggerPrintReport}
                      className="px-4 py-2.5 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      title="Print Ledger Report"
                    >
                      <Printer className="h-4 w-4" /> Print Ledger
                    </button>
                  </div>
                </div>
              </div>

              {/* Ledger table */}
              {filteredLedger.length === 0 ? (
                <div className="text-center text-muted-foreground py-16 bg-card border border-border rounded-3xl">
                  No transactions match your search/filter criteria.
                </div>
              ) : (
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="py-3 px-4 w-12 text-center">Sel</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Ref</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Method</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs">
                        {paginatedLedger.map((item, idx) => {
                          const isRev = item.type === "revenue";
                          const isSel = selectedIds.includes(item.id);
                          return (
                            <tr key={`${item.id}-${idx}`} className="hover:bg-secondary/20 transition-colors">
                              <td className="py-3 px-4 text-center">
                                {item.createdBy === "Operator" && (
                                  <input
                                    type="checkbox"
                                    checked={isSel}
                                    onChange={() =>
                                      setSelectedIds((prev) =>
                                        prev.includes(item.id)
                                          ? prev.filter((x) => x !== item.id)
                                          : [...prev, item.id]
                                      )
                                    }
                                    className="h-4 w-4 rounded text-primary focus:ring-primary border-input cursor-pointer"
                                  />
                                )}
                              </td>
                              <td className="py-3 px-4 font-semibold font-mono text-[11px]">
                                {item.date}
                              </td>
                              <td className="py-3 px-4 font-mono font-semibold text-muted-foreground text-[10px]">
                                {item.reference}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isRev
                                      ? "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                      : "bg-destructive/10 text-destructive dark:bg-destructive/20"
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-medium text-foreground">
                                {item.category}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground truncate max-w-xs" title={item.description}>
                                {item.description}
                              </td>
                              <td className="py-3 px-4 font-bold font-mono text-sm">
                                <span className={isRev ? "text-green-600" : "text-destructive"}>
                                  {isRev ? "+" : "-"}₹{item.amount}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-medium text-[10px] text-muted-foreground">
                                {item.payment}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-block h-2 w-2 rounded-full mr-1.5 ${
                                    item.status.toLowerCase() === "completed" ||
                                    item.status.toLowerCase() === "paid"
                                      ? "bg-green-500 animate-pulse"
                                      : item.status.toLowerCase() === "pending"
                                        ? "bg-amber-500 animate-pulse"
                                        : "bg-destructive"
                                  }`}
                                />
                                <span className="capitalize">{item.status}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {item.createdBy === "Operator" && (
                                  <div className="flex justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        const original = expenses.find((x) => x.id === item.id);
                                        if (original) handleEditTrigger(original);
                                      }}
                                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                      title="Edit entry"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        const original = expenses.find((x) => x.id === item.id);
                                        if (original) handleDuplicateExpense(original);
                                      }}
                                      className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                      title="Duplicate entry"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExpense(item.id)}
                                      className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between bg-card text-xs">
                      <span className="text-muted-foreground font-medium">
                        Showing page {page} of {totalPages} ({filteredLedger.length} items total)
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 cursor-pointer font-bold"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-40 cursor-pointer font-bold"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-card border border-border p-5 rounded-3xl shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Select T-Account:</span>
                  <select
                    value={selectedLedgerAccount}
                    onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-background border border-input text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {ALL_ACCOUNTS.map((acc) => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => exportExcelTab("ledger")}
                  className="px-4 py-2.5 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Export Account Ledger
                </button>
              </div>

              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Ref</th>
                        <th className="py-3 px-4">Opposite Account</th>
                        <th className="py-3 px-4 text-right">Debit (Dr.)</th>
                        <th className="py-3 px-4 text-right">Credit (Cr.)</th>
                        <th className="py-3 px-4 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {(() => {
                        const entries = doubleEntryBook().ledgerBalances[selectedLedgerAccount]?.entries || [];
                        let runningBal = 0;
                        const isAssetOrExpense = selectedLedgerAccount === "Cash" || selectedLedgerAccount === "Bank" || selectedLedgerAccount === "Prepaid Expenses" || selectedLedgerAccount.endsWith("Expense");
                        
                        if (entries.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="text-center text-muted-foreground py-10">No ledger entries for this account.</td>
                            </tr>
                          );
                        }

                        return entries.map((e: any, idx: number) => {
                          if (e.type === "debit") {
                            runningBal += isAssetOrExpense ? e.amount : -e.amount;
                          } else {
                            runningBal += isAssetOrExpense ? -e.amount : e.amount;
                          }
                          return (
                            <tr key={idx} className="hover:bg-secondary/10 transition-colors font-medium">
                              <td className="py-3.5 px-4 font-mono text-[11px]">{e.date}</td>
                              <td className="py-3.5 px-4 text-foreground">{e.description}</td>
                              <td className="py-3.5 px-4 font-mono text-muted-foreground text-[10px]">{e.ref}</td>
                              <td className="py-3.5 px-4 text-muted-foreground">{e.oppositeAccount}</td>
                              <td className="py-3.5 px-4 text-right text-green-600 font-mono font-bold">{e.type === "debit" ? `₹${e.amount}` : "-"}</td>
                              <td className="py-3.5 px-4 text-right text-primary font-mono font-bold">{e.type === "credit" ? `₹${e.amount}` : "-"}</td>
                              <td className="py-3.5 px-4 text-right font-mono text-foreground font-bold">₹{runningBal}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADD/EDIT EXPENSE ENTRY FORM */}
      {activeTab === "expenses" && (
        <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          {/* Main Expense log form */}
          <form
            onSubmit={handleSaveExpense}
            className="lg:col-span-8 bg-card border border-border p-6 rounded-3xl shadow-soft space-y-4"
          >
            <h3 className="font-semibold text-base flex items-center gap-2 text-foreground">
              <FolderMinus className="h-5 w-5 text-primary" />
              {editingId
                ? `Edit ${expenseForm.type === "income" ? "Income" : "Outgoing Expense"}`
                : `Log New ${expenseForm.type === "income" ? "Income / Revenue" : "Outgoing Expense"} Entry`}
            </h3>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <div className="block sm:col-span-2">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Transaction Type *</span>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("expense")}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                      expenseForm.type === "expense"
                        ? "gradient-rose text-white border-primary"
                        : "bg-secondary/50 text-foreground border-border"
                    }`}
                  >
                    Outgoing Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange("income")}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                      expenseForm.type === "income"
                        ? "gradient-rose text-white border-primary"
                        : "bg-secondary/50 text-foreground border-border"
                    }`}
                  >
                    Incoming Revenue / Sales
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">
                  {expenseForm.type === "income" ? "Income Date *" : "Expense Date *"}
                </span>
                <input
                  type="date"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">
                  {expenseForm.type === "income" ? "Income Category *" : "Expense Category *"}
                </span>
                <select
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  {(expenseForm.type === "income" ? DEFAULT_INCOME_CATEGORIES : categories).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">
                  {expenseForm.type === "income" ? "Income Title *" : "Expense Title *"}
                </span>
                <input
                  type="text"
                  required
                  placeholder={expenseForm.type === "income" ? "e.g. Products Sale, Walk-in Service" : "e.g. Rent Payment, Cosmetics Stock"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">
                  {expenseForm.type === "income" ? "Income Amount (INR) *" : "Expense Amount (INR) *"}
                </span>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono font-semibold"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">
                  {expenseForm.type === "income" ? "Client / Source Name" : "Vendor / Recipient Name"}
                </span>
                <input
                  type="text"
                  placeholder={expenseForm.type === "income" ? "e.g. Walk-in Client, Event" : "e.g. L'Oreal Paris, Landlord"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Payment Method</span>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
                  value={expenseForm.payment}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payment: e.target.value })}
                >
                  <option>UPI / Google Pay</option>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Net Banking</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Reference No</span>
                <input
                  type="text"
                  placeholder="e.g. UPI ID, Bill Number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
                  value={expenseForm.reference}
                  onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Payment Status</span>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
                  value={expenseForm.status}
                  onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value as any })}
                >
                  <option value="Paid">{expenseForm.type === "income" ? "Received" : "Paid"}</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                {expenseForm.type === "income" ? "Income Description" : "Expense Description"}
              </span>
              <input
                type="text"
                placeholder="Details..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Special Notes</span>
              <textarea
                rows={2}
                placeholder="Notes for records..."
                className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-xs text-foreground resize-none"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              />
            </label>

            {/* Receipt Image Upload (stored in ImgBB only) */}
            <div className="pt-2">
              <ImageUploader
                label={expenseForm.type === "income" ? "Receipt / Invoice Image Upload" : "Receipt Bill Image Upload"}
                value={expenseForm.image}
                onChange={(url) => setExpenseForm({ ...expenseForm, image: url })}
                aspectRatio="video"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setExpenseForm({
                      type: "expense",
                      date: new Date().toISOString().split("T")[0],
                      category: "Beauty Products",
                      title: "",
                      description: "",
                      vendor: "",
                      payment: "UPI / Google Pay",
                      amount: "",
                      image: "",
                      reference: "",
                      notes: "",
                      status: "Paid",
                    });
                  }}
                  className="px-6 py-2.5 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 rounded-full gradient-rose text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-soft disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-4.5 w-4.5" />
                )}
                {saving ? "Saving Log..." : editingId ? "Update Entry" : `Save ${expenseForm.type === "income" ? "Income" : "Expense"}`}
              </button>
            </div>
          </form>

          {/* Sidebar custom categories add form */}
          <div className="lg:col-span-4 space-y-6">
            <form
              onSubmit={addCustomCategory}
              className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4"
            >
              <h4 className="font-bold text-sm text-foreground">Add Custom Category</h4>
              <input
                type="text"
                required
                placeholder="e.g. Electricity, Water"
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Save Category
              </button>
            </form>

            <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-3">
              <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Category Checklist
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded px-2.5 py-1 whitespace-nowrap"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STAFF PERFORMANCE FINANCIAL LEDGER */}
      {activeTab === "staff" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="font-bold text-base text-foreground">Staff Financial Ledger</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tracks completed bookings, generated revenue, and estimated commissions (10% of service value).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Completed Bookings</th>
                  <th className="py-3 px-4">Revenue Generated</th>
                  <th className="py-3 px-4">Estimated Commission (10%)</th>
                  <th className="py-3 px-4">Performance Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {staffList.map((st, i) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{st.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-muted-foreground">
                      {st.bookings} bookings
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-green-600">₹{st.revenue}</td>
                    <td className="py-3.5 px-4 font-bold font-mono text-primary">₹{st.commission}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          st.revenue >= 15000
                            ? "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                            : st.revenue >= 5000
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}
                      >
                        {st.revenue >= 15000 ? "Elite Stylist" : st.revenue >= 5000 ? "Senior" : "Associate"}
                      </span>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-10">
                      No staff performance data. Log completed bookings first.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER LIFETIME VALUE VALUE */}
      {activeTab === "customers" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="font-bold text-base text-foreground">Customer Lifetime Spend (CLV)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Top guests list ranked by their cumulative spending.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Total Visits</th>
                  <th className="py-3 px-4">Preferred Treatment</th>
                  <th className="py-3 px-4">Last Appointment</th>
                  <th className="py-3 px-4">Lifetime Value (CLV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {customerList.map((cust, i) => (
                  <tr key={i} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">{cust.name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-muted-foreground">
                      {cust.phone}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-muted-foreground">
                      {cust.visits} visit(s)
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground truncate max-w-[150px]">
                      {cust.preferredService}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                      {cust.lastVisit}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-green-600">₹{cust.spend}</td>
                  </tr>
                ))}
                {customerList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-10">
                      No customer turnover log available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL LOGS */}
      {activeTab === "audit" && (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-6 animate-in fade-in duration-300">
          <div>
            <h3 className="font-bold text-base text-foreground">Registry Audit Log & Activity logs</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Tracks actions, operator identities, dates, times, and change metrics for ledger sanity.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Summary details</th>
                  <th className="py-3 px-4">Value Before</th>
                  <th className="py-3 px-4">Value After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground font-semibold">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{log.operator}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-medium">{log.details}</td>
                    <td className="py-3 px-4 font-mono font-medium text-destructive truncate max-w-[120px]">
                      {log.oldValue || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-green-600 truncate max-w-[120px]">
                      {log.newValue || "-"}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-10">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: JOURNAL ENTRIES */}
      {activeTab === "journal" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border p-5 rounded-3xl shadow-soft flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-foreground">Double-Entry Journal Entries</h3>
              <p className="text-xs text-muted-foreground mt-1">Chronological log of all business transactions in dual-aspect accounting format.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => exportExcelTab("journal")} className="px-4 py-2 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Download className="h-4 w-4" /> Excel Export
              </button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Journal Entry Detail</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4 text-right">Debit (Dr)</th>
                    <th className="py-3 px-4 text-right">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {doubleEntryBook().journalEntries.map((e, i) => (
                    <tr key={e.id + i} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-4 px-4 font-semibold font-mono text-[11px] align-top">{e.date}</td>
                      <td className="py-4 px-4 space-y-1 align-top">
                        <div className="font-bold text-foreground">{e.debitAcc}</div>
                        <div className="pl-6 text-muted-foreground font-medium">To {e.creditAcc}</div>
                        <div className="text-[10px] text-muted-foreground italic mt-1 font-normal">({e.description})</div>
                      </td>
                      <td className="py-4 px-4 font-mono font-semibold text-muted-foreground text-[10px] align-top">{e.ref}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-green-600 align-top">₹{e.amount}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-primary align-top">₹{e.amount}</td>
                    </tr>
                  ))}
                  {doubleEntryBook().journalEntries.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-10">No journal entries recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: TRIAL BALANCE */}
      {activeTab === "trial" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border p-5 rounded-3xl shadow-soft flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-foreground">Unadjusted Trial Balance</h3>
              <p className="text-xs text-muted-foreground mt-1">Summary of balances in all ledger accounts to verify equality of debits and credits.</p>
            </div>
            <button onClick={() => exportExcelTab("trial")} className="px-4 py-2 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Download className="h-4 w-4" /> Excel Export
            </button>
          </div>
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4 text-right">Debit Balance (Dr)</th>
                    <th className="py-3 px-4 text-right">Credit Balance (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {doubleEntryBook().trialBalance.map((item) => (
                    <tr key={item.account} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{item.account}</td>
                      <td className="py-3 px-4 text-right font-mono text-foreground font-semibold">{item.debit ? `₹${item.debit}` : "-"}</td>
                      <td className="py-3 px-4 text-right font-mono text-foreground font-semibold">{item.credit ? `₹${item.credit}` : "-"}</td>
                    </tr>
                  ))}
                  <tr className="bg-secondary/50 font-bold border-t-2 border-foreground">
                    <td className="py-3.5 px-4 text-foreground uppercase tracking-wider text-xs">Total Trial Balance</td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-foreground">
                      ₹{doubleEntryBook().trialBalance.reduce((sum, c) => sum + (c.debit || 0), 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-foreground">
                      ₹{doubleEntryBook().trialBalance.reduce((sum, c) => sum + (c.credit || 0), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {doubleEntryBook().trialBalance.reduce((sum, c) => sum + (c.debit || 0), 0) ===
            doubleEntryBook().trialBalance.reduce((sum, c) => sum + (c.credit || 0), 0) && (
              <div className="bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/50 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Trial Balance balanced successfully. Total debits equal total credits.
              </div>
          )}
        </div>
      )}

      {/* TAB: ADJUSTING ENTRIES */}
      {activeTab === "adjustments" && (
        <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          <form onSubmit={handleSaveAdjustment} className="lg:col-span-4 bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4">
            <h4 className="font-bold text-sm text-foreground">Post Adjusting Entry</h4>
            <label className="block">
              <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Adjustment Date *</span>
              <input type="date" required className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground" value={adjustmentForm.date} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, date: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Debit Account (Dr.) *</span>
              <select required className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground" value={adjustmentForm.debitAcc} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, debitAcc: e.target.value })}>
                {ALL_ACCOUNTS.map((acc) => <option key={acc} value={acc}>{acc}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Credit Account (Cr.) *</span>
              <select required className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground" value={adjustmentForm.creditAcc} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, creditAcc: e.target.value })}>
                {ALL_ACCOUNTS.map((acc) => <option key={acc} value={acc}>{acc}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Amount (INR) *</span>
              <input type="number" required placeholder="e.g. 1500" className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground font-mono font-semibold" value={adjustmentForm.amount} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Explanation / Notes</span>
              <input type="text" placeholder="e.g. Accrued salary for June" className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground" value={adjustmentForm.explanation} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, explanation: e.target.value })} />
            </label>
            <button type="submit" disabled={saving} className="w-full py-2.5 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
              <Plus className="h-4 w-4" /> Post Entry
            </button>
          </form>
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-card border border-border p-5 rounded-3xl shadow-soft flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-foreground">Adjustments Register</h3>
                <p className="text-xs text-muted-foreground">Adjusting journal entries for accruals, prepayments, and corrections.</p>
              </div>
              <button onClick={() => exportExcelTab("adjustments")} className="px-4 py-2 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Download className="h-4 w-4" /> Excel Export
              </button>
            </div>
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Entry details</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-semibold">
                    {adjustments.map((a) => (
                      <tr key={a.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="py-3.5 px-4 font-semibold font-mono text-[11px] align-top">{a.date}</td>
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-foreground">{a.debitAcc}</div>
                          <div className="pl-6 text-muted-foreground font-medium">To {a.creditAcc}</div>
                          {a.explanation && <div className="text-[10px] text-muted-foreground italic mt-1 font-normal">({a.explanation})</div>}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground align-top">₹{a.amount}</td>
                        <td className="py-3.5 px-4 text-center align-top">
                          <button onClick={() => handleDeleteAdjustment(a.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors cursor-pointer" title="Delete entry">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {adjustments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted-foreground py-10">No adjusting entries logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ADJUSTED TRIAL BALANCE */}
      {activeTab === "adjusted" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border p-5 rounded-3xl shadow-soft flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-foreground">Adjusted Trial Balance Worksheet</h3>
              <p className="text-xs text-muted-foreground mt-1">Incorporates adjusting entries to verify ledger balance before compiling financial statements.</p>
            </div>
            <button onClick={() => exportExcelTab("adjusted")} className="px-4 py-2 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Download className="h-4 w-4" /> Excel Export
            </button>
          </div>
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider text-center">
                    <th className="py-3 px-4 text-left" rowSpan={2}>Account Name</th>
                    <th className="py-1 px-2 border-b border-border" colSpan={2}>Unadjusted Trial Balance</th>
                    <th className="py-1 px-2 border-b border-border" colSpan={2}>Adjustments</th>
                    <th className="py-1 px-2 border-b border-border" colSpan={2}>Adjusted Trial Balance</th>
                  </tr>
                  <tr className="bg-secondary/20 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider text-right">
                    <th className="py-2 px-3">Debit</th>
                    <th className="py-2 px-3">Credit</th>
                    <th className="py-2 px-3">Debit</th>
                    <th className="py-2 px-3">Credit</th>
                    <th className="py-2 px-3">Debit</th>
                    <th className="py-2 px-3">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {doubleEntryBook().trialBalance.map((item) => {
                    const { account, debit: unDr, credit: unCr } = item;
                    let adjDr = 0;
                    let adjCr = 0;
                    adjustments.forEach((a) => {
                      if (a.debitAcc === account) adjDr += Number(a.amount);
                      if (a.creditAcc === account) adjCr += Number(a.amount);
                    });

                    const isAssetOrExpense = account === "Cash" || account === "Bank" || account === "Prepaid Expenses" || account.endsWith("Expense");
                    const netAdjustment = isAssetOrExpense ? (adjDr - adjCr) : (adjCr - adjDr);
                    const unadjustedNet = isAssetOrExpense ? (unDr - unCr) : (unCr - unDr);
                    const finalNet = unadjustedNet + netAdjustment;

                    const finalDr = isAssetOrExpense ? (finalNet >= 0 ? finalNet : 0) : (finalNet < 0 ? Math.abs(finalNet) : 0);
                    const finalCr = isAssetOrExpense ? (finalNet < 0 ? Math.abs(finalNet) : 0) : (finalNet >= 0 ? finalNet : 0);

                    return (
                      <tr key={account} className="hover:bg-secondary/10 transition-colors text-right">
                        <td className="py-2.5 px-4 text-left font-semibold text-foreground">{account}</td>
                        <td className="py-2.5 px-3 font-mono">{unDr ? `₹${unDr}` : "-"}</td>
                        <td className="py-2.5 px-3 font-mono">{unCr ? `₹${unCr}` : "-"}</td>
                        <td className="py-2.5 px-3 font-mono text-blue-600">{adjDr ? `₹${adjDr}` : "-"}</td>
                        <td className="py-2.5 px-3 font-mono text-blue-600">{adjCr ? `₹${adjCr}` : "-"}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">{finalDr ? `₹${finalDr}` : "-"}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">{finalCr ? `₹${finalCr}` : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FINANCIAL STATEMENTS */}
      {activeTab === "statements" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {(() => {
            const trialBal = doubleEntryBook().trialBalance;
            const getBal = (accName: string) => {
              const acc = trialBal.find(t => t.account === accName);
              return acc ? (acc.debit || acc.credit || 0) : 0;
            };
            const serviceRevenueVal = getBal("Service Revenue");
            let totalExpensesVal = 0;
            const expenseItems: any[] = [];
            ALL_ACCOUNTS.forEach((acc) => {
              if (acc.endsWith("Expense")) {
                const bal = getBal(acc);
                if (bal > 0) {
                  expenseItems.push({ name: acc, amount: bal });
                  totalExpensesVal += bal;
                }
              }
            });
            const netIncomeVal = serviceRevenueVal - totalExpensesVal;

            const cashBal = getBal("Cash");
            const bankBal = getBal("Bank");
            const prepaidBal = getBal("Prepaid Expenses");
            const totalAssetsVal = cashBal + bankBal + prepaidBal;

            const accruedLiabVal = getBal("Accrued Liabilities");
            const retainedEarningsVal = getBal("Retained Earnings");

            const finalRetainedEarningsVal = retainedEarningsVal + netIncomeVal;
            const totalLiabEquityVal = accruedLiabVal + finalRetainedEarningsVal;

            return (
              <>
                <div className="bg-card border border-border p-5 rounded-3xl shadow-soft flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Financial Statements</h3>
                    <p className="text-xs text-muted-foreground mt-1">Generated Profit & Loss, Balance Sheet, and Statement of Cash Flows.</p>
                  </div>
                  <div className="flex gap-2 bg-secondary/30 p-1.5 rounded-2xl border border-border">
                    <button onClick={() => setSelectedStatement("pl")} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedStatement === "pl" ? "bg-primary text-white shadow-soft" : "text-muted-foreground"}`}>Profit & Loss</button>
                    <button onClick={() => setSelectedStatement("bs")} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedStatement === "bs" ? "bg-primary text-white shadow-soft" : "text-muted-foreground"}`}>Balance Sheet</button>
                    <button onClick={() => setSelectedStatement("cf")} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedStatement === "cf" ? "bg-primary text-white shadow-soft" : "text-muted-foreground"}`}>Cash Flow</button>
                  </div>
                </div>

                {selectedStatement === "pl" && (
                  <div className="bg-card border border-border p-6 rounded-3xl shadow-soft max-w-2xl mx-auto space-y-6">
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-lg text-foreground">SD Beauty Parlour</h4>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Income Statement (Profit & Loss)</h5>
                      <p className="text-[10px] text-muted-foreground italic">For Period Ending {todayStr}</p>
                    </div>
                    <div className="border-t border-b border-border py-4 space-y-4">
                      <div className="flex justify-between items-center font-bold text-sm text-foreground">
                        <span>Operating Revenues</span>
                        <span>₹{serviceRevenueVal}</span>
                      </div>
                      <div className="pl-4 space-y-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                          <span>Service revenue & Sales</span>
                          <span>₹{serviceRevenueVal}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center font-bold text-sm text-foreground">
                        <span>Operating Expenses</span>
                        <span>(₹{totalExpensesVal})</span>
                      </div>
                      <div className="pl-4 space-y-2 font-medium">
                        {expenseItems.map((e) => (
                          <div key={e.name} className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{e.name}</span>
                            <span>₹{e.amount}</span>
                          </div>
                        ))}
                        {expenseItems.length === 0 && <div className="text-xs text-muted-foreground italic text-center py-2">No expenses logged.</div>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center font-bold text-base text-foreground bg-secondary/30 p-3.5 rounded-xl border border-border">
                      <span>Net Profit / (Loss)</span>
                      <span className={netIncomeVal >= 0 ? "text-green-600" : "text-destructive"}>₹{netIncomeVal}</span>
                    </div>
                  </div>
                )}

                {selectedStatement === "bs" && (
                  <div className="bg-card border border-border p-6 rounded-3xl shadow-soft max-w-2xl mx-auto space-y-6">
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-lg text-foreground">SD Beauty Parlour</h4>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Balance Sheet</h5>
                      <p className="text-[10px] text-muted-foreground italic">As of {todayStr}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-8 border-t border-b border-border py-6 font-semibold">
                      <div className="space-y-4">
                        <h6 className="font-bold text-xs uppercase tracking-wider text-primary border-b pb-1">Assets</h6>
                        <div className="space-y-2.5 text-xs text-muted-foreground">
                          <div className="flex justify-between"><span>Cash</span><span className="font-mono font-semibold text-foreground">₹{cashBal}</span></div>
                          <div className="flex justify-between"><span>Bank Account</span><span className="font-mono font-semibold text-foreground">₹{bankBal}</span></div>
                          <div className="flex justify-between"><span>Prepaid Expenses</span><span className="font-mono font-semibold text-foreground">₹{prepaidBal}</span></div>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-foreground pt-3 border-t">
                          <span>Total Assets</span>
                          <span>₹{totalAssetsVal}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h6 className="font-bold text-xs uppercase tracking-wider text-primary border-b pb-1">Liabilities & Equity</h6>
                        <div className="space-y-2.5 text-xs text-muted-foreground">
                          <div className="flex justify-between"><span>Accrued Liabilities</span><span className="font-mono font-semibold text-foreground">₹{accruedLiabVal}</span></div>
                          <div className="flex justify-between"><span>Retained Earnings</span><span className="font-mono font-semibold text-foreground">₹{retainedEarningsVal}</span></div>
                          <div className="flex justify-between italic"><span>Current Net Income</span><span className="font-mono font-semibold text-foreground">₹{netIncomeVal}</span></div>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-foreground pt-3 border-t">
                          <span>Total Liabilities & Equity</span>
                          <span>₹{totalLiabEquityVal}</span>
                        </div>
                      </div>
                    </div>
                    {totalAssetsVal === totalLiabEquityVal && (
                      <div className="bg-green-100 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200/50 p-3 rounded-2xl text-[11px] font-bold text-center">
                        Balance Sheet is perfectly balanced (Assets = Liabilities + Equity)
                      </div>
                    )}
                  </div>
                )}

                {selectedStatement === "cf" && (
                  <div className="bg-card border border-border p-6 rounded-3xl shadow-soft max-w-2xl mx-auto space-y-6">
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-lg text-foreground">SD Beauty Parlour</h4>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Statement of Cash Flows</h5>
                      <p className="text-[10px] text-muted-foreground italic">For Period Ending {todayStr}</p>
                    </div>
                    <div className="border-t border-b border-border py-4 space-y-4 text-xs text-muted-foreground font-semibold">
                      <h6 className="font-bold text-xs uppercase tracking-wider text-primary border-b pb-1">Cash Flows from Operating Activities</h6>
                      <div className="flex justify-between pl-2">
                        <span>Inflows from completed bookings & sales</span>
                        <span className="text-green-600 font-bold">+₹{serviceRevenueVal}</span>
                      </div>
                      <div className="flex justify-between pl-2">
                        <span>Outflows for operating expenses</span>
                        <span className="text-destructive font-bold">-₹{totalExpensesVal}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-foreground pt-3 border-t">
                        <span>Net cash from operating activities</span>
                        <span className={netIncomeVal >= 0 ? "text-green-600" : "text-destructive font-bold"}>₹{netIncomeVal}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* TAB: CLOSING ENTRIES */}
      {activeTab === "closing" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border p-5 rounded-3xl shadow-soft flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-foreground">Period closing entries</h3>
              <p className="text-xs text-muted-foreground mt-1">Temporary revenue and expense accounts balances transferred to Retained Earnings.</p>
            </div>
            <button onClick={() => exportExcelTab("closing")} className="px-4 py-2 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Download className="h-4 w-4" /> Excel Export
            </button>
          </div>
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Closing Entry Detail</th>
                    <th className="py-3 px-4 text-right">Debit (Dr)</th>
                    <th className="py-3 px-4 text-right">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {doubleEntryBook().closingEntries.map((c, idx) => (
                    <tr key={idx} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-3 px-4 font-semibold font-mono text-[11px] align-top">{c.date}</td>
                      <td className="py-3 px-4 align-top">
                        <div className="font-bold text-foreground">{c.debitAcc}</div>
                        <div className="pl-6 text-muted-foreground font-medium">To {c.creditAcc}</div>
                        <div className="text-[10px] text-muted-foreground italic mt-1 font-normal">({c.description})</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-green-600 align-top">₹{c.amount}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary align-top">₹{c.amount}</td>
                    </tr>
                  ))}
                  {doubleEntryBook().closingEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted-foreground py-10">No closing entries required yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: POST CLOSING TRIAL BALANCE */}
      {activeTab === "postclosing" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border p-5 rounded-3xl shadow-soft flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base text-foreground">Post-Closing Trial Balance</h3>
              <p className="text-xs text-muted-foreground mt-1">Verifies debit/credit equality after closing entries are posted. Only permanent accounts remain.</p>
            </div>
            <button onClick={() => exportExcelTab("postclosing")} className="px-4 py-2 rounded-full bg-secondary hover:bg-accent text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              <Download className="h-4 w-4" /> Excel Export
            </button>
          </div>
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-secondary/40 text-left border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="py-3 px-4">Permanent Account Name</th>
                    <th className="py-3 px-4 text-right">Debit Balance (Dr)</th>
                    <th className="py-3 px-4 text-right">Credit Balance (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs font-semibold">
                  {doubleEntryBook().postClosingTrialBalance.map((item) => (
                    <tr key={item.account} className="hover:bg-secondary/10 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{item.account}</td>
                      <td className="py-3 px-4 text-right font-mono text-foreground font-semibold">{item.debit ? `₹${item.debit}` : "-"}</td>
                      <td className="py-3 px-4 text-right font-mono text-foreground font-semibold">{item.credit ? `₹${item.credit}` : "-"}</td>
                    </tr>
                  ))}
                  <tr className="bg-secondary/50 font-bold border-t-2 border-foreground">
                    <td className="py-3.5 px-4 text-foreground uppercase tracking-wider text-xs">Total Post-Closing Balance</td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-foreground">
                      ₹{doubleEntryBook().postClosingTrialBalance.reduce((sum, c) => sum + (c.debit || 0), 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-foreground">
                      ₹{doubleEntryBook().postClosingTrialBalance.reduce((sum, c) => sum + (c.credit || 0), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BACKUP & RECOVERY CENTER */}
      {activeTab === "backup" && (
        <div className="grid lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <RefreshCw className="h-4.5 w-4.5 text-primary" /> Backup Settings
              </h4>
              <label className="block">
                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Automated backup schedule</span>
                <select
                  value={settings?.backupSchedule || "Off"}
                  onChange={(e) => handleSaveSettings(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs font-bold text-foreground"
                >
                  <option value="Off">Off (Manual Only)</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </label>
              <button
                onClick={triggerBulkBackup}
                disabled={saving}
                className="w-full py-2.5 rounded-full gradient-rose text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-soft"
              >
                <Download className="h-4 w-4" /> Compile & Download ZIP
              </button>
            </div>

            <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4">
              <h4 className="font-bold text-sm text-foreground">Restore Database</h4>
              <p className="text-[11px] text-muted-foreground">Upload a previously generated backup JSON or ZIP raw dump file to restore state.</p>
              
              <div className="space-y-3">
                <label className="block p-3 border border-dashed border-border rounded-xl hover:bg-secondary/40 transition-colors cursor-pointer text-center">
                  <span className="text-xs font-bold text-foreground block">Restore Mode: Merge</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">(Keeps existing, adds missing)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleRestoreFile(e, "merge")}
                    className="hidden"
                  />
                </label>

                <label className="block p-3 border border-dashed border-destructive/30 hover:border-destructive rounded-xl hover:bg-destructive/5 transition-colors cursor-pointer text-center">
                  <span className="text-xs font-bold text-destructive block">Restore Mode: Replace</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">(Wipes current DB, replaces raw)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => handleRestoreFile(e, "replace")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4">
              <h4 className="font-bold text-sm text-foreground">Backup Log History</h4>
              <div className="overflow-x-auto max-h-48 overflow-y-auto pr-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary/40 text-left border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Backup File Name</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Created By</th>
                      <th className="py-2.5 px-3 text-center">Restore</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {backupHistory.map((b) => (
                      <tr key={b.id} className="hover:bg-secondary/15">
                        <td className="py-2.5 px-3 font-mono text-[10px]">{new Date(b.createdAt).toLocaleString()}</td>
                        <td className="py-2.5 px-3 truncate max-w-[150px] font-medium text-foreground" title={b.name}>{b.name}</td>
                        <td className="py-2.5 px-3 font-mono">{b.size}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{b.createdBy || "System"}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (confirm("Restore this historical backup? This will replace current database.")) {
                                handleExecuteRestore(JSON.parse(b.data), "replace");
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold cursor-pointer"
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                    {backupHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-6">No backup history logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-3xl shadow-soft space-y-4">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Trash2 className="h-4.5 w-4.5 text-destructive" /> Recycle Bin (30-Day Retention)
              </h4>
              <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary/40 text-left border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="py-2.5 px-3">Deleted Date</th>
                      <th className="py-2.5 px-3">Collection</th>
                      <th className="py-2.5 px-3">Item Summary</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-[11px]">
                    {recycleBin.map((item) => {
                      const age = Date.now() - (item.deletedAt || 0);
                      const isExpired = age > 30 * 24 * 60 * 60 * 1000;
                      if (isExpired) return null;

                      const summary = item.data?.title || item.data?.name || item.data?.service || "No Description";
                      return (
                        <tr key={item.id} className="hover:bg-secondary/15">
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">{new Date(item.deletedAt).toLocaleString()}</td>
                          <td className="py-2.5 px-3 capitalize font-semibold text-foreground">{item.originalCollection}</td>
                          <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]" title={summary}>{summary}</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleRestoreFromBin(item)}
                                className="px-2.5 py-1 rounded bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-950/20 dark:text-green-400 text-[10px] font-bold cursor-pointer"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => handlePermanentDeleteFromBin(item.id)}
                                className="px-2.5 py-1 rounded bg-destructive/15 hover:bg-destructive/25 text-destructive text-[10px] font-bold cursor-pointer"
                              >
                                Delete Permanent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {recycleBin.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted-foreground py-6">Recycle bin is empty.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
