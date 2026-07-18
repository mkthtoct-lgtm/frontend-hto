import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

export const PublicSurveyPage = ({ surveyId }) => {
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customerName: "", phone: "", email: "", answers: {} });
  const ctvCode = new URLSearchParams(window.location.search).get("ctv") || "";

  useEffect(() => {
    fetch(`${API_BASE_URL}/surveys/public/${surveyId}`)
      .then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => null) }))
      .then(({ ok, json }) => {
        if (!ok) throw new Error(json?.message || "Không tìm thấy khảo sát.");
        setSurvey(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [surveyId]);

  const setAnswer = (id, value) => setForm((current) => ({ ...current, answers: { ...current.answers, [id]: value } }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/surveys/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, surveyId, surveyTitle: survey.title, ctvCode }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Không thể gửi khảo sát.");
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50">Đang tải khảo sát...</div>;
  if (!survey) return <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center text-rose-600">{error}</div>;
  if (sent) return <div className="grid min-h-screen place-items-center bg-slate-50 px-4"><div className="rounded-2xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-black text-emerald-600">Gửi khảo sát thành công</h1><p className="mt-2 text-slate-500">Cảm ơn bạn đã cung cấp thông tin.</p></div></div>;

  return <main className="min-h-screen bg-slate-50 px-3 py-8 text-slate-900">
    <form onSubmit={submit} className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-8">
      <img src="/assets/images/logo-HTO.png" className="mb-5 h-12 object-contain" alt="HTO" />
      <h1 className="text-2xl font-black">{survey.title}</h1>
      {survey.description && <p className="mt-2 text-sm text-slate-500">{survey.description}</p>}
      {ctvCode && <div className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">Mã cộng tác viên: {ctvCode}</div>}
      {error && <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <div className="mt-6 space-y-5">
        <label className="block text-sm font-bold">Họ và tên *<input required className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
        <label className="block text-sm font-bold">Số điện thoại *<input required className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label className="block text-sm font-bold">Email<input type="email" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        {(survey.questions || []).map((question) => <label key={question._id} className="block text-sm font-bold">{question.label}{question.required ? " *" : ""}
          {question.type === "textarea" ? <textarea required={question.required} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" value={form.answers[question._id] || ""} onChange={(e) => setAnswer(question._id, e.target.value)} /> : question.type === "select" || question.type === "radio" ? <select required={question.required} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" value={form.answers[question._id] || ""} onChange={(e) => setAnswer(question._id, e.target.value)}><option value="">-- Chọn --</option>{question.options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input required={question.required} className="mt-1.5 w-full rounded-xl border px-3 py-2.5 font-normal" value={form.answers[question._id] || ""} onChange={(e) => setAnswer(question._id, e.target.value)} />}
        </label>)}
      </div>
      <button disabled={submitting} className="mt-7 w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-50">{submitting ? "Đang gửi..." : "Gửi khảo sát"}</button>
    </form>
  </main>;
};
