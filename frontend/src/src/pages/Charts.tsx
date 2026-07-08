import { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowLeft, Calendar, TrendingUp, BarChart3, PieChart as PieIcon, Activity, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getDailyVolume, getSummary } from "../services/analytics.service";
import type { DailyVolume, Summary } from "../services/analytics.service";

const RANGE_OPTIONS = [
  { label: "Today", days: 1 },
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
] as const;

const COLORS = {
  accent: "#7C6FCD",
  accentLight: "rgba(124, 111, 205, 0.15)",
  success: "#059669",
  danger: "#DC2626",
  warning: "#D97706",
  grid: "#E5E7EB",
  muted: "#9CA3AF",
  text: "#111827",
  surface: "#FFFFFF",
  tooltipBg: "#111827",
};

const CHART_TOOLTIP = {
  contentStyle: {
    background: COLORS.tooltipBg,
    border: "none",
    borderRadius: "8px",
    color: "#F0F0FF",
    fontSize: 12,
    padding: "8px 12px",
  },
};

const PIE_COLORS = [COLORS.success, COLORS.danger, COLORS.warning];

const formatAmount = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const formatDate = (v: string) =>
  new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const ChartCard = ({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-surface border border-border rounded-[10px] p-6 ${className}`}>
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 bg-accent-soft rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-text-primary font-display">{title}</h3>
    </div>
    {children}
  </div>
);

const VolumeChart = ({ data }: { data: DailyVolume[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.25} />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
      <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
      <Tooltip {...CHART_TOOLTIP} formatter={(v) => [formatAmount(Number(v)), "Volume"]} />
      <Area type="monotone" dataKey="amount" stroke={COLORS.accent} strokeWidth={2.5} fill="url(#volGrad)" dot={{ r: 3, fill: COLORS.accent, strokeWidth: 0 }} activeDot={{ r: 5, fill: COLORS.accent, stroke: COLORS.surface, strokeWidth: 2 }} />
    </AreaChart>
  </ResponsiveContainer>
);

const TransactionCountChart = ({ data }: { data: DailyVolume[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
      <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
      <Tooltip {...CHART_TOOLTIP} formatter={(v) => [v, "Transactions"]} />
      <Bar dataKey="count" fill={COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={32} />
    </BarChart>
  </ResponsiveContainer>
);

const AvgTransactionChart = ({ data }: { data: DailyVolume[] }) => {
  const enriched = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        avg: d.count > 0 ? Math.round(d.amount / d.count) : 0,
      })),
    [data],
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={enriched} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_TOOLTIP} formatter={(v) => [formatAmount(Number(v)), "Avg Transaction"]} />
        <Line type="monotone" dataKey="avg" stroke={COLORS.warning} strokeWidth={2} dot={{ r: 3, fill: COLORS.warning, strokeWidth: 0 }} activeDot={{ r: 5, fill: COLORS.warning, stroke: COLORS.surface, strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const SuccessFailPie = ({ summary }: { summary: Summary | null }) => {
  const successRate = summary?.successRate ?? 0;
  const failRate = 100 - successRate;

  const pieData = [
    { name: "Success", value: successRate },
    { name: "Failed", value: failRate },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={105}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i]} />
          ))}
        </Pie>
        <Tooltip
          {...CHART_TOOLTIP}
          formatter={(v) => [`${Number(v).toFixed(1)}%`]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-text-secondary">{value}</span>
          )}
        />
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold" fill={COLORS.text}>
          {successRate}%
        </text>
        <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="text-[10px]" fill={COLORS.muted}>
          Success Rate 
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

const CumulativeChart = ({ data }: { data: DailyVolume[] }) => {
  const cumulative = useMemo(() => {
    let total = 0;
    return data.map((d) => {
      total += d.amount;
      return { ...d, cumulative: total };
    });
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={cumulative} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.2} />
            <stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="date" tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={formatDate} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
        <Tooltip {...CHART_TOOLTIP} formatter={(v) => [formatAmount(Number(v)), "Cumulative"]} />
        <Area type="monotone" dataKey="cumulative" stroke={COLORS.success} strokeWidth={2.5} fill="url(#cumGrad)" dot={false} activeDot={{ r: 5, fill: COLORS.success, stroke: COLORS.surface, strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const REFRESH_INTERVAL = 30_000;

const Charts = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<1 | 7 | 14 | 30>(1);
  const [data, setData] = useState<DailyVolume[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getDailyVolume(range).catch(() => []), getSummary().catch(() => null)]).then(
      ([vol, sum]) => {
        if (!active) return;
        setData(Array.isArray(vol) ? vol : []);
        setSummary(sum);
        setLoading(false);
      },
    );
    return () => { active = false; };
  }, [range]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      Promise.all([getDailyVolume(range).catch(() => []), getSummary().catch(() => null)]).then(
        ([vol, sum]) => {
          setData(Array.isArray(vol) ? vol : []);
          setSummary(sum);
        },
      );
    };

    intervalRef.current = setInterval(refresh, REFRESH_INTERVAL);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [range]);

  const stats = useMemo(() => {
    const total = data.reduce((s, d) => s + d.amount, 0);
    const txns = data.reduce((s, d) => s + d.count, 0);
    const avg = txns > 0 ? total / txns : 0;
    const peak = Math.max(...data.map((d) => d.amount), 0);
    return { total, txns, avg, peak };
  }, [data]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-surface hover:bg-bg-elevated transition-colors"
            >
              <ArrowLeft size={16} className="text-text-secondary" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary font-display">
                Analytics
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                Detailed payment insights and trends
              </p>
            </div>
          </div>

          {/* Range selector */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-1 mt-4 sm:mt-0">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setRange(opt.days)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === opt.days
                    ? "bg-accent text-white"
                    : "text-text-muted hover:text-text-secondary hover:bg-bg-elevated"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-surface border border-border rounded-[10px] p-6 animate-pulse h-80" />
            ))}
          </div>
        ) : data.length === 0 || data.every((d) => d.count === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 bg-accent-soft rounded-2xl flex items-center justify-center mb-4">
              <Inbox size={24} className="text-accent" />
            </div>
            <p className="text-text-primary font-semibold mb-1">
              {range === 1 ? "No transactions today" : "No transactions in this range"}
            </p>
            <p className="text-sm text-text-muted max-w-xs">
              When a payment comes through, it will appear here automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Volume", value: formatAmount(stats.total), icon: <TrendingUp size={14} /> },
                { label: "Total Transactions", value: stats.txns.toLocaleString("en-IN"), icon: <Activity size={14} /> },
                { label: "Avg Transaction", value: formatAmount(stats.avg), icon: <BarChart3 size={14} /> },
                { label: "Peak Day", value: formatAmount(stats.peak), icon: <Calendar size={14} /> },
              ].map((s) => (
                <div key={s.label} className="bg-surface border border-border rounded-[10px] p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-soft rounded-lg flex items-center justify-center text-accent shrink-0">
                    {s.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-text-muted truncate">{s.label}</p>
                    <p className="text-sm font-bold text-text-primary truncate">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Revenue Over Time" icon={<TrendingUp size={16} className="text-accent" />}>
                <VolumeChart data={data} />
              </ChartCard>

              <ChartCard title="Daily Transactions" icon={<BarChart3 size={16} className="text-accent" />}>
                <TransactionCountChart data={data} />
              </ChartCard>

              <ChartCard title="Average Transaction Value" icon={<Activity size={16} className="text-accent" />}>
                <AvgTransactionChart data={data} />
              </ChartCard>

              <ChartCard title="Success vs Failed" icon={<PieIcon size={116} className="text-accent" />}>
                <SuccessFailPie summary={summary} />
              </ChartCard>

              <ChartCard title="Cumulative Revenue" icon={<TrendingUp size={16} className="text-accent" />} className="lg:col-span-2">
                <CumulativeChart data={data} />
              </ChartCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Charts;
