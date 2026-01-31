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
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { categories, transactions, refreshCategories, refreshTransactions } =
    useApp();
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              Xin chào, {session.user.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              Tổng quan tài chính tháng{" "}
              {format(now, "MM/yyyy", { locale: vi })}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
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
                <button
                  onClick={() => router.push("/transactions")}
                  className="mt-4 text-indigo-600 font-medium hover:text-indigo-700"
                >
                  Thêm giao dịch đầu tiên
                </button>
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
