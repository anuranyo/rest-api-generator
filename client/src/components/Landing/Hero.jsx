'use client';

import { AnimatePresence, motion, useInView } from 'framer-motion';
import React, { useRef } from 'react';

export default function Hero() {
  const headingRef = useRef(null);
  const isInView = useInView(headingRef, { once: true });

  const headline = 'Build and Test Your REST API Instantly';

  return (
    <section className="bg-gray-50 py-40 relative overflow-hidden">
      {/* Hero content */}
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div className="flex flex-wrap justify-center space-x-1 mb-6">
          <AnimatePresence>
            {headline.split('').map((char, i) => (
              <motion.span
                ref={headingRef}
                key={i}
                initial={{ opacity: 0, y: -20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className="text-4xl md:text-5xl font-extrabold text-gray-900"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        <p className="text-lg md:text-xl text-gray-600 mb-8">
          Upload a database schema and we generate the full CRUD API with mock data,
          test environment, and ready-to-download project.
        </p>

        <a
          href="/login"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition"
        >
          Generate API Now
        </a>

      </div>
    </section>
  );
}
