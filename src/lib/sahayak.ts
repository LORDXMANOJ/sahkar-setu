import "server-only";
import { certificatesFor, getInstitute, getProgramme, jobs, programmes, type Trainee } from "./data";
import { isBundled, languageName, type Locale } from "./i18n/dictionaries";
import { matchJob } from "./insights";

/** Everything Sahayak may know about the trainee, built on the server. */
export function traineeContext(trainee: Trainee) {
  const certs = certificatesFor(trainee.id).map((c) => {
    const p = getProgramme(c.programmeSlug);
    return { id: c.id, programme: p?.title, grade: c.grade, score: c.score, issued: c.issuedOn, skills: p?.skills };
  });
  const matches = jobs
    .map((j) => ({ job: j, m: matchJob(trainee, j) }))
    .sort((a, b) => b.m.score - a.m.score)
    .slice(0, 5)
    .map(({ job, m }) => ({
      id: job.id,
      title: job.title,
      employer: job.employer,
      place: `${job.district}, ${job.state}`,
      kind: job.kind,
      pay: job.pay,
      match: m.score,
      missingSkills: m.missing,
    }));
  const upcoming = programmes.map((p) => ({
    title: p.title,
    institute: getInstitute(p.instituteId)?.short,
    starts: p.startsOn,
    days: p.days,
    seatsLeft: p.seats - p.enrolled,
    skills: p.skills,
  }));
  return { certs, matches, upcoming };
}

export function systemPrompt(trainee: Trainee, locale: Locale) {
  const ctx = traineeContext(trainee);
  const language = languageName(locale);
  return `You are Sahayak, the career guide inside Sahkar Setu, the training and employment platform of India's National Council for Cooperative Training. You talk with cooperative members, SHG women, dairy and fisheries workers and rural youth, many of whom read slowly or are new to smartphones.

How to answer:
- Reply in ${language} unless the trainee writes in another language, then match theirs. Use that language's own script.
- Keep it under 120 words. Short sentences, everyday words. Plain text only: no markdown, no asterisks, no tables. A short list with "•" is fine.
- Base advice on the trainee's record below. Name specific jobs, programmes and missing skills from it.
- Don't invent jobs, employers, loan amounts, eligibility rules or certificates. For scheme details you aren't sure of, say to confirm at their cooperative office, the district cooperative bank or the training institute.
- If asked about something unrelated to training, work or cooperatives, answer briefly and steer back.
- Latency-sensitive; begin your visible answer immediately.

Trainee record:
${JSON.stringify(
  {
    name: trainee.name,
    role: trainee.role,
    society: trainee.society,
    district: trainee.district,
    state: trainee.state,
    skills: trainee.skills,
    attendancePct: trainee.attendancePct,
    certificates: ctx.certs,
    bestJobMatches: ctx.matches,
    upcomingProgrammes: ctx.upcoming,
  },
  null,
  1,
)}`;
}

// ---------------------------------------------------------------------------
// Offline fallback: used when no AI key is configured, so the demo
// still answers the common questions from real data.
// ---------------------------------------------------------------------------

export function fallbackAnswer(trainee: Trainee, question: string, locale: Locale): string {
  const q = question.toLowerCase();
  const { matches, upcoming } = traineeContext(trainee);
  const top = matches.slice(0, 3);
  const next = upcoming.find((p) => p.seatsLeft > 0 && !trainee.skills.some((s) => p.skills?.includes(s)));

  const asksJobs = /job|work|hire|naukri|नौकरी|काम|रोज़गार|வேலை|பணி/.test(q);
  const asksLearn = /learn|course|next|train|सीख|कोर्स|प्रशिक्षण|கற்க|படிப்பு|பயிற்சி/.test(q);
  const asksDairy = /dairy|unit|loan|business|start|डेयरी|व्यवसाय|लोन|शुरू|பால்|தொழில்|கடன்/.test(q);

  const jobs = top.map((j) => `• ${j.title}, ${j.employer} (${j.place}), ${j.pay}. Match ${j.match}%`).join("\n");

  const t = {
    en: {
      jobs: `These fit your certificates best:\n${jobs}\n\nOpen Jobs to see why each one matches.`,
      learn: next
        ? `Next, try "${next.title}" at ${next.institute}, starting ${next.starts}. It adds ${next.skills?.slice(0, 2).join(" and ")}, which employers near you are asking for.`
        : "You've covered the programmes open right now. Ask your institute about the next calendar.",
      dairy: `To start a village dairy unit, see the NCDC enterprise support desk listed in Jobs. Your milk testing certificate and bookkeeping skills are a strong start. Take a business plan to your district cooperative bank, and confirm loan terms there.`,
      other: `I can help with jobs that fit your certificates, what to learn next, or starting your own unit. Try asking "Which jobs fit me?"`,
    },
    hi: {
      jobs: `आपके प्रमाणपत्रों से सबसे अच्छी मेल खाती नौकरियाँ:\n${jobs}\n\n"नौकरियाँ" खोलकर देखें कि हर एक क्यों मेल खाती है।`,
      learn: next
        ? `आगे "${next.title}" (${next.institute}) करें, जो ${next.starts} से शुरू है। इससे ${next.skills?.slice(0, 2).join(" और ")} सीखेंगे, जिनकी आपके आस-पास माँग है।`
        : "अभी खुले सभी कार्यक्रम आपने पूरे कर लिए हैं। अगले कैलेंडर के लिए अपने संस्थान से पूछें।",
      dairy: `गाँव में डेयरी यूनिट शुरू करने के लिए "नौकरियाँ" में दिया NCDC उद्यम सहायता डेस्क देखें। दूध जाँच का आपका प्रमाणपत्र और हिसाब-किताब का कौशल अच्छी शुरुआत है। बिज़नेस प्लान लेकर ज़िला सहकारी बैंक जाएँ और लोन की शर्तें वहीं पक्की करें।`,
      other: `मैं आपके प्रमाणपत्रों से मेल खाती नौकरियों, आगे क्या सीखें, या अपना काम शुरू करने में मदद कर सकता हूँ। पूछिए, "मेरे लिए कौन-सी नौकरियाँ हैं?"`,
    },
    ta: {
      jobs: `உங்கள் சான்றிதழ்களுக்கு மிகவும் பொருந்தும் வேலைகள்:\n${jobs}\n\nஒவ்வொன்றும் ஏன் பொருந்துகிறது என்பதை "வேலைகள்" பக்கத்தில் பாருங்கள்.`,
      learn: next
        ? `அடுத்து "${next.title}" (${next.institute}) பயிற்சியில் சேருங்கள். ${next.starts} அன்று தொடங்குகிறது.`
        : "இப்போது திறந்திருக்கும் பயிற்சிகளை முடித்துவிட்டீர்கள். அடுத்த அட்டவணைக்கு உங்கள் நிறுவனத்தைக் கேளுங்கள்.",
      dairy: `கிராமப் பால் பண்ணை அலகு தொடங்க, "வேலைகள்" பக்கத்தில் உள்ள NCDC தொழில் உதவி மையத்தைப் பாருங்கள். வணிகத் திட்டத்துடன் மாவட்ட கூட்டுறவு வங்கியை அணுகி, கடன் விதிமுறைகளை அங்கே உறுதிப்படுத்துங்கள்.`,
      other: `உங்கள் சான்றிதழ்களுக்கு ஏற்ற வேலைகள், அடுத்து என்ன கற்பது, சொந்தத் தொழில் தொடங்குவது பற்றி உதவ முடியும்.`,
    },
  }[isBundled(locale) ? locale : "en"];

  if (asksDairy) return t.dairy;
  if (asksJobs) return t.jobs;
  if (asksLearn) return t.learn;
  return t.other;
}
