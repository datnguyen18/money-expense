"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
  Target,
  PiggyBank,
} from "lucide-react";
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

interface PredictionData {
  predictedIncome: number;
  predictedExpense: number;
  predictedBalance: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  summary: string;
  tips: string[];
  warnings: string[];
  topSpendingCategory: string;
  savingPotential: number;
  monthName: string;
}

export default function StatisticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const [viewType, setViewType] = useState<"expense" | "income">("expense");
  
  // Prediction states
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [showPrediction, setShowPrediction] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchPrediction = async () => {
    setIsPredicting(true);
    setPredictionError(null);
    setShowPrediction(true);
    
    try {
      const res = await fetch("/api/statistics/predict");
      const data = await res.json();
      
      if (data.error) {
        setPredictionError(data.error);
      } else if (data.message) {
        setPredictionError(data.message);
      } else {
        setPrediction(data.prediction);
      }
    } catch (error) {
      console.error("Error fetching prediction:", error);
      setPredictionError("Không thể tải dự đoán. Vui lòng thử lại.");
    } finally {
      setIsPredicting(false);
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Thống kê
              </h1>
              <p className="text-gray-500 mt-1">
                Phân tích chi tiêu và thu nhập
              </p>
            </div>
            <button
              onClick={fetchPrediction}
              disabled={isPredicting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-70"
            >
              {isPredicting ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              {isPredicting ? "Đang phân tích..." : "🔮 Dự đoán tháng tới"}
            </button>
          </div>

          {/* AI Prediction Section */}
          {showPrediction && (
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-sm border border-purple-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Sparkles className="text-purple-500" size={20} />
                  Dự đoán AI cho {prediction?.monthName || "tháng tới"}
                </h2>
                <button
                  onClick={() => setShowPrediction(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  Ẩn
                </button>
              </div>

              {isPredicting ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-500 animate-bounce" size={24} />
                  </div>
                  <p className="text-gray-600 mt-4">AI đang phân tích thói quen chi tiêu của bạn...</p>
                </div>
              ) : predictionError ? (
                <div className="text-center py-6">
                  <AlertTriangle className="mx-auto text-amber-500 mb-3" size={32} />
                  <p className="text-gray-600">{predictionError}</p>
                  <button
                    onClick={fetchPrediction}
                    className="mt-4 text-purple-600 font-medium hover:text-purple-700"
                  >
                    Thử lại
                  </button>
                </div>
              ) : prediction ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-white/60 rounded-xl p-4">
                    <p className="text-gray-700">{prediction.summary}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500">Độ tin cậy:</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full max-w-[150px]">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${prediction.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-purple-600">{prediction.confidence}%</span>
                    </div>
                  </div>

                  {/* Prediction Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/80 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-green-500" size={18} />
                        <span className="text-sm text-gray-600">Dự đoán thu nhập</span>
                      </div>
                      <p className="text-xl font-bold text-green-600">
                        {formatMoney(prediction.predictedIncome)}
                      </p>
                    </div>

                    <div className="bg-white/80 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="text-red-500" size={18} />
                        <span className="text-sm text-gray-600">Dự đoán chi tiêu</span>
                        {prediction.trend === "up" && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">↑ Tăng</span>
                        )}
                        {prediction.trend === "down" && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">↓ Giảm</span>
                        )}
                      </div>
                      <p className="text-xl font-bold text-red-600">
                        {formatMoney(prediction.predictedExpense)}
                      </p>
                    </div>

                    <div className="bg-white/80 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="text-indigo-500" size={18} />
                        <span className="text-sm text-gray-600">Dự đoán số dư</span>
                      </div>
                      <p className={`text-xl font-bold ${prediction.predictedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatMoney(prediction.predictedBalance)}
                      </p>
                    </div>
                  </div>

                  {/* Warnings */}
                  {prediction.warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-amber-500" size={18} />
                        <span className="font-medium text-amber-700">Cảnh báo</span>
                      </div>
                      <ul className="space-y-1">
                        {prediction.warnings.map((warning, i) => (
                          <li key={i} className="text-amber-700 text-sm flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {prediction.tips.length > 0 && (
                    <div className="bg-white/60 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="text-yellow-500" size={18} />
                        <span className="font-medium text-gray-700">Lời khuyên từ AI</span>
                      </div>
                      <ul className="space-y-2">
                        {prediction.tips.map((tip, i) => (
                          <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                            <span className="text-purple-500 font-bold">{i + 1}.</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Saving Potential */}
                  {prediction.savingPotential > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <PiggyBank className="text-green-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-green-700">Tiềm năng tiết kiệm thêm</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatMoney(prediction.savingPotential)}/tháng
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

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
                      formatter={(value) => formatMoney(value as number)}
                      labelFormatter={(label) => `Tháng ${String(label).replace("T", "")}`}
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
                        label={(props) => {
                          const entry = props.payload as { categoryIcon: string; percentage: number };
                          return `${entry.categoryIcon} ${entry.percentage.toFixed(1)}%`;
                        }}
                      >
                        {filteredCategoryStats.map((entry, index) => (
                          <Cell key={index} fill={entry.categoryColor} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatMoney(value as number)}
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
