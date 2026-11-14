/**
 * Chatbot knowledge: personal facts (from the previous site's chatbot, kept by
 * Praveen's choice) + scripted fallback answers used when Workers AI is not
 * available (local dev before Cloudflare login, or the daily free quota is used up).
 * Professional facts are NOT duplicated here — the API builds them from the
 * content collections, so they never go stale.
 */

const DOB = new Date(2004, 10, 10); // 10 Nov 2004
export function age(now = new Date()): number {
  let a = now.getFullYear() - DOB.getFullYear();
  const m = now.getMonth() - DOB.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < DOB.getDate())) a--;
  return a;
}

/** Personal facts Praveen is happy to share (fed to the AI as context). */
export const PERSONAL_FACTS = () =>
  [
    `Born 10 November 2004 (age ${age()}). Lives in Jodhpur, Rajasthan, India.`,
    "Hobbies: football, watching movies, photography, travelling, exploring new technology.",
    "Favourite movie: The Godfather. Favourite series: Vikings.",
    "A cat person — loves petting and hanging out with cats.",
    "Relationship status: single at the moment, focused on his goals.",
    "Has had 2 girlfriends — the names stay classified (answer playfully).",
  ].join("\n");

export const GREETING =
  "Hi! I'm Praveen's assistant. Ask me about his projects, experience, skills or education — or a few personal things he's happy to share.";

export const SUGGESTIONS = [
  "Who is Praveen?",
  "What has he built?",
  "Tell me about his experience",
  "What are his skills?",
  "How can I contact him?",
  "Favourite movie?",
];

interface Entry {
  keywords: string[];
  answer: (ctx: FallbackContext) => string;
}
export interface FallbackContext {
  email: string;
  intro: string;
  roles: string[];
  projects: string[];
  roles_exp: string[];
  skills: string[];
}

const KB: Entry[] = [
  { keywords: ["who", "about", "introduce", "yourself", "what does he do"], answer: (c) => `${c.intro} He works as ${c.roles.join(", ")}.` },
  { keywords: ["project", "built", "build", "made", "work", "portfolio", "app"], answer: (c) => `Some highlights: ${c.projects.slice(0, 6).join(" · ")}. See the Work page for case studies.` },
  { keywords: ["experience", "intern", "job", "company", "career", "drdo", "infosys"], answer: (c) => `Experience: ${c.roles_exp.join(" · ")}.` },
  { keywords: ["skill", "stack", "technolog", "language", "tools", "know"], answer: (c) => `His toolkit: ${c.skills.slice(0, 18).join(", ")}.` },
  { keywords: ["education", "study", "college", "university", "degree", "mca", "bsc"], answer: () => "MCA in AI & Data Science at Poornima University, Jaipur (2025–2027); B.Sc (PMCS) from Lachoo Memorial College, Jodhpur (2022–2025, 85%, Honours); XII Science from Army Public School, Jodhpur." },
  { keywords: ["research", "paper", "gan", "lab"], answer: () => "His research paper 'GANs Under Data Scarcity' compares four GAN losses across 16 training runs — LSGAN was the most stable, WGAN collapsed at 1,000 images. Details are in the Lab." },
  { keywords: ["contact", "email", "reach", "hire", "connect", "phone"], answer: (c) => `Email ${c.email}, or use the Contact page. He's open to AI / ML roles.` },
  { keywords: ["where", "location", "live", "city", "based", "from"], answer: () => "He's based in Jodhpur, Rajasthan, India." },
  { keywords: ["hobby", "hobbies", "free time", "fun", "interest"], answer: () => "Outside code: football, movies, photography, travelling and exploring new tech." },
  { keywords: ["movie", "film", "cinema"], answer: () => "His all-time favourite movie is The Godfather." },
  { keywords: ["series", "show", "tv", "netflix"], answer: () => "His favourite series is Vikings." },
  { keywords: ["cat", "cats", "pet", "animal"], answer: () => "He's a cat person — loves hanging out with cats. 🐱" },
  { keywords: ["age", "old", "born", "birthday"], answer: () => `He's ${age()}, born on 10 November 2004.` },
  { keywords: ["single", "relationship", "married", "partner", "dating"], answer: () => "He's single at the moment — focused on his goals." },
  { keywords: ["girlfriend", "girlfriends", "crush", "gf"], answer: () => "Ha — he's had 2 girlfriends, but the names stay classified. 🤐" },
];

export function fallbackAnswer(q: string, ctx: FallbackContext): string {
  const text = q.toLowerCase();
  let best: Entry | null = null;
  let score = 0;
  for (const e of KB) {
    const s = e.keywords.reduce((n, k) => n + (text.includes(k) ? k.length : 0), 0);
    if (s > score) {
      score = s;
      best = e;
    }
  }
  return best
    ? best.answer(ctx)
    : "I'm not sure about that one. Try asking about his projects, experience, skills, education, or how to contact him.";
}
