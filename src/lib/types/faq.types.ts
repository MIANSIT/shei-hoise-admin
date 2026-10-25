export interface Faq {
  id: string;
  question_en: string;
  answer_en: string;
  question_bn: string;
  answer_bn: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type FaqInput = Omit<Faq, "id" | "created_at" | "updated_at">;

/** Seed answers carry this marker where a fact still has to be confirmed. */
export const FAQ_PLACEHOLDER_MARKER = "[[PLACEHOLDER";

export function hasPlaceholder(faq: Pick<Faq, "question_en" | "answer_en" | "question_bn" | "answer_bn">) {
  return [faq.question_en, faq.answer_en, faq.question_bn, faq.answer_bn].some((t) =>
    t.includes(FAQ_PLACEHOLDER_MARKER)
  );
}
