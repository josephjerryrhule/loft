"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const faqs: FAQItem[] = [
    {
      question: "Who are Land of Fairy Tales stories designed for?",
      answer: "Our stories are created for children aged 2–10, but they can be enjoyed by anyone who loves a good bedtime story.",
    },
    {
      question: "How do I access the stories?",
      answer: "Simply log in on your phone, tablet or computer and browse our library. Everything streams securely through our ad‑free platform, so there’s nothing to download.",
    },
    {
      question: "Can I try Land of Fairy Tales before subscribing?",
      answer: "Absolutely — sign up today and receive five free bedtime stories. If you love them, you can unlock all 365 stories for a small monthly fee.",
    },
    {
      question: "Are Land of Fairy Tales stories just entertainment or also educational?",
      answer: "They’re both! Each tale we produce includes themes that build empathy, vocabulary and cultural awareness, so your child is learning while they listen.",
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You’re in control. You can upgrade, downgrade or cancel your membership at any time through your account settings, and you’ll still keep access to your free stories.",
    },
  ];

  return (
    <section id="faq" className="w-full py-16 sm:py-20 lg:py-28 bg-[#FAF5EF]/30 border-t border-brand-coral/5">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#786B63] block mb-2">
            trusted by families
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-quicksand font-extrabold text-[#302824] leading-tight">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`transition-all duration-300 rounded-[1.75rem] border ${
                  isOpen
                    ? "bg-white border-[#302824]/15 shadow-soft"
                    : "bg-[#FAF5EF]/50 hover:bg-[#FAF5EF]/90 border-[#302824]/5"
                } p-6 sm:p-8 cursor-pointer`}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3
                    className="text-base sm:text-lg font-quicksand font-bold text-[#302824] transition-colors duration-200"
                  >
                    {faq.question}
                  </h3>
                  
                  {/* Circular Button */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isOpen
                        ? "bg-[#FAF5EF] border-[#302824]/15 text-[#302824] rotate-0"
                        : "bg-white border-[#302824]/10 text-[#302824] hover:border-[#302824]/20"
                    } flex-shrink-0`}
                  >
                    {isOpen ? (
                      <X className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Answer container with smooth height animation */}
                <div
                  className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm sm:text-base font-medium text-[#786B63] leading-relaxed border-t border-[#302824]/5 pt-4">
                      {faq.answer}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
