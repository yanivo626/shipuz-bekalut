import React, { useState, useMemo, useEffect, useRef, useId } from "react";
import { supabase } from "./supabaseClient";
import { DATA } from "./data.js";

// Optional: URL of the small backend server that connects this app to
// Google Calendar automatically (no per-event click-through needed).
// Leave empty ("") to use the no-setup "quick add" link instead — the app
// works fully either way. See calendar-backend/README.md for setup steps.
const CALENDAR_BACKEND_URL = "";

const C = {
  bg: "#F6F1EA",
  card: "#FFFFFF",
  cardAlt: "#FFFDF9",
  border: "#E7DCCC",
  borderSoft: "#F0E9DC",
  text: "#2B2622",
  textMuted: "#5C5347", // secondary body text — passes AA on cream bg
  textFaint: "#6B6259", // small labels / captions
  accent: "#B0703F",
  accentText: "#8A5A34", // accent-colored small text/links (darker, readable)
  accentSoft: "#EFE1CE",
};

const GUIDE = {
  glossary: [
    { term: "כתב כמויות", def: "מסמך מפורט שמפרט כל עבודה וכמות חומר בפרויקט. בלעדיו קבלן לא יכול לתת הצעת מחיר מדויקת — וכל שינוי בלי כתב כמויות עלול לייקר את הפרויקט משמעותית." },
    { term: "פחת (בריצוף)", def: "אחוז נוסף שרוכשים מעבר לשטח המדויק, כדי לכסות חיתוכים ושברים. אריחים גדולים/אלכסוניים = פחת גבוה יותר (20%-30%), ולכן גם עבודה יקרה יותר." },
    { term: "אינטרפוץ", def: "ברז/שסתום עירוב פנימי בקיר, שמחבר בין המים הקרים והחמים ליציאה אחת (למשל למקלחת). 'קומפלט' = כולל גם ראש גשם וזרוע." },
    { term: 'ממ"ד', def: "ממ\"ד חדר מוגן דירתי, מרחב בטוח מחוזק בבטון עם דלת/חלון פלדה. שיפוץ בממ\"ד כפוף לרוב לתקנות מיוחדות ואסור לפגוע במעטפת הבטון." },
    { term: "פיקוח עליון", def: "ליווי מקצועי (אדריכל/מעצב) שמבקר באתר לוודא שהעבודה מתבצעת לפי התוכנית — לא זהה לניהול הפרויקט השוטף שנעשה ע\"י הקבלן." },
    { term: "קבלן ראשי מול קבלן משנה", def: "קבלן ראשי אחראי כלפיכם על כל הפרויקט; קבלני משנה (חשמלאי, אינסטלטור) עובדים תחתיו. חשוב לדעת מי אחראי משפטית אם משהו משתבש." },
    { term: "מקדמה", def: "תשלום ראשון לקבלן/ספק לפני תחילת עבודה. מומלץ שלא יעלה על 10%-15% מסכום ההזמנה, ושהתשלומים הבאים יהיו לפי התקדמות בפועל." },
    { term: "אבן קיסר / קוורץ", def: "משטח עבודה מלאכותי (לא אבן טבעית) עמיד לשריטות וכתמים, נפוץ למטבחים. מחיר משתנה לפי עובי וגימור." },
    { term: 'גב"ש (גבס)', def: "לוחות גבס להקמת קירות/תקרות פנימיות קלות, או להנמכת תקרה לצורך הסתרת צנרת/מיזוג." },
    { term: 'קומפ\' (קומפלט)', def: "כינוי למוצר שנמכר כערכה שלמה במחיר אחד, ולא לפי מדידה/כמות (למשל 'אינטרפוץ קומפלט' כולל את כל חלקי המערכת)." },
    { term: 'מ"א (מטר אורך)', def: 'יחידת מידה לפי אורך בקו ישר (למשל נגרות מטבח, פנלים) — בשונה מ"מ"ר" שמודד שטח.' },
    { term: "בלת\"מ", def: "בלתי-צפוי — הוצאה שלא תוכננה מראש (למשל תקלה שהתגלתה בהריסה). מומלץ לשריין רזרבה תקציבית של 10%-15% לבלת\"מים." },
    { term: "VRF / מיני מרכזי", def: "מערכות מיזוג אוויר מרכזיות (VRF גדול יותר, מיני-מרכזי לדירה) שדורשות תכנון צנרת מוקדם ותיאום עם עבודות הגבס/תקרה." },
    { term: 'דלת קו אפס', def: "דלת פנים ללא מסגרת בולטת (חוד/מזוזה) — נראית ממורגת בקיר, יוקרתית יותר ויקרה יותר מדלת רגילה." },
    { term: "אדן", def: "המשטח האופקי בתחתית חלון/דלת הזזה — יכול להיות אבן, אלומיניום או עץ, ומשפיע על איטום המים." },
    { term: "קיר נושא", def: 'קיר שתומך במשקל המבנה (בשונה מקיר חוצץ פנימי). אסור להרוס או לפתוח פתח בקיר נושא בלי אישור מהנדס קונסטרוקציה — זו סוגיית בטיחות, לא רק עיצוב.' },
    { term: "מפסק פחת (RCD)", def: "רכיב בטיחות בלוח החשמל שמנתק זרם באופן מיידי אם מתגלה דליפת חשמל — חובה בחוק בכל דירה, קריטי במיוחד ליד מים." },
    { term: 'מא"ז', def: "מפסק אוטומטי זעיר — 'הנתיך' בלוח החשמל שמנתק מעגל בעומס יתר. כל 'נקודת חשמל' חדשה עשויה לדרוש מא\"ז נפרד." },
    { term: "נקודת חשמל / נקודת מים", def: "יציאה בודדת (שקע, מפסק, גוף תאורה, או ברז) המחוברת בקו נפרד מהלוח/מהצנרת הראשית. מחיר עבודות חשמל/אינסטלציה נמדד לרוב לפי מספר הנקודות." },
    { term: "איטום (הידרואיזולציה)", def: "ציפוי/יריעה שמונעים חדירת מים דרך רצפה/קיר — קריטי בחדרי רטובים ובמרפסות. איטום לקוי הוא הגורם השכיח ביותר לנזקי מים אחרי שיפוץ." },
    { term: "ריצוף בהדבקה מול ריצוף בטיט מלא", def: "הדבקה = הנחת אריחים ישירות על גבי הריצוף הקיים (מהיר וזול, אך מעלה מעט את גובה הרצפה). טיט מלא = פירוק הריצוף הישן והנחה על שכבת מילוי — יקר יותר אך מדויק יותר." },
    { term: "R10 / דירוג החלקה", def: "תקן שמציין את רמת ההחלקה של אריח (R9 עד R13, ככל שהמספר גבוה יותר — האריח בטוח יותר בהליכה רטובה). מומלץ R10 ומעלה לחדרי רחצה ומרפסות." },
    { term: "דקור / דקורטיבי", def: "אריח או פס עיצובי שונה מהריצוף הראשי (צבע/טקסטורה שונים), משמש להדגשה — למשל פס דקור בקיר מקלחון." },
    { term: "פרופיל אלומיניום", def: "מסגרת האלומיניום שממנה בנויים חלונות/דלתות הזזה. סוג הפרופיל (רגיל/תרמי) משפיע על מחיר ועל בידוד תרמי-אקוסטי." },
    { term: "תריס גלילה חשמלי", def: "תריס המופעל במנוע חשמלי (לא בחבל/מוט). המחיר תלוי במשקל התריס ובגודל הפתח, ודורש נקודת חשמל ייעודית." },
    { term: "טריקה שקטה (Soft Close)", def: "מנגנון בפרזול (בציר דלת ארון או במסילת מגירה) שמאט את הסגירה למניעת רעש וחבטה — כמעט סטנדרט במטבחים כיום." },
    { term: "פרזול", def: "כלל האביזרים המכניים הנסתרים בריהוט/ארונות: צירים, מסילות, ידיות, מנגנוני פתיחה. איכות הפרזול משפיעה מאוד על אורך החיים של הארון." },
    { term: "CNC (חיתוך ממוחשב)", def: "טכנולוגיית ייצור שמאפשרת חיתוך מדויק של חומרים (עץ, אבן, זכוכית) לפי קובץ דיגיטלי — נפוצה במטבחי פרימיום לעיצובים מורכבים." },
    { term: "שפכטל", def: "חומר מילוי חלק המשמש להשוואת קירות/תקרות לפני צביעה, לרוב אחרי עבודות גבס או תיקוני טיח." },
    { term: "רולקה", def: "פס גימור דקורטיבי (לרוב גבס או פוליסטירן) בין קיר לתקרה, מסתיר את קו החיבור ומעניק מראה מסיים." },
    { term: "בדק בית", def: "בדיקה מקצועית (לרוב ע\"י מהנדס) של מצב הדירה/מבנה — שימושית גם *לפני* שיפוץ כדי לגלות בעיות נסתרות (רטיבות, סדקים) לפני שמתחילים." },
    { term: "תמיכה זמנית (הנעה)", def: "קורות/עמודי פלדה זמניים שמונעים קריסה בזמן פתיחת קיר נושא, עד ליציקת קורה קבועה — שלב הכרחי בעבודות הריסה מבניות." },
  ],
  stages: [
    { title: "תכנון ועיצוב", duration: "1-4 שבועות", desc: "בחירת קונספט, חומרים, תקציב ראשוני, כתב כמויות." },
    { title: "היתרים (אם נדרש)", duration: "עד כמה שבועות", desc: "שינויים מבניים, ממ\"ד, או חזית עשויים לדרוש היתר מהעירייה." },
    { title: "הריסה ופינוי", duration: "2-5 ימים", desc: "פירוק ריצוף/קירות ישנים ופינוי פסולת בניין." },
    { title: "אינסטלציה וחשמל (תשתיות)", duration: "1-2 שבועות", desc: "העברת קווי מים/ביוב/חשמל בקירות ורצפה, לפני הסגירה." },
    { title: "טיח, גבס והנמכות", duration: "1-2 שבועות", desc: "כולל זמן ייבוש בין שכבות." },
    { title: "ריצוף וחיפוי", duration: "1-3 שבועות", desc: "תלוי בשטח ובמורכבות (אלכסונים/פרקטים אורכים יותר)." },
    { title: "מטבח, ארונות ונגרות אומן", duration: "2-6 שבועות", desc: "כולל זמן ייצור אצל הספק, לרוב מקביל לשלבים אחרים — כדאי להזמין מוקדם." },
    { title: "צביעה וגימורים", duration: "1 שבוע", desc: "לאחר שכל העבודות ה'מלכלכות' הסתיימו." },
    { title: "התקנות סופיות וניקיון", duration: "2-4 ימים", desc: "כלים סניטריים, גופי תאורה, אביזרים, ניקיון בנייה לפני מסירה." },
  ],
  checklist: [
    { id: "permit", text: "בדקתי אם נדרש היתר בנייה (שינויים מבניים, ממ\"ד, חזית)" },
    { id: "neighbors", text: "הודעתי לשכנים/ועד הבית על מועדי העבודה הצפויים" },
    { id: "insurance", text: "בדקתי כיסוי ביטוחי לפרויקט (נזקי צד ג', ביטוח קבלן)" },
    { id: "housing", text: "תיאמתי מקום מגורים חלופי לתקופת השיפוץ (אם צריך)" },
    { id: "surveyor", text: "הזמנתי מודד מוסמך למדידה מקצועית" },
    { id: "longlead", text: "הזמנתי מראש פריטים עם זמן אספקה ארוך (מטבח, כלים סניטריים, אריחים מיובאים)" },
    { id: "access", text: "וידאתי גישה/חניה נוחה לקבלנים ולהובלות" },
    { id: "photos", text: "צילמתי את הדירה לפני תחילת העבודה (למקרה של מחלוקת עתידית)" },
    { id: "furniture", text: "פיניתי/הגנתי על רהיטים ותכולה מאבק ולכלוך" },
    { id: "utilities", text: "תיאמתי ניתוק/חיבור זמני של מים וחשמל בזמן הצורך" },
    { id: "budget_reserve", text: "שריינתי רזרבה תקציבית של 10%-15% לבלת\"מים" },
    { id: "contract", text: "יש לי חוזה כתוב עם הקבלן, כולל לוח תשלומים לפי התקדמות בפועל" },
  ],
  proQuestions: [
    {
      role: "קבלן שיפוצים",
      questions: [
        "אפשר לראות 2-3 פרויקטים קודמים ולדבר עם הלקוחות?",
        "יש לך רישיון קבלן רשום? באיזה סיווג?",
        "מי בדיוק יהיה באתר בפועל — אתה, או קבלני משנה?",
        "מה מבנה התשלומים המוצע, ולפי איזה קצב התקדמות?",
        "מה קורה אם מתגלה בעיה בלתי צפויה (למשל בהריסה)?",
      ],
    },
    {
      role: "חשמלאי",
      questions: [
        "יש רישיון חשמלאי בתוקף (ולאיזו דרגה)?",
        "האם תינתן תעודת בדיקת חשמלאי בודק בסיום?",
        "כמה נקודות/שקעים כלולים במחיר, וכמה עולה נקודה נוספת?",
      ],
    },
    {
      role: "אינסטלטור",
      questions: [
        "האם העבודה כוללת גם איטום, או שזה סעיף נפרד?",
        "איזה סוג צנרת בשימוש (PEX/נחושת) ולמה?",
        "כמה זמן האחריות על העבודה עצמה (לא רק על המוצרים)?",
      ],
    },
    {
      role: "חברת מטבחים",
      questions: [
        "מה זמן הייצור וההתקנה בפועל מרגע ההזמנה?",
        "מה כלול במחיר (פרזול, חשמל, הובלה, התקנה) ומה בתוספת תשלום?",
        "מה קורה אם מידה בשטח לא תואמת לתוכנית?",
      ],
    },
    {
      role: "מעצב/ת פנים",
      questions: [
        "האם הליווי כולל פיקוח עליון באתר, ובאיזו תדירות?",
        "איך מתומחר שינוי תוכנית באמצע הפרויקט?",
        "האם יש עמלה/עמלת ספקים על מוצרים שנרכשים דרך ההמלצה?",
      ],
    },
  ],
  savingsTips: [
    "בחירת גודל אריח סטנדרטי (60×60 או 80×80 ס\"מ) במקום אריחי ענק או ריצוף באלכסון — חוסכת 30%-50% מעלות העבודה, ומקטינה את הפחת.",
    "רכישה מוקדמת של כלים סניטריים, אריחים ואביזרי תאורה 'נועלת' את המחיר ומונעת חשיפה לעליות מחיר עתידיות.",
    "פריסת תשלומים לפי התקדמות פיזית (לא לפי זמן) מגנה מפני תשלום על עבודה שטרם בוצעה.",
    "שריון רזרבה תקציבית של 10%-15% מונע עצירת פרויקט באמצע עקב חריגה תקציבית.",
    "הצמדת חוזה הקבלן למדד תשומות הבנייה (או תקרה מוגדרת) מגנה משני הצדדים מפני תנודתיות מחירים.",
    "איחוד הזמנות אצל ספק אחד (למשל כל הכלים הסניטריים) לרוב מזכה בהנחת כמות.",
  ],
  handoverChecklist: [
    { id: "h_leaks", text: "בדקתי שאין נזילות מתחת לכיורים, מאחורי האסלה ובחיבורי המזגן" },
    { id: "h_doors", text: "כל הדלתות והחלונות נפתחים/נסגרים חלק, בלי חריקה או תקיעות" },
    { id: "h_tiles", text: "בדקתי את הריצוף לאורך קו האור (אריחים שקועים/בולטים, פוגות עקומות)" },
    { id: "h_electric", text: "בדקתי שכל השקעים, המתגים וגופי התאורה עובדים כנדרש" },
    { id: "h_paint", text: "בדקתי את איכות הצבע בזוויות ובקרוב לחלונות (כתמים, פספוסים)" },
    { id: "h_grout", text: "הפוגות בחדרי הרטובים אחידות, נקיות, ואטומות היטב" },
    { id: "h_appliances", text: "כל מוצרי החשמל/המטבח מותקנים ועובדים (כולל בדיקת חום/קירור)" },
    { id: "h_keys", text: "קיבלתי את כל המפתחות, השלטים, וההוראות הפעלה של המערכות" },
    { id: "h_warranty", text: "קיבלתי בכתב את תעודות האחריות על עבודה ועל מוצרים" },
    { id: "h_leftover", text: "וידאתי שכל פסולת הבנייה והציוד של הקבלן פונו מהדירה" },
    { id: "h_final_payment", text: "התשלום הסופי משולם רק אחרי שכל הליקויים שנמצאו תוקנו" },
  ],
  maintenance: [
    { material: "גרניט פורצלן", tip: "ניקוי שוטף במים ודטרגנט נייטרלי; להימנע מחומרים חומציים/מלבינים שעלולים לפגוע בפוגה." },
    { material: "אבן טבעית (שיש/גרניט)", tip: "לאטום מחדש כל 1-2 שנים; לנגב נוזלים חומציים (יין, לימון) מיד כדי למנוע כתמים." },
    { material: "פרקט/למינציה", tip: "לנקות במטלית לחה בלבד (לא רטובה), ולהניח פדים מתחת לרגלי רהיטים למניעת שריטות." },
    { material: "כיורים/ברזים מנירוסטה", tip: "ניגוב יבש אחרי שימוש מונע כתמי מים קשים; להימנע מצמר פלדה שיוצר שריטות." },
    { material: "זכוכית (מקלחון/מראות)", tip: "ניקוי שבועי במסיר אבנית מונע הצטברות סיד, במיוחד באזורים עם מים קשים." },
    { material: "משטחי אבן קיסר/קוורץ", tip: "עמידים לכתמים אך רגישים לחום ישיר — תמיד להשתמש בתחתית לסירים חמים." },
    { material: "ארונות עם חיפוי צבע (שלייפלק)", tip: "רגישים לשריטות מחומרי ניקוי אגרסיביים — מטלית רכה ומים בלבד." },
  ],
  faq: [
    { q: "כמה זמן לפני שרוצים להתחיל כדאי להזמין מודד/מעצב?", a: "מומלץ 2-3 חודשים מראש לפחות, בעיקר אם יש צורך בהיתרים או בהזמנת מטבח (זמני ייצור ארוכים)." },
    { q: "האם אפשר לגור בדירה בזמן שיפוץ יסודי?", a: "טכנית אפשר, אבל לא מומלץ בשיפוץ הכולל הריסה/אבק כבד — מומלץ לתכנן מקום מגורים חלופי לפחות לחלק מהתקופה." },
    { q: "מי אחראי אם קבלן משנה קלקל משהו?", a: "באחריות הקבלן הראשי כלפיכם, גם אם בפועל ביצע קבלן משנה — לכן חשוב חוזה כתוב מול קבלן אחד אחראי." },
    { q: "האם המחירים באפליקציה כוללים מע\"מ?", a: "המחירים הבסיסיים בקטגוריות הם לפני מע\"מ; לוח הסיכום מציג גם את הסכום כולל מע\"מ (17%) בנפרד." },
    { q: "מה עושים אם התקציב חורג באמצע הפרויקט?", a: "לכן קיימת המלצה לרזרבה של 10%-15% מראש. אם היא לא מספיקה, כדאי לעצור ולתעדף מחדש איזה סעיפים חיוניים לעומת סעיפי גימור שאפשר לדחות." },
  ],
  documentsToKeep: [
    "חוזה חתום מול הקבלן/בעלי המקצוע, כולל נספח כתב הכמויות",
    "כל הצעות המחיר שהתקבלו (גם אלו שלא נבחרו — לתיעוד)",
    "קבלות/חשבוניות על כל רכישה ותשלום",
    "תעודות אחריות על מוצרים ועל עבודה",
    "תוכניות/היתרים אם היו שינויים מבניים",
    "תמונות 'לפני' ו'אחרי' לכל שלב מרכזי",
    "פרטי קשר של כל בעלי המקצוע שעבדו בפרויקט, לצורך פנייה עתידית",
  ],
  suppliers: [
    {
      category: "עבודות אלומיניום",
      companies: [
        { name: "קליל (Klil)", note: "היצרנית הוותיקה והגדולה בישראל למערכות אלומיניום (כ-70 שנה בשוק) — חלונות, דלתות, קירות מסך ותריסים במגוון סגנונות (באוהאוס, בלגי ועוד)." },
        { name: "יורוליין (Euroline)", note: "מתמחה במערכות 'מינימל' פרימיום — דלתות הזזה ומחיצות זכוכית עם פרופיל צר ומסילות נסתרות." },
      ],
    },
    {
      category: "כלים סניטריים, ברזים וריצוף",
      companies: [
        { name: "חמת (Hamat)", note: "יצרנית הברזים הוותיקה והגדולה בישראל, ומייצרת גם כלים סניטריים (אסלות, כיורים)." },
        { name: "חרסה (Harsa)", note: "יצרנית ישראלית של כלים סניטריים מחרס (אסלות, כיורים)." },
        { name: "פריד מאיר", note: "רשת שמייבאת ומשווקת מותגים בינלאומיים לריצוף, חיפוי וכלים סניטריים (כגון Roca ו-Colorker הספרדיות), לצד מותגים מקומיים." },
      ],
    },
    {
      category: "שיש ומשטחי עבודה",
      companies: [
        { name: "אבן קיסר (Caesarstone)", note: "חברה ישראלית גלובלית (נסחרת בנאסד\"ק) שפיתחה את משטחי הקוורץ המהונדס — הסטנדרט המוכר ביותר למשטחי מטבח בישראל." },
        { name: "Silestone (קוסנטינו, ספרד)", note: "מתחרה בינלאומי מוביל בתחום משטחי הקוורץ." },
        { name: "KStone", note: "חלופה ישראלית משתלמת יותר, באיכות דומה למותגים המובילים." },
      ],
    },
    {
      category: "מיזוג אוויר",
      companies: [
        { name: "תדיראן (Tadiran)", note: "בסקרי טכנאי מיזוג חוזרת ומדורגת ראשונה באמינות שנה אחר שנה." },
        { name: "אלקטרה (Electra)", note: "יצרנית ישראלית ותיקה, נחשבת חסכונית ועמידה." },
        { name: "מיצובישי (Mitsubishi) / הייסנס (Hisense)", note: "מותגים בינלאומיים פופולריים בישראל, כולל דגמי אינוורטר וWi-Fi." },
      ],
    },
    {
      category: "חשמל חכם ואבטחה",
      companies: [
        { name: "imou", note: "מותג נפוץ ונגיש למצלמות אבטחה ואינטרקום חכם עם אפליקציה." },
      ],
      note: "לב הענף הזה הוא חברות התקנה מקומיות (לא רק יצרן ציוד) — כדאי לבחור מתקין מורשה עם אחריות על השירות, לא רק על החומרה.",
    },
    {
      category: "מוצרי חשמל למטבח",
      companies: [
        { name: "בוש (Bosch)", note: "מהמותגים המוכרים והנפוצים ביותר בישראל למוצרי חשמל למטבח (תנורים, כיריים, מדיחים)." },
        { name: "AEG", note: "מותג פרימיום אירופאי, נפוץ אצל אותם יבואנים שמביאים את Bosch." },
        { name: "סמסונג (Samsung)", note: "נפוץ במיוחד במקררים ובמכשירים חכמים (Wi-Fi)." },
      ],
    },
  ],
};

// Maps each estimator category name to a short list of relevant supplier
// names, used as autocomplete suggestions in the procurement tracker's
// "supplier" field. Categories not listed here simply get no suggestions —
// free text still works normally.
const SUPPLIER_SUGGESTIONS = {
  "עבודות אלומניום": ["קליל (Klil)", "יורוליין (Euroline)"],
  'כלים סנטירים | ריצופים | חיפויים': ["חמת (Hamat)", "חרסה (Harsa)", "פריד מאיר"],
  "שיש": ["אבן קיסר (Caesarstone)", "Silestone (קוסנטינו)", "KStone"],
  "מיזוג אוויר": ["תדיראן (Tadiran)", "אלקטרה (Electra)", "מיצובישי (Mitsubishi)", "הייסנס (Hisense)"],
  'חשמל חכם | אבטחה': ["imou"],
  "מוצרי חשמל": ["בוש (Bosch)", "AEG", "סמסונג (Samsung)"],
};


const fmt = (n) =>
  Math.round(n || 0).toLocaleString("he-IL", { maximumFractionDigits: 0 });

// 2026 price-adjustment: multiplies a category's base (2024) prices by a documented
// inflation factor. See DATA.priceAdjustment2026.note for methodology/sources.
function catMult(categoryName, enabled) {
  if (!enabled) return 1;
  const cfg = DATA.priceAdjustment2026 || {};
  const specific = cfg.categories ? cfg.categories[categoryName] : undefined;
  return specific ?? cfg.default ?? 1;
}

// Categories where a higher floor / no elevator / no truck access nearby
// genuinely increases cost: demolition & waste removal (carried out by hand),
// and delivery of heavy materials (tiles, marble, aluminum frames, kitchen
// carpentry).
const FLOOR_SENSITIVE_CATEGORIES = new Set([
  "קבלן שיפוצים",
  "כלים סנטירים | ריצופים | חיפויים",
  "שיש",
  "מטבח",
  "עבודות אלומניום",
  "נגרות אומן",
]);

// floorAccess: { floor: number, hasElevator: bool, hasParking: bool }
// Surcharge is capped so it never more than doubles a category's cost.
function floorAccessMult(categoryName, floorAccess) {
  if (!floorAccess || !FLOOR_SENSITIVE_CATEGORIES.has(categoryName)) return 1;
  const floor = Math.max(0, floorAccess.floor || 0);
  const perFloor = floorAccess.hasElevator ? 0.01 : 0.05;
  let mult = 1 + floor * perFloor;
  if (!floorAccess.hasParking) mult += 0.1;
  return Math.min(mult, 2);
}

// Sums the SELECTED quote amount across every procurement item linked to a
// given estimate category — this is the "real" price once actual quotes
// have come in, as an alternative to the tier-based estimate.
function actualCategoryTotal(categoryName, procurementItems) {
  return (procurementItems || [])
    .filter((it) => it.category === categoryName)
    .reduce((sum, it) => {
      const sel = it.quotes.find((q) => q.selected);
      return sum + (sel ? sel.amount : 0);
    }, 0);
}

// navigator.clipboard can silently fail inside sandboxed/embedded webviews
// (missing permission, non-secure context, etc). This tries the modern API
// first, falls back to the old execCommand trick, and reports failure
// honestly instead of pretending it worked.
async function copyTextRobust(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy method */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Converts a data: URL to a File object (needed for navigator.share).
function dataUrlToFile(dataUrl, filename) {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

// Opens the device's native share sheet (the same one used by every app) so
// the person can save the file straight into Google Drive, iCloud/Files,
// WhatsApp, email, etc. — whatever they have installed. This needs no
// backend, no API keys, and no Google Cloud project; it's the standard way
// web apps hand a file off to "the rest of the phone."
// Falls back to a plain download if the browser doesn't support file sharing
// (e.g. desktop Chrome, or being sandboxed inside an embedded webview).
async function shareOrDownloadFile(dataUrl, filename, title) {
  try {
    const file = dataUrlToFile(dataUrl, filename);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: title || filename });
      return "shared";
    }
  } catch (err) {
    if (err && err.name === "AbortError") return "cancelled"; // person closed the share sheet
    /* fall through to download */
  }
  try {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return "downloaded";
  } catch {
    return "failed";
  }
}

// Same idea as shareOrDownloadFile, but takes a Blob directly (for the CSV/
// PDF exports, which are already built as Blobs rather than data URLs).
async function shareOrDownloadBlob(blob, filename, title) {
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: title || filename });
      return "shared";
    }
  } catch (err) {
    if (err && err.name === "AbortError") return "cancelled";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return "downloaded";
}

// Downloads a UTF-8 CSV (opens fine in Excel/Sheets) — no external library
// needed, so this keeps working wherever this component is deployed.
function downloadCsv(filename, rows) {
  const escapeCell = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "\uFEFF" + rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  return shareOrDownloadBlob(blob, filename, filename);
}

// Downloads a formatted, print-ready HTML file. The person opens it and uses
// their browser's own "Print → Save as PDF" — this needs no PDF library and,
// unlike window.open()/print(), isn't blocked by popup blockers or sandboxed
// embedded views (it uses the exact same download mechanism as the CSV
// export, which is known to work).
function downloadPrintableHtml(filename, title, htmlBody) {
  const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      body { font-family: Assistant, Heebo, sans-serif; padding: 24px; color: #2B2622; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      h2 { font-size: 15px; margin: 18px 0 6px; color: #8A5A34; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
      th, td { text-align: right; padding: 6px 8px; border-bottom: 1px solid #E7DCCC; font-size: 13px; }
      th { color: #6B6259; font-weight: 600; }
      .total { font-weight: 700; font-size: 15px; margin-top: 8px; }
      .hint { background: #F6F1EA; border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 18px; }
      @media print { .hint { display: none; } }
    </style>
  </head><body>
    <div class="hint">💡 להמרה ל-PDF: לחצו Ctrl+P (או Cmd+P במק) ובחרו "שמירה כ-PDF" ביעד ההדפסה.</div>
    ${htmlBody}
  </body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  return shareOrDownloadBlob(blob, filename, title);
}

const TIERS = [
  { key: "low", label: "מנעד בינוני-נמוך", short: "נמוך" },
  { key: "mid", label: "מנעד בינוני", short: "בינוני" },
  { key: "high", label: "מנעד גבוה", short: "גבוה" },
];

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

function useInjectedFont() {
  useEffect(() => {
    if (document.getElementById("golden-formula-fonts")) return;
    const link = document.createElement("link");
    link.id = "golden-formula-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&family=Assistant:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

// ---- persistence helpers (artifact key-value storage; degrades gracefully if unavailable) ----
// quantities + per-category tier choices are updated together, so they're saved as one key.
// ---- Supabase-backed persistence ----
// Every project is one row in the `projects` table (see supabase/schema.sql).
// Row Level Security means a query only ever returns/affects rows owned by
// the signed-in user — so this layer doesn't need to check "whose data is
// this" itself; Postgres already enforces it.

// Photos need to know *which* user/project they belong to for the storage
// path, but the components that call savePhoto()/loadPhoto() are nested deep
// (PhotoField lives inside QuoteRow inside ProcurementItemCard...). Rather
// than threading ids through every layer, App sets this once per session.
let _storageUserId = null;
let _storageProjectId = null;
function setStorageContext(userId, projectId) {
  _storageUserId = userId;
  _storageProjectId = projectId;
}

async function loadProjectState(projectId) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("quantities, category_tiers, category_source, actual_area, floor_access, use2026")
      .eq("id", projectId)
      .single();
    if (error || !data) return null;
    return {
      quantities: data.quantities,
      categoryTiers: data.category_tiers,
      categorySource: data.category_source,
      actualArea: data.actual_area,
      floorAccess: data.floor_access,
      use2026: data.use2026,
    };
  } catch {
    return null;
  }
}
async function saveProjectState(projectId, state) {
  try {
    await supabase
      .from("projects")
      .update({
        quantities: state.quantities,
        category_tiers: state.categoryTiers,
        category_source: state.categorySource,
        actual_area: state.actualArea,
        floor_access: state.floorAccess,
        use2026: state.use2026,
      })
      .eq("id", projectId);
  } catch {
    /* no-op: persistence is a nice-to-have, never block the UI on it */
  }
}
async function clearProjectState(projectId) {
  try {
    await supabase
      .from("projects")
      .update({
        quantities: {},
        category_tiers: {},
        category_source: {},
        actual_area: null,
        floor_access: { floor: 0, hasElevator: true, hasParking: true },
      })
      .eq("id", projectId);
  } catch {}
}

// ---- procurement tracker persistence ----
async function loadProcurement(projectId) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("procurement_items")
      .eq("id", projectId)
      .single();
    if (error || !data) return null;
    return data.procurement_items;
  } catch {
    return null;
  }
}
async function saveProcurement(projectId, items) {
  try {
    await supabase.from("projects").update({ procurement_items: items }).eq("id", projectId);
  } catch {}
}
async function clearProcurement(projectId) {
  try {
    await supabase.from("projects").update({ procurement_items: [] }).eq("id", projectId);
  } catch {}
}
async function clearStorageKey() {
  /* no-op under Supabase — deleting the project row (see deleteProject)
     already removes everything in one shot. Kept only so any leftover call
     site doesn't throw. */
}

// The list of client projects — one row per project, already scoped to the
// signed-in user by Row Level Security.
async function loadProjectsList() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("id, client_name, room_type, disclaimer_accepted, created_at")
      .order("created_at", { ascending: false });
    if (error || !data) return null;
    return data.map((p) => ({
      id: p.id,
      clientName: p.client_name,
      roomType: p.room_type,
      disclaimerAccepted: p.disclaimer_accepted,
      createdAt: p.created_at,
    }));
  } catch {
    return null;
  }
}
async function createProjectRow(userId, clientName, roomType) {
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, client_name: clientName, room_type: roomType })
    .select("id, client_name, room_type, disclaimer_accepted, created_at")
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    clientName: data.client_name,
    roomType: data.room_type,
    disclaimerAccepted: data.disclaimer_accepted,
    createdAt: data.created_at,
  };
}
async function deleteProjectRow(projectId) {
  try {
    await supabase.from("projects").delete().eq("id", projectId);
    return true;
  } catch {
    return false;
  }
}
async function acceptDisclaimerRow(projectId) {
  try {
    await supabase.from("projects").update({ disclaimer_accepted: true }).eq("id", projectId);
  } catch {}
}

// Photos go to Supabase Storage (bucket "project-photos"), one real file per
// photo, instead of base64 text crammed into a key/value store — this is
// what actually removes the old 5MB-per-item ceiling.
function photoStoragePath(photoKey) {
  return `${_storageUserId}/${_storageProjectId}/${photoKey}.jpg`;
}
async function savePhoto(photoKey, dataUrl) {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const path = photoStoragePath(photoKey);
    const { error } = await supabase.storage
      .from("project-photos")
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    return !error;
  } catch {
    return false;
  }
}
async function loadPhoto(photoKey) {
  try {
    const path = photoStoragePath(photoKey);
    const { data, error } = await supabase.storage.from("project-photos").download(path);
    if (error || !data) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(data);
    });
  } catch {
    return null;
  }
}
async function deletePhoto(photoKey) {
  try {
    await supabase.storage.from("project-photos").remove([photoStoragePath(photoKey)]);
  } catch {}
}

// Standalone documents added directly to the document library (not attached
// to any specific quote) — e.g. a permit, a warranty booklet, a floor plan.
async function loadGeneralDocs(projectId) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("general_docs")
      .eq("id", projectId)
      .single();
    if (error || !data) return null;
    return data.general_docs;
  } catch {
    return null;
  }
}
async function saveGeneralDocs(projectId, docs) {
  try {
    await supabase.from("projects").update({ general_docs: docs }).eq("id", projectId);
  } catch {}
}

// Downscales a photo before storing it (receipts/quote photos don't need to
// be full camera resolution) so it stays well under the per-key size limit.
function compressImageFile(file, maxDim = 700, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("קריאת הקובץ נכשלה"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("טעינת התמונה נכשלה"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const STATUS_OPTIONS = [
  { key: "quoted", label: "התקבלה הצעה" },
  { key: "ordered", label: "הוזמן" },
  { key: "delivered", label: "סופק" },
];

// Builds a Google Calendar "quick add" link for an all-day event on the given
// YYYY-MM-DD date. This needs no login/OAuth from the app itself — it opens
// Google Calendar with the event pre-filled, and the person just taps Save.
function googleCalendarUrl(title, dateStr, details) {
  if (!dateStr) return null;
  const start = dateStr.replace(/-/g, "");
  const endDate = new Date(dateStr);
  endDate.setDate(endDate.getDate() + 1);
  const end = endDate.toISOString().slice(0, 10).replace(/-/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details: details || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// If CALENDAR_BACKEND_URL is configured, this creates the event directly in
// Google Calendar with one tap (no Google confirmation screen each time).
// Otherwise it falls back to the no-setup "quick add" link — the app is
// fully usable either way.
function CalendarAddButton({ title, dateStr, details }) {
  const [state, setState] = useState("idle"); // idle | saving | done | error

  if (!CALENDAR_BACKEND_URL) {
    return (
      <a
        href={googleCalendarUrl(title, dateStr, details)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold ${FOCUS_RING}`}
        style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
      >
        📅 הוספה ליומן Google
      </a>
    );
  }

  const handleClick = async () => {
    setState("saving");
    try {
      const res = await fetch(`${CALENDAR_BACKEND_URL}/api/create-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dateStr, details }),
      });
      if (!res.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  };

  const labels = {
    idle: "📅 הוספה אוטומטית ליומן",
    saving: "מוסיף ליומן...",
    done: "נוסף ליומן ✓",
    error: "נכשל — נסי שוב",
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === "saving" || state === "done"}
      className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold ${FOCUS_RING}`}
      style={{ color: state === "error" ? "#9C4A24" : C.accentText, fontFamily: "Assistant, sans-serif" }}
    >
      {labels[state]}
    </button>
  );
}

function TierPicker({ value, onChange, label, size = "normal" }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex gap-1 rounded-xl ${size === "small" ? "p-0.5" : "p-1 mb-3"}`}
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {TIERS.map((t) => {
        const selected = value === t.key;
        return (
          <button
            key={t.key}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.key)}
            className={`flex-1 rounded-lg font-bold transition-colors ${
              size === "small" ? "py-1.5 min-h-[32px] text-[11px]" : "py-2 min-h-[40px] text-xs"
            } ${FOCUS_RING}`}
            style={{
              background: selected ? C.accent : "transparent",
              color: selected ? C.cardAlt : C.textMuted,
              fontFamily: "Assistant, sans-serif",
            }}
          >
            {t.short}
          </button>
        );
      })}
    </div>
  );
}

function RoomTypeCards({ onSelect }) {
  const cards = Object.keys(DATA.meta)
    .map((key) => ({ key, ...DATA.meta[key] }))
    .sort((a, b) => (a.rooms || 0) - (b.rooms || 0));
  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      {cards.map((c) => (
        <button
          key={c.key}
          onClick={() => onSelect(c.key)}
          className={`text-right rounded-2xl p-6 transition-all duration-200 border hover:-translate-y-0.5 ${FOCUS_RING}`}
          style={{
            background: C.card,
            borderColor: C.border,
            boxShadow: "0 1px 3px rgba(43,38,34,0.06)",
            ringColor: C.accent,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xl font-bold"
              style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
            >
              {c.title}
            </span>
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: C.accentSoft, color: C.accentText }}
              aria-hidden="true"
            >
              {c.rooms}
            </span>
          </div>
          <p
            className="text-sm mt-2"
            style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
          >
            {c.subtitle}
          </p>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
          >
            {c.description}
          </p>
        </button>
      ))}
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-8 text-center">
      <p
        className="tracking-[0.35em] text-xs mb-3"
        style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
      >
        שמרית אוחיון · תכנון ועיצוב פנים
      </p>
      <h1
        className="text-3xl sm:text-4xl font-extrabold mb-3"
        style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
      >
        שיפוץ בקלות
      </h1>
      <span
        className="inline-block text-[11px] font-bold rounded-full px-3 py-1 mb-3"
        style={{ background: C.accentSoft, color: C.accentText, fontFamily: "Assistant, sans-serif" }}
      >
        מחירים מעודכנים לשנת 2026
      </span>
    </div>
  );
}

// Each project belongs to a client, so two different clients renovating the
// same apartment size never share (and overwrite) each other's data — all
// storage is namespaced by project.id, not just the room type.
function ProjectListScreen({ projects, onOpenProject, onCreateProject, onDeleteProject }) {
  const [creating, setCreating] = useState(false);
  const [clientName, setClientName] = useState("");

  if (creating) {
    return (
      <div
        dir="rtl"
        lang="he"
        className="min-h-screen flex flex-col items-center px-5 py-14"
        style={{ background: C.bg }}
      >
        <PageHeader />
        <p
          className="text-sm mb-4 text-center max-w-md"
          style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
        >
          פרויקט חדש — קודם שם הלקוח/ה, ואז סוג הדירה.
        </p>
        <label htmlFor="client-name" className="sr-only">
          שם הלקוח
        </label>
        <input
          id="client-name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="שם הלקוח/ה (למשל: משפחת כהן)"
          aria-label="שם הלקוח"
          className={`w-full max-w-md rounded-xl px-4 py-3 min-h-[44px] text-sm mb-5 ${FOCUS_RING}`}
          style={{ border: `1px solid ${C.border}`, background: C.card, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
        />
        <RoomTypeCards
          onSelect={(roomType) => {
            onCreateProject(clientName.trim() || "פרויקט ללא שם", roomType);
          }}
        />
        <button
          onClick={() => setCreating(false)}
          className={`mt-6 text-sm font-semibold ${FOCUS_RING}`}
          style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
        >
          ביטול, חזרה לרשימת הפרויקטים
        </button>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      lang="he"
      className="min-h-screen flex flex-col items-center px-5 py-14"
      style={{ background: C.bg }}
    >
      <PageHeader />

      <div className="w-full max-w-md">
        {projects.length === 0 ? (
          <p
            className="text-sm text-center mb-6 leading-relaxed"
            style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
          >
            עדיין אין פרויקטים. כל פרויקט שייך ללקוח/ה ספציפי/ת, כך שאפשר לנהל
            כמה לקוחות עם אותו סוג דירה בלי שהנתונים שלהם יתערבבו.
          </p>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {projects.map((p) => {
              const meta = DATA.meta[p.roomType];
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ background: C.card, borderColor: C.border }}
                >
                  <button
                    onClick={() => onOpenProject(p.id)}
                    className={`w-full text-right p-4 flex items-center justify-between gap-3 ${FOCUS_RING}`}
                  >
                    <div className="min-w-0">
                      <p className="text-base font-bold truncate" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
                        {p.clientName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                        {meta ? meta.title : p.roomType}
                      </p>
                    </div>
                    <span
                      className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: C.accentSoft, color: C.accentText }}
                      aria-hidden="true"
                    >
                      {meta ? meta.rooms : "?"}
                    </span>
                  </button>
                  <button
                    onClick={() => onDeleteProject(p.id, p.clientName)}
                    aria-label={`מחיקת פרויקט ${p.clientName}`}
                    className={`w-full text-xs py-2 border-t ${FOCUS_RING}`}
                    style={{ color: "#9C4A24", borderColor: C.borderSoft, fontFamily: "Assistant, sans-serif" }}
                  >
                    מחיקת פרויקט
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => setCreating(true)}
          className={`w-full py-4 min-h-[48px] rounded-2xl text-base font-bold ${FOCUS_RING}`}
          style={{ background: C.accent, color: C.cardAlt, fontFamily: "Heebo, sans-serif" }}
        >
          + פרויקט חדש
        </button>
      </div>

      <p
        className="mt-10 text-xs text-center max-w-sm"
        style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
      >
        הכלי מבוסס על מחירי בסיס 2024, מותאם למחירי 2026, ומיועד לאומדן ראשוני
        בלבד — לא להצעת מחיר מחייבת.
      </p>
    </div>
  );
}

function DisclaimerModal({ onAccept, onBack }) {
  const [checked, setChecked] = useState(false);
  const titleId = useId();
  return (
    <div
      dir="rtl"
      lang="he"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(43,38,34,0.55)" }}
    >
      <div
        className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[88vh] flex flex-col"
        style={{ background: C.cardAlt }}
      >
        <div className="px-6 pt-6 pb-3 border-b" style={{ borderColor: C.borderSoft }}>
          <h2
            id={titleId}
            className="text-lg font-bold"
            style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
          >
            לפני שממשיכים — כדאי לדעת
          </h2>
        </div>
        <div className="px-6 py-4 overflow-y-auto text-sm leading-relaxed" style={{ fontFamily: "Assistant, sans-serif" }}>
          <p className="mb-4" style={{ color: C.textMuted }}>
            {DATA.disclaimerIntro}
          </p>
          <div className="rounded-xl p-4 mb-2" style={{ background: C.bg }}>
            <p className="font-semibold mb-2" style={{ color: C.text }}>
              תקנון רכישת המוצר הדיגיטלי
            </p>
            {DATA.takanon.map((p, i) => (
              <p key={i} className="mb-2" style={{ color: C.textMuted }}>
                {p}
              </p>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t" style={{ borderColor: C.borderSoft }}>
          <label className="flex items-start gap-2 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className={`mt-1 w-5 h-5 shrink-0 ${FOCUS_RING}`}
            />
            <span className="text-sm" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
              קראתי ואני מאשר/ת שהאומדן מבוסס על מחירי 2024 המותאמים למחירי
              2026, אינו מחליף ייעוץ עם בעלי מקצוע, ואינו מהווה התחייבות
              כספית מצד הסטודיו לסכום השיפוץ בפועל, וכן את תנאי התקנון שלעיל.
            </span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className={`flex-1 py-3 min-h-[44px] rounded-xl text-sm font-semibold ${FOCUS_RING}`}
              style={{ background: "#F0EAE0", color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
            >
              חזרה
            </button>
            <button
              disabled={!checked}
              onClick={onAccept}
              className={`flex-1 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-opacity ${FOCUS_RING}`}
              style={{
                background: checked ? C.accent : "#D9C7B0",
                color: C.cardAlt,
                fontFamily: "Heebo, sans-serif",
                cursor: checked ? "pointer" : "not-allowed",
              }}
            >
              אישור והמשך לאומדן
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudioIntroCard() {
  const s = DATA.studio;
  return (
    <details
      className="rounded-2xl mb-4 overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.borderSoft}` }}
    >
      <summary
        className="p-4 text-sm font-bold cursor-pointer list-none flex items-center justify-between"
        style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
      >
        <span>אודות התהליך והסטודיו</span>
        <span className="text-xs font-normal" style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}>
          פתיחה
        </span>
      </summary>
      <div className="px-5 pb-5">
        <p
          className="text-sm leading-relaxed mb-3"
          style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
        >
          {DATA.planningIntro}
        </p>
        <div className="rounded-xl p-4" style={{ background: C.bg }}>
          <p
            className="text-sm font-bold"
            style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
          >
            {s.founders ? `${s.name} · ${s.founders}` : s.name}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
          >
            {s.tagline}
          </p>
          <p
            className="text-xs mt-2 leading-relaxed"
            style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
          >
            {s.note}
          </p>
          {s.url && (
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-block mt-3 text-xs font-semibold underline ${FOCUS_RING}`}
              style={{ color: C.accentText }}
            >
              לאתר הסטודיו ולפגישת ייעוץ
            </a>
          )}
        </div>
      </div>
    </details>
  );
}

function ItemRow({ item, qty, onChange, activeTier, priceMult = 1, onFocusChange }) {
  const showTiers = TIERS.map((t) => qty * (item[t.key] || 0) * priceMult);
  const isLump = item.unit === "lump" || item.unit === "קומפ'";
  const inputId = useId();
  return (
    <div className="py-3 border-b last:border-b-0" style={{ borderColor: C.borderSoft }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {item.group && (
            <p
              className="text-[11px] mb-0.5"
              style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
            >
              {item.group}
            </p>
          )}
          <label
            htmlFor={inputId}
            className="text-sm font-semibold leading-snug block"
            style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}
          >
            {item.name}
          </label>
          {item.notes && (
            <details className="mt-1">
              <summary
                className="text-[12px] cursor-pointer font-medium"
                style={{ color: C.accentText }}
              >
                הערה מקצועית
              </summary>
              <p
                className="text-[12px] mt-1 leading-relaxed"
                style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
              >
                {item.notes}
              </p>
            </details>
          )}
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5">
            {isLump ? (
              <label className="flex items-center gap-1.5 cursor-pointer min-h-[44px] px-1">
                <input
                  type="checkbox"
                  checked={qty > 0}
                  onChange={(e) => onChange(e.target.checked ? 1 : 0)}
                  aria-label={`לכלול את הפריט ${item.name}`}
                  className={`w-5 h-5 ${FOCUS_RING}`}
                />
                <span
                  className="text-xs"
                  style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
                >
                  לכלול
                </span>
              </label>
            ) : (
              <>
                <input
                  id={inputId}
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    onChange(Number.isFinite(v) && v >= 0 ? v : 0);
                  }}
                  onFocus={(e) => {
                    onFocusChange && onFocusChange(true);
                    // On mobile the on-screen keyboard can cover the field
                    // being edited — bring it into view. Retried a few times
                    // since the keyboard/layout animation timing varies a
                    // lot across embedded mobile browsers.
                    const el = e.target;
                    [50, 300, 600].forEach((delay) => {
                      setTimeout(() => {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, delay);
                    });
                  }}
                  onBlur={() => {
                    onFocusChange && onFocusChange(false);
                  }}
                  aria-label={`כמות (${item.unit}) עבור ${item.name}`}
                  className={`w-24 text-center rounded-lg py-2.5 text-base min-h-[44px] ${FOCUS_RING}`}
                  style={{
                    border: `1px solid ${C.border}`,
                    background: C.cardAlt,
                    color: C.text,
                    fontFamily: "Assistant, sans-serif",
                    fontSize: "16px",
                    scrollMarginTop: "96px",
                    scrollMarginBottom: "260px",
                  }}
                />
                <span
                  className="text-xs w-8"
                  style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
                >
                  {item.unit}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-2" aria-hidden={qty === 0}>
        {TIERS.map((t, i) => {
          const selected = activeTier === t.key;
          return (
            <div
              key={t.key}
              className="flex-1 rounded-lg py-1.5 text-center transition-colors"
              style={{
                background: selected ? C.accentSoft : C.bg,
                border: selected ? `1px solid ${C.accent}` : "1px solid transparent",
              }}
            >
              <p className="text-[11px]" style={{ color: selected ? C.accentText : C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                {t.short}
              </p>
              <p
                className="text-xs font-bold"
                style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
              >
                ₪{fmt(showTiers[i])}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryAccordion({
  category,
  quantities,
  onQtyChange,
  isOpen,
  onToggle,
  tier,
  onTierChange,
  use2026,
  onFocusChange,
  procurementItems,
  onSelectQuote,
  source,
  onSourceChange,
  floorAccess,
}) {
  const panelId = useId();
  const mult = catMult(category.name, use2026) * floorAccessMult(category.name, floorAccess);
  const chosenCount = category.items.filter(
    (it) => (quantities[it.id] ?? it.qty) > 0
  ).length;

  const totals = useMemo(() => {
    const t = { low: 0, mid: 0, high: 0 };
    category.items.forEach((it) => {
      const q = quantities[it.id] ?? it.qty;
      TIERS.forEach((tr) => {
        t[tr.key] += q * (it[tr.key] || 0) * mult;
      });
    });
    return t;
  }, [category, quantities, mult]);

  const linkedItems = (procurementItems || []).filter((it) => it.category === category.name && it.quotes.length > 0);
  const hasActualQuotes = linkedItems.length > 0;
  const actualTotal = actualCategoryTotal(category.name, procurementItems);
  const useActual = source === "actual" && hasActualQuotes;

  const tierLabel = TIERS.find((t) => t.key === tier).short;
  const displayedTotal = useActual ? actualTotal : totals[tier];

  return (
    <div
      className="rounded-2xl overflow-hidden mb-3"
      style={{ background: C.card, border: `1px solid ${C.borderSoft}` }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={`w-full flex items-center justify-between px-4 py-4 text-right ${FOCUS_RING}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            aria-hidden="true"
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs transition-transform"
            style={{
              background: C.accentSoft,
              color: C.accent,
              transform: isOpen ? "rotate(180deg)" : "none",
            }}
          >
            ▾
          </span>
          <span className="min-w-0 text-right">
            <span
              className="font-bold text-sm sm:text-base block truncate"
              style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
            >
              {category.name}
              {catMult(category.name, use2026) !== 1 && !useActual && (
                <span
                  className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 mr-1.5 align-middle"
                  style={{ background: C.accentSoft, color: C.accentText }}
                >
                  מחירי 2026 (+{Math.round((catMult(category.name, use2026) - 1) * 100)}%)
                </span>
              )}
              {floorAccessMult(category.name, floorAccess) !== 1 && !useActual && (
                <span
                  className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 mr-1.5 align-middle"
                  style={{ background: "#E4E9EF", color: "#3E5E8A" }}
                >
                  קומה/נגישות (+{Math.round((floorAccessMult(category.name, floorAccess) - 1) * 100)}%)
                </span>
              )}
              {useActual && (
                <span
                  className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 mr-1.5 align-middle"
                  style={{ background: "#DCEBDF", color: "#3E7A4A" }}
                >
                  מחיר בפועל
                </span>
              )}
            </span>
            <span
              className="text-[11px]"
              style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
            >
              {useActual
                ? "לפי הצעת מחיר שנבחרה"
                : `${chosenCount > 0 ? `${chosenCount} פריטים נבחרו · ` : ""}רמת גימור: ${tierLabel}`}
            </span>
          </span>
        </div>
        <span
          className="text-xs shrink-0 ml-2 font-semibold"
          style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
        >
          ₪{fmt(displayedTotal)}
        </span>
      </button>
      {isOpen && (
        <div id={panelId} className="px-4 pb-2" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
          {hasActualQuotes && (
            <div className="pt-3 mb-3 rounded-xl p-3" style={{ background: C.bg }}>
              <p className="text-[11px] mb-1.5 font-semibold" style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}>
                מקור המחיר לקטגוריה זו
              </p>
              <div className="flex gap-1 rounded-xl p-1 mb-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <button
                  onClick={() => onSourceChange("estimate")}
                  className={`flex-1 py-2 min-h-[36px] rounded-lg text-xs font-bold ${FOCUS_RING}`}
                  style={{
                    background: !useActual ? C.accent : "transparent",
                    color: !useActual ? C.cardAlt : C.textMuted,
                    fontFamily: "Assistant, sans-serif",
                  }}
                >
                  אומדן מחירון
                </button>
                <button
                  onClick={() => onSourceChange("actual")}
                  className={`flex-1 py-2 min-h-[36px] rounded-lg text-xs font-bold ${FOCUS_RING}`}
                  style={{
                    background: useActual ? "#3E7A4A" : "transparent",
                    color: useActual ? "#fff" : C.textMuted,
                    fontFamily: "Assistant, sans-serif",
                  }}
                >
                  הצעות מחיר בפועל
                </button>
              </div>

              {useActual && (
                <div>
                  {linkedItems.map((it) => (
                    <div key={it.id} className="mb-2 last:mb-0">
                      <p className="text-xs font-semibold mb-1" style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}>
                        {it.name || "(פריט רכש ללא שם)"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {it.quotes.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => onSelectQuote(it.id, q.id)}
                            className={`text-[11px] rounded-full px-2.5 py-1.5 ${FOCUS_RING}`}
                            style={{
                              background: q.selected ? "#3E7A4A" : C.card,
                              color: q.selected ? "#fff" : C.textMuted,
                              border: `1px solid ${q.selected ? "#3E7A4A" : C.border}`,
                              fontFamily: "Assistant, sans-serif",
                            }}
                          >
                            {q.supplier || "(ספק ללא שם)"} · ₪{fmt(q.amount)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] mt-2" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                    ניהול מלא של ההצעות (תשלומים, תמונות, תאריכים) בטאב "מעקב רכש".
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-1">
            <p
              className="text-[11px] mb-1.5"
              style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
            >
              רמת גימור לקטגוריה זו
            </p>
            <TierPicker
              value={tier}
              onChange={onTierChange}
              label={`רמת גימור עבור ${category.name}`}
              size="small"
            />
          </div>
          {category.intro && (
            <p
              className="text-xs leading-relaxed py-3"
              style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
            >
              {category.intro}
            </p>
          )}
          {category.items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              qty={quantities[it.id] ?? it.qty}
              onChange={(v) => onQtyChange(it.id, v)}
              activeTier={tier}
              priceMult={mult}
              onFocusChange={onFocusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryPanel({ categories, quantities, categoryTiers, use2026, floorAccess, onClose }) {
  const titleId = useId();
  const chosen = [];
  categories.forEach((c) => {
    const tier = categoryTiers[c.name] || "mid";
    const mult = catMult(c.name, use2026) * floorAccessMult(c.name, floorAccess);
    c.items.forEach((it) => {
      const q = quantities[it.id] ?? it.qty;
      if (q > 0) chosen.push({ ...it, q, cat: c.name, tier, mult });
    });
  });

  return (
    <div
      dir="rtl"
      lang="he"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(43,38,34,0.55)" }}
    >
      <div
        className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col"
        style={{ background: C.cardAlt }}
      >
        <div
          className="px-6 pt-5 pb-3 border-b flex items-center justify-between"
          style={{ borderColor: C.borderSoft }}
        >
          <h2
            id={titleId}
            className="text-lg font-bold"
            style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
          >
            תקציר הבחירות שלי ({chosen.length})
          </h2>
          <button
            onClick={onClose}
            className={`text-sm px-3 py-1.5 rounded-full min-h-[36px] ${FOCUS_RING}`}
            style={{ background: C.bg, color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
          >
            סגירה
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">
          {chosen.length === 0 ? (
            <p className="text-sm" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
              עדיין לא נבחרו פריטים. הזינו כמות בכל פריט שרלוונטי לפרויקט שלכם.
            </p>
          ) : (
            chosen.map((it) => (
              <div key={it.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: C.borderSoft }}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}>
                    {it.name}
                  </p>
                  <p className="text-[11px]" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                    {it.cat} · {it.q} {it.unit === "lump" ? "" : it.unit} · {TIERS.find((t) => t.key === it.tier).short}
                  </p>
                </div>
                <p className="text-xs font-bold shrink-0" style={{ color: C.accentText, fontFamily: "Heebo, sans-serif" }}>
                  ₪{fmt(it.q * it[it.tier] * it.mult)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, confirmLabel = "אישור", onConfirm, onCancel }) {
  const titleId = useId();
  return (
    <div
      dir="rtl"
      lang="he"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(43,38,34,0.55)" }}
    >
      <div className="w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5" style={{ background: C.cardAlt }}>
        <p id={titleId} className="text-sm leading-relaxed mb-4" style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}>
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-3 min-h-[44px] rounded-xl text-sm font-semibold ${FOCUS_RING}`}
            style={{ background: "#F0EAE0", color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
          >
            ביטול
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 min-h-[44px] rounded-xl text-sm font-bold ${FOCUS_RING}`}
            style={{ background: "#9C4A24", color: "#fff", fontFamily: "Assistant, sans-serif" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualCopyModal({ text, onClose }) {
  const titleId = useId();
  const taRef = useRef(null);
  useEffect(() => {
    if (taRef.current) {
      taRef.current.focus();
      taRef.current.select();
    }
  }, []);
  return (
    <div
      dir="rtl"
      lang="he"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(43,38,34,0.55)" }}
    >
      <div className="w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-5" style={{ background: C.cardAlt }}>
        <h2 id={titleId} className="text-base font-bold mb-2" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
          ההעתקה האוטומטית נחסמה — העתיקו ידנית
        </h2>
        <p className="text-xs mb-3" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
          זה קורה לפעמים בתצוגות מוטמעות. הטקסט כבר מסומן למטה — פשוט העתיקו אותו (לחיצה ארוכה ← העתקה).
        </p>
        <textarea
          ref={taRef}
          readOnly
          value={text}
          rows={8}
          className="w-full rounded-xl p-3 text-xs mb-3"
          style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontFamily: "monospace", fontSize: "13px" }}
        />
        <button
          onClick={onClose}
          className={`w-full py-2.5 min-h-[44px] rounded-xl text-sm font-bold ${FOCUS_RING}`}
          style={{ background: C.accent, color: C.cardAlt, fontFamily: "Assistant, sans-serif" }}
        >
          סגירה
        </button>
      </div>
    </div>
  );
}

function Dashboard({
  blendedTotal,
  uniformTotals,
  expanded,
  setExpanded,
  onOpenSummary,
  chosenCount,
  totalCount,
  onReset,
  onBulkSetTier,
  meta,
  categories,
  quantities,
  categoryTiers,
  use2026,
  floorAccess,
  hidden,
}) {
  const [copied, setCopied] = useState(false);
  const [manualCopyText, setManualCopyText] = useState(null);
  const blendedWithVat = blendedTotal * (1 + DATA.vatRate);

  const copySummary = async () => {
    const lines = [
      `${meta.title} — סיכום אומדן (${chosenCount} מתוך ${totalCount} פריטים)`,
      `רמת מחירים: ${use2026 ? "2026 (מותאם לאינפלציה)" : "2024 (מקור הקובץ)"}`,
      ``,
    ];
    categories.forEach((c) => {
      const tier = categoryTiers[c.name] || "mid";
      const mult = catMult(c.name, use2026) * floorAccessMult(c.name, floorAccess);
      let sub = 0;
      c.items.forEach((it) => {
        const q = quantities[it.id] ?? it.qty;
        sub += q * (it[tier] || 0) * mult;
      });
      if (sub > 0) {
        lines.push(
          `${c.name} (${TIERS.find((t) => t.key === tier).short}): ₪${fmt(sub)}`
        );
      }
    });
    lines.push(
      ``,
      `סה"כ מחיר השיפוץ (לפי הבחירות שלך): ₪${fmt(blendedTotal)}`,
      `כולל מע"מ (17%): ₪${fmt(blendedWithVat)}`,
      ``,
      `להשוואה — אם כל הקטגוריות היו באותה רמת גימור:`,
      `הכל נמוך: ₪${fmt(uniformTotals.low)} · הכל בינוני: ₪${fmt(uniformTotals.mid)} · הכל גבוה: ₪${fmt(uniformTotals.high)}`,
      ``,
      `אומדן בלבד — אינו מהווה הצעת מחיר או התחייבות כספית. שמרית אוחיון תכנון ועיצוב פנים.`
    );
    const text = lines.join("\n");
    const ok = await copyTextRobust(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setManualCopyText(text);
    }
  };

  return (
    <footer
      role="contentinfo"
      aria-label="סיכום עלויות שיפוץ"
      aria-hidden={hidden}
      className="fixed bottom-0 inset-x-0 z-40"
      style={{
        background: C.cardAlt,
        borderTop: `1px solid ${C.borderSoft}`,
        boxShadow: "0 -4px 16px rgba(43,38,34,0.08)",
        transform: hidden ? "translateY(100%)" : "translateY(0)",
        transition: "transform 0.15s ease-out",
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? "כיווץ סיכום העלויות" : "הרחבת סיכום העלויות"}
        className={`w-full px-4 pt-2 pb-1 flex items-center justify-center ${FOCUS_RING}`}
      >
        <span aria-hidden="true" className="w-10 h-1 rounded-full" style={{ background: C.border }} />
      </button>

      <div className="px-4 pb-1 flex items-center justify-between gap-2">
        <button
          onClick={onOpenSummary}
          className={`text-[11px] px-2 py-1 rounded-full shrink-0 ${FOCUS_RING}`}
          style={{ background: C.accentSoft, color: C.accentText, fontFamily: "Assistant, sans-serif" }}
        >
          {chosenCount}/{totalCount} פריטים
        </button>
        <p
          className="text-[11px] text-center flex-1"
          style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
        >
          סה"כ מחיר השיפוץ — לפי רמת הגימור שנבחרה בכל קטגוריה
        </p>
        <span className="w-[64px]" aria-hidden="true" />
      </div>

      <div className="px-4 text-center">
        <p
          className="text-2xl sm:text-3xl font-extrabold"
          style={{ color: C.accent, fontFamily: "Heebo, sans-serif" }}
        >
          ₪{fmt(blendedTotal)}
        </p>
        <p className="text-[11px]" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
          כולל מע"מ: ₪{fmt(blendedWithVat)}
        </p>
      </div>

      {expanded && (
        <div className="px-4 pt-3 pb-3 border-t" style={{ borderColor: C.borderSoft }}>
          <p
            className="text-[11px] mb-1.5"
            style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
          >
            להשוואה — אם כל הקטגוריות היו באותה רמת גימור
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {TIERS.map((t) => (
              <div key={t.key} className="text-center rounded-xl py-2" style={{ background: C.bg }}>
                <p className="text-[11px]" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                  הכל {t.short}
                </p>
                <p className="text-sm font-bold" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
                  ₪{fmt(uniformTotals[t.key])}
                </p>
              </div>
            ))}
          </div>

          <p
            className="text-[11px] mb-1.5"
            style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
          >
            קביעה גורפת של רמת הגימור לכל הקטגוריות (ניתן עדיין לשנות כל קטגוריה בנפרד)
          </p>
          <TierPicker
            value={null}
            onChange={onBulkSetTier}
            label="קביעה גורפת של רמת גימור לכל הקטגוריות"
            size="small"
          />

          <p
            className="text-[11px] text-center mt-3 leading-relaxed"
            style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
          >
            "סה"כ עלות השיפוץ במציאות כולל מע"מ" — אומדן בלבד, אינו מהווה
            הצעת מחיר או התחייבות.
          </p>
          {use2026 && (
            <details className="mt-2">
              <summary
                className="text-[11px] text-center cursor-pointer font-semibold"
                style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
              >
                על מה מבוססת התאמת מחירי 2026?
              </summary>
              <p
                className="text-[11px] leading-relaxed mt-1"
                style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
              >
                {DATA.priceAdjustment2026.note}
              </p>
            </details>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={copySummary}
              className={`flex-1 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold ${FOCUS_RING}`}
              style={{ background: C.accent, color: C.cardAlt, fontFamily: "Assistant, sans-serif" }}
            >
              {copied ? "הסיכום הועתק ✓" : "העתקת סיכום לשיתוף"}
            </button>
            <button
              onClick={onReset}
              className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold ${FOCUS_RING}`}
              style={{ background: "#F0EAE0", color: C.textMuted, fontFamily: "Assistant, sans-serif" }}
            >
              איפוס
            </button>
          </div>
        </div>
      )}
      {manualCopyText && (
        <ManualCopyModal text={manualCopyText} onClose={() => setManualCopyText(null)} />
      )}
    </footer>
  );
}

function PhotoField({ photoKey, onPhotoKeyChange }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputId = useId();

  useEffect(() => {
    let cancelled = false;
    if (photoKey) {
      loadPhoto(photoKey).then((v) => {
        if (!cancelled) setDataUrl(v);
      });
    } else {
      setDataUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [photoKey]);

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressImageFile(file);
      const key = photoKey || `photo:${Math.random().toString(36).slice(2)}`;
      const ok = await savePhoto(key, compressed);
      if (ok) {
        setDataUrl(compressed);
        onPhotoKeyChange(key);
      }
    } catch {
      /* photo capture is a nice-to-have; fail quietly */
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (photoKey) await deletePhoto(photoKey);
    setDataUrl(null);
    onPhotoKeyChange(null);
  };

  return (
    <div className="flex items-center gap-2">
      {dataUrl ? (
        <div className="relative">
          <img
            src={dataUrl}
            alt="תמונה מצורפת של ההצעה/הזמנה"
            className="w-14 h-14 rounded-lg object-cover"
            style={{ border: `1px solid ${C.border}` }}
          />
          <button
            onClick={remove}
            aria-label="הסרת התמונה"
            className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold ${FOCUS_RING}`}
            style={{ background: C.text, color: C.cardAlt }}
          >
            ✕
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`flex items-center justify-center w-14 h-14 rounded-lg cursor-pointer text-[10px] text-center leading-tight ${FOCUS_RING}`}
          style={{ border: `1px dashed ${C.border}`, color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
        >
          {busy ? "טוען..." : "צילום / תמונה"}
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        aria-label="צירוף תמונה של ההצעה או ההזמנה"
      />
    </div>
  );
}

function QuoteRow({ quote, onChange, onDelete, onSelect, itemName, category }) {
  const datalistId = useId();
  const supplierOptions = SUPPLIER_SUGGESTIONS[category] || [];
  return (
    <div
      className="rounded-xl p-3 mb-2"
      style={{
        background: quote.selected ? C.accentSoft : C.bg,
        border: quote.selected ? `1px solid ${C.accent}` : `1px solid ${C.borderSoft}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <input
            value={quote.supplier}
            onChange={(e) => onChange({ ...quote, supplier: e.target.value })}
            placeholder={supplierOptions.length ? "שם הספק (או בחרו מהרשימה)" : "שם הספק"}
            aria-label="שם הספק"
            list={supplierOptions.length ? datalistId : undefined}
            className={`w-full rounded-lg px-2.5 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
            style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
          />
          {supplierOptions.length > 0 && (
            <datalist id={datalistId}>
              {supplierOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
          {supplierOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {supplierOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ ...quote, supplier: s })}
                  className={`text-[11px] rounded-full px-2.5 py-1 ${FOCUS_RING}`}
                  style={{
                    background: quote.supplier === s ? C.accent : C.card,
                    color: quote.supplier === s ? C.cardAlt : C.accentText,
                    border: `1px solid ${quote.supplier === s ? C.accent : C.border}`,
                    fontFamily: "Assistant, sans-serif",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => onChange({ ...quote, urgent: !quote.urgent })}
          aria-pressed={!!quote.urgent}
          aria-label="סימון כפריט דחוף / זמן אספקה ארוך"
          className={`shrink-0 h-9 px-2.5 rounded-lg text-xs font-semibold ${FOCUS_RING}`}
          style={{
            background: quote.urgent ? "#FBEBD0" : C.card,
            color: quote.urgent ? "#8A6412" : C.textFaint,
            border: `1px solid ${quote.urgent ? "#E8C77A" : C.border}`,
          }}
        >
          🔥 דחוף
        </button>
        <button
          onClick={onDelete}
          aria-label="מחיקת הצעת המחיר"
          className={`shrink-0 w-9 h-9 rounded-lg text-sm ${FOCUS_RING}`}
          style={{ background: C.card, color: C.textFaint, border: `1px solid ${C.border}` }}
        >
          🗑
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[11px] block mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            סכום ההצעה (₪)
          </label>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={quote.amount}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange({ ...quote, amount: Number.isFinite(v) && v >= 0 ? v : 0 });
            }}
            aria-label="סכום ההצעה"
            className={`w-full rounded-lg px-2.5 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
            style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
          />
        </div>
        <div>
          <label className="text-[11px] block mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            סטטוס
          </label>
          <select
            value={quote.status}
            onChange={(e) => onChange({ ...quote, status: e.target.value })}
            aria-label="סטטוס ההזמנה"
            className={`w-full rounded-lg px-2 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
            style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[11px] block mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            שולם עד כה (₪)
          </label>
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={quote.paidAmount || 0}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange({ ...quote, paidAmount: Number.isFinite(v) && v >= 0 ? v : 0 });
            }}
            aria-label="סכום ששולם עד כה"
            className={`w-full rounded-lg px-2.5 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
            style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
          />
        </div>
        <div>
          <label className="text-[11px] block mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            יתרה לתשלום
          </label>
          <div
            className="w-full rounded-lg px-2.5 py-2 text-sm min-h-[40px] flex items-center font-semibold"
            style={{
              border: `1px solid ${C.border}`,
              background: C.bg,
              color: quote.amount - (quote.paidAmount || 0) > 0 ? C.accentText : "#3E7A4A",
              fontFamily: "Heebo, sans-serif",
            }}
          >
            ₪{fmt(quote.amount - (quote.paidAmount || 0))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[11px] block mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            תאריך ההצעה
          </label>
          <input
            type="date"
            value={quote.quoteDate || ""}
            onChange={(e) => onChange({ ...quote, quoteDate: e.target.value })}
            aria-label="תאריך ההצעה"
            className={`w-full rounded-lg px-2 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
            style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
          />
        </div>
        <div>
          <label className="text-[11px] block mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            תאריך אספקה משוער
          </label>
          <input
            type="date"
            value={quote.deliveryDate || ""}
            onChange={(e) => onChange({ ...quote, deliveryDate: e.target.value })}
            aria-label="תאריך אספקה משוער"
            className={`w-full rounded-lg px-2 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
            style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
          />
          {quote.deliveryDate && (
            <CalendarAddButton
              title={`אספקה/התקנה: ${itemName || "פריט רכש"}`}
              dateStr={quote.deliveryDate}
              details={`ספק: ${quote.supplier || "-"}\nסכום: ₪${fmt(quote.amount)}${quote.notes ? `\nהערות: ${quote.notes}` : ""}`}
            />
          )}
        </div>
      </div>

      <div className="mb-2">
        <label className="text-[11px] block mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
          תוקף אחריות עד
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={quote.warrantyExpiry || ""}
            onChange={(e) => onChange({ ...quote, warrantyExpiry: e.target.value })}
            aria-label="תוקף אחריות עד תאריך"
            className={`flex-1 rounded-lg px-2 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
            style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
          />
          {quote.warrantyExpiry && (() => {
            const today = new Date().toISOString().slice(0, 10);
            const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
            let label, bg, fg;
            if (quote.warrantyExpiry < today) {
              label = "פגה"; bg = "#FBE3D8"; fg = "#9C4A24";
            } else if (quote.warrantyExpiry <= in30) {
              label = "עומדת לפוג"; bg = "#FBEBD0"; fg = "#8A6412";
            } else {
              label = "בתוקף"; bg = C.accentSoft; fg = C.accentText;
            }
            return (
              <span
                className="shrink-0 text-[11px] font-semibold rounded-full px-2.5 py-1.5"
                style={{ background: bg, color: fg, fontFamily: "Assistant, sans-serif" }}
              >
                {label}
              </span>
            );
          })()}
        </div>
      </div>

      <textarea
        value={quote.notes}
        onChange={(e) => onChange({ ...quote, notes: e.target.value })}
        placeholder="הערות (מס' הזמנה, תנאי תשלום...)"
        aria-label="הערות על ההצעה"
        rows={2}
        className={`w-full rounded-lg px-2.5 py-2 text-sm mb-2 ${FOCUS_RING}`}
        style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
      />

      <div className="flex items-center gap-3 mb-2">
        <div>
          <p className="text-[11px] mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            תמונת מוצר
          </p>
          <PhotoField
            photoKey={quote.productPhotoKey}
            onPhotoKeyChange={(key) => onChange({ ...quote, productPhotoKey: key })}
          />
        </div>
        <div>
          <p className="text-[11px] mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            קבלה / הזמנה
          </p>
          <PhotoField
            photoKey={quote.receiptPhotoKey}
            onPhotoKeyChange={(key) => onChange({ ...quote, receiptPhotoKey: key })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={!!quote.clientApproved}
            onChange={(e) => onChange({ ...quote, clientApproved: e.target.checked })}
            aria-label="אושר על ידי הלקוח"
            className="w-4 h-4"
          />
          <span className="text-xs font-semibold" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
            אושר ע"י הלקוח
          </span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="radio"
            checked={!!quote.selected}
            onChange={() => onSelect()}
            aria-label="בחירת הצעה זו כהצעה הנבחרת"
            className="w-4 h-4"
          />
          <span className="text-xs font-semibold" style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}>
            הצעה נבחרת
          </span>
        </label>
      </div>
    </div>
  );
}

function ProcurementItemCard({ item, categories, onChange, onDelete, onSaveNow }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const bestQuote = item.quotes.reduce(
    (best, q) => (q.amount > 0 && (!best || q.amount < best.amount) ? q : best),
    null
  );
  const selectedQuote = item.quotes.find((q) => q.selected);
  const hasUrgent = item.quotes.some((q) => q.urgent);

  const addQuote = () => {
    const newQuote = {
      id: `q${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      supplier: "",
      amount: 0,
      paidAmount: 0,
      status: "quoted",
      quoteDate: "",
      deliveryDate: "",
      warrantyExpiry: "",
      notes: "",
      urgent: false,
      clientApproved: false,
      productPhotoKey: null,
      receiptPhotoKey: null,
      selected: item.quotes.length === 0,
    };
    onChange({ ...item, quotes: [...item.quotes, newQuote] });
  };

  const updateQuote = (updated) => {
    onChange({ ...item, quotes: item.quotes.map((q) => (q.id === updated.id ? updated : q)) });
  };
  const deleteQuote = (id) => {
    onChange({ ...item, quotes: item.quotes.filter((q) => q.id !== id) });
  };
  const selectQuote = (id) => {
    onChange({ ...item, quotes: item.quotes.map((q) => ({ ...q, selected: q.id === id })) });
  };

  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ background: C.card, border: `1px solid ${C.borderSoft}` }}>
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          placeholder="שם הפריט לרכישה (למשל: כיריים אינדוקציה)"
          aria-label="שם פריט הרכש"
          className={`flex-1 min-w-0 font-bold text-sm bg-transparent ${FOCUS_RING}`}
          style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
        />
        <button
          onClick={onDelete}
          aria-label="מחיקת פריט הרכש"
          className={`shrink-0 w-9 h-9 rounded-lg text-sm ${FOCUS_RING}`}
          style={{ background: C.bg, color: C.textFaint, border: `1px solid ${C.border}` }}
        >
          🗑
        </button>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`w-full flex items-center justify-between gap-2 px-4 pb-3 text-right ${FOCUS_RING}`}
      >
        <span className="text-[11px]" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
          {hasUrgent && <span style={{ color: "#8A6412" }}>🔥 דחוף · </span>}
          {item.quotes.length > 0
            ? `${item.quotes.length} הצעות מחיר` +
              (selectedQuote ? ` · נבחרה: ₪${fmt(selectedQuote.amount)}` : bestQuote ? ` · הזולה ביותר: ₪${fmt(bestQuote.amount)}` : "")
            : "עדיין אין הצעות מחיר"}
        </span>
        <span
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-3 py-2 min-h-[36px]"
          style={{ background: C.accentSoft, color: C.accentText, fontFamily: "Assistant, sans-serif" }}
        >
          {item.quotes.length > 0 ? "עריכת הצעות מחיר" : "הוספת הצעת מחיר"}
          <span
            aria-hidden="true"
            className="inline-block transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          >
            ▾
          </span>
        </span>
      </button>

      {open && (
        <div id={panelId} className="px-4 pb-4" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
          <div className="pt-3 mb-3">
            <label className="text-[11px] block mb-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
              קטגוריה משויכת (אופציונלי)
            </label>
            <select
              value={item.category || ""}
              onChange={(e) => onChange({ ...item, category: e.target.value })}
              aria-label="קטגוריה משויכת"
              className={`w-full rounded-lg px-2 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
              style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
            >
              <option value="">— ללא —</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {item.quotes.map((q) => (
            <QuoteRow
              key={q.id}
              quote={q}
              itemName={item.name}
              category={item.category}
              onChange={updateQuote}
              onDelete={() => deleteQuote(q.id)}
              onSelect={() => selectQuote(q.id)}
            />
          ))}

          <button
            onClick={addQuote}
            className={`w-full py-2.5 min-h-[44px] rounded-xl text-sm font-semibold mb-2 ${FOCUS_RING}`}
            style={{ background: C.accentSoft, color: C.accentText, fontFamily: "Assistant, sans-serif" }}
          >
            + הוספת הצעת מחיר / ספק להשוואה
          </button>

          <button
            onClick={() => {
              onSaveNow && onSaveNow();
              setOpen(false);
            }}
            className={`w-full py-2.5 min-h-[44px] rounded-xl text-sm font-bold ${FOCUS_RING}`}
            style={{ background: C.accent, color: C.cardAlt, fontFamily: "Assistant, sans-serif" }}
          >
            שמירה וסגירה
          </button>
        </div>
      )}
    </div>
  );
}

function PhotoLightbox({ dataUrl, label, onClose }) {
  const titleId = useId();
  const [status, setStatus] = useState("idle"); // idle | working | done

  const handleShare = async () => {
    setStatus("working");
    const filename = `${label.replace(/[^\wא-ת \-]/g, "").slice(0, 60) || "מסמך"}.jpg`;
    const result = await shareOrDownloadFile(dataUrl, filename, label);
    setStatus(result === "downloaded" ? "done" : "idle");
    if (result === "done") setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <div
      dir="rtl"
      lang="he"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(20,17,15,0.85)" }}
      onClick={onClose}
    >
      <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <img src={dataUrl} alt={label} className="w-full rounded-xl mb-3" style={{ maxHeight: "70vh", objectFit: "contain", background: "#fff" }} />
        <p id={titleId} className="text-sm font-semibold mb-3" style={{ color: "#fff", fontFamily: "Assistant, sans-serif" }}>
          {label}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            disabled={status === "working"}
            className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-full text-xs font-bold ${FOCUS_RING}`}
            style={{ background: C.accentSoft, color: C.accentText, fontFamily: "Assistant, sans-serif" }}
          >
            {status === "done" ? "הקובץ הורד ✓" : "📤 שמירה ל-Drive / iCloud"}
          </button>
          <button
            onClick={onClose}
            className={`px-4 py-2.5 min-h-[44px] rounded-full text-xs font-bold ${FOCUS_RING}`}
            style={{ background: C.accent, color: C.cardAlt, fontFamily: "Assistant, sans-serif" }}
          >
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentThumbnail({ doc, onOpen, onDelete }) {
  const [dataUrl, setDataUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadPhoto(doc.photoKey).then((v) => {
      if (!cancelled) setDataUrl(v);
    });
    return () => {
      cancelled = true;
    };
  }, [doc.photoKey]);

  if (!dataUrl) {
    return (
      <div
        className="rounded-lg animate-pulse"
        style={{ aspectRatio: "1", background: C.bg }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => onOpen(dataUrl, doc.label)}
        className={`block w-full text-right rounded-lg overflow-hidden relative ${FOCUS_RING}`}
        style={{ aspectRatio: "1" }}
        aria-label={`הצגת ${doc.label}`}
      >
        <img src={dataUrl} alt={doc.label} className="w-full h-full object-cover" />
        <span
          className="absolute bottom-0 inset-x-0 text-[10px] px-1.5 py-1 truncate"
          style={{ background: "rgba(43,38,34,0.72)", color: "#fff", fontFamily: "Assistant, sans-serif" }}
        >
          {doc.kindLabel}
        </span>
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`מחיקת ${doc.label}`}
          className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold ${FOCUS_RING}`}
          style={{ background: C.text, color: C.cardAlt }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function GeneralDocUploadButton({ onAdd }) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const compressed = await compressImageFile(file);
      const key = `general-doc-photo:${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
      const ok = await savePhoto(key, compressed);
      if (ok) {
        onAdd({
          id: key,
          photoKey: key,
          label: label.trim() || "מסמך כללי",
        });
        setLabel("");
      }
    } catch {
      /* fail quietly, nothing was added */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2 mb-3">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="שם המסמך (למשל: היתר בנייה)"
        aria-label="שם המסמך שמצורף"
        className={`flex-1 min-w-0 rounded-lg px-3 py-2 text-sm min-h-[40px] ${FOCUS_RING}`}
        style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
      />
      <label
        htmlFor={inputId}
        className={`shrink-0 flex items-center justify-center px-4 py-2 min-h-[40px] rounded-lg text-xs font-bold cursor-pointer ${FOCUS_RING}`}
        style={{ background: C.accent, color: C.cardAlt, fontFamily: "Assistant, sans-serif" }}
      >
        {busy ? "מעלה..." : "+ הוספת מסמך"}
      </label>
      <input id={inputId} type="file" accept="image/*" onChange={handleFile} className="sr-only" aria-label="צירוף תמונת מסמך" />
    </div>
  );
}

function DocumentLibrarySection({ items, roomType }) {
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [generalDocs, setGeneralDocs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    loadGeneralDocs(roomType).then((saved) => {
      if (!cancelled) {
        setGeneralDocs(saved || []);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [roomType]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveGeneralDocs(roomType, generalDocs), 400);
    return () => clearTimeout(saveTimer.current);
  }, [generalDocs, roomType, loaded]);

  const docs = useMemo(() => {
    const list = [];
    items.forEach((it) => {
      it.quotes.forEach((q) => {
        if (q.productPhotoKey) {
          list.push({
            photoKey: q.productPhotoKey,
            kindLabel: "תמונת מוצר",
            label: `${it.name || "פריט"} · תמונת מוצר · ${q.supplier || ""}`,
            itemName: it.name || "",
            category: it.category || "",
            supplier: q.supplier || "",
            deletable: false,
          });
        }
        if (q.receiptPhotoKey) {
          list.push({
            photoKey: q.receiptPhotoKey,
            kindLabel: "קבלה / הזמנה",
            label: `${it.name || "פריט"} · קבלה/הזמנה · ${q.supplier || ""}`,
            itemName: it.name || "",
            category: it.category || "",
            supplier: q.supplier || "",
            deletable: false,
          });
        }
      });
    });
    generalDocs.forEach((d) => {
      list.push({
        photoKey: d.photoKey,
        kindLabel: "מסמך כללי",
        label: d.label,
        itemName: d.label,
        category: "",
        supplier: "",
        deletable: true,
        docId: d.id,
      });
    });
    return list;
  }, [items, generalDocs]);

  const filtered = docs.filter((d) => {
    if (!query.trim()) return true;
    const q = query.trim();
    return d.itemName.includes(q) || d.category.includes(q) || d.supplier.includes(q);
  });

  const removeGeneralDoc = async (docId, photoKey) => {
    await deletePhoto(photoKey);
    setGeneralDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  return (
    <GuideAccordion title={`ספריית מסמכים (${docs.length})`} defaultOpen={docs.length === 0}>
      <div className="pt-2">
        <p className="text-xs leading-relaxed mb-3" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
          כל תמונות המוצר והקבלות שצירפתם להצעות מחיר מופיעות כאן אוטומטית. אפשר גם להוסיף כאן ישירות מסמך כללי (היתר, תוכנית, אחריות) שלא קשור לפריט ספציפי.
        </p>
        <GeneralDocUploadButton onAdd={(doc) => setGeneralDocs((prev) => [...prev, doc])} />
        {docs.length > 0 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי פריט, קטגוריה או ספק..."
            aria-label="חיפוש בספריית המסמכים"
            className={`w-full rounded-lg px-3 py-2 text-sm mb-3 min-h-[40px] ${FOCUS_RING}`}
            style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
          />
        )}
        {docs.length === 0 ? (
          <p className="text-sm" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            אין עדיין מסמכים. הוסיפו אחד למעלה, או צרפו תמונת מוצר/קבלה בתוך הצעת מחיר.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            לא נמצאו מסמכים תואמים.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filtered.map((doc, i) => (
              <DocumentThumbnail
                key={`${doc.photoKey}-${i}`}
                doc={doc}
                onOpen={(url, label) => setLightbox({ url, label })}
                onDelete={doc.deletable ? () => removeGeneralDoc(doc.docId, doc.photoKey) : null}
              />
            ))}
          </div>
        )}
      </div>
      {lightbox && (
        <PhotoLightbox dataUrl={lightbox.url} label={lightbox.label} onClose={() => setLightbox(null)} />
      )}
    </GuideAccordion>
  );
}

function ProcurementTracker({ roomType, categories, quantities, categoryTiers, use2026, floorAccess, items, setItems, onSaveNow }) {
  const [copied, setCopied] = useState(false);
  const [manualCopyText, setManualCopyText] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: `p${Date.now()}${Math.random().toString(36).slice(2, 6)}`, name: "", category: "", quotes: [] },
    ]);
  };

  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const selectedTotal = items.reduce((sum, it) => {
    const sel = it.quotes.find((q) => q.selected);
    return sum + (sel ? sel.amount : 0);
  }, 0);
  const balanceDue = items.reduce((sum, it) => {
    const sel = it.quotes.find((q) => q.selected);
    return sum + (sel ? sel.amount - (sel.paidAmount || 0) : 0);
  }, 0);
  const upcomingDeliveries = items.filter((it) =>
    it.quotes.some((q) => q.selected && q.status !== "delivered" && q.deliveryDate)
  ).length;
  const overdue = items.filter((it) =>
    it.quotes.some((q) => q.selected && q.status !== "delivered" && q.deliveryDate && q.deliveryDate < today)
  ).length;
  const dueSoon = items.filter((it) =>
    it.quotes.some(
      (q) => q.selected && q.status !== "delivered" && q.deliveryDate && q.deliveryDate >= today && q.deliveryDate <= in7
    )
  );
  const urgentPending = items.filter((it) => it.quotes.some((q) => q.urgent && q.status !== "delivered")).length;
  const warrantyExpired = items.filter((it) =>
    it.quotes.some((q) => q.selected && q.warrantyExpiry && q.warrantyExpiry < today)
  ).length;
  const warrantyExpiringSoon = items.filter((it) =>
    it.quotes.some((q) => q.selected && q.warrantyExpiry && q.warrantyExpiry >= today && q.warrantyExpiry <= in30)
  ).length;

  // Supplier view: total committed (selected quotes) per supplier, useful for
  // volume-discount conversations.
  const supplierTotals = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      const sel = it.quotes.find((q) => q.selected);
      if (sel && sel.supplier) {
        map[sel.supplier] = (map[sel.supplier] || 0) + sel.amount;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // Budget vs. actual: for every category linked to at least one procurement
  // item, compares the estimator's budgeted amount (at its chosen tier, with
  // the 2026 adjustment if enabled) against the sum of selected quotes.
  const budgetComparison = useMemo(() => {
    const linkedCategoryNames = new Set(items.map((it) => it.category).filter(Boolean));
    const rows = [];
    linkedCategoryNames.forEach((catName) => {
      const cat = categories.find((c) => c.name === catName);
      if (!cat) return;
      const tier = (categoryTiers && categoryTiers[catName]) || "mid";
      const mult = catMult(catName, use2026) * floorAccessMult(catName, floorAccess);
      let budgeted = 0;
      cat.items.forEach((it) => {
        const q = (quantities && quantities[it.id]) ?? it.qty;
        budgeted += q * (it[tier] || 0) * mult;
      });
      const actual = items
        .filter((it) => it.category === catName)
        .reduce((sum, it) => {
          const sel = it.quotes.find((q) => q.selected);
          return sum + (sel ? sel.amount : 0);
        }, 0);
      rows.push({ catName, budgeted, actual });
    });
    return rows;
  }, [items, categories, quantities, categoryTiers, use2026, floorAccess]);

  const copySummary = async () => {
    const lines = [`מעקב רכש — סיכום (${items.length} פריטים)`, ""];
    items.forEach((it) => {
      const sel = it.quotes.find((q) => q.selected);
      if (!sel) return;
      const bal = sel.amount - (sel.paidAmount || 0);
      lines.push(
        `${it.name || "(ללא שם)"}${it.category ? ` [${it.category}]` : ""} — ${sel.supplier || "-"}: ₪${fmt(sel.amount)}` +
          (bal > 0 ? ` (יתרה: ₪${fmt(bal)})` : " (שולם במלואו)") +
          (sel.deliveryDate ? ` · אספקה: ${sel.deliveryDate}` : "")
      );
    });
    lines.push("", `סה"כ נבחר: ₪${fmt(selectedTotal)}`, `יתרה כוללת לתשלום: ₪${fmt(balanceDue)}`);
    const text = lines.join("\n");
    const ok = await copyTextRobust(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setManualCopyText(text);
    }
  };

  const exportCsv = async () => {
    const rows = [
      ["פריט", "קטגוריה", "ספק", "סכום", "שולם", "יתרה", "סטטוס", "תאריך הצעה", "תאריך אספקה", "תוקף אחריות", "דחוף", "אושר ע\"י הלקוח", "הערות"],
    ];
    items.forEach((it) => {
      const sel = it.quotes.find((q) => q.selected) || it.quotes[0];
      if (!sel) {
        rows.push([it.name || "", it.category || "", "", "", "", "", "", "", "", "", "", "", ""]);
        return;
      }
      rows.push([
        it.name || "",
        it.category || "",
        sel.supplier || "",
        sel.amount || 0,
        sel.paidAmount || 0,
        (sel.amount || 0) - (sel.paidAmount || 0),
        STATUS_OPTIONS.find((s) => s.key === sel.status)?.label || sel.status || "",
        sel.quoteDate || "",
        sel.deliveryDate || "",
        sel.warrantyExpiry || "",
        sel.urgent ? "כן" : "לא",
        sel.clientApproved ? "כן" : "לא",
        sel.notes || "",
      ]);
    });
    downloadCsv(`מעקב-רכש-${roomType}.csv`, rows);
  };

  const exportPdf = async () => {
    const rowsHtml = items
      .map((it) => {
        const sel = it.quotes.find((q) => q.selected) || it.quotes[0];
        if (!sel) return `<tr><td>${it.name || "-"}</td><td colspan="5">אין עדיין הצעת מחיר</td></tr>`;
        const bal = (sel.amount || 0) - (sel.paidAmount || 0);
        return `<tr>
          <td>${it.name || "-"}</td>
          <td>${it.category || "-"}</td>
          <td>${sel.supplier || "-"}</td>
          <td>₪${fmt(sel.amount)}</td>
          <td>₪${fmt(bal)}</td>
          <td>${sel.deliveryDate || "-"}</td>
        </tr>`;
      })
      .join("");
    const html = `
      <h1>מעקב רכש — ${DATA.meta[roomType].title}</h1>
      <p>${new Date().toLocaleDateString("he-IL")}</p>
      <table>
        <thead><tr><th>פריט</th><th>קטגוריה</th><th>ספק</th><th>סכום</th><th>יתרה</th><th>אספקה</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p class="total">סה"כ נבחר: ₪${fmt(selectedTotal)} · יתרה כוללת לתשלום: ₪${fmt(balanceDue)}</p>
    `;
    downloadPrintableHtml(`מעקב-רכש-${roomType}.html`, "מעקב רכש", html);
  };

  return (
    <div>
      <div className="rounded-2xl p-4 mb-4 relative" style={{ background: C.card, border: `1px solid ${C.borderSoft}` }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-xs flex-1" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            מעקב רכש והשוואת הצעות מחיר בין ספקים — כל הזמנה, תשלום, תאריך אספקה ותמונה נשמרים כאן.
          </p>
          <div className="relative shrink-0">
            <button
              onClick={() => setExportMenuOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={exportMenuOpen}
              aria-label="ייצוא ושיתוף"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${FOCUS_RING}`}
              style={{ background: C.accentSoft, color: C.accentText, border: `1px solid ${C.border}` }}
            >
              ⬆
            </button>
            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="menu"
                  className="absolute left-0 top-11 z-20 rounded-xl overflow-hidden w-48"
                  style={{ background: C.cardAlt, border: `1px solid ${C.border}`, boxShadow: "0 4px 16px rgba(43,38,34,0.15)" }}
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      copySummary();
                      setExportMenuOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3 text-xs font-semibold ${FOCUS_RING}`}
                    style={{ color: C.text, fontFamily: "Assistant, sans-serif", borderBottom: `1px solid ${C.borderSoft}` }}
                  >
                    {copied ? "הסיכום הועתק ✓" : "העתקת סיכום"}
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      exportCsv();
                      setExportMenuOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3 text-xs font-semibold ${FOCUS_RING}`}
                    style={{ color: C.text, fontFamily: "Assistant, sans-serif", borderBottom: `1px solid ${C.borderSoft}` }}
                  >
                    ייצוא לאקסל (CSV)
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      exportPdf();
                      setExportMenuOpen(false);
                    }}
                    className={`w-full text-right px-4 py-3 text-xs font-semibold ${FOCUS_RING}`}
                    style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}
                  >
                    ייצוא ל-PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded-xl py-2" style={{ background: C.bg }}>
            <p className="text-[11px]" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
              סה"כ הצעות נבחרות
            </p>
            <p className="text-sm font-bold" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
              ₪{fmt(selectedTotal)}
            </p>
          </div>
          <div className="text-center rounded-xl py-2" style={{ background: balanceDue > 0 ? C.accentSoft : C.bg }}>
            <p className="text-[11px]" style={{ color: balanceDue > 0 ? C.accentText : C.textFaint, fontFamily: "Assistant, sans-serif" }}>
              יתרה לתשלום
            </p>
            <p className="text-sm font-bold" style={{ color: balanceDue > 0 ? C.accent : C.text, fontFamily: "Heebo, sans-serif" }}>
              ₪{fmt(balanceDue)}
            </p>
          </div>
          <div className="text-center rounded-xl py-2" style={{ background: overdue > 0 ? "#FBE3D8" : C.bg }}>
            <p className="text-[11px]" style={{ color: overdue > 0 ? "#9C4A24" : C.textFaint, fontFamily: "Assistant, sans-serif" }}>
              אספקה באיחור
            </p>
            <p className="text-sm font-bold" style={{ color: overdue > 0 ? "#9C4A24" : C.text, fontFamily: "Heebo, sans-serif" }}>
              {overdue}
            </p>
          </div>
        </div>

        {(warrantyExpired > 0 || warrantyExpiringSoon > 0 || urgentPending > 0) && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center rounded-xl py-2" style={{ background: urgentPending > 0 ? "#FBEBD0" : C.bg }}>
              <p className="text-[11px]" style={{ color: urgentPending > 0 ? "#8A6412" : C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                פריטים דחופים
              </p>
              <p className="text-sm font-bold" style={{ color: urgentPending > 0 ? "#8A6412" : C.text, fontFamily: "Heebo, sans-serif" }}>
                {urgentPending}
              </p>
            </div>
            <div className="text-center rounded-xl py-2" style={{ background: warrantyExpired > 0 ? "#FBE3D8" : C.bg }}>
              <p className="text-[11px]" style={{ color: warrantyExpired > 0 ? "#9C4A24" : C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                אחריות שפגה
              </p>
              <p className="text-sm font-bold" style={{ color: warrantyExpired > 0 ? "#9C4A24" : C.text, fontFamily: "Heebo, sans-serif" }}>
                {warrantyExpired}
              </p>
            </div>
            <div className="text-center rounded-xl py-2" style={{ background: warrantyExpiringSoon > 0 ? "#FBEBD0" : C.bg }}>
              <p className="text-[11px]" style={{ color: warrantyExpiringSoon > 0 ? "#8A6412" : C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                אחריות עומדת לפוג
              </p>
              <p className="text-sm font-bold" style={{ color: warrantyExpiringSoon > 0 ? "#8A6412" : C.text, fontFamily: "Heebo, sans-serif" }}>
                {warrantyExpiringSoon}
              </p>
            </div>
          </div>
        )}
      </div>

      {manualCopyText && (
        <ManualCopyModal text={manualCopyText} onClose={() => setManualCopyText(null)} />
      )}

      {dueSoon.length > 0 && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-start gap-2"
          style={{ background: "#FBEBD0", border: "1px solid #E8C77A" }}
        >
          <span aria-hidden="true">⏰</span>
          <div>
            <p className="text-xs font-bold" style={{ color: "#8A6412", fontFamily: "Heebo, sans-serif" }}>
              אספקה בקרוב (7 ימים הקרובים)
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#8A6412", fontFamily: "Assistant, sans-serif" }}>
              {dueSoon.map((it) => it.name || "(ללא שם)").join(" · ")}
            </p>
          </div>
        </div>
      )}

      {supplierTotals.length > 0 && (
        <GuideAccordion title={`תצוגת ספקים (${supplierTotals.length})`}>
          <div className="pt-2">
            {supplierTotals.map(([supplier, total]) => (
              <div key={supplier} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: C.borderSoft }}>
                <p className="text-sm font-semibold" style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}>
                  {supplier}
                </p>
                <p className="text-sm font-bold" style={{ color: C.accentText, fontFamily: "Heebo, sans-serif" }}>
                  ₪{fmt(total)}
                </p>
              </div>
            ))}
          </div>
        </GuideAccordion>
      )}

      {budgetComparison.length > 0 && (
        <GuideAccordion title="תקציב מול בפועל (לפי קטגוריה)">
          <div className="pt-2">
            {budgetComparison.map((r) => {
              const diff = r.actual - r.budgeted;
              const over = diff > 0;
              return (
                <div key={r.catName} className="py-2 border-b last:border-b-0" style={{ borderColor: C.borderSoft }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}>
                    {r.catName}
                  </p>
                  <div className="flex items-center justify-between text-xs" style={{ fontFamily: "Assistant, sans-serif" }}>
                    <span style={{ color: C.textFaint }}>תוקצב: ₪{fmt(r.budgeted)}</span>
                    <span style={{ color: C.textFaint }}>בפועל: ₪{fmt(r.actual)}</span>
                  </div>
                  {r.actual > 0 && (
                    <p
                      className="text-xs font-semibold mt-0.5"
                      style={{ color: over ? "#9C4A24" : "#3E7A4A", fontFamily: "Assistant, sans-serif" }}
                    >
                      {over ? `חריגה של ₪${fmt(diff)}` : `חיסכון של ₪${fmt(-diff)}`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </GuideAccordion>
      )}

      <DocumentLibrarySection items={items} roomType={roomType} />

      {items.map((it) => (
        <ProcurementItemCard
          key={it.id}
          item={it}
          categories={categories}
          onChange={(updated) => setItems((prev) => prev.map((x) => (x.id === it.id ? updated : x)))}
          onDelete={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
          onSaveNow={onSaveNow}
        />
      ))}

      <button
        onClick={addItem}
        className={`w-full py-3 min-h-[44px] rounded-xl text-sm font-bold mb-4 ${FOCUS_RING}`}
        style={{ background: C.accent, color: C.cardAlt, fontFamily: "Assistant, sans-serif" }}
      >
        + הוספת פריט רכש חדש
      </button>
    </div>
  );
}

function parseChecklistKey(storageKey) {
  const sep = storageKey.indexOf(":");
  const prefix = storageKey.slice(0, sep);
  const projectId = storageKey.slice(sep + 1);
  const column = prefix === "handover-checklist" ? "handover_checklist" : "checklist";
  return { projectId, column };
}
async function loadChecklist(storageKey) {
  try {
    const { projectId, column } = parseChecklistKey(storageKey);
    const { data, error } = await supabase.from("projects").select(column).eq("id", projectId).single();
    if (error || !data) return null;
    return data[column];
  } catch {
    return null;
  }
}
async function saveChecklist(storageKey, checked) {
  try {
    const { projectId, column } = parseChecklistKey(storageKey);
    await supabase.from("projects").update({ [column]: checked }).eq("id", projectId);
  } catch {}
}

// A small set of warm, distinguishable colors that fit the app's palette —
// enough for a real project's typical 6-10 non-zero categories, cycling if
// there happen to be more.
const CHART_COLORS = [
  "#B0703F", "#8A5A34", "#C9975E", "#6B8F71", "#7A9CB5",
  "#B8763F", "#9C6B8A", "#5C8A7A", "#C4A24A", "#8A7A9C",
  "#A85C4A", "#4A8A9C",
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function BudgetPieChart({ categoryTotals }) {
  const entries = Object.entries(categoryTotals)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total <= 0) {
    return (
      <p className="text-sm py-2" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
        הזינו כמויות בקטגוריות כדי לראות כאן את חלוקת התקציב.
      </p>
    );
  }

  let cursor = 0;
  const slices = entries.map(([name, value], i) => {
    const sliceAngle = (value / total) * 360;
    const path = arcPath(50, 50, 50, cursor, cursor + sliceAngle);
    cursor += sliceAngle;
    return { name, value, path, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-40 h-40 shrink-0" role="img" aria-label="תרשים חלוקת התקציב לפי קטגוריה">
        {slices.map((s) => (
          <path key={s.name} d={s.path} fill={s.color} stroke={C.cardAlt} strokeWidth="0.5" />
        ))}
        <circle cx="50" cy="50" r="28" fill={C.card} />
      </svg>
      <div className="w-full min-w-0">
        {slices.map((s) => (
          <div key={s.name} className="flex items-center gap-2 py-1">
            <span aria-hidden="true" className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs flex-1 min-w-0 truncate" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
              {s.name}
            </span>
            <span className="text-xs font-semibold shrink-0" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
              {Math.round((s.value / total) * 100)}% · ₪{fmt(s.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GuideAccordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <div className="rounded-2xl overflow-hidden mb-3" style={{ background: C.card, border: `1px solid ${C.borderSoft}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`w-full flex items-center justify-between px-4 py-4 text-right ${FOCUS_RING}`}
      >
        <span className="font-bold text-sm sm:text-base" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
          {title}
        </span>
        <span
          aria-hidden="true"
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs transition-transform"
          style={{ background: C.accentSoft, color: C.accent, transform: open ? "rotate(180deg)" : "none" }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div id={panelId} className="px-4 pb-4" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ChecklistSection({ roomType, storageKeyPrefix, items, title }) {
  const [checked, setChecked] = useState({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);
  const storageKey = `${storageKeyPrefix}:${roomType}`;

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    loadChecklist(storageKey).then((saved) => {
      if (!cancelled) {
        setChecked(saved || {});
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveChecklist(storageKey, checked), 400);
    return () => clearTimeout(saveTimer.current);
  }, [checked, storageKey, loaded]);

  const doneCount = items.filter((c) => checked[c.id]).length;

  return (
    <GuideAccordion title={`${title} (${doneCount}/${items.length})`}>
      <div className="pt-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-start gap-2.5 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!checked[item.id]}
              onChange={(e) => setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))}
              className={`mt-0.5 w-5 h-5 shrink-0 ${FOCUS_RING}`}
            />
            <span
              className="text-sm leading-snug"
              style={{
                color: checked[item.id] ? C.textFaint : C.textMuted,
                textDecoration: checked[item.id] ? "line-through" : "none",
                fontFamily: "Assistant, sans-serif",
              }}
            >
              {item.text}
            </span>
          </label>
        ))}
      </div>
    </GuideAccordion>
  );
}

function GlossarySection() {
  const [q, setQ] = useState("");
  const filtered = GUIDE.glossary.filter(
    (g) => !q.trim() || g.term.includes(q) || g.def.includes(q)
  );
  return (
    <GuideAccordion title="מילון מונחים">
      <div className="pt-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חיפוש מונח..."
          aria-label="חיפוש במילון המונחים"
          className={`w-full rounded-lg px-3 py-2 text-sm mb-3 min-h-[40px] ${FOCUS_RING}`}
          style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
        />
        {filtered.map((g) => (
          <div key={g.term} className="py-2 border-b last:border-b-0" style={{ borderColor: C.borderSoft }}>
            <p className="text-sm font-bold" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
              {g.term}
            </p>
            <p className="text-xs leading-relaxed mt-0.5" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
              {g.def}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
            לא נמצא מונח מתאים.
          </p>
        )}
      </div>
    </GuideAccordion>
  );
}

function TimelineSection() {
  return (
    <GuideAccordion title="שלבי השיפוץ וציר זמן משוער">
      <div className="pt-2">
        {GUIDE.stages.map((s, i) => (
          <div key={s.title} className="flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center shrink-0">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: C.accent, color: C.cardAlt, fontFamily: "Heebo, sans-serif" }}
              >
                {i + 1}
              </span>
              {i < GUIDE.stages.length - 1 && (
                <span className="w-px flex-1 mt-1" style={{ background: C.border }} />
              )}
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm font-bold" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
                {s.title}
                <span className="text-xs font-normal mr-2" style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}>
                  {s.duration}
                </span>
              </p>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </GuideAccordion>
  );
}

function ProQuestionsSection() {
  return (
    <GuideAccordion title="שאלות שכדאי לשאול כל בעל מקצוע">
      <div className="pt-2">
        {GUIDE.proQuestions.map((group) => (
          <div key={group.role} className="mb-4 last:mb-0">
            <p className="text-sm font-bold mb-1.5" style={{ color: C.accentText, fontFamily: "Heebo, sans-serif" }}>
              {group.role}
            </p>
            <ul className="pr-4" style={{ listStyleType: "disc" }}>
              {group.questions.map((q) => (
                <li key={q} className="text-sm leading-relaxed mb-1" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </GuideAccordion>
  );
}

function SavingsTipsSection() {
  return (
    <GuideAccordion title="טיפים לחיסכון בתקציב">
      <div className="pt-2">
        {GUIDE.savingsTips.map((tip, i) => (
          <div key={i} className="flex gap-2 py-2 border-b last:border-b-0" style={{ borderColor: C.borderSoft }}>
            <span aria-hidden="true" style={{ color: C.accent }}>💡</span>
            <p className="text-sm leading-relaxed" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
              {tip}
            </p>
          </div>
        ))}
      </div>
    </GuideAccordion>
  );
}

function ReserveCalculator({ blendedTotal }) {
  const reserve = blendedTotal * 0.15;
  return (
    <GuideAccordion title={'מחשבון רזרבה לבלת"מים'} defaultOpen>
      <div className="pt-2">
        <p className="text-sm leading-relaxed mb-3" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
          מומלץ לשריין רזרבה תקציבית של כ-15% מעל האומדן הנוכחי, לכיסוי הוצאות בלתי צפויות שמתגלות תוך כדי עבודה (למשל בעיות תשתית שהתגלו בהריסה).
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center rounded-xl py-2.5" style={{ background: C.bg }}>
            <p className="text-[11px]" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
              רזרבה מומלצת (15%)
            </p>
            <p className="text-base font-bold" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
              ₪{fmt(reserve)}
            </p>
          </div>
          <div className="text-center rounded-xl py-2.5" style={{ background: C.accentSoft }}>
            <p className="text-[11px]" style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}>
              תקציב כולל מומלץ לשריין
            </p>
            <p className="text-base font-bold" style={{ color: C.accent, fontFamily: "Heebo, sans-serif" }}>
              ₪{fmt(blendedTotal + reserve)}
            </p>
          </div>
        </div>
      </div>
    </GuideAccordion>
  );
}

function MaintenanceSection() {
  return (
    <GuideAccordion title="טיפול ותחזוקה בחומרים אחרי השיפוץ">
      <div className="pt-2">
        {GUIDE.maintenance.map((m) => (
          <div key={m.material} className="py-2 border-b last:border-b-0" style={{ borderColor: C.borderSoft }}>
            <p className="text-sm font-bold" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
              {m.material}
            </p>
            <p className="text-xs leading-relaxed mt-0.5" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
              {m.tip}
            </p>
          </div>
        ))}
      </div>
    </GuideAccordion>
  );
}

function FAQSection() {
  return (
    <GuideAccordion title="שאלות נפוצות">
      <div className="pt-2">
        {GUIDE.faq.map((f) => (
          <div key={f.q} className="py-2 border-b last:border-b-0" style={{ borderColor: C.borderSoft }}>
            <p className="text-sm font-bold" style={{ color: C.accentText, fontFamily: "Heebo, sans-serif" }}>
              {f.q}
            </p>
            <p className="text-xs leading-relaxed mt-0.5" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
              {f.a}
            </p>
          </div>
        ))}
      </div>
    </GuideAccordion>
  );
}

function DocumentsSection() {
  return (
    <GuideAccordion title="מסמכים שכדאי לשמור אחרי הפרויקט">
      <div className="pt-2">
        {GUIDE.documentsToKeep.map((d, i) => (
          <div key={i} className="flex gap-2 py-1.5">
            <span aria-hidden="true" style={{ color: C.accent }}>📄</span>
            <p className="text-sm leading-relaxed" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
              {d}
            </p>
          </div>
        ))}
      </div>
    </GuideAccordion>
  );
}

function SuppliersSection() {
  return (
    <GuideAccordion title="ספקים מובילים לפי קטגוריה">
      <div className="pt-2">
        <p className="text-xs leading-relaxed mb-3" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
          רשימה כללית להתמצאות ראשונית — לא המלצה בלעדית ואין לסטודיו קשר מסחרי עם החברות המוזכרות. תמיד שווה לבקש כמה הצעות מחיר ולהשוות (בדיוק כמו בטאב "מעקב רכש").
        </p>
        {GUIDE.suppliers.map((group) => (
          <div key={group.category} className="mb-4 last:mb-0">
            <p className="text-sm font-bold mb-1.5" style={{ color: C.accentText, fontFamily: "Heebo, sans-serif" }}>
              {group.category}
            </p>
            {group.companies.map((c) => (
              <div key={c.name} className="py-1.5">
                <p className="text-sm font-semibold" style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}>
                  {c.name}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
                  {c.note}
                </p>
              </div>
            ))}
            {group.note && (
              <p className="text-xs leading-relaxed mt-1 italic" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                {group.note}
              </p>
            )}
          </div>
        ))}
      </div>
    </GuideAccordion>
  );
}

function GuideTab({ roomType, blendedTotal }) {
  return (
    <div>
      <p className="text-xs mb-3 leading-relaxed" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
        מדריך קצר שמלווה אתכם לאורך התהליך — מהתכנון ועד למסירה.
      </p>
      <ReserveCalculator blendedTotal={blendedTotal} />
      <ChecklistSection
        roomType={roomType}
        storageKeyPrefix="checklist"
        items={GUIDE.checklist}
        title="צ'ק-ליסט לפני שמתחילים"
      />
      <TimelineSection />
      <ProQuestionsSection />
      <SuppliersSection />
      <GlossarySection />
      <SavingsTipsSection />
      <ChecklistSection
        roomType={roomType}
        storageKeyPrefix="handover-checklist"
        items={GUIDE.handoverChecklist}
        title="צ'ק-ליסט לפני מסירה/סיום"
      />
      <MaintenanceSection />
      <FAQSection />
      <DocumentsSection />
    </div>
  );
}

function Estimator({ user, onLogout }) {
  useInjectedFont();
  const [stage, setStage] = useState("select"); // select | disclaimer | app
  const [roomType, setRoomType] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [categoryTiers, setCategoryTiers] = useState({}); // { [categoryName]: "low"|"mid"|"high" }
  const [openCats, setOpenCats] = useState({});
  const [dashExpanded, setDashExpanded] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [search, setSearch] = useState("");
  const [use2026, setUse2026] = useState(true);
  const [activeView, setActiveView] = useState("estimate"); // "estimate" | "procurement"
  const [inputFocused, setInputFocused] = useState(false);
  const [actualArea, setActualArea] = useState(null);
  const [procurementItems, setProcurementItems] = useState([]);
  const [procurementLoaded, setProcurementLoaded] = useState(false);
  const [categorySource, setCategorySource] = useState({}); // { [categoryName]: "estimate" | "actual" }
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm } | null
  const [floorAccess, setFloorAccess] = useState({ floor: 0, hasElevator: true, hasParking: true });
  const saveTimer = useRef(null);
  const procurementSaveTimer = useRef(null);
  const focusTimer = useRef(null);

  // Debounced so moving focus directly from one qty field to another
  // doesn't cause the dashboard to flash back in between them.
  const handleFocusChange = (focused) => {
    if (focusTimer.current) clearTimeout(focusTimer.current);
    if (focused) {
      setInputFocused(true);
    } else {
      focusTimer.current = setTimeout(() => setInputFocused(false), 150);
    }
  };

  // load the client-projects list once, on mount (needed for the select screen itself)
  useEffect(() => {
    let cancelled = false;
    loadProjectsList().then((saved) => {
      if (!cancelled && saved) setProjects(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = roomType ? DATA[roomType] : [];

  const getCatTier = (name) => categoryTiers[name] || "mid";

  // Rescales every item tagged "scalesWithArea" (measurer, demolition, main
  // flooring) relative to its original template quantity, based on the real
  // apartment size vs. the room-type's reference size. Re-running this with
  // a new area always recomputes from the same template — so it's safe to
  // adjust the size more than once without compounding errors.
  const applyAreaScale = (area, defaultArea) => {
    if (!area || !defaultArea) return;
    const ratio = area / defaultArea;
    setQuantities((prev) => {
      const next = { ...prev };
      categories.forEach((c) => {
        c.items.forEach((it) => {
          if (it.scalesWithArea) {
            next[it.id] = Math.round(it.qty * ratio * 10) / 10;
          }
        });
      });
      return next;
    });
  };

  // load persisted project state whenever we enter the app for a given client project
  useEffect(() => {
    if (stage !== "app" || !activeProjectId || !roomType) return;
    let cancelled = false;
    loadProjectState(activeProjectId).then((saved) => {
      if (!cancelled) {
        if (saved) {
          setQuantities(saved.quantities || {});
          setCategoryTiers(saved.categoryTiers || {});
          setActualArea(saved.actualArea || DATA.meta[roomType].defaultArea);
          setCategorySource(saved.categorySource || {});
          setFloorAccess(saved.floorAccess || { floor: 0, hasElevator: true, hasParking: true });
        } else {
          setActualArea(DATA.meta[roomType].defaultArea);
          setCategorySource({});
          setFloorAccess({ floor: 0, hasElevator: true, hasParking: true });
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stage, activeProjectId, roomType]);

  // debounce-save quantities + tier choices + apartment size + price-source + floor/access together
  useEffect(() => {
    if (stage !== "app" || !activeProjectId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProjectState(activeProjectId, { quantities, categoryTiers, actualArea, categorySource, floorAccess });
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [quantities, categoryTiers, actualArea, categorySource, floorAccess, stage, activeProjectId]);

  // load/save procurement items (shared between the Procurement tab and the
  // estimate's per-category "actual quotes" picker)
  useEffect(() => {
    if (stage !== "app" || !activeProjectId) return;
    let cancelled = false;
    setProcurementLoaded(false);
    loadProcurement(activeProjectId).then((saved) => {
      if (!cancelled) {
        setProcurementItems(saved || []);
        setProcurementLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stage, activeProjectId]);

  useEffect(() => {
    if (!procurementLoaded || stage !== "app" || !activeProjectId) return;
    if (procurementSaveTimer.current) clearTimeout(procurementSaveTimer.current);
    procurementSaveTimer.current = setTimeout(() => {
      saveProcurement(activeProjectId, procurementItems);
    }, 500);
    return () => clearTimeout(procurementSaveTimer.current);
  }, [procurementItems, activeProjectId, procurementLoaded, stage]);

  const flushProcurementSave = () => {
    if (procurementSaveTimer.current) clearTimeout(procurementSaveTimer.current);
    saveProcurement(activeProjectId, procurementItems);
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim();
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => it.name.includes(q) || (it.group && it.group.includes(q))
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, search]);

  const { blendedTotal, uniformTotals, chosenCount, totalCount, categoryTotals } = useMemo(() => {
    let blended = 0;
    const uniform = { low: 0, mid: 0, high: 0 };
    let chosen = 0;
    let total = 0;
    const perCategory = {};
    categories.forEach((c) => {
      const tier = getCatTier(c.name);
      const mult = catMult(c.name, use2026) * floorAccessMult(c.name, floorAccess);
      const useActual = categorySource[c.name] === "actual";
      let catAmount = 0;
      if (useActual) {
        catAmount = actualCategoryTotal(c.name, procurementItems);
        blended += catAmount;
      }
      c.items.forEach((it) => {
        total += 1;
        const q = quantities[it.id] ?? it.qty;
        if (q > 0) chosen += 1;
        if (!useActual) {
          const amount = q * (it[tier] || 0) * mult;
          catAmount += amount;
          blended += amount;
        }
        // The low/mid/high reference comparison always stays estimate-based,
        // regardless of the per-category actual-quote override — it's meant
        // to answer "what would this have cost at each price tier", which
        // isn't a question real quotes (a single fixed number) can answer.
        TIERS.forEach((t) => {
          uniform[t.key] += q * (it[t.key] || 0) * mult;
        });
      });
      perCategory[c.name] = catAmount;
    });
    return { blendedTotal: blended, uniformTotals: uniform, chosenCount: chosen, totalCount: total, categoryTotals: perCategory };
  }, [categories, quantities, categoryTiers, use2026, categorySource, procurementItems, floorAccess]);

  if (stage === "select") {
    return (
      <ProjectListScreen
        projects={projects}
        onOpenProject={(id) => {
          const proj = projects.find((p) => p.id === id);
          if (!proj) return;
          setActiveProjectId(id);
          setRoomType(proj.roomType);
          setStorageContext(user.id, id);
          setStage(proj.disclaimerAccepted ? "app" : "disclaimer");
        }}
        onCreateProject={async (clientName, roomType) => {
          const created = await createProjectRow(user.id, clientName, roomType);
          if (!created) {
            setConfirmDialog({
              message: "יצירת הפרויקט נכשלה. בדקי את החיבור לאינטרנט ונסי שוב.",
              onConfirm: () => setConfirmDialog(null),
            });
            return;
          }
          setProjects((prev) => [created, ...prev]);
          setActiveProjectId(created.id);
          setRoomType(roomType);
          setStorageContext(user.id, created.id);
          setStage("disclaimer");
        }}
        onDeleteProject={(id, clientName) => {
          setConfirmDialog({
            message: `למחוק את הפרויקט של "${clientName}"? כל הכמויות, נתוני הרכש, הצ'ק-ליסטים והמסמכים שלו יימחקו לצמיתות.`,
            onConfirm: async () => {
              await deleteProjectRow(id);
              setProjects((prev) => prev.filter((p) => p.id !== id));
              if (activeProjectId === id) {
                setActiveProjectId(null);
                setRoomType(null);
              }
              setConfirmDialog(null);
            },
          });
        }}
      />
    );
  }

  if (stage === "disclaimer") {
    return (
      <>
        <ProjectListScreen projects={projects} onOpenProject={() => {}} onCreateProject={() => {}} onDeleteProject={() => {}} />
        <DisclaimerModal
          onBack={() => {
            setStage("select");
            setActiveProjectId(null);
            setRoomType(null);
          }}
          onAccept={async () => {
            await acceptDisclaimerRow(activeProjectId);
            setProjects((prev) => prev.map((p) => (p.id === activeProjectId ? { ...p, disclaimerAccepted: true } : p)));
            setStage("app");
          }}
        />
      </>
    );
  }

  const meta = DATA.meta[roomType];
  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  return (
    <div dir="rtl" lang="he" className="min-h-screen pb-56" style={{ background: C.bg }}>
      <header
        className="sticky top-0 z-30 px-4 pt-3 pb-3"
        style={{ background: C.bg, borderBottom: `1px solid ${C.borderSoft}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0">
            <p
              className="text-[10px] tracking-widest"
              style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
            >
              שמרית אוחיון · שיפוץ בקלות
            </p>
            <h1
              className="text-base font-extrabold truncate"
              style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
            >
              {activeProject ? activeProject.clientName : meta.title}
            </h1>
            {activeProject && (
              <p className="text-[11px]" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                {meta.title}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setConfirmDialog({
                  message:
                    `לאפס את האומדן עבור "${meta.title}"? ` +
                    "זה ימחק את כל הכמויות ורמות הגימור שהוזנו (מעקב הרכש, הצ'ק-ליסטים והמסמכים לא יושפעו). הפעולה אינה הפיכה.",
                  onConfirm: async () => {
                    setQuantities({});
                    setCategoryTiers({});
                    setCategorySource({});
                    setActualArea(meta.defaultArea);
                    setFloorAccess({ floor: 0, hasElevator: true, hasParking: true });
                    await clearProjectState(activeProjectId);
                    setConfirmDialog(null);
                  },
                });
              }}
              className={`text-xs px-3 py-2 min-h-[36px] rounded-full ${FOCUS_RING}`}
              style={{ background: C.card, color: "#9C4A24", border: `1px solid ${C.border}`, fontFamily: "Assistant, sans-serif" }}
            >
              איפוס אומדן
            </button>
            <button
              onClick={() => {
                setStage("select");
                setActiveProjectId(null);
                setRoomType(null);
              }}
              className={`text-xs px-3 py-2 min-h-[36px] rounded-full ${FOCUS_RING}`}
              style={{ background: C.card, color: C.accentText, border: `1px solid ${C.border}`, fontFamily: "Assistant, sans-serif" }}
            >
              פרויקטים אחרים
            </button>
            <button
              onClick={onLogout}
              aria-label="יציאה מהחשבון"
              className={`text-xs px-3 py-2 min-h-[36px] rounded-full ${FOCUS_RING}`}
              style={{ background: C.card, color: C.textFaint, border: `1px solid ${C.border}`, fontFamily: "Assistant, sans-serif" }}
            >
              יציאה
            </button>
          </div>
        </div>

        <label htmlFor="item-search" className="sr-only">
          חיפוש פריט
        </label>
        <input
          id="item-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש פריט..."
          className={`w-full rounded-xl px-4 py-2.5 min-h-[44px] text-base ${FOCUS_RING}`}
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            color: C.text,
            fontFamily: "Assistant, sans-serif",
            fontSize: "16px",
          }}
        />
      </header>

      <main className="px-4 pt-3">
        <div
          role="tablist"
          aria-label="מעבר בין אומדן שיפוץ, מעקב רכש ומדריך"
          className="flex gap-1 rounded-xl p-1 mb-3"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          {[
            { key: "estimate", label: "אומדן שיפוץ" },
            { key: "procurement", label: "מעקב רכש" },
            { key: "guide", label: "מדריך ומידע" },
          ].map((v) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={activeView === v.key}
              onClick={() => setActiveView(v.key)}
              className={`flex-1 py-2.5 min-h-[40px] rounded-lg text-[11px] sm:text-xs font-bold transition-colors ${FOCUS_RING}`}
              style={{
                background: activeView === v.key ? C.accent : "transparent",
                color: activeView === v.key ? C.cardAlt : C.textMuted,
                fontFamily: "Assistant, sans-serif",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {activeView === "procurement" && (
          <ProcurementTracker
            roomType={activeProjectId}
            categories={categories}
            quantities={quantities}
            categoryTiers={categoryTiers}
            use2026={use2026}
            floorAccess={floorAccess}
            items={procurementItems}
            setItems={setProcurementItems}
            onSaveNow={flushProcurementSave}
          />
        )}
        {activeView === "guide" && (
          <GuideTab roomType={activeProjectId} blendedTotal={blendedTotal} />
        )}
        {activeView === "estimate" && (
          <>
            <div
              className="rounded-xl px-3 py-3 mb-3"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <label htmlFor="apt-area" className="text-xs font-bold block mb-1" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
                גודל הדירה בפועל (מ"ר נטו)
              </label>
              <p className="text-[11px] mb-2 leading-snug" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                משנה אוטומטית את כמויות המדידה, ההריסה והריצוף הכללי לפי הגודל האמיתי של הדירה שלכם (ברירת המחדל: {meta.defaultArea} מ"ר).
              </p>
              <div className="flex items-center gap-2">
                <input
                  id="apt-area"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="decimal"
                  value={actualArea ?? meta.defaultArea}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v) && v > 0) setActualArea(v);
                  }}
                  onBlur={() => applyAreaScale(actualArea, meta.defaultArea)}
                  aria-label="גודל הדירה בפועל במטרים רבועים"
                  className={`w-24 text-center rounded-lg py-2 min-h-[40px] ${FOCUS_RING}`}
                  style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
                />
                <span className="text-xs" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                  מ"ר
                </span>
                <button
                  onClick={() => applyAreaScale(actualArea, meta.defaultArea)}
                  className={`text-xs font-semibold px-3 py-2 min-h-[40px] rounded-lg ${FOCUS_RING}`}
                  style={{ background: C.accentSoft, color: C.accentText, fontFamily: "Assistant, sans-serif" }}
                >
                  עדכון כמויות
                </button>
              </div>
            </div>

            <div
              className="rounded-xl px-3 py-3 mb-3"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <p className="text-xs font-bold mb-1" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
                קומה ונגישות
              </p>
              <p className="text-[11px] mb-2 leading-snug" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
                משפיע על עלות הריסה/פינוי והובלת חומרים כבדים (קבלן, ריצוף, שיש, מטבח, נגרות, אלומיניום) — קומות גבוהות בלי מעלית או בלי גישת רכב עולות יותר.
              </p>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="floor-num" className="text-xs shrink-0" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
                  קומה:
                </label>
                <input
                  id="floor-num"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={floorAccess.floor}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setFloorAccess((fa) => ({ ...fa, floor: Number.isFinite(v) && v >= 0 ? v : 0 }));
                  }}
                  aria-label="מספר קומה"
                  className={`w-20 text-center rounded-lg py-2 min-h-[40px] ${FOCUS_RING}`}
                  style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
                />
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setFloorAccess((fa) => ({ ...fa, hasElevator: !fa.hasElevator }))}
                  aria-pressed={floorAccess.hasElevator}
                  className={`flex-1 py-2 min-h-[40px] rounded-lg text-xs font-semibold ${FOCUS_RING}`}
                  style={{
                    background: floorAccess.hasElevator ? C.accent : C.bg,
                    color: floorAccess.hasElevator ? C.cardAlt : C.textMuted,
                    fontFamily: "Assistant, sans-serif",
                  }}
                >
                  {floorAccess.hasElevator ? "✓ יש מעלית" : "אין מעלית"}
                </button>
                <button
                  onClick={() => setFloorAccess((fa) => ({ ...fa, hasParking: !fa.hasParking }))}
                  aria-pressed={floorAccess.hasParking}
                  className={`flex-1 py-2 min-h-[40px] rounded-lg text-xs font-semibold ${FOCUS_RING}`}
                  style={{
                    background: floorAccess.hasParking ? C.accent : C.bg,
                    color: floorAccess.hasParking ? C.cardAlt : C.textMuted,
                    fontFamily: "Assistant, sans-serif",
                  }}
                >
                  {floorAccess.hasParking ? "✓ גישת רכב/חניה" : "אין גישת רכב קרובה"}
                </button>
              </div>
              {(floorAccess.floor > 0 || !floorAccess.hasElevator || !floorAccess.hasParking) && (
                <p className="text-[11px]" style={{ color: "#3E5E8A", fontFamily: "Assistant, sans-serif" }}>
                  תוספת משוערת לקטגוריות הרגישות: +{Math.round((floorAccessMult("קבלן שיפוצים", floorAccess) - 1) * 100)}%
                </p>
              )}
            </div>

            <GuideAccordion title="חלוקת התקציב לפי קטגוריה" defaultOpen>
              <div className="pt-2">
                <BudgetPieChart categoryTotals={categoryTotals} />
              </div>
            </GuideAccordion>

            <div
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 mb-3"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="min-w-0">
                <p
                  className="text-xs font-bold"
                  style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}
                >
                  מחירי {use2026 ? "2026" : "2024"}
                </p>
                <p
                  className="text-[11px] leading-snug"
                  style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
                >
                  {use2026
                    ? "מותאם לעליית מחירי שיפוצים ואלומיניום 2024–2026"
                    : "מחירי המקור המקוריים (2024), ללא התאמה"}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={use2026}
                aria-label="הפעלת התאמת מחירים ל-2026"
                onClick={() => setUse2026((v) => !v)}
                className={`shrink-0 w-12 h-7 rounded-full relative transition-colors ${FOCUS_RING}`}
                style={{ background: use2026 ? C.accent : C.border }}
              >
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-6 h-6 rounded-full transition-all"
                  style={{
                    background: C.cardAlt,
                    right: use2026 ? "22px" : "2px",
                  }}
                />
              </button>
            </div>

            <StudioIntroCard />
            <p
              className="text-xs mb-3 leading-relaxed"
              style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}
            >
              בכל קטגוריה למטה אפשר לבחור בנפרד את רמת הגימור (נמוך / בינוני /
              גבוה) — פתחו את הקטגוריה ובחרו.
            </p>
            {filteredCategories.map((cat) => (
              <CategoryAccordion
                key={cat.name}
                category={cat}
                quantities={quantities}
                onQtyChange={(id, v) =>
                  setQuantities((q) => ({ ...q, [id]: v }))
                }
                isOpen={!!openCats[cat.name] || !!search.trim()}
                onToggle={() =>
                  setOpenCats((o) => ({ ...o, [cat.name]: !o[cat.name] }))
                }
                tier={getCatTier(cat.name)}
                onTierChange={(t) =>
                  setCategoryTiers((ct) => ({ ...ct, [cat.name]: t }))
                }
                use2026={use2026}
                onFocusChange={handleFocusChange}
                procurementItems={procurementItems}
                source={categorySource[cat.name] || "estimate"}
                onSourceChange={(src) =>
                  setCategorySource((cs) => ({ ...cs, [cat.name]: src }))
                }
                floorAccess={floorAccess}
                onSelectQuote={(itemId, quoteId) =>
                  setProcurementItems((prev) =>
                    prev.map((it) =>
                      it.id !== itemId
                        ? it
                        : { ...it, quotes: it.quotes.map((q) => ({ ...q, selected: q.id === quoteId })) }
                    )
                  )
                }
              />
            ))}
          </>
        )}
      </main>

      {activeView === "estimate" && (
        <Dashboard
        blendedTotal={blendedTotal}
        uniformTotals={uniformTotals}
        expanded={dashExpanded}
        setExpanded={setDashExpanded}
        onOpenSummary={() => setShowSummary(true)}
        chosenCount={chosenCount}
        totalCount={totalCount}
        meta={meta}
        categories={categories}
        quantities={quantities}
        categoryTiers={categoryTiers}
        use2026={use2026}
        floorAccess={floorAccess}
        hidden={inputFocused}
        onBulkSetTier={(t) => {
          const all = {};
          categories.forEach((c) => (all[c.name] = t));
          setCategoryTiers(all);
        }}
        onReset={() => {
          setConfirmDialog({
            message: "לאפס את כל הכמויות ורמות הגימור שהוזנו לפרויקט הזה?",
            onConfirm: () => {
              setQuantities({});
              setCategoryTiers({});
              setCategorySource({});
              clearProjectState(activeProjectId);
              setConfirmDialog(null);
            },
          });
        }}
        />
      )}

      {activeView === "estimate" && showSummary && (
        <SummaryPanel
          categories={categories}
          quantities={quantities}
          categoryTiers={categoryTiers}
          use2026={use2026}
          floorAccess={floorAccess}
          onClose={() => setShowSummary(false)}
        />
      )}
      {confirmDialog && (
        <ConfirmModal
          message={confirmDialog.message}
          confirmLabel="איפוס"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [signupDone, setSignupDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSignupDone(true);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "אימייל או סיסמה שגויים."
          : err.message || "משהו השתבש, נסי שוב."
      );
    } finally {
      setBusy(false);
    }
  };

  if (signupDone) {
    return (
      <div dir="rtl" lang="he" className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: C.bg }}>
        <PageHeader />
        <div className="max-w-sm w-full rounded-2xl p-6 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-sm leading-relaxed" style={{ color: C.text, fontFamily: "Assistant, sans-serif" }}>
            נרשמת בהצלחה! שלחנו מייל אימות לכתובת <b>{email}</b> — אחרי שתאשרי אותו, אפשר להתחבר.
          </p>
          <button
            onClick={() => {
              setSignupDone(false);
              setMode("login");
            }}
            className={`mt-4 text-sm font-semibold ${FOCUS_RING}`}
            style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
          >
            למסך התחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="he" className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: C.bg }}>
      <PageHeader />
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full rounded-2xl p-6"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <h2 className="text-lg font-bold mb-4 text-center" style={{ color: C.text, fontFamily: "Heebo, sans-serif" }}>
          {mode === "login" ? "התחברות" : "הרשמה"}
        </h2>

        <label htmlFor="auth-email" className="text-xs font-semibold block mb-1" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
          אימייל
        </label>
        <input
          id="auth-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full rounded-xl px-4 py-3 min-h-[44px] text-sm mb-3 ${FOCUS_RING}`}
          style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
        />

        <label htmlFor="auth-password" className="text-xs font-semibold block mb-1" style={{ color: C.textMuted, fontFamily: "Assistant, sans-serif" }}>
          סיסמה
        </label>
        <input
          id="auth-password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full rounded-xl px-4 py-3 min-h-[44px] text-sm mb-4 ${FOCUS_RING}`}
          style={{ border: `1px solid ${C.border}`, background: C.cardAlt, color: C.text, fontFamily: "Assistant, sans-serif", fontSize: "16px" }}
        />

        {error && (
          <p className="text-xs mb-3" style={{ color: "#9C4A24", fontFamily: "Assistant, sans-serif" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className={`w-full py-3 min-h-[44px] rounded-xl text-sm font-bold ${FOCUS_RING}`}
          style={{ background: C.accent, color: C.cardAlt, fontFamily: "Heebo, sans-serif", opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "רגע..." : mode === "login" ? "התחברות" : "הרשמה"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "login" ? "signup" : "login"));
            setError(null);
          }}
          className={`w-full mt-4 text-xs font-semibold ${FOCUS_RING}`}
          style={{ color: C.accentText, fontFamily: "Assistant, sans-serif" }}
        >
          {mode === "login" ? "אין לך חשבון? הרשמה" : "יש לך כבר חשבון? התחברות"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div dir="rtl" lang="he" className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <p className="text-sm" style={{ color: C.textFaint, fontFamily: "Assistant, sans-serif" }}>
          טוען...
        </p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <Estimator user={session.user} onLogout={() => supabase.auth.signOut()} />;
}
