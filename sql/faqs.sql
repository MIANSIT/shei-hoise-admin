-- Run this once in Supabase Studio → SQL Editor against the project database.
--
-- Creates public.faqs, the question/answer content managed from
-- /dashboard/faq in this admin panel and rendered server-side on the public
-- Shei Hoise landing page (for SEO the text must be in the initial HTML).
--
-- Access model:
--   * anon / authenticated: SELECT only rows where is_published = true
--   * super_admin:          full read/write (policies below)
--   The admin panel itself writes through the service-role key, which bypasses
--   RLS; the write policies are the second line of defence for any other path.
--
-- The super-admin check mirrors the rest of the panel: public.users.user_type
-- = 'super_admin' for the signed-in user (see sql/super_admin_access.sql, whose
-- "users_select_own_row" policy is what lets this subquery see the caller's row).
--
-- Seed rows that still contain a [[PLACEHOLDER ...]] marker are inserted with
-- is_published = false so unverified text never reaches crawlers. Fill them in
-- from the admin panel, then publish.
--
-- Re-running this script is safe (seed only runs while the table is empty).

CREATE TABLE IF NOT EXISTS public.faqs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en  text NOT NULL,
  answer_en    text NOT NULL,
  question_bn  text NOT NULL DEFAULT '',
  answer_bn    text NOT NULL DEFAULT '',
  sort_order   integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS faqs_published_sort_idx
  ON public.faqs (is_published, sort_order);

CREATE OR REPLACE FUNCTION public.faqs_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS faqs_set_updated_at ON public.faqs;
CREATE TRIGGER faqs_set_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.faqs_set_updated_at();

-- RLS --------------------------------------------------------------------

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faqs_select_published" ON public.faqs;
CREATE POLICY "faqs_select_published"
  ON public.faqs
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "faqs_select_superadmin" ON public.faqs;
CREATE POLICY "faqs_select_superadmin"
  ON public.faqs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.user_type = 'super_admin'
  ));

DROP POLICY IF EXISTS "faqs_insert_superadmin" ON public.faqs;
CREATE POLICY "faqs_insert_superadmin"
  ON public.faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.user_type = 'super_admin'
  ));

DROP POLICY IF EXISTS "faqs_update_superadmin" ON public.faqs;
CREATE POLICY "faqs_update_superadmin"
  ON public.faqs
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.user_type = 'super_admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.user_type = 'super_admin'
  ));

DROP POLICY IF EXISTS "faqs_delete_superadmin" ON public.faqs;
CREATE POLICY "faqs_delete_superadmin"
  ON public.faqs
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.user_type = 'super_admin'
  ));

-- Seed -------------------------------------------------------------------
-- Verified against the admin code: 7-day trial (TRIAL_DAYS), billing cycles
-- (monthly / 6 months / yearly / custom), BDT currency, bKash / Nagad / bank
-- transfer for subscription payments, WhatsApp renewal reminders, plan
-- feature + limit lists, Inside/Outside Dhaka shipping fees, return window.
-- NOT verifiable in code (left as [[PLACEHOLDER ...]], unpublished): plan
-- prices, grace period, what the storefront does on lapse, customer checkout
-- payment methods, custom-domain setup steps, order status workflow.

INSERT INTO public.faqs
  (question_en, answer_en, question_bn, answer_bn, sort_order, is_published)
SELECT * FROM (VALUES
  (
    'How do I start an online store with Shei Hoise?',
    'Getting started is simple. The Shei Hoise team creates your store account for you: you share your store name, the web address (slug) you want, your contact details, your currency and your delivery fees, and we set everything up. Your store begins with a free trial, so you can add products and see how it works before you pay anything. You can reach the team through the contact form on sheihoise.com, by email at sheihoise.bd@gmail.com, or by phone and WhatsApp on 01349005099. [[PLACEHOLDER: confirm whether stores can also be created by self-signup, and add the signup link if so]]',
    'শেই হইসে কীভাবে অনলাইন স্টোর শুরু করব?',
    'শুরু করা খুব সহজ। শেই হইসের টিম আপনার জন্য স্টোর অ্যাকাউন্ট তৈরি করে দেয়: আপনি স্টোরের নাম, পছন্দের ওয়েব ঠিকানা (স্লাগ), যোগাযোগের তথ্য, মুদ্রা এবং ডেলিভারি ফি জানালেই আমরা সবকিছু সেটআপ করে দিই। আপনার স্টোর শুরু হয় ফ্রি ট্রায়াল দিয়ে, তাই কোনো টাকা দেওয়ার আগেই পণ্য যোগ করে সবকিছু দেখে নিতে পারবেন। sheihoise.com-এর যোগাযোগ ফর্ম, sheihoise.bd@gmail.com ইমেইল অথবা ০১৩৪৯০০৫০৯৯ নম্বরে ফোন ও হোয়াটসঅ্যাপে আমাদের টিমের সঙ্গে যোগাযোগ করতে পারেন। [[PLACEHOLDER: নিজে নিজে সাইনআপ করে স্টোর খোলা যায় কিনা নিশ্চিত করুন, যায় হলে সাইনআপ লিংক যোগ করুন]]',
    10, false
  ),
  (
    'How much does Shei Hoise cost?',
    'Shei Hoise works on subscription plans, and every price is shown in Bangladeshi Taka (BDT). Each plan can be paid monthly, every six months or yearly, and a custom number of months can be arranged with our team. The longer billing periods can carry a discount compared with paying month by month. Plans differ in the features they include and in limits such as the number of products, orders per month, staff accounts, branches and brands, so you only pay for what your business needs. [[PLACEHOLDER: add the current monthly, 6-month and yearly price of each public plan — prices are stored in the database, not in code, so they could not be verified]]',
    'শেই হইসের খরচ কত?',
    'শেই হইস সাবস্ক্রিপশন প্ল্যানে চলে এবং সব মূল্য বাংলাদেশি টাকায় (BDT) দেখানো হয়। প্রতিটি প্ল্যান মাসিক, ছয় মাসিক অথবা বার্ষিকভাবে পরিশোধ করা যায়, আর নিজের পছন্দমতো মাস সংখ্যার জন্য আমাদের টিমের সঙ্গে কথা বলে ব্যবস্থা করা যায়। মাসে মাসে দেওয়ার তুলনায় দীর্ঘ মেয়াদে ছাড় থাকতে পারে। প্ল্যানভেদে ফিচার এবং সীমা (যেমন পণ্যের সংখ্যা, মাসিক অর্ডার, স্টাফ অ্যাকাউন্ট, শাখা ও ব্র্যান্ড) আলাদা হয়, তাই আপনার ব্যবসার যতটুকু দরকার ততটুকুই দেবেন। [[PLACEHOLDER: প্রতিটি পাবলিক প্ল্যানের বর্তমান মাসিক, ৬ মাসিক ও বার্ষিক মূল্য যোগ করুন — মূল্য ডাটাবেসে থাকে, কোডে নয়, তাই যাচাই করা যায়নি]]',
    20, false
  ),
  (
    'Is there a free trial?',
    'Yes. Every new store starts with a 7-day free trial that begins on the day the store is created. During the trial you can set up your store, add products and explore the features. As the trial nears its end we remind you on WhatsApp so your store is not interrupted. To keep selling, choose a plan from the My Plan section of your store admin panel and follow the steps to pay. If you need help picking the right plan, just reply to our message or contact the team and we will guide you.',
    'ফ্রি ট্রায়াল আছে কি?',
    'হ্যাঁ। প্রতিটি নতুন স্টোর স্টোর তৈরির দিন থেকে ৭ দিনের ফ্রি ট্রায়াল দিয়ে শুরু হয়। ট্রায়ালের সময় আপনি স্টোর সাজাতে, পণ্য যোগ করতে এবং সব ফিচার ঘুরে দেখতে পারবেন। ট্রায়াল শেষ হওয়ার আগে আমরা হোয়াটসঅ্যাপে আপনাকে মনে করিয়ে দিই, যাতে আপনার স্টোর বন্ধ না হয়ে যায়। বিক্রি চালিয়ে যেতে স্টোর অ্যাডমিন প্যানেলের "My Plan" অংশ থেকে একটি প্ল্যান বেছে নিয়ে পেমেন্টের ধাপগুলো অনুসরণ করুন। কোন প্ল্যান ঠিক হবে বুঝতে সমস্যা হলে আমাদের বার্তায় রিপ্লাই দিন বা টিমের সঙ্গে যোগাযোগ করুন, আমরা সাহায্য করব।',
    30, true
  ),
  (
    'How do payments and delivery work?',
    'There are two sides to this. For your Shei Hoise subscription, you pay by bKash or Nagad Send Money, or by bank transfer, and you send us the transaction ID or receipt with your invoice number. We then confirm the payment and email you a receipt. For delivery from your own store, you set your delivery fees for Inside Dhaka and Outside Dhaka and choose how many days customers have to return a product after delivery, with zero meaning no returns. Plans that include courier tracking let you follow your parcels. [[PLACEHOLDER: list the payment methods your customers can use at checkout (for example cash on delivery, bKash, Nagad) and the courier partners — these live in the storefront and could not be verified here]]',
    'পেমেন্ট ও ডেলিভারি কীভাবে কাজ করে?',
    'এখানে দুটি দিক আছে। শেই হইস সাবস্ক্রিপশনের জন্য আপনি বিকাশ বা নগদে সেন্ড মানি অথবা ব্যাংক ট্রান্সফারের মাধ্যমে পেমেন্ট করেন এবং ইনভয়েস নম্বরসহ ট্রান্জাকশন আইডি বা রসিদ আমাদের পাঠান। আমরা পেমেন্ট নিশ্চিত করে আপনাকে ইমেইলে রসিদ পাঠাই। আপনার নিজের স্টোরের ডেলিভারির জন্য ঢাকার ভেতরে ও ঢাকার বাইরে আলাদা ডেলিভারি ফি ঠিক করতে পারেন এবং ডেলিভারির পর কত দিন পর্যন্ত গ্রাহক পণ্য ফেরত দিতে পারবেন তা নির্ধারণ করতে পারেন (০ মানে ফেরত নেই)। কুরিয়ার ট্র্যাকিং-সহ প্ল্যানে আপনি পার্সেলের অবস্থা অনুসরণ করতে পারবেন। [[PLACEHOLDER: গ্রাহকরা চেকআউটে কোন কোন পেমেন্ট পদ্ধতি (যেমন ক্যাশ অন ডেলিভারি, বিকাশ, নগদ) ব্যবহার করতে পারে এবং কোন কুরিয়ার পার্টনার আছে তা যোগ করুন — এগুলো স্টোরফ্রন্টে থাকে, এখানে যাচাই করা যায়নি]]',
    40, false
  ),
  (
    'Can I use my own custom domain?',
    'Custom domain support is a plan feature, so whether you can connect your own web address depends on the plan you choose. Every store also gets its own store address based on the slug you pick when the store is created. Check the feature list of each plan, or ask the team, to see which plans include a custom domain. [[PLACEHOLDER: add the steps to connect a custom domain (DNS records to set, how long it takes, who does it) — not present in the admin code]]',
    'আমি কি নিজের কাস্টম ডোমেইন ব্যবহার করতে পারব?',
    'কাস্টম ডোমেইন একটি প্ল্যান ফিচার, তাই নিজের ওয়েব ঠিকানা যুক্ত করা যাবে কিনা তা আপনার বেছে নেওয়া প্ল্যানের ওপর নির্ভর করে। স্টোর তৈরির সময় আপনি যে স্লাগ বেছে নেন তার ভিত্তিতে প্রতিটি স্টোর নিজস্ব একটি স্টোর ঠিকানাও পায়। কোন প্ল্যানে কাস্টম ডোমেইন আছে তা জানতে প্রতিটি প্ল্যানের ফিচার তালিকা দেখুন বা আমাদের টিমকে জিজ্ঞেস করুন। [[PLACEHOLDER: কাস্টম ডোমেইন যুক্ত করার ধাপ (কোন DNS রেকর্ড দিতে হবে, কত সময় লাগে, কে করে দেয়) যোগ করুন — অ্যাডমিন কোডে নেই]]',
    50, false
  ),
  (
    'What happens if my subscription expires?',
    'We remind you before your subscription ends. Reminders go out on WhatsApp with your plan, the end date and the renewal amount, and you can renew by bKash, Nagad or bank transfer; the same message tells you how to pay. Invoices are issued with a due date, which is 7 days after the invoice is created. Once you pay, we confirm it and email you a receipt, and your new billing period is recorded. [[PLACEHOLDER: state the grace period (if any) and exactly what happens to the live store, products and orders after a subscription lapses — no grace period or lapse behaviour was found in the admin code, so this must come from the owner]]',
    'সাবস্ক্রিপশন শেষ হয়ে গেলে কী হবে?',
    'সাবস্ক্রিপশন শেষ হওয়ার আগে আমরা আপনাকে মনে করিয়ে দিই। হোয়াটসঅ্যাপ রিমাইন্ডারে আপনার প্ল্যান, শেষ হওয়ার তারিখ ও নবায়নের পরিমাণ জানানো হয়, এবং একই বার্তায় কীভাবে পেমেন্ট করবেন তা বলা থাকে। আপনি বিকাশ, নগদ বা ব্যাংক ট্রান্সফারে নবায়ন করতে পারেন। ইনভয়েস তৈরির ৭ দিন পরের তারিখ পরিশোধের শেষ তারিখ হিসেবে দেওয়া হয়। পেমেন্ট করলে আমরা তা নিশ্চিত করে ইমেইলে রসিদ পাঠাই এবং আপনার নতুন বিলিং মেয়াদ রেকর্ড হয়। [[PLACEHOLDER: গ্রেস পিরিয়ড (থাকলে) এবং সাবস্ক্রিপশন শেষ হলে লাইভ স্টোর, পণ্য ও অর্ডারের কী হয় তা লিখুন — অ্যাডমিন কোডে গ্রেস পিরিয়ড বা মেয়াদ শেষের আচরণ পাওয়া যায়নি, তাই মালিকের কাছ থেকে নিশ্চিত হতে হবে]]',
    60, false
  ),
  (
    'How do I manage my orders?',
    'You manage your store from one admin panel. Depending on your plan, you get tools for the whole selling process: point of sale (POS), bulk product import, courier tracking, vendor flow, expense tracking, profit and loss reports, analytics and advanced reports, plus data exports. Plans also set limits such as how many orders you can take each month, so pick a plan that matches your volume. You can add staff accounts on plans that include them, so your team can handle orders with you. [[PLACEHOLDER: describe the order statuses a store owner moves an order through (for example pending, confirmed, shipped, delivered) — the order workflow lives in the store admin, not in this codebase]]',
    'আমি কীভাবে অর্ডার পরিচালনা করব?',
    'একটি অ্যাডমিন প্যানেল থেকেই আপনি আপনার স্টোর পরিচালনা করেন। প্ল্যান অনুযায়ী বিক্রির পুরো প্রক্রিয়ার জন্য টুল পাবেন: পয়েন্ট অব সেল (POS), বাল্ক পণ্য ইমপোর্ট, কুরিয়ার ট্র্যাকিং, ভেন্ডর ফ্লো, খরচের হিসাব, লাভ-ক্ষতির রিপোর্ট, অ্যানালিটিক্স ও অ্যাডভান্সড রিপোর্ট এবং ডেটা এক্সপোর্ট। প্ল্যানে মাসে কতগুলো অর্ডার নেওয়া যাবে এমন সীমাও থাকে, তাই আপনার অর্ডারের পরিমাণ অনুযায়ী প্ল্যান বেছে নিন। যে প্ল্যানে স্টাফ অ্যাকাউন্ট আছে সেখানে আপনার টিমকেও অর্ডার সামলাতে যুক্ত করতে পারবেন। [[PLACEHOLDER: স্টোর মালিক অর্ডারকে কোন কোন স্ট্যাটাসের মধ্য দিয়ে নেন (যেমন পেন্ডিং, কনফার্মড, শিপড, ডেলিভার্ড) তা লিখুন — অর্ডার ওয়ার্কফ্লো স্টোর অ্যাডমিনে আছে, এই কোডবেসে নয়]]',
    70, false
  ),
  (
    'Do I need technical skills to run my store?',
    'No coding is needed. Your store is set up through simple forms: your store details, contact information, currency, delivery fees and terms. After that you work from a visual admin panel to add products, set prices and manage your business, and the Shei Hoise team is available if you get stuck. Plans can also include storefront design and custom store design options, so you can shape how your store looks. [[PLACEHOLDER: confirm that product management needs no technical skills, and mention any onboarding or training you offer — not verifiable from the admin code]]',
    'স্টোর চালাতে কি প্রযুক্তিগত দক্ষতা লাগে?',
    'কোনো কোডিং জানা লাগে না। সহজ ফর্মের মাধ্যমে আপনার স্টোর সেটআপ হয়: স্টোরের তথ্য, যোগাযোগের তথ্য, মুদ্রা, ডেলিভারি ফি ও শর্তাবলি। এরপর একটি ভিজ্যুয়াল অ্যাডমিন প্যানেল থেকে পণ্য যোগ, দাম ঠিক এবং ব্যবসা পরিচালনা করেন, আর কোথাও আটকে গেলে শেই হইস টিম আপনার পাশে আছে। কিছু প্ল্যানে স্টোরফ্রন্ট ডিজাইন ও কাস্টম স্টোর ডিজাইনের সুযোগও থাকে, যাতে আপনার স্টোর কেমন দেখাবে তা নিজের মতো সাজাতে পারেন। [[PLACEHOLDER: পণ্য ব্যবস্থাপনায় কোনো প্রযুক্তিগত দক্ষতা লাগে না তা নিশ্চিত করুন এবং কোনো অনবোর্ডিং বা প্রশিক্ষণ থাকলে উল্লেখ করুন — অ্যাডমিন কোড থেকে যাচাই করা যায়নি]]',
    80, false
  ),
  (
    'What features and limits do the plans include?',
    'Plans are built from a set of features and limits, so you can compare them side by side. Features include POS, analytics, custom domain, priority support, API access, bulk import, SEO tools, advanced reports, Meta Pixel and Conversions API, expense tracking, courier tracking, vendor flow, storefront design, QR codes and barcodes, profit and loss, staff accounts, multiple branches and brands. Limits cover products, orders per month, images and variants per product, staff, users, categories, coupons, branches and brands. A limit marked unlimited has no cap. Ask the team for a plan comparison and we will send it to you.',
    'প্ল্যানগুলোতে কী কী ফিচার ও সীমা আছে?',
    'প্ল্যান তৈরি হয় কিছু ফিচার ও সীমা দিয়ে, তাই পাশাপাশি তুলনা করা সহজ। ফিচারের মধ্যে আছে POS, অ্যানালিটিক্স, কাস্টম ডোমেইন, প্রায়োরিটি সাপোর্ট, API অ্যাক্সেস, বাল্ক ইমপোর্ট, SEO টুলস, অ্যাডভান্সড রিপোর্ট, মেটা পিক্সেল ও কনভার্সন API, খরচের হিসাব, কুরিয়ার ট্র্যাকিং, ভেন্ডর ফ্লো, স্টোরফ্রন্ট ডিজাইন, QR কোড ও বারকোড, লাভ-ক্ষতি, স্টাফ অ্যাকাউন্ট, একাধিক শাখা ও ব্র্যান্ড। সীমার মধ্যে আছে পণ্য, মাসিক অর্ডার, প্রতি পণ্যের ছবি ও ভ্যারিয়েন্ট, স্টাফ, ইউজার, ক্যাটাগরি, কুপন, শাখা ও ব্র্যান্ডের সংখ্যা। যে সীমা আনলিমিটেড, তাতে কোনো সর্বোচ্চ সীমা নেই। প্ল্যান তুলনা চাইলে আমাদের টিমকে বলুন, আমরা পাঠিয়ে দেব।',
    90, true
  ),
  (
    'How can I contact Shei Hoise for help?',
    'You can reach the Shei Hoise team by phone or WhatsApp on 01349005099, by email at sheihoise.bd@gmail.com, or through the contact form at sheihoise.com/contact-us. Tell us your store name and what you need and we will reply. Plans that include priority support get faster help. For payments, always include your invoice number when you send the transaction ID, so we can match your payment and confirm it quickly.',
    'সাহায্যের জন্য শেই হইসের সঙ্গে কীভাবে যোগাযোগ করব?',
    'আপনি শেই হইস টিমের সঙ্গে ০১৩৪৯০০৫০৯৯ নম্বরে ফোন বা হোয়াটসঅ্যাপে, sheihoise.bd@gmail.com ইমেইলে, অথবা sheihoise.com/contact-us-এর যোগাযোগ ফর্মের মাধ্যমে যোগাযোগ করতে পারেন। আপনার স্টোরের নাম ও কী দরকার তা জানান, আমরা উত্তর দেব। প্রায়োরিটি সাপোর্ট আছে এমন প্ল্যানে দ্রুত সহায়তা পাওয়া যায়। পেমেন্টের সময় ট্রান্জাকশন আইডির সঙ্গে সবসময় ইনভয়েস নম্বর দিন, যাতে আমরা দ্রুত পেমেন্ট মিলিয়ে নিশ্চিত করতে পারি।',
    100, true
  )
) AS seed(question_en, answer_en, question_bn, answer_bn, sort_order, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.faqs);
