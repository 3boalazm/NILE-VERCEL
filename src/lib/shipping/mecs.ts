/**
 * Carrier: Middle East Courier Service (MECS) — the company that delivers
 * NPF orders (door-to-door, branch drop-off) per the client's 2026 shipping
 * arrangement.
 *
 * SOURCES (both official, cross-validated against each other):
 *  - The carrier's own website: https://mecs-eg.com (Branches Locator),
 *    fetched 2026-09-23 — Latin-script addresses.
 *  - The client's 2026 branch sheets + 2026 price list (supplied as images
 *    2026-09-23) — Arabic addresses, the full phone lists, and the 2026
 *    rate card (see MECS_RATE_CARD below).
 */

export const MECS_CARRIER = {
  nameAr: "شركة ميدل ايست لكوريير سيرفيس",
  nameEn: "Middle East Courier Service (MECS)",
  website: "https://mecs-eg.com",
  email: "mecs@mecs-eg.com",
  headOfficeAddress: "1 Mahmoud Hafez St., Safir Sq., Heliopolis, Cairo",
  callCenter: "0227762827",
} as const

export type MecsBranch = {
  /** Branch name as published by the carrier. */
  name: string
  /** Arabic address (from the client's 2026 branch sheets). */
  addressAr: string
  /** Latin-script address (from the carrier's website). */
  address: string
  /** Published numbers (landlines + mobiles), click-to-call via mecsTelHref. */
  phones: string[]
}

export type MecsBranchGroup = {
  governorateAr: string
  governorateEn: string
  branches: MecsBranch[]
}

export const MECS_BRANCHES: MecsBranchGroup[] = [
  {
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    branches: [
      { name: "المقر الرئيسي — Head Office", addressAr: "1 ش محمود حافظ، ميدان السفير، مصر الجديدة", address: "1 Mahmoud Hafez St., Safir Sq., Heliopolis", phones: ["0227762827", "01000130156"] },
      { name: "مصر الجديدة 1 — Heliopolis 1", addressAr: "5 ش كفر الزيات، صلاح الدين، مصر الجديدة", address: "5 Kafr El Zayat St., Salah El Din", phones: ["0222917291", "0226900620", "0224159340", "01098961116", "01065098885"] },
      { name: "مصر الجديدة 2 — Heliopolis 2", addressAr: "10 ش نبيل الوقاد، الدور الأرضي شقة 1، أرض الجولف", address: "10 Nabil El Wakkad St., Ground Floor, Apt. 1, Ard El Golf", phones: ["0222906740", "0224197941", "01026007034"] },
      { name: "مدينة نصر — Nasr City", addressAr: "61 ش حسن الشريف، الحي الثامن، الدور الأول شقة 7، بجوار مدرسة المنهل", address: "61 Hassan El Sherif St., 8th Neighbourhood, 1st Floor, Unit 7 (beside El Manhal School)", phones: ["0226706101", "0222754083", "01286171867"] },
      { name: "الزمالك — Zamalek", addressAr: "118 ش 26 يوليو، الدور 7 شقة 704", address: "118, 26th July St., 7th Floor, Unit 704", phones: ["0227374253", "0227356428", "01064915556"] },
      { name: "العجوزة — Agouza", addressAr: "16 ش حافظ حسن، بجوار مستشفى الشرطة، خلف الخدمات والطلائع، الدور الخامس شقة 5", address: "16 Hafez Hassan St., beside Police Hospital, Ground Floor, Unit 5", phones: ["0233037946", "0233037949", "01023050866"] },
      { name: "وسط البلد — Down Town", addressAr: "13 ش نوبار، خلف المعرض، محل 1 و 2، وسط البلد", address: "13 Nobar St., from El Kasr El Aainy, Unit 1 & 2", phones: ["0227930809", "0227930810", "01062955591"] },
      { name: "شبرا — Shoubra", addressAr: "24 ش شبرا، الدور الخامس شقة 3", address: "24 Shoubra St., 5th Floor, Apt. 3", phones: ["0225764535", "01064777032"] },
      { name: "المعادي 1 — Maadi 1", addressAr: "17 أبراج عثمان، الكورنيش، خلف مستشفى القوات المسلحة، الدور الأول شقة 58", address: "17 Osman Towers, Corniche El Maadi, behind Armed Forces Hospital, 1st Floor, Unit 58", phones: ["0225242775", "0225247833", "01096082586"] },
      { name: "المعادي 2 — Maadi 2", addressAr: "زهراء المعادي، الشطر الخامس عشر، أمام كارفور، بلوك 61، مدخل 7، وحدة 101، الدور الأرضي", address: "Zahraa El Maadi, Elshatr Elaasher in front of Carrefour, Block 61, Entrance 7, Unit 101", phones: ["0223101261", "01015481117"] },
      { name: "المطرية — Matareya", addressAr: "114 ش الكبلات", address: "114 El Kablat St.", phones: ["0222553102", "0222528627", "01004482727"] },
      { name: "القاهرة الجديدة — New Cairo", addressAr: "التجمع الخامس، مركز خدمات الحي الأول، التوينز مول، الدور الثاني، مكتب 207", address: "5th Settlement, 1st District, Commercial Center, Street 15, Twins Mall, 2nd Floor, Office 207", phones: ["0225657118", "01024446544"] },
    ],
  },
  {
    governorateAr: "الجيزة",
    governorateEn: "Giza",
    branches: [
      { name: "الهرم (نصر الدين) — Haram", addressAr: "446 ش الهرم، برج نصر الدين، فوق نفق نصر الدين، بجوار برج 4 نصر الدين، الدور 2", address: "446 El Haram St., Nasr El Din Towers, above Nasr El Din Tunnel, Tower 4H, 1st Floor, Unit 2", phones: ["0235690199", "0235697730", "01023222398"] },
      { name: "القرية الذكية — Smart Village", addressAr: "ارك مول (B123-C11)، الدور الأرضي (وحدة B014)", address: "ARC Mall, Bldg. B123-C11, Ground Floor, Unit B014", phones: ["0235372238", "01066687876"] },
      { name: "الشيخ زايد — Sheikh Zayed", addressAr: "شلال مول، الحي السابع، الحي الثاني، البلوك الأول، الدور الأول، الوحدة G103A", address: "Shalz Mall, 7th Neighbourhood, 2nd District, Block 1, 1st Floor, Unit GI03A", phones: ["0237880461", "01000158287"] },
      { name: "6 أكتوبر — 6th of October", addressAr: "20 ش المحور المركزي، ميدان النجدة، الحي الرابع، الحي التجاري، محل 79", address: "20 El Mehwar El Markazy St., El Nagda Sq., El Madina Commercial Mall, Ground Floor, Unit 21", phones: ["0238341160", "0238341161", "01023050877"] },
    ],
  },
  {
    governorateAr: "القليوبية",
    governorateEn: "Qalyubia",
    branches: [
      { name: "العبور — Obour", addressAr: "11 ش إمام مالك، الحي السادس، المدخل الثاني، خلف مول كابيتال بلازا، الدور الأول شقة 7", address: "11 Emam Malek St., 6th Neighbourhood, behind Capital Plaza Mall, 1st Floor, Unit 7", phones: ["01022204371", "01065143338"] },
      { name: "بنها — Banha", addressAr: "10 ش الرياح التوفيقي، برج المحمدي، الدور الأرضي، طريق المنصورة بنها", address: "10 El Rayyah El Tawfiky St., El Mohammady Tower, El Mansoura Banha Road", phones: ["0133196377", "01022202830"] },
    ],
  },
  {
    governorateAr: "الشرقية",
    governorateEn: "Sharqia",
    branches: [
      { name: "العاشر من رمضان 1 — 10th of Ramadan 1", addressAr: "المنطقة الصناعية الثالثة، طريق الإسماعيلية، دوار العاشر، الدور الثاني، مكتب 142", address: "3rd Industrial Area, Ismailia Desert Road, Dawar El Asher Bldg., 2nd Floor, Office 142", phones: ["0554412199"] },
      { name: "العاشر من رمضان 2 — 10th of Ramadan 2", addressAr: "ش سنترال، مول سنترال، الحي الأردنية، الدور الأرضي، محل 8", address: "El Sentral St., World Trade Center Mall, Ground Floor, Unit 8", phones: ["0554490250", "01066687847"] },
      { name: "الزقازيق — Zagazig", addressAr: "ش سعد زغلول، برج علي زكي، الكورنيش، أمام مبنى المحافظة، الدور الأول", address: "Saad Zaghloul St., Aly Zaky Tower, El Corniche Road, in front of El Mohafza Bldg., 1st Floor", phones: ["0552351231", "01066687855"] },
    ],
  },
  {
    governorateAr: "الإسكندرية",
    governorateEn: "Alexandria",
    branches: [
      { name: "المنشية 1 — Mansheya 1", addressAr: "8 ش محمد عبد العادي، المنشية، الدور الثاني شقة 4", address: "8 Ahmed Oraby St., El Mansheya, 2nd Floor, Apt. 4", phones: ["034876706", "034876110", "01000502217"] },
      { name: "المنشية 2 — Mansheya 2", addressAr: "14 ش النصر، المنشية، الدور الثاني شقة 3", address: "14 A El Nasr St., El Mansheya, 2nd Floor, Apt. 3", phones: ["034839296", "01066687848"] },
      { name: "سيدي جابر — Sidi Gaber", addressAr: "21 ش المشير أحمد إسماعيل، كايرو تاورز، أمام محطة سيدي جابر، الدور الأرضي، مكتب 23", address: "21 El Moshir Ahmed Ismail St., Cairo Towers, in front of Sidi Gaber Station, Bldg. B, Ground Floor, Office 23", phones: ["035241605", "035241610", "01066687849"] },
      { name: "محرم بك — Moharram Bek", addressAr: "1630 ش ترعة المحمودية، برجا كرام واللولو، محرم بك، الدور الأرضي", address: "1630 Canal El Mahmoudia St., Karram Towers, El Loaloa Tower, Moharram Bek, Ground Floor, Apt. 1", phones: ["034287335", "034287366", "01002142724"] },
      { name: "لوران — Louran", addressAr: "3 ش إسماعيل سرهانك، داخل مول فلورنسا، الدور الأرضي، محل 23، لوران", address: "3 Ismaail Serhank St., Florence Mall, Ground Floor, Unit 23, Louran", phones: ["035861172", "035861182", "01066687879"] },
      { name: "برج العرب — Borg El Arab", addressAr: "الإسكان الاجتماعي، المنطقة التاسعة، عمارة 28، الدور الأرضي شقة 1", address: "El Eskan El Shaaby, 9th District, Bldg. 28, Ground Floor, Unit 1", phones: ["034592635", "01066687850"] },
    ],
  },
  {
    governorateAr: "مرسى مطروح",
    governorateEn: "Marsa Matrouh",
    branches: [
      { name: "مرسى مطروح — Marsa Matrouh", addressAr: "51 علم الروم، برج زهير، الدور الأول شقة 2", address: "51 Alam El Roum St., Zohair Tower, 1st Floor, Unit 2", phones: ["0464937454", "01009072288"] },
      { name: "العلمين — Al-Alamein", addressAr: "المركز التجاري، وحدة J1، المنطقة السياحية، سمارا مارينا — العلمين", address: "Building 1, Model G, Stella Marina Shopping Mall", phones: ["01022774962"] },
    ],
  },
  {
    governorateAr: "بورسعيد",
    governorateEn: "Port Said",
    branches: [
      { name: "بورسعيد 1 — Port Said 1", addressAr: "3 ش عرابي وأبو الفدا، الدور الأرضي، محل 6", address: "3 Orabi & Abul Feda St., Ground Floor, Unit 6", phones: ["0663202790", "0663202916", "01091020221"] },
      { name: "بورسعيد 2 — Port Said 2", addressAr: "6 ش ورشة الأراضي القديمة، برج نورهان، الدور الأول، وحدة 2", address: "6 Old Workshop Land St., Norhan Tower, 1st Floor, Unit 2", phones: ["0663244148", "0663244022", "01066687857"] },
      { name: "بورفؤاد — Port Fouad", addressAr: "بورفؤاد، 7 ش 3 الرئيسي، بجوار بناء البحرية، خلف الورشة، الدور الأرضي", address: "Port Fouad, 7 Street 3 Main, Abo El Naga Tower, behind Marine Shipyard, Ground Floor, Unit 2", phones: ["0663406488"] },
    ],
  },
  {
    governorateAr: "السويس",
    governorateEn: "Suez",
    branches: [
      { name: "السويس — Suez", addressAr: "بورتوفيق، 7 ش محمد الكريم، خلف القنصلية السعودية، الدور الأول، شقة 2", address: "Port Tawfik, 7 Mohamed El Karim St., behind Saudi Arabian Consulate, 1st Floor, Unit 2", phones: ["0623192325", "01066687858"] },
      { name: "العين السخنة — Ain El Sokhna", addressAr: "قرية الوادي، السخنة، بجوار ميناء السخنة، محطة 6، الدور الأرضي", address: "El Wady Resort, El Sokhna Road, beside El Sokhna Port, Unit 6", phones: ["01000155804"] },
    ],
  },
  {
    governorateAr: "الإسماعيلية",
    governorateEn: "Ismailia",
    branches: [
      { name: "الإسماعيلية — Ismailia", addressAr: "89 ش سيناء، بجوار مدرسة صفية زغلول، الدور الأرضي، شقة 1", address: "89 Sinai St., beside Safia Zaghloul School, Ground Floor, Unit 1", phones: ["0643144564", "01066687859"] },
    ],
  },
  {
    governorateAr: "البحيرة",
    governorateEn: "Beheira",
    branches: [
      { name: "دمنهور — Damanhour", addressAr: "18 ش حديقة الجمهورية، متفرع من ش يحيى الصاوي، الدور الأول، شقة 1", address: "18 Hadikat El Gomhoria St., from El Gomhoria St., 1st Floor, Apt. 1", phones: ["0453339441", "01013989900"] },
    ],
  },
  {
    governorateAr: "المنوفية",
    governorateEn: "Monufia",
    branches: [
      { name: "شبين الكوم — Shebin El Koum", addressAr: "4 أبراج بشاير الخير، الدور الأرضي، محل رقم 40", address: "4 Bashaer El Kheir Towers, Ground Floor, Unit 40", phones: ["0482080427", "01022443344"] },
    ],
  },
  {
    governorateAr: "الغربية",
    governorateEn: "Gharbia",
    branches: [
      { name: "طنطا — Tanta", addressAr: "40 ش حسن رضوان، برج التكوين، الدور الأول، مكتب 2", address: "40 Hassan Radwan St., Eamaar El Delta, Dr. Taha Tower, 1st Floor, Office 2", phones: ["0403325822", "01066687854"] },
      { name: "المحلة الكبرى — Mahalla El Kobra", addressAr: "1 ش فيصل السود، منطقة شكري القوتلي، الدور الأرضي، وحدة 1", address: "1 Feisal Al Soaud St., Shoukry El Kawatly Area, Ground Floor, Unit 1", phones: ["0402243078", "01066687853"] },
    ],
  },
  {
    governorateAr: "الدقهلية",
    governorateEn: "Dakahlia",
    branches: [
      { name: "المنصورة — Mansoura", addressAr: "ش الجيشات، برج زمزم، الدور الأول، وحدة رقم 2", address: "شارع فخر الدين، برج زمزم، أمام مسجد الفتح، دور ١", phones: ["0502323923", "0502301404", "01066687851"] },
    ],
  },
  {
    governorateAr: "دمياط",
    governorateEn: "Damietta",
    branches: [
      { name: "دمياط — Damietta", addressAr: "ش كورنيش النيل، شركة التأمين الشرقية، الدور الأرضي، محل رقم 18", address: "Corniche El Nil St., East Insurance Co. Tower, 1st El Aasar Area, Ground Floor, Unit 18", phones: ["0572356006", "01066687852"] },
    ],
  },
  {
    governorateAr: "كفر الشيخ",
    governorateEn: "Kafr El Sheikh",
    branches: [
      { name: "كفر الشيخ — Kafr El Sheikh", addressAr: "ش سنترال الاستاد الرياضي، محل 11، الدور الأول", address: "Sour El Estad Al Riyady St., 1st Floor, Unit 11", phones: ["0473220579", "01066687856"] },
    ],
  },
  {
    governorateAr: "الفيوم",
    governorateEn: "Fayoum",
    branches: [
      { name: "الفيوم — Fayoum", addressAr: "3 ش مدراب الرو، الدور الأرضي، شقة 2", address: "3 Madrab El Roz St., El Moalemeen Tower, 2nd Entrance, Ground Floor, Unit 2", phones: ["0842153916", "01066687860"] },
    ],
  },
  {
    governorateAr: "بني سويف",
    governorateEn: "Beni Suef",
    branches: [
      { name: "بني سويف — Beni Suef", addressAr: "1 ش علي عبد الحميد، من ش الروضة، الدور الثاني، شقة رقم 2", address: "1 Aly Abd El Hamid St., from El Rawda St., 2nd Floor, Unit 2", phones: ["0822124004", "0822124062", "01066687861"] },
    ],
  },
  {
    governorateAr: "المنيا",
    governorateEn: "Minia",
    branches: [
      { name: "المنيا 1 — Minia 1", addressAr: "9 ش الجمهورية، برج ميامي تاور، ميدان القصر، الدور الأرضي", address: "9 El Gomhoria St., Miami Tower, Palace Sq., Ground Floor", phones: ["0862374907"] },
      { name: "المنيا 2 — Minia 2", addressAr: "103 ش عدنان المالكي، أرض سلطان، الدور الأول، شقة 2", address: "103 Adnan El Malky St., Ard Sultan, 1st Floor, Unit 2", phones: ["0862338833", "08662330358", "01066687862"] },
    ],
  },
  {
    governorateAr: "أسيوط",
    governorateEn: "Assiut",
    branches: [
      { name: "أسيوط 1 — Assiut 1", addressAr: "50 ش 26 يوليو، برج المحبة، الدور الثاني، شقة 7", address: "50, 26th July St., El Mahabba Tower, 2nd Floor, Apt. 7", phones: ["0882349975", "01066687863"] },
      { name: "أسيوط 2 — Assiut 2", addressAr: "102 ش الجمهورية، برج الأطباء، الدور الأرضي", address: "102 El Gomhouria St., El Atebbaa Tower, Ground Floor", phones: ["0882059946", "01221535896"] },
    ],
  },
  {
    governorateAr: "سوهاج",
    governorateEn: "Sohag",
    branches: [
      { name: "سوهاج 1 — Sohag 1", addressAr: "ش بحر القناة، برج العدالة رقم 2، الدور الأول", address: "Baga Canal St., El Adallah Towers, Tower 2, 1st Floor", phones: ["0932711480", "01066687864"] },
      { name: "سوهاج 2 — Sohag 2", addressAr: "5 ش أمين سامي، من كورنيش النيل، الدور الأرضي", address: "5 Amin Samy St., from Corniche El Nil St., Ground Floor", phones: ["0932718157", "0932313351", "01062955598"] },
      { name: "سوهاج 3 — Sohag 3", addressAr: "شقة 57، منطقة الخدمات، الدور الأول", address: "El Kawsar, Unit 57, Services Area, 1st Floor", phones: ["0934819652"] },
    ],
  },
  {
    governorateAr: "قنا",
    governorateEn: "Qena",
    branches: [
      { name: "قنا — Qena", addressAr: "ش 26 يوليو، الدور الأرضي، أمام الرقابة الإدارية", address: "26 July St., Ground Floor, beside QNB Bank", phones: ["0963360006", "01066687866"] },
      { name: "نجع حمادي — Nag Hammadi", addressAr: "2 ش الهرم، عمارات زين العابدين، الدور الأرضي", address: "2 El Zahraa St., Zain El Abdin Bldg., Ground Floor", phones: ["0966595814", "01066687865"] },
    ],
  },
  {
    governorateAr: "الأقصر",
    governorateEn: "Luxor",
    branches: [
      { name: "الأقصر — Luxor", addressAr: "ش التلفزيون، مبنى عروس النيل، الدور الأرضي", address: "Television St., Arous El Nil Bldg., Ground Floor", phones: ["0952275044", "01066687867"] },
    ],
  },
  {
    governorateAr: "أسوان",
    governorateEn: "Aswan",
    branches: [
      { name: "أسوان — Aswan", addressAr: "7 ش النبية العسكرية، منطقة أطلس، الدور الأرضي", address: "7 El Neyaba El Askareya St., Atlas Area, Ground Floor", phones: ["0972428808", "0972429029", "01066687868"] },
    ],
  },
  {
    governorateAr: "البحر الأحمر",
    governorateEn: "Red Sea",
    branches: [
      { name: "الغردقة 1 — Hurghada 1", addressAr: "67 أ ش حسين أبو العباس، الدور الأول، شقة 2", address: "67 A Hussain Abo El Abbass St., 1st Floor, Unit 2", phones: ["0653447622", "01066687870"] },
      { name: "الغردقة (الدخار) — Hurghada 2", addressAr: "السوق التجاري (الدخار)، مجموعة أ، محل رقم 7، الدور الأرضي", address: "El Dahhar Trade Market, Unit 7 A, Group A, Ground Floor", phones: ["0653551165"] },
      { name: "سفاجا — Safaga", addressAr: "ش 23 يوليو، الدور الثاني", address: "23 July St., Galal El Desouky Bldg., 2nd Floor", phones: ["0653257097", "01066687871"] },
    ],
  },
  {
    governorateAr: "جنوب سيناء",
    governorateEn: "South Sinai",
    branches: [
      { name: "شرم الشيخ — Sharm El Sheikh", addressAr: "3 أ عمرو مول شاروود، Banks St.، هضبة أم السيد، الدور الأرضي", address: "3A Sharmwood Mall, Banks St., Ommelsid Hadaba, Ground Floor", phones: ["0693663075", "01066687869"] },
      { name: "خليج نبق — Nabq Bay", addressAr: "قرية نوبية، منطقة الغرقانة، الدور الأرضي، وحدة 43", address: "Nubia Resort, El Gharkana Area, Ground Floor, Unit 43", phones: ["01000158290"] },
    ],
  },
]

/** tel: href for a published local-format number (+20, one leading 0 dropped). */
export function mecsTelHref(phone: string): string {
  return `tel:+20${phone.replace(/^0+/, "")}`
}

/**
 * MECS 2026 rate card (client-supplied price list, 2026-09-23) — domestic
 * rates FROM Cairo (NPF ships from Cairo), base weight tier up to 1 kg.
 *
 * VERIFIED from the sheet: the price ladder, the Cairo→Cairo row (75 EGP),
 * the per-extra-kg fees, the operational fees, and the 14% collection VAT
 * note. NOT yet verifiable from the sheet image: which exact cities sit in
 * each destination tier beyond Cairo — `coverageAr` is left open
 * (`pendingCoverage: true`) until the client confirms the split, so nothing
 * here drives checkout pricing except the Cairo row already applied to
 * zone 1 in npf-shipping.ts / the storefront zone table.
 */
export const MECS_RATE_CARD = {
  source: "قائمة أسعار ميدل ايست كوريير سيرفيس 2026 (من القاهرة) + سياسة المتجر: القاهرة والجيزة والإسكندرية شحن مجاني",
  baseWeightKg: 1,
  /** Per-tier city coverage — the client's official written split
   * (2026-09-24). "STORE: FREE" rows are absorbed by the store per its
   * free-shipping-by-default policy for Greater Cairo + Alexandria. */
  destinationTiersEGP: [
    { priceEGP: 75, coverageAr: "القاهرة (القاهرة الكبرى) — STORE: FREE", pendingCoverage: false },
    // Not assigned in the client's 2026 split — kept pending on purpose.
    { priceEGP: 80, coverageAr: null, pendingCoverage: true },
    { priceEGP: 85, coverageAr: "الإسكندرية (تُقدَّم للعميل مجاناً ضمن سياسة zone 1)، بورسعيد، السويس، الإسماعيلية، وكل مدن محافظات الدلتا", pendingCoverage: false },
    { priceEGP: 90, coverageAr: "العين السخنة، العاصمة الإدارية (مدن محافظة الجيزة مجانية للعميل — على المتجر)", pendingCoverage: false },
    { priceEGP: 95, coverageAr: "كل مدن محافظتي بني سويف والفيوم", pendingCoverage: false },
    { priceEGP: 105, coverageAr: "كل مدن محافظتي المنيا وأسيوط", pendingCoverage: false },
    { priceEGP: 120, coverageAr: "كل مدن محافظات سوهاج والأقصر وقنا وأسوان + الغردقة", pendingCoverage: false },
    { priceEGP: 170, coverageAr: "مطروح، الساحل الشمالي، شرم الشيخ، الجونة، سفاجا، شمال وجنوب سيناء", pendingCoverage: false },
    { priceEGP: 400, coverageAr: "الشيخ فضل (المنيا)، مدن محافظة الوادي الجديد، دهب، نويبع، طابا، القصير", pendingCoverage: false },
    { priceEGP: 550, coverageAr: "أخميم الجديدة، الداخلة، الواحات البحرية، أبو سمبل، مرسى علم", pendingCoverage: false },
    { priceEGP: 1400, coverageAr: "خدمة تسليم المناطق النائية: الفرافرة، السلوم، حلايب، شلاتين، توشكى، سيوة، سانت كاترين", pendingCoverage: false },
  ] as Array<{ priceEGP: number; coverageAr: string | null; pendingCoverage: boolean }>,
  extraPerKgEGP: { greaterCairoAlexandriaDeltaCanal: 15, restOfEgypt: 17 },
  /** "عودة التحصيل" — per the sheet it starts at 50 EGP; the ladder below is
   * the full per-tier progression recorded from the sheet (confirm with the
   * client before relying on brackets beyond the first). */
  collectionReturnFeesEGP: [50, 125, 250, 250, 250, 250, 520, 650, 700, 850, 975],
  /** NOT waiting/refusal fees (client confirmed 2026-09-24): these are the
   * "رسوم إضافية للاستلام أو التسليم بالعنوان" (door-to-door pickup &
   * delivery add-on). The store absorbs them — customers pay the tier
   * price only. */
  addressPickupDeliveryFeeEGP: {
    greaterCairoAlexandriaCanalCities: 30,
    restOfEgypt: 35,
  },
  /** Collection-service VAT per the sheet's note ("طبقاً للقانون"). The
   * sheet does not roll it into the displayed shipping price — customer-
   * facing prices above are charged as displayed (client's open point). */
  collectionVatPercent: 14,
  notes: [
    "الأسعار بالجنيه المصري للوزن حتى 1 كجم.",
    "عن كل كيلوجرام إضافي: 15ج للقاهرة والإسكندرية والدلتا والقناة، و17ج لباقي المحافظات.",
    "+30ج إضافية للاستلام/التسليم بالعنوان داخل (القاهرة، الإسكندرية، مدن القنال) و+35ج لباقي الجمهورية — يتحمّلها المتجر، والعميل يدفع سعر الدرجة فقط.",
    "عودة التحصيل تبدأ من 50ج (سلّم تصاعدي حسب الدرجة في اللائحة).",
  ],
} as const
