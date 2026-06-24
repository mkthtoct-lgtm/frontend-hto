import { useEffect, useMemo, useRef, useState } from "react";

const CHAT_STORAGE_KEY = "hto_ai_chat_sessions";

const defaultSources = [
  {
    title: "Tài liệu & Biểu mẫu",
    detail: "Kho tài liệu nội bộ trong portal",
    type: "Portal",
  },
  {
    title: "Sản phẩm HTO",
    detail: "Thông tin chương trình, chi phí và quy trình đang cấu hình",
    type: "CRM",
  },
  {
    title: "Nghiệp vụ kế toán",
    detail: "Dữ liệu kế toán chỉ khả dụng khi đã đồng bộ và đối soát",
    type: "Kế toán",
  },
];

const createAssistantReply = (question) => {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("hoa hồng") || normalizedQuestion.includes("kế toán")) {
    return {
      content:
        "Hoa hồng dự kiến phụ thuộc vào hồ sơ CRM và khoản thu đã được kế toán xác nhận. Nếu chưa có dữ liệu đối soát, hệ thống chỉ hiển thị trạng thái chờ dữ liệu và không dùng để chốt chi trả.",
      sources: [defaultSources[1], defaultSources[2]],
    };
  }

  if (normalizedQuestion.includes("tài liệu") || normalizedQuestion.includes("biểu mẫu") || normalizedQuestion.includes("hồ sơ")) {
    return {
      content:
        "Bạn có thể kiểm tra kho Tài liệu & Biểu mẫu để xem file nội bộ, link được cấp quyền và trạng thái nguồn AI. Với hồ sơ sản phẩm, nên đối chiếu thêm điều kiện, chi phí và quy trình trong mục Sản phẩm.",
      sources: [defaultSources[0], defaultSources[1]],
    };
  }

  return {
    content:
      "Mình đã ghi nhận câu hỏi của bạn. Khi API AI được kết nối, câu trả lời sẽ được sinh từ dữ liệu portal như CRM, tài liệu nội bộ, sản phẩm và kế toán. Bản demo hiện mô phỏng luồng chat, loading, lịch sử phiên và nguồn tham chiếu.",
    sources: defaultSources,
  };
};

const createMessage = (role, content, sources = []) => ({
  id: `message-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  sources,
  createdAt: new Date().toISOString(),
});

const createSession = () => ({
  id: `session-${Date.now()}`,
  title: "Phiên chat mới",
  updatedAt: new Date().toISOString(),
  messages: [
    createMessage(
      "assistant",
      "Chào bạn, mình là AI nội bộ HTO. Bạn có thể hỏi về tài liệu, sản phẩm, CRM, kế toán hoặc quy trình trong portal.",
      [defaultSources[0]],
    ),
  ],
});

const readSessions = () => {
  try {
    const storedValue = window.localStorage.getItem(CHAT_STORAGE_KEY);
    const parsedSessions = storedValue ? JSON.parse(storedValue) : null;

    if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
      return parsedSessions;
    }
  } catch {
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  }

  const initialSessions = [createSession()];

  writeSessions(initialSessions);
  return initialSessions;
};

const writeSessions = (sessions) => {
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
};

const formatChatTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

export function AiChatPage({ currentUser, isOpen: controlledIsOpen, onOpenChange }) {
  const [sessions, setSessions] = useState(() => readSessions());
  const [activeSessionId, setActiveSessionId] = useState(() => readSessions()[0]?.id);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesScrollRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const isOpen = typeof controlledIsOpen === "boolean" ? controlledIsOpen : uncontrolledIsOpen;

  // Trạng thái bật/tắt chatbot từ Cấu hình hệ thống
  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem("hto_chat_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.enabled === "boolean") return parsed.enabled;
      }
    } catch (e) {}
    return true;
  });

  useEffect(() => {
    const checkEnabled = () => {
      try {
        const stored = localStorage.getItem("hto_chat_config");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed.enabled === "boolean") {
            setIsEnabled(parsed.enabled);
            return;
          }
        }
      } catch (e) {}
      setIsEnabled(true);
    };

    checkEnabled();
    window.addEventListener("storage", checkEnabled);
    window.addEventListener("hto:chat_config_updated", checkEnabled);

    return () => {
      window.removeEventListener("storage", checkEnabled);
      window.removeEventListener("hto:chat_config_updated", checkEnabled);
    };
  }, []);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [activeSessionId, sessions],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const scrollElement = messagesScrollRef.current;

    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [activeSession?.messages.length, activeSessionId, isLoading, isOpen]);

  useEffect(() => {
    return () => {
      window.clearTimeout(pendingTimerRef.current);
    };
  }, []);

  const setChatOpen = (nextIsOpen) => {
    if (typeof controlledIsOpen !== "boolean") {
      setUncontrolledIsOpen(nextIsOpen);
    }

    onOpenChange?.(nextIsOpen);
  };

  const persistSessions = (nextSessions) => {
    setSessions(nextSessions);
    writeSessions(nextSessions);
  };

  const startNewSession = () => {
    const nextSession = createSession();
    const nextSessions = [nextSession, ...sessions];

    persistSessions(nextSessions);
    setActiveSessionId(nextSession.id);
    setQuestion("");
  };

  const updateActiveSession = (updater) => {
    const nextSessions = sessions.map((session) =>
      session.id === activeSession.id ? updater(session) : session,
    );

    persistSessions(nextSessions);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    const userMessage = createMessage("user", trimmedQuestion);
    const nextTitle = activeSession.messages.length <= 1 ? trimmedQuestion.slice(0, 48) : activeSession.title;

    updateActiveSession((session) => ({
      ...session,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
      messages: [...session.messages, userMessage],
    }));
    setQuestion("");
    setIsLoading(true);

    window.clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = window.setTimeout(() => {
      const reply = createAssistantReply(trimmedQuestion);
      const assistantMessage = createMessage("assistant", reply.content, reply.sources);

      setSessions((currentSessions) => {
        const nextSessions = currentSessions.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                updatedAt: new Date().toISOString(),
                messages: [...session.messages, assistantMessage],
              }
            : session,
        );

        writeSessions(nextSessions);
        return nextSessions;
      });
      setIsLoading(false);
    }, 850);
  };

  const deleteSession = (sessionId) => {
    const nextSessions = sessions.filter((session) => session.id !== sessionId);
    const safeSessions = nextSessions.length > 0 ? nextSessions : [createSession()];

    persistSessions(safeSessions);

    if (activeSessionId === sessionId) {
      setActiveSessionId(safeSessions[0].id);
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="ai-chat-widget">
      {isOpen && (
        <div className={`ai-chat-popover${isHistoryOpen ? " ai-chat-history-active" : ""}`}>
          {isHistoryOpen && (
            <section className="ai-chat-history rounded-lg border bg-[var(--bs-body-bg)] shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-2 p-3 pb-2">
                <h6 className="fw-bold text-body-emphasis mb-0">Lịch sử</h6>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-body-secondary text-body">{sessions.length}</span>
                  <button
                    className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center ai-chat-history-close"
                    type="button"
                    onClick={() => setIsHistoryOpen(false)}
                    title="Đóng lịch sử"
                    aria-label="Đóng lịch sử"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
              <div className="grid min-h-0 content-start gap-2 overflow-y-auto overscroll-contain p-2 pt-0">
                {sessions.map((session) => {
                  const isActive = session.id === activeSession?.id;

                  return (
                    <button
                      className={`btn text-start border d-flex gap-2 align-items-start ${isActive ? "btn-primary" : "btn-light"}`}
                      key={session.id}
                      type="button"
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setIsHistoryOpen(false);
                      }}
                      style={{ borderRadius: "8px" }}
                    >
                      <span className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: "28px", height: "28px", backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "var(--bs-body-bg)" }}>
                        <ChatIcon />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span className="fw-semibold d-block text-truncate" style={{ fontSize: "13px" }}>
                          {session.title}
                        </span>
                        <span className={isActive ? "text-white-50" : "text-body-secondary"} style={{ fontSize: "11px" }}>
                          {formatChatTime(session.updatedAt)}
                        </span>
                      </span>
                      <span
                        className="d-inline-flex align-items-center justify-content-center rounded-circle"
                        role="button"
                        tabIndex={0}
                        title="Xóa phiên"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteSession(session.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.stopPropagation();
                            deleteSession(session.id);
                          }
                        }}
                        style={{ width: "24px", height: "24px" }}
                      >
                        <TrashMiniIcon />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="ai-chat-panel">
            <ChatConversationPanel
              currentUser={currentUser}
              isHistoryOpen={isHistoryOpen}
              isLoading={isLoading}
              messages={activeSession?.messages || []}
              messagesScrollRef={messagesScrollRef}
              onClose={() => setChatOpen(false)}
              onHistoryToggle={() => setIsHistoryOpen((currentValue) => !currentValue)}
              onNewSession={startNewSession}
              onQuestionChange={setQuestion}
              onSubmit={handleSubmit}
              question={question}
              title={activeSession?.title || "Phiên chat"}
            />
          </section>
        </div>
      )}

      <button
        className="ai-chat-toggle btn btn-primary d-inline-flex align-items-center justify-content-center shadow-lg"
        type="button"
        onClick={() => setChatOpen(!isOpen)}
        title={isOpen ? "Đóng AI chat" : "Mở AI chat"}
        aria-label={isOpen ? "Đóng AI chat" : "Mở AI chat"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <CloseIcon />
        ) : (
          <img
            className="ai-chat-toggle-image"
            src="/assets/images/hito_4.png"
            alt="AI hỗ trợ"
          />
        )}
      </button>
    </div>
  );
}

function ChatConversationPanel({
  currentUser,
  isHistoryOpen,
  isLoading,
  messages,
  messagesScrollRef,
  onClose,
  onHistoryToggle,
  onNewSession,
  onQuestionChange,
  onSubmit,
  question,
  title,
}) {
  return (
    <article className="grid h-full min-h-0 w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-lg border bg-[var(--bs-body-bg)] shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
      <header className="flex items-start justify-between gap-2 border-bottom bg-transparent p-3">
        <div style={{ minWidth: 0 }}>
          <h6 className="fw-bold text-body-emphasis mb-1">{title}</h6>
          <div className="text-body-secondary" style={{ fontSize: "12px" }}>
            {currentUser?.fullName || currentUser?.name || currentUser?.email || "Người dùng portal"}
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <button
            className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center"
            type="button"
            onClick={onHistoryToggle}
            title={isHistoryOpen ? "Ẩn lịch sử chat" : "Hiện lịch sử chat"}
            aria-label={isHistoryOpen ? "Ẩn lịch sử chat" : "Hiện lịch sử chat"}
          >
            <MenuIcon />
          </button>
          <button
            className="btn btn-sm btn-primary d-inline-flex align-items-center justify-content-center"
            type="button"
            onClick={onNewSession}
            title="Chat mới"
            aria-label="Chat mới"
          >
            <PlusMiniIcon />
          </button>
          <button
            className="btn btn-sm btn-light border d-inline-flex align-items-center justify-content-center"
            type="button"
            onClick={onClose}
            title="Đóng"
            aria-label="Đóng"
          >
            <CloseIcon />
          </button>
        </div>
      </header>

      <main className="min-h-0 overflow-hidden p-3">
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pe-1" ref={messagesScrollRef}>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="d-flex justify-content-start">
              <div className="rounded bg-body-tertiary border p-3" style={{ maxWidth: "720px" }}>
                <div className="d-flex align-items-center gap-2 text-body-secondary" style={{ fontSize: "13px" }}>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                  AI đang tìm trong portal và tổng hợp nguồn...
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="flex-shrink-0 border-0 bg-[var(--bs-body-bg)] p-3 shadow-[0_-8px_18px_rgba(15,23,42,0.04)]">
        <form className="flex gap-2" onSubmit={onSubmit}>
          <input
            className="form-control"
            placeholder="Nhập câu hỏi cho AI..."
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
          />
          <button className="btn btn-primary shrink-0 d-inline-flex align-items-center justify-content-center" type="submit" disabled={isLoading || !question.trim()} title="Gửi" aria-label="Gửi">
            <SendIcon />
          </button>
        </form>
      </footer>
    </article>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`d-flex ${isUser ? "justify-content-end" : "justify-content-start"}`}>
      <div className={`rounded p-3 ${isUser ? "bg-primary text-white" : "bg-body-tertiary border"}`} style={{ maxWidth: "760px" }}>
        <div style={{ fontSize: "13px", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{message.content}</div>
        <div className={isUser ? "text-white-50 mt-2" : "text-body-secondary mt-2"} style={{ fontSize: "11px" }}>
          {formatChatTime(message.createdAt)}
        </div>

        {!isUser && message.sources?.length > 0 && (
          <div className="mt-3 d-grid gap-2">
            <div className="fw-semibold text-body-emphasis" style={{ fontSize: "12px" }}>
              Source
            </div>
            {message.sources.map((source) => (
              <div className="rounded bg-body border p-2" key={`${message.id}-${source.title}`}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <div className="fw-semibold text-body-emphasis" style={{ fontSize: "12px" }}>{source.title}</div>
                    <div className="text-body-secondary" style={{ fontSize: "11px", lineHeight: 1.4 }}>{source.detail}</div>
                  </div>
                  <span className="badge bg-primary-subtle text-primary flex-shrink-0">{source.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>
    </svg>
  );
}

function TrashMiniIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"></path>
      <path d="M8 6V4h8v2"></path>
      <path d="M19 6l-1 14H6L5 6"></path>
    </svg>
  );
}

function PlusMiniIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14"></path>
      <path d="M5 12h14"></path>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"></path>
      <path d="M3 12h18"></path>
      <path d="M3 18h18"></path>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"></path>
      <path d="M22 2 11 13"></path>
    </svg>
  );
}
