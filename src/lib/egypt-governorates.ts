/**
 * F-17 — Egypt's 27 governorates, for the checkout address select.
 *
 * The governorate field used to be a free-text input, which meant "القاهره",
 * "القاهرة" and "Cairo" were three different values for one place, shipping
 * quotes keyed on governorate silently missed, and typos reached the ops
 * team as undeliverable addresses. A closed list fixes all three: the value
 * is always one of these ids, and the label is shown in the visitor's locale.
 *
 * Names are the official common Arabic forms and their standard English
 * transliterations (as used by CAPS/postal references); the id is a stable
 * slug so stored orders never depend on display language.
 */
export type Governorate = { id: string; ar: string; en: string }

export const EGYPT_GOVERNORATES: readonly Governorate[] = [
  { id: "cairo", ar: "القاهرة", en: "Cairo" },
  { id: "giza", ar: "الجيزة", en: "Giza" },
  { id: "alexandria", ar: "الإسكندرية", en: "Alexandria" },
  { id: "qalyubia", ar: "القليوبية", en: "Qalyubia" },
  { id: "monufia", ar: "المنوفية", en: "Monufia" },
  { id: "gharbia", ar: "الغربية", en: "Gharbia" },
  { id: "dakahlia", ar: "الدقهلية", en: "Dakahlia" },
  { id: "sharqia", ar: "الشرقية", en: "Sharqia" },
  { id: "beheira", ar: "البحيرة", en: "Beheira" },
  { id: "kafr-el-sheikh", ar: "كفر الشيخ", en: "Kafr El Sheikh" },
  { id: "damietta", ar: "دمياط", en: "Damietta" },
  { id: "port-said", ar: "بورسعيد", en: "Port Said" },
  { id: "ismailia", ar: "الإسماعيلية", en: "Ismailia" },
  { id: "suez", ar: "السويس", en: "Suez" },
  { id: "north-sinai", ar: "شمال سيناء", en: "North Sinai" },
  { id: "south-sinai", ar: "جنوب سيناء", en: "South Sinai" },
  { id: "matrouh", ar: "مطروح", en: "Matrouh" },
  { id: "red-sea", ar: "البحر الأحمر", en: "Red Sea" },
  { id: "new-valley", ar: "الوادي الجديد", en: "New Valley" },
  { id: "fayoum", ar: "الفيوم", en: "Fayoum" },
  { id: "beni-suef", ar: "بني سويف", en: "Beni Suef" },
  { id: "minya", ar: "المنيا", en: "Minya" },
  { id: "asyut", ar: "أسيوط", en: "Asyut" },
  { id: "sohag", ar: "سوهاج", en: "Sohag" },
  { id: "qena", ar: "قنا", en: "Qena" },
  { id: "luxor", ar: "الأقصر", en: "Luxor" },
  { id: "aswan", ar: "أسوان", en: "Aswan" },
] as const

export function governorateLabel(governorate: Governorate, locale: string): string {
  return locale === "ar" ? governorate.ar : governorate.en
}
