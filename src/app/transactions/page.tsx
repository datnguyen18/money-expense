"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useApp } from "@/contexts/AppContext";
import { Plus, Edit2, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Transaction } from "@/types";

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { categories, transactions, refreshCategories, refreshTransactions } =
    useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">(
    "all"
  );
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

  const openModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description || "",
        date: format(new Date(transaction.date), "yyyy-MM-dd"),
        type: transaction.type as "expense" | "income",
        categoryId: transaction.categoryId,
      });
    } else {
      setEditingTransaction(null);
      const defaultCategory = categories.find((c) => c.type === "expense");
      setFormData({
        amount: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        type: "expense",
        categoryId: defaultCategory?.id || "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions";

      const res = await fetch(url, {
        method: editingTransaction ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await refreshTransactions();
        closeModal();
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

  const handleDelete = async (transaction: Transaction) => {
    if (!confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
    setDeletingId(transaction.id);

    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await refreshTransactions();
      } else {
        const error = await res.json();
        alert(error.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Có lỗi xảy ra");
    } finally {
      setDeletingId(null);
    }
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) return null;

  const filteredTransactions =
    filterType === "all"
      ? transactions
      : transactions.filter((t) => t.type === filterType);

  const filteredCategories = categories.filter(
    (c) => c.type === formData.type
  );

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, t) => {
    const dateKey = format(new Date(t.date), "yyyy-MM-dd");
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(t);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Giao dịch
              </h1>
              <p className="text-gray-500 mt-1">
                {filteredTransactions.length} giao dịch
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "all"
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilterType("expense")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "expense"
                      ? "bg-red-100 text-red-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Chi tiêu
                </button>
                <button
                  onClick={() => setFilterType("income")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === "income"
                      ? "bg-green-100 text-green-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Thu nhập
                </button>
              </div>

              <button
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Thêm</span>
              </button>
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-500 mb-4">Chưa có giao dịch nào</p>
              <button
                onClick={() => openModal()}
                className="text-indigo-600 font-medium hover:text-indigo-700"
              >
                Thêm giao dịch đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTransactions).map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    {format(new Date(date), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                    {items.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{
                            backgroundColor: `${transaction.category?.color}20`,
                          }}
                        >
                          {transaction.category?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {transaction.description ||
                              transaction.category?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.category?.name}
                          </p>
                        </div>
                        <p
                          className={`font-semibold flex-shrink-0 ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatMoney(transaction.amount)}
                        </p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => openModal(transaction)}
                            disabled={deletingId === transaction.id}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction)}
                            disabled={deletingId === transaction.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingId === transaction.id ? (
                              <div className="w-[18px] h-[18px] border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingTransaction ? "Sửa giao dịch" : "Thêm giao dịch mới"}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giao dịch
                </label>
                <div className="flex gap-4">
                  <label className="flex-1">
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={formData.type === "expense"}
                      onChange={(e) => {
                        const newType = e.target.value as "expense" | "income";
                        const newCategory = categories.find(
                          (c) => c.type === newType
                        );
                        setFormData({
                          ...formData,
                          type: newType,
                          categoryId: newCategory?.id || "",
                        });
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                        formData.type === "expense"
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl block mb-1">💸</span>
                      <span className="font-medium">Chi tiêu</span>
                    </div>
                  </label>
                  <label className="flex-1">
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === "income"}
                      onChange={(e) => {
                        const newType = e.target.value as "expense" | "income";
                        const newCategory = categories.find(
                          (c) => c.type === newType
                        );
                        setFormData({
                          ...formData,
                          type: newType,
                          categoryId: newCategory?.id || "",
                        });
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                        formData.type === "income"
                          ? "border-green-500 bg-green-50 text-green-600"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl block mb-1">💰</span>
                      <span className="font-medium">Thu nhập</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
                    placeholder="0"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, categoryId: category.id })
                      }
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.categoryId === category.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl block mb-1">{category.icon}</span>
                      <span className="text-xs text-gray-600 truncate block">
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Mô tả giao dịch"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {isSaving ? "Đang lưu..." : editingTransaction ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
