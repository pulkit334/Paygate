import { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCard";
import TransactionTable from "../components/TransactionTable";
import { fetchDashboardData, refreshDashboardData } from "../toolkit/dashboard/dashboard-slice";
import type { RootState, AppDispatch } from "../store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  IndianRupee,
  Activity,
  CheckCircle,  
  Clock,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const REFRESH_INTERVAL = 60_000;

const Dashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const Navigate = useNavigate();
  // const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalRef = useRef<number | null>(null);

  const { summary, payments, dailyVolume, loading, refreshing, error } =
    useSelector((state: RootState) => state.dashboard);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        dispatch(refreshDashboardData());
      }
    }, REFRESH_INTERVAL);
  }, [dispatch]);
  



  useEffect(() => {
    dispatch(fetchDashboardData());
    startAutoRefresh();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        dispatch(refreshDashboardData());
        startAutoRefresh();
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [dispatch, startAutoRefresh]);

  const handleRefresh = () => {
    dispatch(refreshDashboardData());
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-display">
              Dashboard
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Welcome back, Acme Corp
            </p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-md text-text-secondary text-sm hover:bg-bg-elevated transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-success-soft border border-success/20 rounded-md text-success text-sm">
              <TrendingUp size={16} />
              <span className="font-medium">+12.5% this month</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger-soft border border-danger/20 rounded-md text-danger text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-border rounded-[10px] p-5 animate-pulse h-24"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-surface border border-border rounded-[10px] p-6 animate-pulse h-64" />
              <div className="bg-surface border border-border rounded-[10px] p-6 animate-pulse h-64" />
            </div>
          </>
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <SummaryCard
                  label="Total Volume"
                  value={formatAmount(summary?.totalReceived ?? 0)}
                  icon={<IndianRupee size={20} />}
                  trend="+12% vs yesterday"
                  trendUp
                />
                <SummaryCard
                  label="Total Transactions"
                  value={summary?.totalTransactions?.toLocaleString("en-IN") ?? "0"}
                  icon={<Activity size={20} />}
                />
                <SummaryCard
                  label="Success Rate"
                  value={summary?.successRate != null ? `${summary.successRate}%` : "0%"}
                  icon={<CheckCircle size={20} />}
                  trend="Stable"
                  trendUp
                />
                <SummaryCard
                  label="Last Payment"
                  value={
                    summary.lastPaymentAt
                      ? new Date(summary.lastPaymentAt).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "N/A"
                  }
                  icon={<Clock size={20} />}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary font-display">
                    Recent Transactions
                  </h2>
                  <span
                    onClick={() => Navigate("/transactions")}
                    className="text-xs text-accent flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    View all <ArrowUpRight size={12} />
                  </span>
                </div>
                <TransactionTable payments={payments} loading={false} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary font-display">
                    Daily Volume
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    Last 7 days
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-[10px] p-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dailyVolume} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#55556A", fontSize: 12 }}
                        tickFormatter={(v) =>
                          new Date(v).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })
                        }
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#55556A", fontSize: 12 }}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#111118",
                          border: "1px solid #2A2A38",
                          borderRadius: "8px",
                          color: "#F0F0FF",
                        }}
                        formatter={(value) => [
                          formatAmount(value as number),
                          "Volume",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#6C63FF"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#6C63FF", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#6C63FF", stroke: "#111118", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-surface border border-border rounded-[10px] p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Wallet size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Wallet Balance</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatAmount(0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-soft rounded-lg flex items-center justify-center">
                  <TrendingUp size={18} className="text-success" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Settlements Pending</p>
                  <p className="text-lg font-bold text-text-primary">
                    {formatAmount(0)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-text-muted">
                Auto-updates every 60s
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
