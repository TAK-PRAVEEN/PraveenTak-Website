import Navigation from "@/components/Navigation";
import ProjectCard from "@/components/ProjectCard";
import TimelineItem from "@/components/TimelineItem";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Award, 
  BookOpen, 
  Calendar,
  ExternalLink
} from "lucide-react";

const Experience = () => {
  const workExperience = [
    {
      title: "AI/ML Intern",
      company: "Create Consciously AI",
      period: "May 2026 - Present",
      location: "Jaipur, Rajasthan",
      description: [
      "Contributed to TourIQ, an AI-powered tour revenue optimization platform processing 649K+ booking records across multiple tour operators.",
      "Improved booking forecast accuracy from 82% to 90% and reduced prediction MAPE from 18% to 12% using DTD, occupancy, and seasonal demand features.",
      "Enhanced dynamic pricing recommendations, increasing projected seat fill rates from 68% to 82% and identifying $50K+ revenue recovery opportunities across underperforming departures.",
      "Worked extensively with Machine Learning pipelines, time-series forecasting, pricing optimization, and data analytics."
      ],
      technologies: [
      "Python",
      "Machine Learning",
      "LightGBM",
      "Time Series Forecasting",
      "Dynamic Pricing",
      "Pandas",
      "NumPy",
      "Data Analytics"
      ],
      type: "work" as const
    },

    {
      title: "AI Intern",
      company: "Infosys Springboard",
      period: "Nov 2025 - Jan 2026",
      location: "Remote",
      description: [
      "Built an AI-powered Python code reviewer using AST, Hugging Face (Qwen), and LangChain to detect 20+ code issues and enforce PEP8 standards.",
      "Reduced linting violations from 50+ to 35 per 1,000 lines of code (~30% improvement) through automated code analysis and optimization recommendations.",
      "Developed a Streamlit-based review platform delivering AI-generated feedback in under 2 seconds for real-time code quality assessment.",
      "Integrated Large Language Models (LLMs), prompt engineering, and static code analysis into an end-to-end AI application."
      ],
      technologies: [
      "Python",
      "LangChain",
      "Hugging Face",
      "Qwen",
      "AST",
      "Streamlit",
      "LLMs",
      "Generative AI"
      ],
      type: "work" as const
    },
    {
      title: "AI Intern",
      company: "Elevate Labs",
      period: "Aug 2025 - Sep 2025",
      location: "Remote",
      description: [
        "Contributed to the project “Sign Language Recognition”, achieving ~85% accuracy in translating gestures to text.",
        "Built and optimized deep learning models (CNNs, RNNs) using Python, TensorFlow, and PyTorch, reducing training time by 20%.",
        "Applied data preprocessing and augmentation on a dataset of 10,000+ gesture images, improving model generalization."
      ],
      technologies: ["Machine Learning", "Computer Vision", "Deep Learning"],
      type: "work" as const
    },
    {
      title: "Project Trainee",
      company: "Defence Research and Development Organisation (DRDO)",
      period: "Feb 2025 - Apr 2025",
      location: "Jodhpur, India",
      description: [
        "Developed “Painting Generation using CycleGANs”, generating 1,000+ high-quality synthetic artworks from real images.",
        "Trained GAN models with TensorFlow/PyTorch, improving image fidelity scores by 15%.",
        "Performed data preprocessing and augmentation on a dataset of 5,000+ images, enhancing stability in model convergence."
      ],
      technologies: ["Machine Learning", "Computer Vision", "Deep Learning"],
      type: "work" as const
    },
    {
      title: "Student Intern",
      company: "PW (PhysicsWallah)",
      period: "Jan 2025 - Feb 2025",
      location: "Remote",
      description: [
        "Completed 3+ machine learning projects applying regression, classification, and clustering on datasets of up to 50,000+ records.",
        "Designed and evaluated ML models using Scikit-learn, TensorFlow, and PyTorch, achieving performance improvements of 10–25% over baseline.",
        "Executed data cleaning and validation pipelines reducing preprocessing errors by 30%."
      ],
      technologies: ["Machine Learning", "Python", "Data Analysis"],
      type: "work" as const
    }
  ];

  const education = [
    {
      title: "Master of Computer Application",
      company: "Poornima University, Jaipur",
      period: "Aug 2025 - Sep 2027",
      description: [
        "Major in Computer Science with specialization in AI & Data Science",
        "Active participant in college technical events and competitions"
      ],
      type: "education" as const
    },
    {
      title: "Bachelor of Science (PMCS)",
      company: "Lachoo Memorial College of Science & Technology, Jodhpur",
      period: "Sep 2022 - Jul 2025",
      description: [
        "Major in Computer Science with specialization in Data Science",
        "Maintained 85.00% academic performance",
        "Active participant in college technical events and competitions"
      ],
      type: "education" as const
    },
    {
      title: "XII (Science)",
      company: "Army Public School, Jodhpur",
      period: "May 2021 - Jul 2022",
      description: [
        "Completed senior secondary education with Science stream",
        "Achieved 85.00% in final examinations",
        "Strong foundation in Mathematics and Physics"
      ],
      type: "education" as const
    }
  ];

  const projects = [
    {
      title: "GoldLens AI",
      description: "AI-powered platform for real-time gold price prediction, multi-currency analytics, and daily motivational quotes.",
      technologies: ["Python", "FastAPI", "TensorFlow", "Machine Learning", "Google OAuth", "MySQL", "Jinja2", "Docker", "Chart.js", "Gemini AI"],
      features: [
        "Built an end-to-end ML system for gold price forecasting using advanced LSTM, GRU, and BiLSTM models (RMSE ~13.9) on 4,000+ records.",
        "Showcases real-time live gold prices in USD, EUR, GBP, and INR (18K/22K/24K), integrated via public APIs.",
        "Delivers daily motivational quotes using Google Gemini AI, with Google OAuth login and user management in MySQL.",
        "Interactive web dashboard with responsive charts and secure prediction API endpoints.",
        "Deployed on Hugging Face Spaces using Docker; supports concurrent users and <500ms inference."
      ],
      links: { demo: "https://huggingface.co/spaces/PraveenTak/GoldLens-AI", github: "https://github.com/TAK-PRAVEEN/GoldLens-AI" }
    },
    {
      title: "ResumeParser.ai",
      description: "Natural Language Processing (NLP) application for resume optimization and analysis",
      technologies: ["Python", "NLP", "Machine Learning", "OAuth", "MongoDB"],
      features: [
        "Built a web app to extract structured data from resumes using spaCy & NLP",
        "Integrated Google OAuth and MongoDB for user data handling",
        "Enabled downloads in CSV, JSON, Excel, deployed on Railway with 12+ web integrations"
      ],
      links: { demo: "https://resumeparserai.up.railway.app/", github: "https://github.com/TAK-PRAVEEN/ResumeParser.ai" }
    },
    {
      title: "Mushroom Classification",
      description: "Machine Learning project for identifying edible vs poisonous mushrooms",
      technologies: ["Python", "Scikit-learn", "Decision Tree", "Model Evaluation"],
      features: [
        "Trained a Decision Tree classifier to identify edible vs poisonous mushrooms",
        "Achieved 99% accuracy using feature engineering and model evaluation",
        "Implemented comprehensive data preprocessing and validation techniques"
      ],
      links: { demo: "https://mushrooms-classification-w915.onrender.com/", github: "https://github.com/TAK-PRAVEEN/MUSHROOMS-CLASSIFICATION" }
    },
    {
      title: "Library Management System",
      description: "Comprehensive Python-based library management solution",
      technologies: ["Python", "Database Management", "GUI", "Tkinter", "JSON"],
      features: [
        "Created a GUI-based system for book issuing, returns, and tracking",
        "Integrated email database and real-time listing of available books",
        "Implemented user-friendly interface with comprehensive book management features"
      ],
      links: { github: "https://github.com/TAK-PRAVEEN/Library-Management" }
    }
  ];

  const certifications = [
    { name: "Khelo India University Games 2025 Volunteer", provider: "Khelo India", date: "Dec 2025" },
    { name: "Generative AI Unleashing", provider: "Infosys Springboard", date: "Oct 2025" },
    { name: "Artificial Intelligence Primer Certification", provider: "Infosys Springboard", date: "Oct 2025" },
    { name: "Agile Scrum in Practice", provider: "Infosys Springboard", date: "Oct 2025" },
    { name: "Prompt Engineering", provider: "Infosys Springboard", date: "Oct 2025" },
    { name: "Principles of Generative AI Certification", provider: "Infosys Springboard", date: "Oct 2025" },
    { name: "Deep Learning for Developers", provider: "Infosys Springboard", date: "Oct 2025" },
    { name: "Artificial Intelligence", provider: "Infosys Springboard", date: "Oct 2025" },
    { name: "Time Management", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Introduction to OpenAI GPT Models", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Introduction to Deep Learning", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Generative Models for Developers", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Introduction to Artificial Intelligence", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Introduction to Natural Language Processing", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Email Writing Skills", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Computer Vision 101", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Introduction to Data Science", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Microsoft Power BI", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "OpenAI Generative Pre-trained Transformer 3 (GPT-3) for Developers", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "Introduction to Robotic Process Automation", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "High Impact Presentations", provider: "Infosys Springboard", date: "Sep 2025" },
    { name: "ChatGPT Prompt Engineering for Developers", provider: "DeepLearning.AI & ChatGPT", date: "Aug 2025" },
    { name: "Cloud Technical Series - AI Agents edition", provider: "United Latino Students Association", date: "Aug 2025" },
    { name: "Exploring AI Use Cases and Applications", provider: "Amazon Web Services (AWS)", date: "Aug 2025" },
    { name: "Excel Formulas & Functions Basic to Advanced", provider: "Unstop", date: "Jul 2025 - Jul 2025" },
    { name: "Online Photography Competition - NIRA", provider: "Unstop", date: "Jul 2025" },
    { name: "Gen AI Academy", provider: "Google Cloud & Hack2skill", date: "Jul 2025" },
    { name: "AWS Submit", provider: "Amazon Web Services (AWS)", date: "Jul 2025" },
    { name: "Tata GenAI Powered Data Analytics Job Simulation", provider: "Forage", date: "Jul 2025" },
    { name: "Global Photography Contest", provider: "iNOVIZE Art and Culture", date: "Jul 2025" },
    { name: "FinQuest", provider: "Department of Finance Studies, University of Delhi", date: "Jun 2025" },
    { name: "Microsoft Power BI", provider: "Infosys Springboard", date: "Jun 2025 - Jun 2025" },
    { name: "Central India Hackathon 2.0", provider: "Suryodaya College of Engineering & Technology, Nagpur", date: "Jun 2025" },
    { name: "Full Stack Data Science Pro", provider: "PW Skills", date: "Aug 2023 - Jan 2025" },
    { name: "Codemathon 2024", provider: "Department of Mathematics, NIT Kurukshetra", date: "Oct 2024" },
    { name: "Python Stack", provider: "Great Learning", date: "Feb 2024 - Feb 2024" },
    { name: "Python for Data Science", provider: "Udemy", date: "Oct 2023 - Oct 2023" },
    { name: "Learn Python & Machine Learning", provider: "Microsoft Learn Student Ambassador, Google Developer Student Clubs", date: "Jul 2025" },
    { name: "Cloud Technical Series", provider: "Google", date: "Mar 2023" }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <section className="pt-24 pb-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center space-x-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="sm" className="hover-scale">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <SectionHeader
            title="Experience & Projects"
            subtitle="My professional journey, educational background, and project portfolio"
          />
        </div>
      </section>

      {/* Work Experience Timeline */}
      <section id="work-experience" className="scroll-mt-24 py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader title="Work Experience" icon={Calendar} align="left" />

          <div className="space-y-0">
            {workExperience.map((exp, index) => (
              <TimelineItem key={index} {...exp} />
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader title="Featured Projects" icon={BookOpen} align="left" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </div>
      </section>

      {/* Education Timeline */}
      <section className="scroll-mt-24 py-12 px-6" id="Education">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader title="Education" icon={BookOpen} align="left" />

          <div className="space-y-0">
            {education.map((edu, index) => (
              <TimelineItem key={index} {...edu} />
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="scroll-mt-24 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader title="Certifications & Courses" icon={Award} align="left" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="card-modern group relative p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-accent/15 p-2 text-accent transition-colors group-hover:bg-accent/25">
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold leading-tight text-card-foreground">
                      {cert.name}
                    </h4>
                    <p className="text-xs text-primary">{cert.provider}</p>
                    <p className="text-xs text-muted-foreground">{cert.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra-curricular Activities */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <SectionHeader title="Extra-curricular Activities" align="left" />

          <div className="space-y-4">
            {[
              "Poster Making Competition Winner — National Mathematics Day",
              "Active participant in coding competitions and hackathons", 
              "Calligraphy Competition Winner — APS Session 2021-22",
              "National Reading (English) — APS Session 2021-22"
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 rounded-lg glass-hover hover-lift animate-fade-in"
              >
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-foreground">{activity}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-muted-foreground mb-6">
              <strong>Hobbies:</strong> Watching movies, Photography, playing football, travelling, exploring user technology
            </p>
            
            <Link to="/">
              <Button size="lg" className="hover-scale shadow-glow">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Experience;