export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
  isDefault: boolean;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  date: Date;
  type: "expense" | "income";
  categoryId: string;
  category?: Category;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt" | "updatedAt" | "userId">[] = [
  { name: "Ăn uống", icon: "🍜", color: "#ef4444", type: "expense", isDefault: true },
  { name: "Di chuyển", icon: "🚗", color: "#f97316", type: "expense", isDefault: true },
  { name: "Mua sắm", icon: "🛒", color: "#eab308", type: "expense", isDefault: true },
  { name: "Giải trí", icon: "🎬", color: "#22c55e", type: "expense", isDefault: true },
  { name: "Hóa đơn", icon: "📄", color: "#3b82f6", type: "expense", isDefault: true },
  { name: "Sức khỏe", icon: "💊", color: "#8b5cf6", type: "expense", isDefault: true },
  { name: "Giáo dục", icon: "📚", color: "#ec4899", type: "expense", isDefault: true },
  { name: "Tiết kiệm", icon: "🏦", color: "#14b8a6", type: "expense", isDefault: true },
  { name: "Khác", icon: "📁", color: "#6b7280", type: "expense", isDefault: true },
  { name: "Lương", icon: "💰", color: "#22c55e", type: "income", isDefault: true },
  { name: "Thưởng", icon: "🎁", color: "#f97316", type: "income", isDefault: true },
  { name: "Đầu tư", icon: "📈", color: "#3b82f6", type: "income", isDefault: true },
  { name: "Thu nhập khác", icon: "💵", color: "#8b5cf6", type: "income", isDefault: true },
];
