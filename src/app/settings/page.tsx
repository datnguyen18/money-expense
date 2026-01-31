"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Users, UserPlus, Copy, Check, LogOut } from "lucide-react";

interface FamilyMember {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchFamily();
    }
  }, [session]);

  const fetchFamily = async () => {
    try {
      const res = await fetch("/api/family");
      if (res.ok) {
        const data = await res.json();
        setFamilyId(data.familyId);
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching family:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFamily = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        await fetchFamily();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      console.error("Error creating family:", error);
      setMessage({ type: "error", text: "Có lỗi xảy ra" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setInviteEmail("");
        await fetchFamily();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      console.error("Error inviting:", error);
      setMessage({ type: "error", text: "Có lỗi xảy ra" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLeaveFamily = async () => {
    if (!confirm("Bạn có chắc muốn rời khỏi gia đình?")) return;

    setIsProcessing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message });
        setFamilyId(null);
        setMembers([]);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (error) {
      console.error("Error leaving family:", error);
      setMessage({ type: "error", text: "Có lỗi xảy ra" });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyFamilyId = () => {
    if (familyId) {
      navigator.clipboard.writeText(familyId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt</h1>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Family Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users className="text-indigo-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Chia sẻ dữ liệu gia đình</h2>
                <p className="text-sm text-gray-500">
                  Các thành viên trong gia đình sẽ thấy chung giao dịch và danh mục
                </p>
              </div>
            </div>

            {!familyId ? (
              // No family yet
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Bạn chưa tham gia gia đình nào</p>
                <button
                  onClick={handleCreateFamily}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus size={20} />
                  )}
                  Tạo gia đình mới
                </button>
              </div>
            ) : (
              // Has family
              <div className="space-y-6">
                {/* Family ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã gia đình (dùng để mời người khác)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={familyId}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                    />
                    <button
                      onClick={copyFamilyId}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                {/* Members */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Thành viên ({members.length})
                  </label>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        {member.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.image}
                            alt={member.name || ""}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                            {member.name?.charAt(0) || "?"}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        {member.id === session?.user?.id && (
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                            Bạn
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite */}
                <form onSubmit={handleInvite}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mời thành viên mới
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Nhập email..."
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing || !inviteEmail.trim()}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus size={20} />
                      )}
                      Mời
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    * Người được mời phải đã đăng nhập vào hệ thống trước đó
                  </p>
                </form>

                {/* Leave Family */}
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleLeaveFamily}
                    disabled={isProcessing}
                    className="text-red-600 hover:text-red-700 text-sm flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Rời khỏi gia đình
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
