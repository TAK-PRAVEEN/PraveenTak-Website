/**
 * Answers for search and AI engines (SEO + AEO + GEO).
 *
 * One source of truth for the services Praveen offers and the questions people (and
 * ChatGPT / Perplexity / Gemini / Google AI Overviews) ask about him. It feeds:
 *  - the visible FAQ on /about (answer engines only trust answers that are on the page),
 *  - the FAQPage + Service JSON-LD in BaseLayout / about.astro,
 *  - /llms.txt and /llms-full.txt.
 * Keep every fact here consistent with src/content/profile.json — same name, title and city everywhere.
 */

/** Profiles that are Praveen but aren't shown as footer/contact links (added to schema.org `sameAs`). */
export const EXTRA_SAME_AS = ["https://www.instagram.com/praveentak.dev/"];

export interface Service {
  name: string;
  /** One sentence, answer-first: what it is and who it's for. */
  description: string;
}

export const SERVICES: Service[] = [
  {
    name: "Custom AI dashboards",
    description:
      "One web dashboard for a business's sales, stock, customers and leads — on laptop and phone — built and managed for the client.",
  },
  {
    name: "Machine-learning forecasting",
    description:
      "Sales, demand and price forecasts from the client's own history plus festivals, holidays and seasonality, back-tested and shown as a likely range.",
  },
  {
    name: "WhatsApp automation",
    description:
      "Rate cards, reminders, follow-ups and replies on the official WhatsApp Business Platform, sent only to customers who opted in.",
  },
  {
    name: "Web design and development",
    description: "Fast, mobile-first websites and web apps with clean design, structured data and good Core Web Vitals.",
  },
  {
    name: "Computer vision and LLM tools",
    description: "Image and video recognition systems and LLM-powered tools for real business workflows.",
  },
];

export interface Faq {
  q: string;
  a: string;
}

/** Answer-first: the first sentence answers the question on its own, so engines can quote it. */
export function faqs(city: string, region: string, email: string): Faq[] {
  return [
    {
      q: "Who is Praveen Tak?",
      a: `Praveen Tak is an AI/ML engineer and full-stack developer from ${city}, ${region}, India. He builds AI dashboards, machine-learning forecasting, computer-vision systems, LLM tools and production web apps for real businesses.`,
    },
    {
      q: "What services does Praveen Tak offer?",
      a: `Custom AI dashboards, machine-learning forecasting, WhatsApp automation on the official WhatsApp Business Platform, web design and development, and computer-vision and LLM tools. Each project is built around the client's own data and workflow.`,
    },
    {
      q: "What is an AI dashboard?",
      a: "An AI dashboard is a web dashboard that brings a business's sales, stock, customers and leads onto one screen and adds machine-learning forecasts and recommendations — for example, what to stock before a festival or which customers to call today.",
    },
    {
      q: "How does machine-learning sales or demand forecasting work?",
      a: "The model learns from the business's own history — bills, seasons, festivals, holidays and prices — then is back-tested on months it has never seen. It only ships if it beats a simple last-year baseline, and forecasts are shown as a likely range, not a promise.",
    },
    {
      q: "Which businesses does Praveen Tak work with?",
      a: "Jewellery showrooms, sales and marketing teams, and small and mid-sized businesses that run on spreadsheets and WhatsApp and want one dashboard with forecasts and automation.",
    },
    {
      q: "What technologies does Praveen Tak use?",
      a: "Python with scikit-learn, LightGBM, TensorFlow and PyTorch for machine learning; LangChain, Hugging Face and the Gemini API for LLM tools; FastAPI, Streamlit and Docker for services; and JavaScript, Astro and Cloudflare for fast websites and dashboards.",
    },
    {
      q: "How long does a project take and how is it priced?",
      a: "A custom dashboard is usually live in one to two weeks, on a low monthly plan with setup, training and support included. A free 15-minute demo comes first.",
    },
    {
      q: `Where is Praveen Tak based, and does he work remotely?`,
      a: `He is based in ${city}, ${region}, India, and works remotely with clients across India.`,
    },
    {
      q: "How can I contact Praveen Tak?",
      a: `Email ${email} or use the contact page at praveentak.dev/contact. He is open to AI/ML roles and client projects.`,
    },
  ];
}
