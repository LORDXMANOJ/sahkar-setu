export {
  languages,
  locales,
  bundledLocales,
  isLocale,
  isBundled,
  languageName,
  speechTag,
  type Locale,
  type BundledLocale,
} from "./languages";
import type { BundledLocale } from "./languages";

const en = {
  brandTag: "Cooperative training, certification and jobs",
  nav: {
    programmes: "Programmes",
    verify: "Verify a certificate",
    employers: "For employers",
    open: "Open the app",
    skip: "Skip to content",
    language: "Language",
  },
  hero: {
    title: "From the training hall to a job, on one passport.",
    body: "Sahkar Setu runs NCCT training end to end: nominations, attendance, lessons that work offline, certificates anyone can verify, and jobs matched to what each trainee has actually learned.",
    primary: "Open the trainee app",
    secondary: "Verify a certificate",
    facts: ["Works in English, Hindi and Tamil", "Lessons keep working without internet", "Certificates are digitally signed"],
  },
  passport: {
    title: "Skill Passport",
    issuer: "National Council for Cooperative Training",
    holder: "Holder",
    society: "Society",
    id: "Passport no.",
  },
  journey: {
    title: "One record follows the trainee",
    body: "Today a trainee's history is spread across registers, spreadsheets and paper certificates. Here, each step adds a stamp to a single Skill Passport.",
    steps: [
      { stamp: "Nominated", title: "Nominated by their society", body: "The cooperative society nominates them online. The institute approves, assigns a hostel room and sends the timetable by SMS." },
      { stamp: "Present", title: "Marked present, honestly", body: "They scan a QR code on the trainer's screen. It changes every 20 seconds, so a forwarded photo won't mark anyone present." },
      { stamp: "Learned", title: "Learning without a signal", body: "Lessons and quizzes are saved on the phone and work offline. Answers sync on their own when the network comes back." },
      { stamp: "Certified", title: "Certified, and provably so", body: "The certificate is signed by the council. Any employer can scan it and know in seconds whether it is genuine." },
      { stamp: "Hired", title: "Matched to real work", body: "Jobs are ranked by certified skills, with the reasons shown, so employers see why a candidate fits." },
    ],
  },
  features: {
    title: "Built for how cooperative training actually runs",
    items: [
      { title: "Programmes and nominations", body: "Publish the calendar, take nominations from societies, and manage seats, hostel rooms and travel in one place." },
      { title: "Attendance that can't be proxied", body: "A rotating QR code on the trainer's screen. No fingerprint machine to buy, and no register to fudge." },
      { title: "Lessons in the trainee's language", body: "English, Hindi and Tamil, with every lesson read aloud for those who would rather listen. Built for a basic smartphone." },
      { title: "Sahayak, the career guide", body: "An assistant that knows the trainee's certificates and answers questions about jobs, schemes and the next course, in their language." },
    ],
  },
  verify: {
    title: "Check a certificate",
    body: "Enter the ID printed on it, or scan the QR code in the corner.",
    placeholder: "e.g. NCCT-2026-GNR-0412",
    action: "Check certificate",
    sample: "Try a sample",
    label: "Certificate ID",
  },
  roles: {
    title: "One system, five kinds of users",
    items: [
      { who: "Trainees", what: "Their passport, lessons, attendance and job matches on their phone." },
      { who: "Institutes", what: "Programme calendars, timetables, hostels and live attendance." },
      { who: "Cooperative societies", what: "Nominate members and track who finished and who is struggling." },
      { who: "Employers", what: "Post jobs, see ranked candidates and verify certificates instantly." },
      { who: "NCCT and the Ministry", what: "Outreach, completion and placement across every state." },
    ],
  },
  footer: {
    note: "Prototype for Smart India Hackathon problem 26087, Ministry of Cooperation (NCCT). All people and employers shown are fictional.",
  },
  app: {
    home: "Home",
    learn: "Learn",
    attendance: "Attendance",
    jobs: "Jobs",
    employer: "Employer",
    insights: "Insights",
    demo: "Demo mode",
    greeting: "Namaste",
    offline: "You're offline. Lessons and quizzes still work and will sync later.",
    backOnline: "Back online. Your answers have synced.",
  },
  assistant: {
    open: "Ask Sahayak",
    title: "Sahayak",
    subtitle: "Career guide",
    placeholder: "Ask about jobs, courses or schemes",
    send: "Send",
    close: "Close",
    starters: ["Which jobs fit my certificates?", "What should I learn next?", "How do I start a dairy unit?"],
    error: "Sahayak couldn't answer just now. Check your connection and try again.",
  },
};

export type Dictionary = typeof en;

const hi: Dictionary = {
  brandTag: "सहकारी प्रशिक्षण, प्रमाणन और रोज़गार",
  nav: {
    programmes: "कार्यक्रम",
    verify: "प्रमाणपत्र जाँचें",
    employers: "नियोक्ताओं के लिए",
    open: "ऐप खोलें",
    skip: "सामग्री पर जाएँ",
    language: "भाषा",
  },
  hero: {
    title: "प्रशिक्षण कक्ष से रोज़गार तक, एक ही पासपोर्ट पर।",
    body: "सहकार सेतु NCCT के प्रशिक्षण को शुरू से अंत तक चलाता है: नामांकन, उपस्थिति, बिना इंटरनेट चलने वाले पाठ, ऐसे प्रमाणपत्र जिन्हें कोई भी जाँच सके, और हर प्रशिक्षु के सीखे हुए कौशल से मेल खाती नौकरियाँ।",
    primary: "प्रशिक्षु ऐप खोलें",
    secondary: "प्रमाणपत्र जाँचें",
    facts: ["अंग्रेज़ी, हिन्दी और तमिल में", "बिना इंटरनेट भी पाठ चलते हैं", "प्रमाणपत्र डिजिटल रूप से हस्ताक्षरित"],
  },
  passport: {
    title: "कौशल पासपोर्ट",
    issuer: "राष्ट्रीय सहकारी प्रशिक्षण परिषद",
    holder: "धारक",
    society: "समिति",
    id: "पासपोर्ट सं.",
  },
  journey: {
    title: "एक ही रिकॉर्ड प्रशिक्षु के साथ चलता है",
    body: "आज प्रशिक्षु का इतिहास रजिस्टरों, स्प्रेडशीट और काग़ज़ी प्रमाणपत्रों में बिखरा है। यहाँ हर कदम एक ही कौशल पासपोर्ट पर मुहर लगाता है।",
    steps: [
      { stamp: "नामांकित", title: "समिति द्वारा नामांकन", body: "सहकारी समिति ऑनलाइन नामांकन करती है। संस्थान मंज़ूरी देकर छात्रावास का कमरा देता है और समय-सारणी SMS से भेजता है।" },
      { stamp: "उपस्थित", title: "ईमानदार उपस्थिति", body: "प्रशिक्षु प्रशिक्षक की स्क्रीन पर QR कोड स्कैन करते हैं। यह हर 20 सेकंड में बदलता है, इसलिए भेजी गई फ़ोटो से किसी की हाज़िरी नहीं लगती।" },
      { stamp: "सीखा", title: "बिना नेटवर्क के पढ़ाई", body: "पाठ और क्विज़ फ़ोन में सहेजे रहते हैं और ऑफ़लाइन चलते हैं। नेटवर्क लौटते ही उत्तर अपने-आप सिंक हो जाते हैं।" },
      { stamp: "प्रमाणित", title: "प्रमाणित, और साबित भी", body: "प्रमाणपत्र पर परिषद का डिजिटल हस्ताक्षर होता है। कोई भी नियोक्ता स्कैन करके कुछ ही सेकंड में जान सकता है कि वह असली है।" },
      { stamp: "नियुक्त", title: "असली काम से मेल", body: "नौकरियाँ प्रमाणित कौशल के आधार पर क्रम में आती हैं, कारण सहित, ताकि नियोक्ता देख सकें कि उम्मीदवार क्यों उपयुक्त है।" },
    ],
  },
  features: {
    title: "सहकारी प्रशिक्षण जैसे असल में चलता है, वैसे ही बना",
    items: [
      { title: "कार्यक्रम और नामांकन", body: "कैलेंडर प्रकाशित करें, समितियों से नामांकन लें, और सीटें, छात्रावास व यात्रा एक ही जगह सँभालें।" },
      { title: "उपस्थिति जिसमें प्रॉक्सी नहीं", body: "प्रशिक्षक की स्क्रीन पर बदलता QR कोड। न फ़िंगरप्रिंट मशीन ख़रीदनी, न रजिस्टर में हेरफेर।" },
      { title: "प्रशिक्षु की अपनी भाषा में पाठ", body: "अंग्रेज़ी, हिन्दी और तमिल में, और हर पाठ सुनने की सुविधा के साथ। साधारण स्मार्टफ़ोन के लिए बना।" },
      { title: "सहायक, करियर मार्गदर्शक", body: "एक सहायक जो प्रशिक्षु के प्रमाणपत्र जानता है और नौकरियों, योजनाओं और अगले कोर्स के सवालों का जवाब उनकी भाषा में देता है।" },
    ],
  },
  verify: {
    title: "प्रमाणपत्र जाँचें",
    body: "उस पर छपी ID डालें, या कोने में दिया QR कोड स्कैन करें।",
    placeholder: "जैसे NCCT-2026-GNR-0412",
    action: "प्रमाणपत्र जाँचें",
    sample: "नमूना आज़माएँ",
    label: "प्रमाणपत्र ID",
  },
  roles: {
    title: "एक प्रणाली, पाँच तरह के उपयोगकर्ता",
    items: [
      { who: "प्रशिक्षु", what: "अपना पासपोर्ट, पाठ, उपस्थिति और नौकरी के मिलान, अपने फ़ोन पर।" },
      { who: "संस्थान", what: "कार्यक्रम कैलेंडर, समय-सारणी, छात्रावास और लाइव उपस्थिति।" },
      { who: "सहकारी समितियाँ", what: "सदस्यों का नामांकन करें और देखें कि किसने पूरा किया और किसे मदद चाहिए।" },
      { who: "नियोक्ता", what: "नौकरियाँ डालें, क्रमबद्ध उम्मीदवार देखें और तुरंत प्रमाणपत्र जाँचें।" },
      { who: "NCCT और मंत्रालय", what: "हर राज्य में पहुँच, पूर्णता और नियुक्ति।" },
    ],
  },
  footer: {
    note: "स्मार्ट इंडिया हैकाथॉन समस्या 26087, सहकारिता मंत्रालय (NCCT) के लिए प्रोटोटाइप। दिखाए गए सभी व्यक्ति और नियोक्ता काल्पनिक हैं।",
  },
  app: {
    home: "होम",
    learn: "पढ़ाई",
    attendance: "उपस्थिति",
    jobs: "नौकरियाँ",
    employer: "नियोक्ता",
    insights: "विश्लेषण",
    demo: "डेमो मोड",
    greeting: "नमस्ते",
    offline: "आप ऑफ़लाइन हैं। पाठ और क्विज़ चलते रहेंगे और बाद में सिंक होंगे।",
    backOnline: "फिर से ऑनलाइन। आपके उत्तर सिंक हो गए।",
  },
  assistant: {
    open: "सहायक से पूछें",
    title: "सहायक",
    subtitle: "करियर मार्गदर्शक",
    placeholder: "नौकरी, कोर्स या योजनाओं के बारे में पूछें",
    send: "भेजें",
    close: "बंद करें",
    starters: ["मेरे प्रमाणपत्रों से कौन-सी नौकरियाँ मेल खाती हैं?", "मुझे आगे क्या सीखना चाहिए?", "डेयरी यूनिट कैसे शुरू करूँ?"],
    error: "सहायक अभी जवाब नहीं दे सका। कनेक्शन जाँचकर फिर कोशिश करें।",
  },
};

const ta: Dictionary = {
  brandTag: "கூட்டுறவுப் பயிற்சி, சான்றிதழ் மற்றும் வேலைவாய்ப்பு",
  nav: {
    programmes: "பயிற்சித் திட்டங்கள்",
    verify: "சான்றிதழைச் சரிபார்க்க",
    employers: "வேலை வழங்குநர்களுக்கு",
    open: "செயலியைத் திற",
    skip: "உள்ளடக்கத்துக்குச் செல்",
    language: "மொழி",
  },
  hero: {
    title: "பயிற்சி அரங்கிலிருந்து வேலை வரை, ஒரே கடவுச்சீட்டில்.",
    body: "சஹகார் சேது NCCT பயிற்சியை முழுமையாக நடத்துகிறது: பரிந்துரை, வருகைப் பதிவு, இணையம் இல்லாமலும் இயங்கும் பாடங்கள், யாரும் சரிபார்க்கக்கூடிய சான்றிதழ்கள், மற்றும் ஒவ்வொருவரும் கற்ற திறன்களுக்கு ஏற்ற வேலைகள்.",
    primary: "பயிற்சியாளர் செயலியைத் திற",
    secondary: "சான்றிதழைச் சரிபார்க்க",
    facts: ["ஆங்கிலம், இந்தி, தமிழில்", "இணையம் இல்லாமலும் பாடங்கள் இயங்கும்", "சான்றிதழ்கள் டிஜிட்டல் கையொப்பம் பெற்றவை"],
  },
  passport: {
    title: "திறன் கடவுச்சீட்டு",
    issuer: "தேசிய கூட்டுறவுப் பயிற்சி மன்றம்",
    holder: "உரிமையாளர்",
    society: "சங்கம்",
    id: "கடவுச்சீட்டு எண்",
  },
  journey: {
    title: "ஒரே பதிவு பயிற்சியாளருடன் தொடர்கிறது",
    body: "இன்று ஒரு பயிற்சியாளரின் வரலாறு பதிவேடுகள், விரிதாள்கள், காகிதச் சான்றிதழ்களில் சிதறிக் கிடக்கிறது. இங்கே ஒவ்வொரு படியும் ஒரே திறன் கடவுச்சீட்டில் முத்திரை இடுகிறது.",
    steps: [
      { stamp: "பரிந்துரை", title: "சங்கத்தால் பரிந்துரை", body: "கூட்டுறவுச் சங்கம் இணையத்தில் பரிந்துரைக்கிறது. நிறுவனம் ஒப்புதல் அளித்து, விடுதி அறை ஒதுக்கி, கால அட்டவணையை SMS மூலம் அனுப்புகிறது." },
      { stamp: "வருகை", title: "நேர்மையான வருகைப் பதிவு", body: "பயிற்றுநரின் திரையில் உள்ள QR குறியீட்டை ஸ்கேன் செய்கிறார்கள். அது 20 வினாடிக்கு ஒருமுறை மாறுவதால், அனுப்பப்பட்ட புகைப்படம் யாருக்கும் வருகை பதியாது." },
      { stamp: "கற்றது", title: "சிக்னல் இல்லாமலும் கற்றல்", body: "பாடங்களும் வினாடி வினாக்களும் கைப்பேசியில் சேமிக்கப்பட்டு ஆஃப்லைனில் இயங்கும். நெட்வொர்க் திரும்பியதும் பதில்கள் தானாக ஒத்திசைகின்றன." },
      { stamp: "சான்றளிப்பு", title: "சான்றளிக்கப்பட்டது, நிரூபிக்கவும் முடியும்", body: "சான்றிதழில் மன்றத்தின் டிஜிட்டல் கையொப்பம் உள்ளது. எந்த வேலை வழங்குநரும் ஸ்கேன் செய்து சில வினாடிகளில் அது உண்மையானதா என அறியலாம்." },
      { stamp: "பணியமர்வு", title: "உண்மையான வேலையுடன் பொருத்தம்", body: "சான்றளிக்கப்பட்ட திறன்களின் அடிப்படையில், காரணங்களுடன் வேலைகள் வரிசைப்படுத்தப்படுகின்றன." },
    ],
  },
  features: {
    title: "கூட்டுறவுப் பயிற்சி உண்மையில் நடக்கும் விதத்திற்கேற்ப உருவாக்கப்பட்டது",
    items: [
      { title: "பயிற்சித் திட்டங்களும் பரிந்துரைகளும்", body: "அட்டவணையை வெளியிடுங்கள், சங்கங்களிடமிருந்து பரிந்துரைகளைப் பெறுங்கள், இடங்கள், விடுதி, பயணம் அனைத்தையும் ஒரே இடத்தில் நிர்வகியுங்கள்." },
      { title: "போலி வருகை இல்லை", body: "பயிற்றுநர் திரையில் மாறிக்கொண்டே இருக்கும் QR குறியீடு. கைரேகை இயந்திரம் வாங்கத் தேவையில்லை." },
      { title: "பயிற்சியாளரின் மொழியில் பாடங்கள்", body: "ஆங்கிலம், இந்தி, தமிழில், ஒவ்வொரு பாடத்தையும் கேட்கும் வசதியுடன். சாதாரண ஸ்மார்ட்போனுக்காக உருவாக்கப்பட்டது." },
      { title: "சஹாயக், தொழில் வழிகாட்டி", body: "பயிற்சியாளரின் சான்றிதழ்களை அறிந்து, வேலைகள், திட்டங்கள், அடுத்த படிப்பு பற்றிய கேள்விகளுக்கு அவர்களின் மொழியில் பதிலளிக்கும் உதவியாளர்." },
    ],
  },
  verify: {
    title: "சான்றிதழைச் சரிபார்க்க",
    body: "அதில் அச்சிடப்பட்ட ID-ஐ உள்ளிடுங்கள், அல்லது மூலையில் உள்ள QR குறியீட்டை ஸ்கேன் செய்யுங்கள்.",
    placeholder: "எ.கா. NCCT-2026-GNR-0412",
    action: "சான்றிதழைச் சரிபார்",
    sample: "மாதிரியை முயல்க",
    label: "சான்றிதழ் ID",
  },
  roles: {
    title: "ஒரே அமைப்பு, ஐந்து வகைப் பயனர்கள்",
    items: [
      { who: "பயிற்சியாளர்கள்", what: "கடவுச்சீட்டு, பாடங்கள், வருகை, வேலைப் பொருத்தங்கள், அவர்களின் கைப்பேசியில்." },
      { who: "நிறுவனங்கள்", what: "பயிற்சி அட்டவணை, கால அட்டவணை, விடுதி, நேரடி வருகை." },
      { who: "கூட்டுறவுச் சங்கங்கள்", what: "உறுப்பினர்களைப் பரிந்துரைத்து, யார் முடித்தார்கள், யாருக்கு உதவி தேவை என்பதைக் கண்காணிக்கலாம்." },
      { who: "வேலை வழங்குநர்கள்", what: "வேலைகளை வெளியிட்டு, வரிசைப்படுத்தப்பட்ட விண்ணப்பதாரர்களைப் பார்த்து, சான்றிதழ்களை உடனே சரிபார்க்கலாம்." },
      { who: "NCCT மற்றும் அமைச்சகம்", what: "ஒவ்வொரு மாநிலத்திலும் பயிற்சி, நிறைவு, பணியமர்வு." },
    ],
  },
  footer: {
    note: "ஸ்மார்ட் இந்தியா ஹேக்கத்தான் சிக்கல் 26087, கூட்டுறவு அமைச்சகம் (NCCT) க்கான முன்மாதிரி. காட்டப்பட்டுள்ள அனைவரும் கற்பனையானவர்கள்.",
  },
  app: {
    home: "முகப்பு",
    learn: "கற்றல்",
    attendance: "வருகை",
    jobs: "வேலைகள்",
    employer: "வேலை வழங்குநர்",
    insights: "பகுப்பாய்வு",
    demo: "டெமோ முறை",
    greeting: "வணக்கம்",
    offline: "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள். பாடங்களும் வினாடி வினாக்களும் இயங்கும், பின்னர் ஒத்திசைக்கப்படும்.",
    backOnline: "மீண்டும் ஆன்லைனில். உங்கள் பதில்கள் ஒத்திசைக்கப்பட்டன.",
  },
  assistant: {
    open: "சஹாயக்கிடம் கேளுங்கள்",
    title: "சஹாயக்",
    subtitle: "தொழில் வழிகாட்டி",
    placeholder: "வேலை, படிப்பு அல்லது திட்டங்கள் பற்றிக் கேளுங்கள்",
    send: "அனுப்பு",
    close: "மூடு",
    starters: ["என் சான்றிதழ்களுக்கு எந்த வேலைகள் பொருந்தும்?", "அடுத்து நான் என்ன கற்க வேண்டும்?", "பால் பண்ணை அலகை எப்படித் தொடங்குவது?"],
    error: "சஹாயக்கால் இப்போது பதிலளிக்க முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயலுங்கள்.",
  },
};

/** Hand-written dictionaries shipped with the app. Other languages are downloaded as packs. */
export const dictionaries: Record<BundledLocale, Dictionary> = { en, hi, ta };
