import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import TransactionTable from "../components/TransactionTable";
import { getPayments } from "../services/payments.service";
import { Download, RefreshCw } from "lucide-react";
import type { IPayment } from "../../utils/interface_dashboard/dashboard";

const REFRESH_INTERVAL = 5 * 60 * 1000;

const exportCSV = (payments: IPayment[], date: string) => {
  const headers = [
    "Date",
    "Amount",
    "Status",
    "Customer",
    "Transaction ID",
    "Razorpay Order ID",
  ];
  const rows = payments.map((p) => [
    new Date(p.createdAt).toISOString(),
    p.amount,
    p.status,
    p.customerEmail,
    p.transactionId,
    p.razorpayOrderId,
  ]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${date || "all"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const today = new Date().toISOString().split("T")[0];

const Transactions = () => {
  useAuth();
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // for refresh button + interval
  const fetchPayments = useCallback(() => {
    setLoading(true);
    setError("");
    const params: Record<string, string> = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    getPayments(params)
      .then((res) => {
        setPayments(res?.payments ?? []);
        setLastRefreshed(new Date());
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load transactions");
        setLoading(false);
      });
  }, [fromDate, toDate]);

  // for filter change — setState inside callbacks not effect body
  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string> = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    getPayments(params)
      .then((res) => {
        if (!cancelled) {
          setPayments(res?.payments ?? []);
          setLastRefreshed(new Date());
          setLoading(false);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.error || "Failed to load transactions");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate]);

  // auto refresh interval
  useEffect(() => {
    const interval = setInterval(fetchPayments, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
              Transactions
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {loading ? "Loading..." : `${payments.length} transactions found`}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
              <span className="text-text-muted text-sm">to</span>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={fetchPayments}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
            <button
              onClick={() => exportCSV(payments, `${fromDate}-${toDate}`)}
              disabled={loading || payments.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="text-xs text-text-muted mb-4 text-right">
          Auto-refreshes every 5 min · Last refreshed:{" "}
          {lastRefreshed.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-danger-soft border border-danger/20 rounded-md text-danger text-sm">
            {error}
          </div>
        )}

        <TransactionTable payments={payments} loading={loading} />
      </main>
    </div>
  );
};

export default Transactions;
