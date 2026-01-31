"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface StatisticsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryStats: Array<{
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    type: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  monthlyStats: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  transactionCount: number;
}

export default function StatisticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const [viewType, setViewType] = useState<"expense" | "income">("expense");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
  }, [session, year, month]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ year: year.toString() });
      if (month) {
        params.append("month", month.toString());
      }
      const res = await fetch(`/api/statistics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const formatMoneyShort = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}tr`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k`;
    }
    return amount.toString();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const filteredCategoryStats =
    stats?.categoryStats.filter((c) => c.type === viewType) || [];

  const months = [
    { value: null, label: "Cả năm" },
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              Thống kê
            </h1>
            <p className="text-gray-500 mt-1">
              Phân tích chi tiêu và thu nhập
            </p>
          </div>

          {/* Year/Month Selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Year Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setYear(year - 1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-lg font-semibold text-gray-800 min-w-[80px] text-center">
                  {year}
                </span>
                <button
                  onClick={() => setYear(year + 1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Month Selector */}
              <div className="flex-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                {months.map((m) => (
                  <button
                    key={m.value ?? "all"}
                    onClick={() => setMonth(m.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      month === m.value
                        ? "bg-indigo-100 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-gray-500">Thu nhập</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-green-600">
                {formatMoney(stats?.totalIncome || 0)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-gray-500">Chi tiêu</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-red-600">
                {formatMoney(stats?.totalExpense || 0)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-3 rounded-xl ${
                    (stats?.balance || 0) >= 0 ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  {(stats?.balance || 0) >= 0 ? (
                    <TrendingUp
                      className={`w-6 h-6 ${
                        (stats?.balance || 0) >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <span className="text-gray-500">Số dư</span>
              </div>
              <p
                className={`text-2xl lg:text-3xl font-bold ${
                  (stats?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatMoney(stats?.balance || 0)}
              </p>
            </div>
          </div>

          {/* Monthly Chart */}
          {!month && stats?.monthlyStats && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                Biểu đồ theo tháng
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatMoneyShort}
                    />
                    <Tooltip
                      formatter={(value: number) => formatMoney(value)}
                      labelFormatter={(label) => `Tháng ${label.replace("T", "")}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="income"
                      name="Thu nhập"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      name="Chi tiêu"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Thống kê theo danh mục
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewType("expense")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewType === "expense"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  Chi tiêu
                </button>
                <button
                  onClick={() => setViewType("income")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewType === "income"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  Thu nhập
                </button>
              </div>
            </div>

            {filteredCategoryStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Chưa có dữ liệu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredCategoryStats}
                        dataKey="total"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ categoryIcon, percentage }) =>
                          `${categoryIcon} ${percentage.toFixed(1)}%`
                        }
                      >
                        {filteredCategoryStats.map((entry, index) => (
                          <Cell key={index} fill={entry.categoryColor} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatMoney(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Category List */}
                <div className="space-y-3">
                  {filteredCategoryStats.map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${cat.categoryColor}20` }}
                      >
                        {cat.categoryIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800 truncate">
                            {cat.categoryName}
                          </span>
                          <span className="font-semibold text-gray-800">
                            {formatMoney(cat.total)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${cat.percentage}%`,
                                backgroundColor: cat.categoryColor,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {cat.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
