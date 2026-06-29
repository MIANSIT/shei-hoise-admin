// ─────────────────────────────────────────────────────────────
// UPDATE THESE VALUES WHEN YOU RECEIVE THE ACTUAL DETAILS
// ─────────────────────────────────────────────────────────────

export const PAYMENT_DETAILS = {
  bkash: {
    number: "01761867763",
    accountType: "Personal",
    cashoutCharge: "1.85%",
    chargeRate: 0.0185, // regular Send Money charge
    priyoCharge: "1.49%",
    priyoChargeRate: 0.0149, // reduced charge if saved as Priyo
    instructions:
      'Open bKash app → tap "Send Money" → enter number → enter the total amount shown → use invoice number as reference.',
  },
  nagad: {
    number: "01833228622",
    accountType: "Personal",
    cashoutCharge: "1.3%",
    chargeRate: 0.013, // no Priyo facility on Nagad
    instructions:
      'Open Nagad app → tap "Send Money" → enter number → enter the total amount shown → use invoice number as reference.',
  },
  bank: {
    bankName: "Non-Resident Bangladeshis Commercial Bank (NRBC)", // e.g. Dutch-Bangla Bank Limited
    accountName: "SHAH NAWROSE", // e.g. SheiHoise Ltd.
    accountNumber: "012032000001758",
    branch: "Rajshahi", // e.g. Gulshan Branch
    routingNumber: "260811934",
    instructions:
      "Transfer the exact amount and email the transaction receipt with your invoice number.",
  },
  company: {
    name: "Shei Hoise",
    email: "sheihoise.bd@gmail.com",
    phone: "01349005099",
    address: "Bangladesh",
    website: "https://sheihoise.com/contact-us",
  },
  invoiceDueDays: 7, // how many days after creation the invoice is due
};
