import React, { useState, useEffect } from "react";
import { authFetch, getAuthHeaders } from "../auth/session";
import { API_BASE_URL } from "../config/api";

const ADMIN_ROLE_ID = "69fc5af582ef85451120772a";

const DEFAULT_CHAT_CONFIG = {
  enabled: true,
  apiKey: "",
  model: "gemini-2.5-flash",
  systemPrompt: "Bạn là trợ lý AI thông minh của HT Ocean Group. Hãy giải đáp thắc mắc của nhân viên dựa trên SOP và tài liệu nội bộ.",
  welcomeMessage: "Xin chào! Tôi là trợ lý AI của HT Ocean. Tôi có thể giúp gì cho bạn?"
};

const DEFAULT_COMMISSION_CONFIG = {
  khachHangThanThiet: 5,
  daiSuGieoMamDong: 5,
  daiSuKetNoiBac: 6,
  daiSuTruCotVang: 7,
  daiSuTinhAnhKimCuong: 8,
  daiSuTanTamMaster: 10
};

const DEFAULT_AUTOMATION_CONFIG = {
  enabled: true,
  autoAssignEnabled: true,
  duplicateDetectionEnabled: true,
  duplicateWindowDays: 30,
  welcomeEmailEnabled: true,
  internalAlertEnabled: true,
  staleReminderEnabled: true,
  staleReminderHours: 24,
  autoLostEnabled: true,
  autoLostDays: 14,
  commissionReminderEnabled: true,
  commissionPendingReminderDays: 7,
  rankUpSuggestionEnabled: true,
};

const DEFAULT_AUTOMATION_STATS = {
  unassignedLeads: 0,
  staleLeads: 0,
  dueForAutoLost: 0,
  recentDuplicates: 0,
  overduePendingCommissions: 0,
};

export function SystemSettingsPage({ currentUser }) {
  // Check permission
  const isAdmin = currentUser?.role === "admin" || currentUser?.roleId === ADMIN_ROLE_ID;

  // Active Tab
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "commission" | "automation"

  // Settings states
  const [chatConfig, setChatConfig] = useState(DEFAULT_CHAT_CONFIG);
  const [commissionConfig, setCommissionConfig] = useState(DEFAULT_COMMISSION_CONFIG);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingCommission, setSavingCommission] = useState(false);

  // CRM Automation states
  const [automationConfig, setAutomationConfig] = useState(DEFAULT_AUTOMATION_CONFIG);
  const [automationStats, setAutomationStats] = useState(DEFAULT_AUTOMATION_STATS);
  const [automationLoading, setAutomationLoading] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [runningAutomationNow, setRunningAutomationNow] = useState(false);

  // Success/Error Message Toast emulation
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load configuration on mount
  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    const loadSettings = async () => {
      setSettingsLoading(true);

      try {
        const response = await authFetch(`${API_BASE_URL}/system-settings`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || "Không thể tải cấu hình hệ thống.");
        }

        const data = payload?.data || {};
        if (!isMounted) return;
        setChatConfig({ ...DEFAULT_CHAT_CONFIG, ...(data.chatConfig || {}) });
        setCommissionConfig({ ...DEFAULT_COMMISSION_CONFIG, ...(data.commissionConfig || {}) });
      } catch (e) {
        if (!isMounted) return;
        showToast(e instanceof Error ? e.message : "Không thể tải cấu hình hệ thống.", "error");
      } finally {
        if (isMounted) setSettingsLoading(false);
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // Tải cấu hình + số liệu tổng quan của CRM Automation
  const loadAutomationOverview = async () => {
    setAutomationLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/automation/overview`, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Không thể tải cấu hình CRM Automation.");
      }

      const data = payload?.data || {};
      setAutomationConfig({ ...DEFAULT_AUTOMATION_CONFIG, ...(data.config || {}) });
      setAutomationStats({ ...DEFAULT_AUTOMATION_STATS, ...(data.stats || {}) });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Không thể tải cấu hình CRM Automation.", "error");
    } finally {
      setAutomationLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    void loadAutomationOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Handle changes
  const handleChatChange = (field, value) => {
    setChatConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleCommissionChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    setCommissionConfig(prev => ({ ...prev, [field]: Math.max(0, Math.min(100, numericValue)) }));
  };

  const handleAutomationToggle = (field, value) => {
    setAutomationConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleAutomationNumberChange = (field, value) => {
    const numericValue = parseInt(value, 10);
    setAutomationConfig(prev => ({ ...prev, [field]: Number.isFinite(numericValue) && numericValue > 0 ? numericValue : prev[field] }));
  };

  const handleSaveAutomation = async (e) => {
    e.preventDefault();
    setSavingAutomation(true);

    try {
      const response = await authFetch(`${API_BASE_URL}/automation/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(automationConfig),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Lưu cấu hình CRM Automation thất bại.");
      }

      setAutomationConfig({ ...DEFAULT_AUTOMATION_CONFIG, ...(payload?.data || {}) });
      showToast("Lưu cấu hình CRM Automation thành công!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lưu cấu hình CRM Automation thất bại.", "error");
    } finally {
      setSavingAutomation(false);
    }
  };

  const handleRunAutomationNow = async () => {
    setRunningAutomationNow(true);

    try {
      const response = await authFetch(`${API_BASE_URL}/automation/run-now`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Chạy kiểm tra CRM Automation thất bại.");
      }

      const result = payload?.data || {};
      const staleCount = result?.staleResult?.reminded || 0;
      const autoLostCount = result?.autoLostResult?.closed || 0;
      const commissionCount = result?.commissionResult?.count || 0;
      const rankUpCount = result?.rankUpResult?.suggested || 0;

      showToast(
        `Đã chạy xong: nhắc ${staleCount} lead im lặng, đóng ${autoLostCount} lead quá hạn, nhắc ${commissionCount} khoản hoa hồng, gợi ý ${rankUpCount} CTV thăng hạng.`,
        "success"
      );

      // Cập nhật lại số liệu tổng quan sau khi chạy
      void loadAutomationOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Chạy kiểm tra CRM Automation thất bại.", "error");
    } finally {
      setRunningAutomationNow(false);
    }
  };

  // Save changes
  const handleSaveChat = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem("hto_chat_config", JSON.stringify(chatConfig));
      window.dispatchEvent(new Event("hto:chat_config_updated"));
      showToast("Lưu cấu hình Chatbot thành công!", "success");
    } catch (err) {
      showToast("Lưu cấu hình Chatbot thất bại.", "error");
    }
  };

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    setSavingCommission(true);

    try {
      const response = await authFetch(`${API_BASE_URL}/system-settings/commission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(commissionConfig),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Lưu cấu hình hoa hồng thất bại.");
      }

      setCommissionConfig({ ...DEFAULT_COMMISSION_CONFIG, ...(payload?.data || {}) });
      showToast("Lưu cấu hình hoa hồng thành công!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Lưu cấu hình hoa hồng thất bại.", "error");
    } finally {
      setSavingCommission(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container-fluid pt-5 pb-4" style={{ maxWidth: "1200px" }}>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h4 className="font-bold text-red-800 text-lg mb-1">Từ chối quyền truy cập</h4>
          <p className="text-slate-600 text-sm">Bạn không có quyền quản trị viên để xem hoặc chỉnh sửa trang cài đặt này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid pt-3 pb-4" style={{ maxWidth: "1200px" }}>
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg transition-all duration-300 ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
          }`}>
          {toast.type === "success" ? (
            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Page Title */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">Cấu hình Hệ thống</h2>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 mb-4 border-b border-slate-200 pb-1">
        <button
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${activeTab === "chat"
            ? "border-b-2 border-cyan-900 text-cyan-900 bg-cyan-50/50"
            : "text-slate-500 hover:text-slate-800"
            }`}
          onClick={() => setActiveTab("chat")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chatbot AI Settings
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${activeTab === "commission"
            ? "border-b-2 border-cyan-900 text-cyan-900 bg-cyan-50/50"
            : "text-slate-500 hover:text-slate-800"
            }`}
          onClick={() => setActiveTab("commission")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Chính sách Hoa hồng Deal
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${activeTab === "automation"
            ? "border-b-2 border-cyan-900 text-cyan-900 bg-cyan-50/50"
            : "text-slate-500 hover:text-slate-800"
            }`}
          onClick={() => setActiveTab("automation")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          CRM Automation
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "chat" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-cyan-900 rounded"></span> Cấu hình dịch vụ Chatbot AI
          </h4>

          <form onSubmit={handleSaveChat} className="space-y-4">
            {/* Toggle Enabled */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3">
              <div>
                <label className="block font-bold text-xs text-slate-700 mr-2 ">Kích hoạt Chatbot</label>
                <span className="text-[11px] text-slate-500">Cho phép trợ lý ảo hiển thị trên trang web nội bộ của nhân viên.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={chatConfig.enabled}
                  onChange={(e) => handleChatChange("enabled", e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
              </label>
            </div>

            {/* API Key */}
            <div>
              <label className="block font-semibold text-xs text-slate-650 mb-1.5">API Key (Gemini hoặc OpenAI)</label>
              <input
                type="password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all placeholder-slate-400"
                placeholder="Nhập API Key liên quan đến chatbot của bạn..."
                value={chatConfig.apiKey}
                onChange={(e) => handleChatChange("apiKey", e.target.value)}
              />
              <span className="text-[10px] text-slate-400 mt-1 block">API Key được mã hóa và lưu trữ cục bộ để gọi API trực tiếp dưới trình duyệt.</span>
            </div>

            {/* Model Name */}
            <div>
              <label className="block font-semibold text-xs text-slate-650 mb-1.5">Model Name</label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all cursor-pointer"
                value={chatConfig.model}
                onChange={(e) => handleChatChange("model", e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Khuyên dùng)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>

            {/* Welcome message */}
            <div>
              <label className="block font-semibold text-xs text-slate-650 mb-1.5">Tin nhắn chào mừng</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all placeholder-slate-400"
                placeholder="Nhập lời chào đầu tiên khi mở khung chat..."
                value={chatConfig.welcomeMessage}
                onChange={(e) => handleChatChange("welcomeMessage", e.target.value)}
              />
            </div>

            {/* System Prompt */}
            <div>
              <label className="block font-semibold text-xs text-slate-650 mb-1.5">Prompt Hệ thống (System Instruction)</label>
              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all placeholder-slate-400"
                rows="3"
                placeholder="Hướng dẫn cách trợ lý AI phản hồi nhân viên..."
                value={chatConfig.systemPrompt}
                onChange={(e) => handleChatChange("systemPrompt", e.target.value)}
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all shadow-sm"
              >
                Lưu cấu hình Chatbot
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "commission" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-cyan-900 rounded"></span> Cài đặt mức chiết khấu & hoa hồng (%)
          </h4>
          <p className="text-slate-500 text-xs mb-4">Cấu hình tỷ lệ phần trăm hoa hồng được áp dụng cho từng cấp độ đại sứ khi có Deal thành công.</p>

          <form onSubmit={handleSaveCommission} className="space-y-4">
            {settingsLoading && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                Đang tải cấu hình hoa hồng từ hệ thống...
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Khách hàng thân thiết */}
              <div>
                <label className="block font-semibold text-xs text-slate-650 mb-1.5">Khách hàng thân thiết</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    value={commissionConfig.khachHangThanThiet}
                    onChange={(e) => handleCommissionChange("khachHangThanThiet", e.target.value)}
                    disabled={settingsLoading || savingCommission}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</div>
                </div>
              </div>

              {/* Đại sứ gieo mầm (Đồng) */}
              <div>
                <label className="block font-semibold text-xs text-slate-650 mb-1.5">Đại sứ gieo mầm (Đồng)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    value={commissionConfig.daiSuGieoMamDong}
                    onChange={(e) => handleCommissionChange("daiSuGieoMamDong", e.target.value)}
                    disabled={settingsLoading || savingCommission}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</div>
                </div>
              </div>

              {/* Đại sứ kết nối (Bạc) */}
              <div>
                <label className="block font-semibold text-xs text-slate-650 mb-1.5">Đại sứ kết nối (Bạc)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    value={commissionConfig.daiSuKetNoiBac}
                    onChange={(e) => handleCommissionChange("daiSuKetNoiBac", e.target.value)}
                    disabled={settingsLoading || savingCommission}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</div>
                </div>
              </div>

              {/* Đại sứ trụ cột (Vàng) */}
              <div>
                <label className="block font-semibold text-xs text-slate-650 mb-1.5">Đại sứ trụ cột (Vàng)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    value={commissionConfig.daiSuTruCotVang}
                    onChange={(e) => handleCommissionChange("daiSuTruCotVang", e.target.value)}
                    disabled={settingsLoading || savingCommission}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</div>
                </div>
              </div>

              {/* Đại sứ tinh anh (Kim cương) */}
              <div>
                <label className="block font-semibold text-xs text-slate-650 mb-1.5">Đại sứ tinh anh (Kim cương)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    value={commissionConfig.daiSuTinhAnhKimCuong}
                    onChange={(e) => handleCommissionChange("daiSuTinhAnhKimCuong", e.target.value)}
                    disabled={settingsLoading || savingCommission}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</div>
                </div>
              </div>

              {/* Đại sứ tận tâm (Master) */}
              <div>
                <label className="block font-semibold text-xs text-slate-650 mb-1.5">Đại sứ tận tâm (Master)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900 transition-all"
                    value={commissionConfig.daiSuTanTamMaster}
                    onChange={(e) => handleCommissionChange("daiSuTanTamMaster", e.target.value)}
                    disabled={settingsLoading || savingCommission}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                className="bg-transparent hover:bg-slate-100 text-slate-550 border border-slate-250 text-xs font-semibold py-2 px-4 rounded-xl transition-all"
                onClick={() => setCommissionConfig(DEFAULT_COMMISSION_CONFIG)}
                disabled={settingsLoading || savingCommission}
              >
                Đặt lại Mặc định
              </button>
              <button
                type="submit"
                disabled={settingsLoading || savingCommission}
                className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingCommission ? "Đang lưu..." : "Lưu cấu hình Hoa hồng"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "automation" && (
        <div className="space-y-4">
          {/* Tổng quan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-1.5 h-4 bg-cyan-900 rounded"></span> Tổng quan CRM Automation
              </h4>
              <button
                type="button"
                onClick={handleRunAutomationNow}
                disabled={automationLoading || runningAutomationNow}
                className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAutomationNow ? "Đang chạy..." : "Chạy kiểm tra ngay"}
              </button>
            </div>

            {automationLoading && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 mb-3">
                Đang tải số liệu CRM Automation...
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-slate-800">{automationStats.unassignedLeads}</div>
                <div className="text-[11px] text-slate-500 mt-1">Lead chưa có người phụ trách</div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-amber-700">{automationStats.staleLeads}</div>
                <div className="text-[11px] text-slate-500 mt-1">Lead im lặng quá hạn</div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-red-700">{automationStats.dueForAutoLost}</div>
                <div className="text-[11px] text-slate-500 mt-1">Sắp bị tự động đóng</div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-orange-700">{automationStats.recentDuplicates}</div>
                <div className="text-[11px] text-slate-500 mt-1">Lead trùng (7 ngày qua)</div>
              </div>
              <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-cyan-800">{automationStats.overduePendingCommissions}</div>
                <div className="text-[11px] text-slate-500 mt-1">Hoa hồng chờ đối soát quá hạn</div>
              </div>
            </div>
          </div>

          {/* Cấu hình quy tắc */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-cyan-900 rounded"></span> Cấu hình quy tắc tự động hoá (rule-based, không dùng AI)
            </h4>
            <p className="text-slate-500 text-xs mb-4">
              Tự động phân công, phát hiện trùng lặp, nhắc nhở chăm sóc khách hàng và đối soát hoa hồng theo các quy tắc và ngưỡng thời gian bên dưới.
            </p>

            <form onSubmit={handleSaveAutomation} className="space-y-3">
              {/* Công tắc tổng */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 mb-1">
                <div>
                  <label className="block font-bold text-xs text-slate-700 mr-2">Kích hoạt CRM Automation</label>
                  <span className="text-[11px] text-slate-500">Công tắc tổng - tắt sẽ dừng toàn bộ các automation bên dưới.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={automationConfig.enabled}
                    onChange={(e) => handleAutomationToggle("enabled", e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                </label>
              </div>

              {/* Tự động phân công */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-bold text-xs text-slate-700 mr-2">Tự động phân công nhân sự</label>
                  <span className="text-[11px] text-slate-500">Lead không có CTV giới thiệu sẽ được tự động gán cho nhân viên nội bộ theo vòng xoay công bằng (round-robin).</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={automationConfig.autoAssignEnabled}
                    onChange={(e) => handleAutomationToggle("autoAssignEnabled", e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                </label>
              </div>

              {/* Phát hiện trùng lặp */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1 pr-3">
                  <label className="block font-bold text-xs text-slate-700 mr-2">Phát hiện Lead trùng lặp</label>
                  <span className="text-[11px] text-slate-500">Cảnh báo khi 1 khách hàng (SĐT/email) gửi lead nhiều lần trong khoảng thời gian gần đây.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900"
                      value={automationConfig.duplicateWindowDays}
                      onChange={(e) => handleAutomationNumberChange("duplicateWindowDays", e.target.value)}
                      disabled={!automationConfig.duplicateDetectionEnabled}
                    />
                    <span className="text-[11px] text-slate-500">ngày</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={automationConfig.duplicateDetectionEnabled}
                      onChange={(e) => handleAutomationToggle("duplicateDetectionEnabled", e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                  </label>
                </div>
              </div>

              {/* Email xác nhận khách hàng */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-bold text-xs text-slate-700 mr-2">Email xác nhận tự động cho khách hàng</label>
                  <span className="text-[11px] text-slate-500">Gửi email cảm ơn/xác nhận ngay khi khách hàng gửi thông tin đăng ký tư vấn.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={automationConfig.welcomeEmailEnabled}
                    onChange={(e) => handleAutomationToggle("welcomeEmailEnabled", e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                </label>
              </div>

              {/* Thông báo nội bộ */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-bold text-xs text-slate-700 mr-2">Thông báo nội bộ khi có Lead mới</label>
                  <span className="text-[11px] text-slate-500">Gửi thông báo trong hệ thống + email cho người phụ trách và cấp quản lý.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={automationConfig.internalAlertEnabled}
                    onChange={(e) => handleAutomationToggle("internalAlertEnabled", e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                </label>
              </div>

              {/* Nhắc lead im lặng */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1 pr-3">
                  <label className="block font-bold text-xs text-slate-700 mr-2">Nhắc nhở Lead "im lặng"</label>
                  <span className="text-[11px] text-slate-500">Nhắc người phụ trách khi lead chưa được cập nhật trạng thái sau khoảng thời gian này.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900"
                      value={automationConfig.staleReminderHours}
                      onChange={(e) => handleAutomationNumberChange("staleReminderHours", e.target.value)}
                      disabled={!automationConfig.staleReminderEnabled}
                    />
                    <span className="text-[11px] text-slate-500">giờ</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={automationConfig.staleReminderEnabled}
                      onChange={(e) => handleAutomationToggle("staleReminderEnabled", e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                  </label>
                </div>
              </div>

              {/* Tự động đóng lead quá hạn */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1 pr-3">
                  <label className="block font-bold text-xs text-slate-700 mr-2">Tự động đóng Lead quá hạn</label>
                  <span className="text-[11px] text-slate-500">Tự động chuyển sang "Thất bại" nếu không có cập nhật sau khoảng thời gian này.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900"
                      value={automationConfig.autoLostDays}
                      onChange={(e) => handleAutomationNumberChange("autoLostDays", e.target.value)}
                      disabled={!automationConfig.autoLostEnabled}
                    />
                    <span className="text-[11px] text-slate-500">ngày</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={automationConfig.autoLostEnabled}
                      onChange={(e) => handleAutomationToggle("autoLostEnabled", e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                  </label>
                </div>
              </div>

              {/* Nhắc đối soát hoa hồng */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1 pr-3">
                  <label className="block font-bold text-xs text-slate-700 mr-2">Nhắc đối soát hoa hồng</label>
                  <span className="text-[11px] text-slate-500">Nhắc Admin/BGĐ khi có hoa hồng ở trạng thái "Chờ đối soát" quá lâu.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 text-center focus:outline-none focus:ring-2 focus:ring-cyan-900/10 focus:border-cyan-900"
                      value={automationConfig.commissionPendingReminderDays}
                      onChange={(e) => handleAutomationNumberChange("commissionPendingReminderDays", e.target.value)}
                      disabled={!automationConfig.commissionReminderEnabled}
                    />
                    <span className="text-[11px] text-slate-500">ngày</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={automationConfig.commissionReminderEnabled}
                      onChange={(e) => handleAutomationToggle("commissionReminderEnabled", e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                  </label>
                </div>
              </div>

              {/* Gợi ý thăng hạng CTV */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-bold text-xs text-slate-700 mr-2">Gợi ý thăng hạng Cộng tác viên</label>
                  <span className="text-[11px] text-slate-500">Hàng tháng, đề xuất cấp quản lý xem xét thăng hạng CTV đạt đủ chỉ tiêu (không tự động thay đổi cấp bậc/hoa hồng).</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={automationConfig.rankUpSuggestionEnabled}
                    onChange={(e) => handleAutomationToggle("rankUpSuggestionEnabled", e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-900"></div>
                </label>
              </div>

              {/* Save Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={automationLoading || savingAutomation}
                  className="bg-cyan-900 hover:bg-cyan-950 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAutomation ? "Đang lưu..." : "Lưu cấu hình CRM Automation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
