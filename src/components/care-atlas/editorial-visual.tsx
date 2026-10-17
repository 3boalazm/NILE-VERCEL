import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/npf/motion/reveal";

const visuals = {
  about: {
    file: "about-garden",
    index: "01 / LIFE, IN THE EVERYDAY",
    ar: {
      alt: "زوجان يسيران من الخلف في حديقة هادئة؛ الزوجة بحجاب كامل وملابس طويلة واسعة، دون ملامح وجه ظاهرة.",
      caption:
        "مشهد توضيحي مولّد للعناية اليومية، وليس صورة لفريقنا أو لعملاء.",
    },
    en: {
      alt: "A couple walking away through a quiet garden; the woman wears a full-coverage hijab and loose full-length clothing. No faces are shown.",
      caption:
        "AI-generated everyday-care illustration, not our team or a customer photograph.",
    },
  },
  story: {
    file: "story-courtyard",
    index: "02 / A WAY FORWARD",
    ar: {
      alt: "ممر حجري معاصر وشجرة زيتون وزجاج يفتح على أفق البحر، دون أشخاص.",
      caption: "مشهد معماري توضيحي مولّد، لا يمثل مقر الشركة.",
    },
    en: {
      alt: "A contemporary stone passage, olive tree and glass opening toward the sea, with no people.",
      caption:
        "AI-generated architectural illustration, not the company's premises.",
    },
  },
  quality: {
    file: "quality-materials",
    index: "03 / CLARITY, IN THE DETAILS",
    ar: {
      alt: "ضوء أزرق ينكسر عبر زجاج شفاف فوق ورق خالٍ من الكتابة على سطح حجري.",
      caption: "تكوين توضيحي مولّد للدقة والوضوح، وليس معملًا أو مكوّنات منتج.",
    },
    en: {
      alt: "Blue light refracting through clear glass onto blank paper on a stone surface.",
      caption:
        "AI-generated study of clarity, not a laboratory or actual product ingredients.",
    },
  },
  contact: {
    file: "contact-conversation",
    index: "04 / ROOM FOR A QUESTION",
    ar: {
      alt: "دفتر مفتوح دون كتابة وقلم أزرق وكوب ماء في ضوء طبيعي، دون أشخاص.",
      caption: "تفاصيل توضيحية مولّدة للحوار، وليست صورة لمكتب الشركة.",
    },
    en: {
      alt: "An open blank notebook, blue pencil and glass of water in natural light, with no people.",
      caption:
        "AI-generated conversation still life, not a photograph of our office.",
    },
  },
} as const;

export function EditorialVisual({
  kind,
  locale,
  className = "",
}: {
  kind: keyof typeof visuals;
  locale: Locale;
  className?: string;
}) {
  const visual = visuals[kind],
    copy = visual[locale];
  return (
    <Reveal as="figure" className={`ca-editorial-visual ${className}`}>
      <div className="ca-editorial-media">
        <Image
          src={`/care-atlas/editorial/${visual.file}.jpg`}
          alt={copy.alt}
          width={1264}
          height={848}
          sizes={
            kind === "contact"
              ? "(min-width:1024px) 38vw, 90vw"
              : kind === "story"
                ? "(min-width:1024px) 55vw, 90vw"
                : "90vw"
          }
        />
      </div>
      <figcaption>
        <span className="ca-mono">{visual.index}</span>
        <span>{copy.caption}</span>
      </figcaption>
    </Reveal>
  );
}
