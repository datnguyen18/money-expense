"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useApp } from "@/contexts/AppContext";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { categories, transactions, refreshCategories, refreshTransactions } =
    useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "expense" as "expense" | "income",
    categoryId: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      Promise.all([refreshCategories(), refreshTransactions()]).finally(() =>
        setIsLoading(false)
      );
    }
  }, [session, refreshCategories, refreshTransactions]);

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      const defaultCategory = categories.find((c) => c.type === formData.type);
      if (defaultCategory) {
        setFormData((prev) => ({ ...prev, categoryId: defaultCategory.id }));
      }
    }
  }, [categories, formData.type, formData.categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.categoryId) return;
    
    setIsSaving(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await refreshTransactions();
        // Reset form
        const defaultCategory = categories.find((c) => c.type === "expense");
        setFormData({
          amount: "",
          description: "",
          date: format(new Date(), "yyyy-MM-dd"),
          type: "expense",
          categoryId: defaultCategory?.id || "",
        });
        // Show success message
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } else {
        const error = await res.json();
        alert(error.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      alert("Có lỗi xảy ra");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeChange = (newType: "expense" | "income") => {
    const newCategory = categories.find((c) => c.type === newType);
    setFormData({
      ...formData,
      type: newType,
      categoryId: newCategory?.id || "",
    });
  };

  // Format number with dots as thousand separators
  const formatNumberWithDots = (value: string) => {
    // Remove all non-digit characters
    const number = value.replace(/\D/g, "");
    // Format with dots
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Parse formatted number back to raw number
  const parseFormattedNumber = (value: string) => {
    return value.replace(/\./g, "");
  };

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFormattedNumber(e.target.value);
    setFormData({ ...formData, amount: rawValue });
  };

  // Get display value for amount input
  const displayAmount = formData.amount ? formatNumberWithDots(formData.amount) : "";

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) return null;

  // Calculate totals for current month
  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const recentTransactions = transactions.slice(0, 5);
  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              Xin chào, {session.user.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Tổng quan tài chính tháng{" "}
              {format(now, "MM/yyyy", { locale: vi })}
            </p>
          </div>

          {/* Quick Add Transaction Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                ✨ Thêm giao dịch nhanh
              </h2>
              <button
                type="button"
                onClick={() => router.push("/chatbot")}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg text-sm font-medium"
              >
                <Sparkles size={18} />
                Nhập bằng AI
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                    formData.type === "expense"
                      ? "border-red-500 bg-red-50 text-red-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  💸 Chi tiêu
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                    formData.type === "income"
                      ? "border-green-500 bg-green-50 text-green-600"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  💰 Thu nhập
                </button>
              </div>

              {/* Amount & Date Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg text-gray-900 bg-white"
                    placeholder="Số tiền"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    VNĐ
                  </span>
                </div>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
                  required
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, categoryId: category.id })
                      }
                      className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                        formData.categoryId === category.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
                placeholder="Ghi chú (tùy chọn)"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSaving || !formData.amount || !formData.categoryId}
                className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  showSuccess
                    ? "bg-green-500 text-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : showSuccess ? (
                  <>
                    <Check size={20} />
                    Đã thêm thành công!
                  </>
                ) : (
                  <>
                    Thêm giao dịch
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                  <ArrowUpRight size={16} />
                  Thu nhập
                </span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-800">
                {formatMoney(totalIncome)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Tổng thu trong tháng</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-red-600 text-sm font-medium flex items-center gap-1">
                  <ArrowDownRight size={16} />
                  Chi tiêu
                </span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-gray-800">
                {formatMoney(totalExpense)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Tổng chi trong tháng</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Wallet className="w-6 h-6 text-indigo-600" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    balance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Số dư
                </span>
              </div>
              <p
                className={`text-2xl lg:text-3xl font-bold ${
                  balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatMoney(balance)}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {balance >= 0 ? "Còn dư" : "Thiếu hụt"} trong tháng
              </p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Giao dịch gần đây
                </h2>
                <button
                  onClick={() => router.push("/transactions")}
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
                >
                  Xem tất cả
                </button>
              </div>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-gray-500">Chưa có giao dịch nào</p>
                <p className="text-gray-400 text-sm mt-1">
                  Sử dụng form phía trên để thêm giao dịch đầu tiên
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: `${transaction.category?.color}20`,
                      }}
                    >
                      {transaction.category?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {transaction.description || transaction.category?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.category?.name} •{" "}
                        {format(new Date(transaction.date), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <p
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatMoney(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
