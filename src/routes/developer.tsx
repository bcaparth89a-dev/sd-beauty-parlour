import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  Linkedin,
  BookOpen,
  ArrowLeft,
  Briefcase,
  Award,
  Cpu,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function DeveloperPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Parth Pawar — Developer Portfolio";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 py-12 md:py-20 relative overflow-hidden">
        {/* Background Decorative Glows */}
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-96 h-96 rounded-full bg-rose-gold/5 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-12">
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Salon
          </button>

          {/* Profile Header Block */}
          <div className="bg-card border border-border rounded-[36px] p-8 md:p-10 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10">
              {/* Photo Frame */}
              <div className="relative group shrink-0">
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-primary to-rose-gold rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500" />
                <div className="relative h-40 w-40 rounded-full overflow-hidden border-4 border-card bg-muted shadow-soft">
                  <img
                    src="/Developer.png"
                    alt="Parth Pawar"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300";
                    }}
                  />
                </div>
              </div>

              {/* Identity & Contact Details */}
              <div className="space-y-4 text-center md:text-left flex-1">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" /> Pronix Digital Partner
                  </span>
                  <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground tracking-wide uppercase">
                    PAWAR PARTH
                  </h1>
                  <p className="text-sm font-semibold text-primary/80 uppercase tracking-widest mt-1">
                    Computer Application Student & Web Developer
                  </p>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-light max-w-2xl">
                  I'm a passionate BCA-Hons. student focused on web development and database management. I enjoy building user-friendly applications, exploring new technologies, working in teams, and continuously growing to excel in the IT industry.
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 border-t border-border/60 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary shrink-0" /> Adajan, Surat, Gujarat - 395005
                  </span>
                  <a href="tel:+917990101983" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4 text-primary shrink-0" /> +91 79901 01983
                  </a>
                  <a href="mailto:pawarparth233@gmail.com" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors break-all">
                    <Mail className="h-4 w-4 text-primary shrink-0" /> pawarparth233@gmail.com
                  </a>
                  <a
                    href="https://www.linkedin.com/in/parth-pawar-143682307"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Linkedin className="h-4 w-4 text-primary shrink-0" /> LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Core Content Grid */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (Col 4) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Technical Skills Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                  <Cpu className="h-4.5 w-4.5 text-primary" /> Skill Directory
                </h2>

                <div className="space-y-4 text-left">
                  {/* Category: Languages */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Programming Languages</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["C", "C++", "Python", "Java", "DSA", "OOP Concepts", "Kotlin"].map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-secondary text-foreground text-[10px] font-medium rounded-lg border border-border/40">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category: Web Dev */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Web Development</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["HTML", "CSS", "JavaScript", "jQuery", "PHP", "React.js", "Node.js", "Express.js", "Bootstrap", "Tailwind CSS", "Git & GitHub"].map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-secondary text-foreground text-[10px] font-medium rounded-lg border border-border/40">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category: Databases */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Databases & Cloud</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["MySQL", "DBMS", "Firebase", "MongoDB", "Cloudinary"].map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-secondary text-foreground text-[10px] font-medium rounded-lg border border-border/40">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category: Non-Technical */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Non-Technical Attributes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {["Teaching", "Leadership", "Self Learning", "Management"].map((s) => (
                        <span key={s} className="px-2.5 py-1 bg-secondary text-foreground text-[10px] font-medium rounded-lg border border-border/40">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Spoken Languages Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2 justify-start">
                  {["Gujarati", "Hindi", "English", "Marathi"].map((l) => (
                    <span key={l} className="px-3 py-1 bg-secondary/80 text-foreground text-xs font-semibold rounded-full border border-border/40">
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Non-Academic Activities Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
                  Activities
                </h2>
                <div className="space-y-3 text-left text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">National Cadet Corps (NCC)</div>
                    <div className="text-muted-foreground">Role: Cadet (Till A Certificate)</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">Pathshala Vadodara NGO</div>
                    <div className="text-muted-foreground">Role: Volunteer</div>
                  </div>
                </div>
              </div>

              {/* Hobbies Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
                  Hobbies & Interests
                </h2>
                <div className="flex flex-wrap gap-2 justify-start">
                  {["Listening to Music", "Watching Movies", "Personal Development"].map((h) => (
                    <span key={h} className="px-3 py-1 bg-secondary/80 text-foreground text-xs font-semibold rounded-full border border-border/40">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Col 8) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Experience Timeline */}
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-primary" /> Professional Internships
                </h2>

                <div className="relative border-l border-border/60 ml-4 space-y-8 text-left">
                  {/* Internship 1 */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary font-mono tracking-widest block uppercase">1/5/2026 – 31/5/2026</span>
                      <h3 className="font-display font-bold text-base text-foreground leading-snug">Web Application Development Intern</h3>
                      <div className="text-xs font-semibold text-muted-foreground">Niyaans Gallery, Surat</div>
                      <p className="text-xs text-muted-foreground/90 leading-relaxed font-light mt-2">
                        Developed a dynamic web application for interior design service listings, product showcases, customer inquiries, and admin systems. Utilized Java and Spring Boot for a production-ready application.
                      </p>
                    </div>
                  </div>

                  {/* Internship 2 */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary font-mono tracking-widest block uppercase">1/5/2026 – 31/5/2026</span>
                      <h3 className="font-display font-bold text-base text-foreground leading-snug">Android Application Development Intern</h3>
                      <div className="text-xs font-semibold text-muted-foreground">System Tron, Vadodara</div>
                      <p className="text-xs text-muted-foreground/90 leading-relaxed font-light mt-2">
                        Task-based mobile application development including calculators, to-do lists, and portfolios. Used Java, Kotlin, Jetpack Compose, and Android Studio with complete UML & ERD documentation.
                      </p>
                    </div>
                  </div>

                  {/* Internship 3 */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary font-mono tracking-widest block uppercase">1/3/2026 – 31/3/2026</span>
                      <h3 className="font-display font-bold text-base text-foreground leading-snug">Full Stack Java Development Intern</h3>
                      <div className="text-xs font-semibold text-muted-foreground">System Tron, Vadodara</div>
                      <p className="text-xs text-muted-foreground/90 leading-relaxed font-light mt-2">
                        Built multiple spring-based applications including custom JavaFX interfaces. Formulated architecture layouts: SRS, UML, ERD, and Activity Diagrams.
                      </p>
                    </div>
                  </div>

                  {/* Internship 4 */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary font-mono tracking-widest block uppercase">1/3/2026 – 31/3/2026</span>
                      <h3 className="font-display font-bold text-base text-foreground leading-snug">Web Application Development Intern</h3>
                      <div className="text-xs font-semibold text-muted-foreground">GB Innovation, Ahmedabad</div>
                      <p className="text-xs text-muted-foreground/90 leading-relaxed font-light mt-2">
                        Designed Food Ordering application featuring menu cataloging, cart systems, order trackers, and admin panel modules. Built on React.js, Firebase, and Tailwind CSS.
                      </p>
                    </div>
                  </div>

                  {/* Internship 5 */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary font-mono tracking-widest block uppercase">6/10/2025 – 6/12/2025</span>
                      <h3 className="font-display font-bold text-base text-foreground leading-snug">Web Application Development Intern</h3>
                      <div className="text-xs font-semibold text-muted-foreground">Prism I.T. Systems, Surat</div>
                      <p className="text-xs text-muted-foreground/90 leading-relaxed font-light mt-2">
                        Built a PG Finder housing portal with filters, booking mechanisms, favorites, and owner boards using React.js and Firebase. Published SRS and UML schematics.
                      </p>
                    </div>
                  </div>

                  {/* Internship 6 */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-primary font-mono tracking-widest block uppercase">12/05/2025 – 12/07/2025</span>
                      <h3 className="font-display font-bold text-base text-foreground leading-snug">Web Application Development Intern</h3>
                      <div className="text-xs font-semibold text-muted-foreground">Faculty of Science – Summer Internship Program</div>
                      <p className="text-xs text-muted-foreground/90 leading-relaxed font-light mt-2">
                        Built responsive React frontend dashboards, integrated custom invoice billing modules with EmailJS, WhatsApp messaging protocols, PDF.co processing, and Cloudinary image assets.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education Card */}
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> Academic History
                </h2>

                <div className="relative border-l border-border/60 ml-4 space-y-6 text-left">
                  {/* BCA Hons */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-primary font-mono block uppercase">2023 – PRESENT</span>
                      <h3 className="font-display font-bold text-sm text-foreground">Bachelor of Computer Application (BCA-Hons.)</h3>
                      <div className="text-xs text-muted-foreground">Maharaja Sayajirao University of Vadodara</div>
                      <div className="text-[11px] font-semibold text-primary/80 mt-1">Academic Score: 8.09 CGPA (Till 6th Semester)</div>
                    </div>
                  </div>

                  {/* HSC Commerce */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-primary font-mono block uppercase">2023</span>
                      <h3 className="font-display font-bold text-sm text-foreground">HSC Commerce (GHSEB)</h3>
                      <div className="text-xs text-muted-foreground">Sanskar Bharti Vidhyalaya, Surat</div>
                      <div className="text-[11px] font-semibold text-primary/80 mt-1">Academic Score: 99.47 Percentile</div>
                    </div>
                  </div>

                  {/* SSC */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4.5 w-4.5 rounded-full bg-primary border-4 border-card" />
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-primary font-mono block uppercase">2021</span>
                      <h3 className="font-display font-bold text-sm text-foreground">SSC (GHSEB)</h3>
                      <div className="text-xs text-muted-foreground">Sanskar Bharti Vidhyalaya, Surat</div>
                      <div className="text-[11px] font-semibold text-primary/80 mt-1">Academic Score: 93.26 Percentile</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certifications Card */}
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft space-y-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> Credentials & Certifications
                </h2>

                <div className="grid gap-4 text-left text-xs">
                  {[
                    { title: "Unlocking Generative AI", source: "Maharaja Sayajirao University, Vadodara", date: "2025" },
                    { title: "IBM SkillsBuild Project-Based Learning Program (Agentic AI architecture training)", source: "CSRBOX & IBM (4 Weeks)", date: "July–Aug 2025" },
                    { title: "Code Revolution: Mastering Modern Software Development", source: "Maharaja Sayajirao University, Vadodara", date: "2025" },
                    { title: "Front-End Development Course", source: "Udemy Online Learning Platform", date: "2024" },
                    { title: "IoT-Workshop (Basics of IOT)", source: "Maharaja Sayajirao University, Vadodara", date: "2024" },
                    { title: "Web Development Remedial Course", source: "Maharaja Sayajirao University, Vadodara", date: "2023" },
                  ].map((cert, i) => (
                    <div key={i} className="flex gap-3 items-start border-b border-border/40 pb-3 last:border-0 last:pb-0">
                      <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="font-bold text-foreground">{cert.title}</div>
                        <div className="text-[10px] text-muted-foreground">{cert.source} ({cert.date})</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Declaration Card */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft text-left text-xs space-y-3">
                <h2 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                  Declaration
                </h2>
                <p className="text-muted-foreground leading-relaxed italic">
                  "I confirm that the details shared in this resume are true and accurate to the best of my knowledge."
                </p>
                <div className="flex justify-between items-center pt-2 text-[10px] text-primary/70 font-semibold uppercase tracking-wider font-mono">
                  <span>Pawar Parth</span>
                  <span>Signature Verified</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
