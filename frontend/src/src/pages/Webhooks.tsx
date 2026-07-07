/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import WebhookTable from "../components/WebhookTable";
import { getDeliveries, retryDelivery } from "../services/webhooks.service";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Download,
  AlertTriangle,
} from "lucide-react";
import type { IWebhookDelivery } from "../../utils/webhook_dashboard/webhook";

const REFRESH_INTERVAL = 60 * 60 * 1000;

type AppError = {
  message: string;
  type: "fetch" | "retry" | "export";
};

const parseError = (err: unknown, fallback: string): string => {
  if (err !== null && typeof err === "object") {
    const response = (err as Record<string, unknown>)?.response;
    if (response !== null && typeof response === "object") {
      const data = (response as Record<string, unknown>)?.data;
      if (data !== null && typeof data === "object") {
        const errorMsg = (data as Record<string, unknown>)?.error;
        if (typeof errorMsg === "string") return errorMsg;
      }
    }
    const message = (err as Record<string, unknown>)?.message;
    if (typeof message === "string") return message;
  }

  return fallback;
};

const exportCSV = (deliveries: IWebhookDelivery[], date: string): void => {
  if (!deliveries.length) {
    throw new Error("No deliveries to export for the selected date.");
  }
  const headers = ["Date", "Target URL", "Status", "Attempt", "HTTP Code"];
  const rows = deliveries.map((d) => [
    new Date(d.createdAt).toISOString(),
    d.targetUrl,
    d.status,
    d.attemptNumber,
    d.httpResponseCode ?? "N/A",
  ]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
  ].join("\n");

  try {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `webhook-deliveries-${date || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    throw new Error("Failed to generate CSV file. Please try again.");
  }
};

const ErrorBanner = ({
  error,
  onDismiss,
}: {
  error: AppError;
  onDismiss: () => void;
}) => {
  const label =
    error.type === "fetch"
      ? "Load error"
      : error.type === "retry"
        ? "Retry error"
        : "Export error";

  return (
    <div className="mb-4 flex items-start gap-3 p-4 bg-danger-soft border border-danger/20 rounded-md text-danger text-sm">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <span className="font-semibold">{label}: </span>
        {error.message}
      </div>
      <button
        onClick={onDismiss}
        className="text-danger/60 hover:text-danger transition-colors text-xs underline shrink-0"
      >
        Dismiss
      </button>
    </div>
  );
};

const Webhooks = () => {
  const [deliveries, setDeliveries] = useState<IWebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date()); 

  const fetchDeliveries = useCallback(() => {
    setLoading(true);
    setError(null);
    getDeliveries({ from: selectedDate })
      .then((data) => {
        setDeliveries(data);
        setLastRefreshed(new Date());
      })
      .catch((err) =>
        setError({
          message: parseError(err, "Failed to load webhook deliveries."),
          type: "fetch",
        }),
      )
      .finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    const interval = setInterval(fetchDeliveries, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    setError(null);
    try {
      await retryDelivery(id);
      fetchDeliveries();
    } catch (err: unknown) {
      setError({
        message: parseError(err, "Retry failed. Please try again."),
        type: "retry",
      });
    } finally {
      setRetryingId(null);
    }
  };

  const handleExportCSV = () => {
    try {
      exportCSV(deliveries, selectedDate);
    } catch (err: unknown) {
      setError({
        message: parseError(err, "Export failed. Please try again."),
        type: "export",
      });
    }
  };

  const succeeded = deliveries.filter(
    (d) => d.status === "success" || d.status === "delivered",
  ).length;
  const failed = deliveries.filter((d) => d.status === "failed").length;
  const totalAttempts = deliveries.reduce((sum, d) => sum + d.attemptNumber, 0);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-display)]">
              Webhook Deliveries
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {loading
                ? "Loading..."
                : `${deliveries.length} deliveries logged`}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
            <button
              onClick={fetchDeliveries}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              disabled={loading || deliveries.length === 0}
              title={
                deliveries.length === 0 ? "No data to export" : "Export as CSV"
              }
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Last refreshed */}
        <div className="text-xs text-text-muted mb-2 text-right">
          Auto-refreshes every 60 min · Last refreshed:{" "}
          {lastRefreshed.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        {/* Error banner */}
        {error && (
          <ErrorBanner error={error} onDismiss={() => setError(null)} />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-info-soft rounded-lg flex items-center justify-center">
                <Activity size={18} className="text-info" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Today</p>
                <p className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
                  {deliveries.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-soft rounded-lg flex items-center justify-center">
                <CheckCircle size={18} className="text-success" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Succeeded</p>
                <p className="text-xl font-bold text-success font-[family-name:var(--font-display)]">
                  {succeeded}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-danger-soft rounded-lg flex items-center justify-center">
                <XCircle size={18} className="text-danger" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Failed</p>
                <p className="text-xl font-bold text-danger font-[family-name:var(--font-display)]">
                  {failed}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-[10px] p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-soft rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Attempts</p>
                <p className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
                  {totalAttempts}
                </p>
              </div>
            </div>
          </div>
        </div>

        <WebhookTable
          deliveries={deliveries}
          loading={loading}
          onRetry={handleRetry}
          retryingId={retryingId}
        />
      </main>
    </div>
  );
};

export default Webhooks;
