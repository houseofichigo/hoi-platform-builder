export const TOKENIZER_SINGLE_PRESETS = [
  {
    id: "support_policy",
    label: "Support policy answer",
    text: "Customers can request a refund within 30 days when the product is unused, the order number is provided, and the refund reason matches the published policy.",
  },
  {
    id: "messy_ticket",
    label: "Messy support ticket",
    text: "cust says: paid twice?? order #A-8839 maybe A-8893\ncan't login since monday, renewal tomorrow, pls fix asap!!!\nnotes from chat: tried reset link 3x, no email, maybe old domain?\npriority unclear -- account owner is travelling",
  },
  {
    id: "knowledge_base",
    label: "Knowledge-base excerpt",
    text: "Account-access issues are high priority when a renewal, live customer event, or executive stakeholder is mentioned. The assistant may summarize status, identify missing details, and draft an internal escalation note. It must not promise restoration, change account status, or reveal internal account records to the customer without human approval.",
  },
  {
    id: "customer_email",
    label: "Long customer email",
    text: "Hello support team,\n\nI am writing because our team account is blocked even though our renewal was approved last week. We have a customer workshop tomorrow and need access for five users before 09:00. The reset email does not arrive, and the admin console says the workspace is inactive.\n\nCould you confirm whether the renewal was applied, restore access for the listed users, and let me know if you need any additional verification from our account owner?\n\nThank you,\nAmira",
  },
] as const;

export const LANGUAGE_TAX_PRESETS = [
  {
    id: "greeting",
    label: "Greeting",
    en: "Hello, how are you today? I would like to schedule a meeting next week.",
    fr: "Bonjour, comment allez-vous aujourd'hui ? Je voudrais organiser une réunion la semaine prochaine.",
    ar: "مرحبا، كيف حالك اليوم؟ أود تحديد موعد اجتماع الأسبوع المقبل.",
  },
  {
    id: "business_request",
    label: "Business request",
    en: "Please send me the latest quarterly report for the marketing department, including the breakdown by region.",
    fr: "Veuillez m'envoyer le dernier rapport trimestriel du service marketing, avec la répartition par région.",
    ar: "يرجى إرسال أحدث تقرير ربع سنوي لقسم التسويق، بما في ذلك التفصيل حسب المنطقة.",
  },
  {
    id: "technical_question",
    label: "Technical question",
    en: "What is artificial intelligence, and how does it differ from traditional software?",
    fr: "Qu'est-ce que l'intelligence artificielle, et en quoi diffère-t-elle des logiciels traditionnels ?",
    ar: "ما هو الذكاء الاصطناعي، وكيف يختلف عن البرامج التقليدية؟",
  },
  {
    id: "long_paragraph",
    label: "Long paragraph",
    en: "Artificial intelligence is transforming how businesses operate across every industry. From customer service to financial analysis, organizations are exploring new ways to integrate AI into their daily workflows. The challenge is no longer whether to adopt AI, but how to do so responsibly while maintaining quality, security, and trust with customers and employees.",
    fr: "L'intelligence artificielle transforme la façon dont les entreprises fonctionnent dans tous les secteurs. Du service client à l'analyse financière, les organisations explorent de nouvelles façons d'intégrer l'IA dans leurs flux de travail quotidiens. La question n'est plus de savoir s'il faut adopter l'IA, mais comment le faire de manière responsable tout en maintenant la qualité, la sécurité et la confiance avec les clients et les employés.",
    ar: "يعمل الذكاء الاصطناعي على تحويل طريقة عمل الشركات في كل صناعة. من خدمة العملاء إلى التحليل المالي، تستكشف المؤسسات طرقًا جديدة لدمج الذكاء الاصطناعي في سير العمل اليومي. التحدي لم يعد يتمثل في تبني الذكاء الاصطناعي، بل في كيفية القيام بذلك بطريقة مسؤولة مع الحفاظ على الجودة والأمان والثقة مع العملاء والموظفين.",
  },
] as const;

export type LanguageTaxPreset = (typeof LANGUAGE_TAX_PRESETS)[number];
