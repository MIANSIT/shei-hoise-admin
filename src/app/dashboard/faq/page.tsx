"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import { Plus, Pencil, Trash2, HelpCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useSheiNotification } from "@/lib/hooks/useSheiNotification";
import { getFaqs } from "@/lib/queries/faq/getFaqs";
import { createFaq, updateFaq } from "@/lib/queries/faq/saveFaq";
import { deleteFaq } from "@/lib/queries/faq/deleteFaq";
import { Faq, FaqInput, hasPlaceholder } from "@/lib/types/faq.types";

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition";
const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1";

const emptyForm: FaqInput = {
  question_en: "",
  answer_en: "",
  question_bn: "",
  answer_bn: "",
  sort_order: 0,
  is_published: true,
};

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function FaqPage() {
  const { success, error: notifyError } = useSheiNotification();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState<FaqInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    const res = await getFaqs();
    if (res.success) setFaqs(res.data);
    else notifyError("Failed to load FAQs");
    setLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    const next = faqs.length ? Math.max(...faqs.map((f) => f.sort_order)) + 10 : 10;
    setEditing(null);
    setForm({ ...emptyForm, sort_order: next });
    setModalOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditing(faq);
    setForm({
      question_en: faq.question_en,
      answer_en: faq.answer_en,
      question_bn: faq.question_bn,
      answer_bn: faq.answer_bn,
      sort_order: faq.sort_order,
      is_published: faq.is_published,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.question_en.trim() || !form.answer_en.trim()) {
      notifyError("English question and answer are required");
      return;
    }
    setSaving(true);
    const payload: FaqInput = {
      ...form,
      question_en: form.question_en.trim(),
      answer_en: form.answer_en.trim(),
      question_bn: form.question_bn.trim(),
      answer_bn: form.answer_bn.trim(),
    };
    const res = editing ? await updateFaq(editing.id, payload) : await createFaq(payload);
    if (res.success) {
      success(editing ? "FAQ updated" : "FAQ created");
      closeModal();
      await fetchFaqs();
    } else {
      notifyError("Failed to save FAQ");
    }
    setSaving(false);
  };

  const handleTogglePublished = async (faq: Faq) => {
    const val = !faq.is_published;
    const res = await updateFaq(faq.id, { is_published: val });
    if (res.success) {
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? { ...f, is_published: val } : f)));
    } else {
      notifyError("Failed to update FAQ");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    const res = await deleteFaq(deleteConfirm);
    if (res.success) {
      success("FAQ deleted");
      setFaqs((prev) => prev.filter((f) => f.id !== deleteConfirm));
    } else {
      notifyError("Failed to delete FAQ");
    }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return faqs.filter(
      (f) =>
        !q ||
        f.question_en.toLowerCase().includes(q) ||
        f.answer_en.toLowerCase().includes(q) ||
        f.question_bn.includes(search) ||
        f.answer_bn.includes(search),
    );
  }, [faqs, search]);

  const published = faqs.filter((f) => f.is_published);
  const needsReview = faqs.filter(hasPlaceholder).length;
  const publishedWords = published.reduce(
    (sum, f) => sum + wordCount(f.question_en) + wordCount(f.answer_en),
    0,
  );

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="w-5 h-5 text-violet-600" />
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  FAQ
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Questions and answers shown on the public Shei Hoise landing page
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow transition"
            >
              <Plus className="w-4 h-4" />
              New FAQ
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", value: faqs.length, color: "text-slate-700 dark:text-slate-200" },
              { label: "Published", value: published.length, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Needs review", value: needsReview, color: "text-amber-600 dark:text-amber-400" },
              { label: "Published words (EN)", value: publishedWords, color: "text-blue-600 dark:text-blue-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-5 py-4"
              >
                <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <input
            className={`${inputCls} mb-5 py-2.5`}
            placeholder="Search questions and answers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* List */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-2xl bg-slate-200 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-white/[0.02] rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08]">
              <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                {search ? "No FAQs match your search" : "No FAQs yet"}
              </div>
              {!search && (
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Click “New FAQ” to create one
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((faq) => {
                const review = hasPlaceholder(faq);
                return (
                  <div
                    key={faq.id}
                    className="bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-6 py-5 hover:border-slate-300 dark:hover:border-white/[0.14] transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded">
                            #{faq.sort_order}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              faq.is_published
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {faq.is_published ? "Published" : "Draft"}
                          </span>
                          {review && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="w-3 h-3" />
                              Placeholder to fill
                            </span>
                          )}
                        </div>
                        <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {faq.question_en}
                        </div>
                        {faq.question_bn && (
                          <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                            {faq.question_bn}
                          </div>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                          {faq.answer_en}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          title={faq.is_published ? "Unpublish" : "Publish"}
                          onClick={() => handleTogglePublished(faq)}
                          className={`p-1.5 rounded-lg transition ${
                            faq.is_published
                              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                              : "text-slate-400 hover:text-emerald-600"
                          }`}
                        >
                          {faq.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(faq)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-violet-50 dark:hover:bg-violet-500/10 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 text-xs font-medium transition"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(faq.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 text-xs font-medium transition"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSave}
        okText={saving ? "Saving…" : editing ? "Save changes" : "Create FAQ"}
        okButtonProps={{ loading: saving }}
        cancelText="Cancel"
        title={editing ? "Edit FAQ" : "New FAQ"}
        width={680}
        destroyOnHidden
      >
        <div className="flex flex-col gap-4 pt-2">
          <div>
            <label className={labelCls}>Question (English) *</label>
            <input
              className={inputCls}
              value={form.question_en}
              onChange={(e) => setForm({ ...form, question_en: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Answer (English) *</label>
            <textarea
              rows={5}
              className={inputCls}
              value={form.answer_en}
              onChange={(e) => setForm({ ...form, answer_en: e.target.value })}
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {wordCount(form.answer_en)} words · plain text, shown as-is on the landing page
            </div>
          </div>
          <div>
            <label className={labelCls}>প্রশ্ন (বাংলা)</label>
            <input
              className={inputCls}
              value={form.question_bn}
              onChange={(e) => setForm({ ...form, question_bn: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>উত্তর (বাংলা)</label>
            <textarea
              rows={5}
              className={inputCls}
              value={form.answer_bn}
              onChange={(e) => setForm({ ...form, answer_bn: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div className="w-32">
              <label className={labelCls}>Sort order</label>
              <input
                type="number"
                className={inputCls}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 pb-2">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              Published (visible to the public)
            </label>
          </div>
          {hasPlaceholder(form) && (
            <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-3 py-2">
              This text still contains a [[PLACEHOLDER …]] marker. Replace it with the confirmed
              fact before publishing.
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onOk={handleDelete}
        okText={deleting ? "Deleting…" : "Delete"}
        okButtonProps={{ danger: true, loading: deleting }}
        cancelText="Cancel"
        title="Delete FAQ"
        width={400}
      >
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Are you sure you want to delete this FAQ? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
}
