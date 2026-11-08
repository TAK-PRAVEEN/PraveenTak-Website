import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  User,
  Briefcase,
  MessageSquare,
  Github,
  Linkedin,
  Mail,
  Instagram,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navigation = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  // Sidebar animation
  const sidebarVariants = {
    hidden: { x: "-100%" },
    visible: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        staggerChildren: 0.15,
      },
    },
    exit: {
      x: "-100%",
      transition: { duration: 0.3 },
    },
  };


  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
    <nav className="fixed top-4 inset-x-0 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl rounded-full border border-border bg-background/80 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
      <div className="w-full px-8 py-3">
        <div className="grid grid-cols-3 items-center">
          {/* Left: Animated Hamburger + Logo */}
          <div className="flex items-center space-x-4 justify-self-start">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              className="relative md:hidden w-8 h-8 flex flex-col justify-center items-center z-[60]" // z-60 to be above sidebar (z-50)
            >
              {/* Top line */}
              <motion.span
                animate={
                  sidebarOpen
                    ? { rotate: 45, y: 0 }
                    : { rotate: 0, y: -6 }
                }
                className="absolute w-6 h-0.5 bg-primary rounded"
                transition={{ duration: 0.3 }}
              />
              {/* Middle line */}
              <motion.span
                animate={{ opacity: sidebarOpen ? 0 : 1 }}
                className="absolute w-6 h-0.5 bg-primary rounded"
                transition={{ duration: 0.3 }}
              />
              {/* Bottom line */}
              <motion.span
                animate={
                  sidebarOpen
                    ? { rotate: -45, y: 0 }
                    : { rotate: 0, y: 6 }
                }
                className="absolute w-6 h-0.5 bg-primary rounded"
                transition={{ duration: 0.3 }}
              />
            </button>

            {/* Logo — centered on mobile (over the pill), left on desktop */}
            <Link
              to="/"
              className="absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0"
            >
              <img
                src={`${import.meta.env.BASE_URL}Name.gif`}
                alt="Name Logo"
                className="h-12 w-auto object-contain md:h-16"
              />
            </Link>
          </div>

          {/* Center: Desktop menu */}
          <div className="hidden md:flex items-center space-x-6 justify-self-center">
              <Link to="/">
                <Button
                  variant={location.pathname === "/" ? "default" : "ghost"}
                  size="sm"
                  className="transition-smooth"
                >
                  <User className="w-4 h-4 mr-2" />
                  About
                </Button>
              </Link>
              <Link to="/experience">
                <Button
                  variant={
                    location.pathname === "/experience" ? "default" : "ghost"
                  }
                  size="sm"
                  className="transition-smooth"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Experience
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant={location.pathname === "/contact" ? "default" : "ghost"}
                  size="sm"
                  className="transition-smooth"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact
                </Button>
              </Link>
            </div>

          {/* Right: Social Icons (desktop only) */}
          <div className="hidden md:flex items-center space-x-4 justify-self-end">
            <a
              href="https://www.instagram.com/tak.praveen04/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="hover-scale">
                <Instagram className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="https://github.com/TAK-PRAVEEN"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="hover-scale">
                <Github className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="https://linkedin.com/in/praveentak/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="hover-scale">
                <Linkedin className="w-4 h-4" />
              </Button>
            </a>
            <a
              href="mailto:praveentak715@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="hover-scale">
                <Mail className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
      </nav>

      {/* Sidebar with Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Black overlay with blur */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              onClick={toggleSidebar}
            />
            {/* Sidebar — floating rounded panel (below the nav pill) */}
            <motion.div
              key="sidebar"
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-20 left-4 bottom-4 w-[min(17rem,calc(100vw-2rem))] rounded-3xl bg-black/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/15 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-hidden"
              variants={sidebarVariants}
            >
              {/* Links (sections at the top) */}
              <div className="flex flex-col space-y-4">
                <motion.div variants={itemVariants}>
                  <Link to="/" onClick={toggleSidebar}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className={`w-full justify-start backdrop-blur-md border transition-colors ${
                        location.pathname === "/"
                          ? "bg-primary/30 border-primary/40 text-foreground"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <User className="w-5 h-5 mr-2" />
                      Home
                    </Button>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/experience" onClick={toggleSidebar}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className={`w-full justify-start backdrop-blur-md border transition-colors ${
                        location.pathname === "/experience"
                          ? "bg-primary/30 border-primary/40 text-foreground"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <Briefcase className="w-5 h-5 mr-2" />
                      Experience
                    </Button>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link to="/contact" onClick={toggleSidebar}>
                    <Button
                      variant="ghost"
                      size="lg"
                      className={`w-full justify-start backdrop-blur-md border transition-colors ${
                        location.pathname === "/contact"
                          ? "bg-primary/30 border-primary/40 text-foreground"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Contact
                    </Button>
                  </Link>
                </motion.div>
              </div>

              

              {/* Social Icons */}
              <div className="flex justify-around mt-10">
                {[
                  { href: "https://www.instagram.com/tak.praveen04/", icon: Instagram },
                  { href: "https://github.com/TAK-PRAVEEN", icon: Github },
                  { href: "https://linkedin.com/in/praveentak/", icon: Linkedin },
                  { href: "mailto:praveentak715@gmail.com", icon: Mail },
                ].map(({ href, icon: Icon }, i) => (
                  <motion.a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={itemVariants}
                  >
                    <Icon className="w-6 h-6 text-primary hover:scale-110 transition-transform" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
