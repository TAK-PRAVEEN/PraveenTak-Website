/**
 * ============================================================
 *  CHATBOT KNOWLEDGE BASE  —  EDIT ME
 * ============================================================
 *  This is the "brain" of the mascot chatbot. It answers visitor
 *  questions by matching their words against the `keywords` of each
 *  entry below and replying with `answer`.
 *
 *  HOW TO EDIT:
 *   • Change any `answer` text freely.
 *   • Add a new entry: { id, keywords: [...], answer: "..." }.
 *   • `keywords` are lowercase words/phrases to look for in the question.
 *
 *  ⚠️ ENTRIES MARKED `// TODO` BELOW NEED YOUR REAL INFO — fill them in.
 * ============================================================
 */

export interface KBEntry {
  id: string;
  keywords: string[];
  answer: string;
}

// Age is computed from the date of birth so it's always current.
const DOB = new Date(2004, 10, 10); // 10 Nov 2004 (month is 0-indexed)
function calcAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
const AGE = calcAge(DOB);

export const GREETING =
  "Hey! 👋 I'm Praveen's little buddy. Ask me about his experience, skills, education, projects — or a few personal things he's okay sharing!";

export const FALLBACK =
  "Hmm, I don't have an answer for that one 🤔. Try asking about Praveen's skills, experience, education, projects, hobbies, or how to contact him!";

// Shown as clickable chips to guide the visitor.
export const SUGGESTIONS: string[] = [
  "Who is Praveen?",
  "What are his skills?",
  "Tell me about his experience",
  "What projects has he built?",
  "When did he graduate?",
  "How can I contact him?",
  "Any hobbies?",
  "Favorite movie?",
  "Does he like cats? 🐱",
];

export const KNOWLEDGE: KBEntry[] = [
  {
    id: "who",
    keywords: ["who", "about", "yourself", "introduce", "tell me about", "what does he do"],
    answer:
      "Praveen Tak is a Computer Science graduate from Jaipur, India, specializing in Data Science & Machine Learning. He's currently pursuing his MCA at Poornima University and loves turning data into real-world solutions. 🚀",
  },
  {
    id: "skills",
    keywords: ["skill", "skills", "technolog", "stack", "languages", "know", "tools", "programming"],
    answer:
      "His toolkit: Python, Java, SQL, C/C++, JavaScript, HTML/CSS. For ML/Data Science — Scikit-learn, TensorFlow, Pandas, NumPy, Matplotlib. Plus MongoDB, MySQL, REST APIs, Git, Docker & Figma. 🛠️",
  },
  {
    id: "experience",
    keywords: ["experience", "work", "job", "intern", "internship", "career", "company", "companies"],
    answer:
      "Praveen has interned across some great teams: AI/ML Intern @ Create Consciously AI (TourIQ pricing platform), AI Intern @ Infosys Springboard (AI code reviewer), AI Intern @ Elevate Labs (sign-language recognition), Project Trainee @ DRDO (CycleGAN art generation), and Student Intern @ PhysicsWallah. 💼",
  },
  {
    id: "projects",
    keywords: ["project", "projects", "built", "made", "portfolio", "apps", "app"],
    answer:
      "Some highlights: 🪙 GoldLens AI (real-time gold price prediction with LSTM/GRU), 📄 ResumeParser.ai (NLP resume analyzer), 🍄 Mushroom Classification (99% accuracy), and a 📚 Library Management System. Check the Experience page for details!",
  },
  {
    id: "education",
    keywords: ["education", "study", "studied", "college", "university", "degree", "school", "qualification"],
    answer:
      "🎓 MCA at Poornima University, Jaipur (2025–2027) · B.Sc (PMCS) from Lachoo Memorial College, Jodhpur (2022–2025, 85%) · XII Science from Army Public School, Jodhpur (85%).",
  },
  {
    id: "graduation-dates",
    keywords: ["when", "pass", "passed", "graduate", "graduated", "finish", "complete", "completed", "year"],
    answer:
      "📅 He cleared Class XII in 2022, completed his B.Sc in July 2025, and is currently doing his MCA (expected 2027).",
  },
  {
    id: "achievements",
    keywords: ["achievement", "achievements", "award", "won", "win", "hackathon", "prize", "recognition"],
    answer:
      "🏆 Finalist at Central India Hackathon 2.0, Runner-Up & Winner at Sandhaanam 2025 events, Winner of MiniHackathon 2024, and graduated with Honours in B.Sc!",
  },
  {
    id: "certifications",
    keywords: ["certification", "certificate", "certified", "courses", "course"],
    answer:
      "He's earned 35+ certifications — Generative AI, Deep Learning, NLP, Computer Vision, Power BI, Prompt Engineering and more (Infosys Springboard, AWS, Google Cloud, DeepLearning.AI). 📜",
  },
  {
    id: "location",
    keywords: ["where", "location", "live", "from", "city", "based", "place"],
    answer: "📍 Praveen is based in Jaipur, Rajasthan, India.",
  },
  {
    id: "hobbies",
    keywords: ["hobby", "hobbies", "free time", "fun", "interest", "interests", "like to do", "passion"],
    answer:
      "⚽ Outside of code he loves football, 🎬 watching movies, 📸 photography, ✈️ travelling, and exploring new technology.",
  },
  {
    id: "contact",
    keywords: ["contact", "reach", "email", "phone", "hire", "connect", "linkedin", "github", "touch"],
    answer:
      "📬 Email: praveentak715@gmail.com · 📞 +91 94620 96002 · LinkedIn: /in/praveentak · GitHub: TAK-PRAVEEN. Or just use the Contact page form!",
  },
  {
    id: "resume",
    keywords: ["resume", "cv", "download"],
    answer:
      "You can grab his resume from the “Download Resume” button on the home page. 📄",
  },

  /* ----------------- PERSONAL ----------------- */
  {
    id: "girlfriends",
    keywords: ["girlfriend", "girlfriends", "dating", "crush", "love life", "gf"],
    answer:
      "Ha! 😄 He's had 2 girlfriends — but the names? Those stay classified. 🤐",
  },
  {
    id: "relationship-status",
    keywords: [
      "single",
      "relationship",
      "married",
      "wife",
      "partner",
      "committed",
      "taken",
      "boyfriend",
    ],
    answer: "He's single at the moment — focused on his goals. 😎",
  },
  {
    id: "age",
    keywords: ["age", "old", "born", "birthday", "dob"],
    answer: `He's ${AGE} years old, born on 10 November 2004. 🎂`,
  },
  {
    id: "favorite-movie",
    keywords: ["movie", "movies", "film", "cinema", "genre", "favourite movie"],
    answer: "🎬 His all-time favorite movie is The Godfather.",
  },
  {
    id: "favorite-series",
    keywords: ["series", "show", "shows", "tv", "web series", "binge", "netflix"],
    answer: "📺 His favorite series is Vikings — he loves it!",
  },
  {
    id: "cats",
    keywords: ["cat", "cats", "pet", "pets", "animal", "animals", "kitten"],
    answer: "🐱 He's a cat person — loves petting and hanging out with cats!",
  },
];
