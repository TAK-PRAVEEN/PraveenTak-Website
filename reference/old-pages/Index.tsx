import Navigation from "@/components/Navigation";
import SkillCard from "@/components/SkillCard";
import InteractiveCard from "@/components/InteractiveCard";
import ProfileUpload from "@/components/ProfileUpload";
import SectionHeader from "@/components/SectionHeader";
import HeroSection from "@/components/HeroSection";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Code, 
  Database, 
  Palette, 
  Brain,
  Download,
  MapPin,
  GraduationCap,
  Trophy,
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from "lucide-react";

const Index = () => {
  const skills = {
    programming: ["Python", "Java", "SQL", "C", "C++", "JavaScript", "HTML", "CSS"],
    ml: ["Scikit-learn", "TensorFlow", "Pandas", "NumPy", "Matplotlib"],
    web: ["MongoDB", "MySQL", "REST APIs", "Railway", "Git", "Figma"],
    tools: ["Problem-Solving", "Teamwork", "Communication", "Time Management"]
  };

  const achievements = [
    "Finalist, Central India Hackathon 2.0",
    "Runner-Up, Overnight Problem (Sandhaanam 2025)",
    "Honours in B.Sc",
    "Winner, MiniHackathon 2024",
    "Winner, Hourly Problem (Sandhaanam 2025)",
  ];

  // Scroll animations
  const aboutSection = useScrollAnimation({ threshold: 0.2 });
  const skillsSection = useScrollAnimation({ threshold: 0.1 });
  const achievementsSection = useScrollAnimation({ threshold: 0.1 });
  const staggeredSkills = useStaggeredAnimation(4, 150);
  const staggeredAchievements = useStaggeredAnimation(achievements.length, 100);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section — full-viewport particle portrait */}
      <HeroSection />

      {/* About Section */}
      <section ref={aboutSection.elementRef} className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            title="About Me"
            subtitle="Actively seeking opportunities as a Data Scientist Intern or Machine Learning Engineer to contribute to innovative projects."
          />

          {/* Profile Section */}
          <div className={`mb-12 scroll-fade-up ${aboutSection.isVisible ? 'visible' : ''}`} style={{ transitionDelay: '200ms' }}>
            <InteractiveCard className="max-w-4xl mx-auto p-8" glowIntensity="high">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="flex flex-col items-center space-y-4">
                  <img src={`${import.meta.env.BASE_URL}profilePicture.png`} alt="Profile Picture" className="rounded-full w-40"/>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground">Praveen Tak</h3>
                    <p className="text-primary">Data Science Enthusiast</p>
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group">
                      <div className="shrink-0 p-2 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors">
                        <Target className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Focus</p>
                        <p className="text-xs text-muted-foreground">ML & Data Science</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors group">
                      <div className="shrink-0 p-2 rounded-full bg-secondary/20 group-hover:bg-secondary/40 transition-colors">
                        <Zap className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Experience</p>
                        <p className="text-xs text-muted-foreground">1+ Years</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    Passionate about transforming data into actionable insights. Experienced in building machine learning models, 
                    data analysis, and creating innovative solutions for complex problems. Always eager to learn new technologies 
                    and collaborate on challenging projects.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {["Python", "TensorFlow", "Data Analysis", "Machine Learning", "Problem Solving"].map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-accent/20 text-accent border-accent/30 hover:bg-accent/30 transition-colors">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 scroll-slide-left ${aboutSection.isVisible ? 'visible' : ''}`} style={{ transitionDelay: '400ms' }}>
            <Link to="/experience#Education">
              <InteractiveCard className="p-6" glowIntensity="medium">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20 shadow-glow">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Education</h3>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Bachelor of Science (PMCS)</p>
                  <p className="text-primary text-sm">Lachoo Memorial College of Science & Technology</p>
                  <p className="text-muted-foreground text-sm">Sep 2022 - Jul 2025 • 85.00%</p>
                </div>
              </InteractiveCard>
            </Link>
            <InteractiveCard className="p-6" glowIntensity="medium">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <Trophy className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold">Key Stats</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center group">
                  <span className="text-muted-foreground">Projects Completed</span>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium text-primary">3+</span>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-muted-foreground">Certifications</span>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium text-primary">15+</span>
                  </div>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-muted-foreground">Hackathon Wins</span>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium text-primary">2</span>
                  </div>
                </div>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section ref={skillsSection.elementRef} className="py-16 px-6 bg-background/50">
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            title="Skills & Technologies"
            subtitle="My technical expertise spans across multiple domains"
          />

          <div ref={staggeredSkills.containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className={`scroll-fade-up ${staggeredSkills.visibleItems.has(0) ? 'visible' : ''}`}>
              <SkillCard
                title="Programming"
                skills={skills.programming}
                icon={Code}
              />
            </div>
            <div className={`scroll-fade-up ${staggeredSkills.visibleItems.has(1) ? 'visible' : ''}`}>
              <SkillCard
                title="ML & Data Science"
                skills={skills.ml}
                icon={Brain}
              />
            </div>
            <div className={`scroll-fade-up ${staggeredSkills.visibleItems.has(2) ? 'visible' : ''}`}>
              <SkillCard
                title="Web & Database"
                skills={skills.web}
                icon={Database}
              />
            </div>
            <div className={`scroll-fade-up ${staggeredSkills.visibleItems.has(3) ? 'visible' : ''}`}>
              <SkillCard
                title="Soft Skills"
                skills={skills.tools}
                icon={Palette}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section
        id="achievements"
        ref={achievementsSection.elementRef}
        className="scroll-mt-24 py-16 px-6"
      >
        <div className="container mx-auto max-w-6xl">
          <SectionHeader
            title="Achievements"
            subtitle="Recognition for excellence in competitions and academics"
          />

          <div ref={staggeredAchievements.containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`scroll-slide-left ${staggeredAchievements.visibleItems.has(index) ? 'visible' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <InteractiveCard glowIntensity="low">
                  <div className="flex items-center space-x-3 p-4">
                    <div className="w-2 h-2 bg-primary rounded-full shadow-glow animate-pulse-glow" />
                    <span className="text-foreground">{achievement}</span>
                  </div>
                </InteractiveCard>
              </div>
            ))}
          </div>

          <div className={`text-center mt-12 scroll-fade-up ${achievementsSection.isVisible ? 'visible' : ''}`} style={{ transitionDelay: '600ms' }}>
            <Link to="/experience#work-experience">
              <Button size="lg" variant="outline" className="hover-scale">
                Explore My Journey
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;