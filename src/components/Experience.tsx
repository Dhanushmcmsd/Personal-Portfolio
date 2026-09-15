"use client";

import { motion } from "framer-motion";
import { experience } from "@/data/resume";

export default function Experience() {
  return (
    <section id="experience" className="bg-forest px-6 py-32 text-cream md:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-cream/40">Experience</span>
          <h2 className="mt-4 font-display text-4xl md:text-6xl">WHERE I&apos;VE WORKED</h2>
        </motion.div>

        <div className="mt-16 space-y-12">
          {experience.map((job, i) => (
            <motion.div
              key={job.company + job.role}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative border-l-2 border-neon-cyan/30 pl-8 transition-colors hover:border-neon-cyan"
            >
              <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-neon-cyan opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                <div>
                  <h3 className="font-display text-2xl text-cream">{job.role}</h3>
                  <p className="text-sm text-neon-cyan">{job.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-cream/50">{job.period}</p>
                  <p className="text-xs text-cream/30">{job.location}</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {job.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-sm leading-relaxed text-cream/70">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-neon-cyan/60" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
