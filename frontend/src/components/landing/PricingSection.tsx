"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Zap } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "Perfect for teams evaluating AI video intelligence.",
    features: [
      "5 investigations per month",
      "2GB video storage",
      "Basic anomaly detection",
      "PDF report export",
      "Community support",
    ],
    cta: "Start Free",
    href: "/auth?mode=register",
    popular: false,
  },
  {
    name: "Professional",
    price: "$99",
    period: "per month",
    description: "For serious investigation teams that need full power.",
    features: [
      "Unlimited investigations",
      "100GB video storage",
      "All 12 AI detection models",
      "AI Chat Investigator",
      "Evidence Graph visualization",
      "Multi-camera reconstruction",
      "Priority email support",
      "API access",
    ],
    cta: "Start Free Trial",
    href: "/auth?mode=register&plan=pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "per year",
    description: "For large organizations with custom requirements.",
    features: [
      "Everything in Professional",
      "Unlimited storage",
      "On-premise deployment",
      "Custom AI model fine-tuning",
      "SSO & LDAP integration",
      "Dedicated customer success",
      "SLA guarantee",
      "HIPAA & SOC 2 compliance",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@insightx.ai",
    popular: false,
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="pricing" className="py-32 relative" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary-400 mb-4 tracking-widest uppercase">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Start free. Scale as your investigation needs grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 flex flex-col ${plan.popular ? "" : "card"}`}
              style={plan.popular ? {
                background: "rgba(124,58,237,0.07)",
                border: "2px solid rgba(124,58,237,0.4)",
                boxShadow: "0 0 60px rgba(124,58,237,0.15), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
              } : undefined}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold">
                  <Zap size={10} />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-black gradient-text-purple">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted text-sm mb-1">/{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted">{plan.description}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={9} className="text-accent" />
                    </div>
                    <span className="text-sm text-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={plan.popular ? "btn-primary text-center justify-center" : "btn-secondary text-center justify-center"}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
