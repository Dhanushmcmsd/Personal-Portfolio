"use client";

import { motion } from "framer-motion";
import { personalInfo, skills, education, languages } from "@/data/resume";

export default function About() {
  return (
    <section id="about" className="bg-cream px-6 py-32 md:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-forest/50">About</span>
          <h2 className="mt-4 font-display text-4xl text-forest md:text-6xl">WHO I AM</h2>
        </motion.div>

        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-lg leading-relaxed text-forest/80">{personalInfo.summary}</p>
            <p className="mt-6 text-sm leading-relaxed text-forest/60">
              Studying data science and machine learning (B.Sc. AI &amp; ML; ongoing M.Sc. Data
              Science) alongside hands-on software work. I ship products that real users depend on
              — from field inspection apps to AI classification APIs.
            </p>

            <div className="mt-10">
              <h3 className="text-xs uppercase tracking-[0.2em] text-forest/50">Languages</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full border border-forest/10 bg-white/50 px-4 py-1.5 text-xs text-forest/70"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {skills.map((group) => (
              <div key={group.category}>
                <h3 className="text-xs uppercase tracking-[0.2em] text-forest/50">
                  {group.category}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-forest/5 px-3 py-1.5 text-xs text-forest/80 transition-colors hover:bg-purple-500/10 hover:text-purple-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 grid gap-6 md:grid-cols-2"
        >
          {education.map((edu) => (
            <div
              key={edu.degree}
              className="rounded-2xl border border-forest/10 bg-white/40 p-8 transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
            >
              <span className="text-[10px] uppercase tracking-widest text-forest/40">
                {edu.period}
              </span>
              <h3 className="mt-2 font-display text-xl text-forest">{edu.degree}</h3>
              <p className="mt-1 text-sm text-forest/60">{edu.school}</p>
              <p className="mt-3 text-xs text-purple-600">{edu.gpa}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
