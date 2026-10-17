import type { Locale } from "./config"
const copy = {
  ar: {
    forgot: "نسيت كلمة المرور؟",
    title: "استعادة كلمة المرور",
    body: "هنبعتلك رابط آمن لو البريد مرتبط بحساب.",
    email: "البريد الإلكتروني",
    send: "ابعت رابط الاستعادة",
    sent: "لو البريد مرتبط بحساب، هيوصلك رابط الاستعادة. راجع صندوق الوارد والرسائل غير المرغوبة.",
    unavailable:
      "استعادة كلمة المرور بالبريد مش متاحة حاليًا. تواصل معانا للمساعدة—مش هنطلب منك كلمة المرور.",
    contact: "تواصل معانا",
    password: "كلمة المرور الجديدة",
    confirm: "تأكيد كلمة المرور",
    save: "احفظ كلمة المرور",
    done: "كلمة المرور اتغيّرت. سجّل الدخول بكلمة المرور الجديدة.",
    login: "تسجيل الدخول",
    invalid: "الرابط غير صالح أو انتهت صلاحيته. اطلب رابط جديد.",
    mismatch: "كلمتا المرور مش متطابقتين.",
    error: "تعذّر إتمام الطلب. جرّب تاني بعد قليل.",
    rate: "طلبات كتير في وقت قصير. انتظر شوية وحاول تاني.",
    validation: "راجع البريد الإلكتروني أو كلمة المرور (من ٨ إلى ١٢٨ حرف).",
  },
  en: {
    forgot: "Forgot your password?",
    title: "Recover your account",
    body: "We'll send a secure link if this email belongs to an account.",
    email: "Email address",
    send: "Send recovery link",
    sent: "If this email belongs to an account, a recovery link will arrive. Check your inbox and spam folder.",
    unavailable:
      "Email recovery is currently unavailable. Contact us for help—we will never ask for your password.",
    contact: "Contact us",
    password: "New password",
    confirm: "Confirm password",
    save: "Save new password",
    done: "Your password has changed. Sign in with your new password.",
    login: "Sign in",
    invalid: "This link is invalid or has expired. Request a new one.",
    mismatch: "The passwords do not match.",
    error: "We couldn't complete this request. Please try again shortly.",
    rate: "Too many requests. Please wait before trying again.",
    validation: "Check your email or password (8–128 characters).",
  },
}
export function getRecoveryCopy(locale: Locale) {
  return copy[locale]
}
