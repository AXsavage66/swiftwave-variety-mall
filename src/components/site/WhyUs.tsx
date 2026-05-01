import { Award, Clock, BadgeCheck, Wallet, Users, ThumbsUp } from "lucide-react";

const reasons = [
  { icon: Award, title: "Rated 4.9 ★ on Google", desc: "81 reviews and counting from happy Battersea & London customers." },
  { icon: Clock, title: "24/7 emergency response", desc: "Open every day, every hour. We answer when others don't." },
  { icon: BadgeCheck, title: "Gas Safe Registered", desc: "Fully qualified, insured and certified for boilers and gas work." },
  { icon: Wallet, title: "Fair, upfront pricing", desc: "Honest quotes before any work begins — no nasty surprises." },
  { icon: Users, title: "Local Battersea team", desc: "Based on Albion Rd, SW8 — fast on-site across central London." },
  { icon: ThumbsUp, title: "Workmanship guaranteed", desc: "If it's not right, we make it right. That's our promise." },
];

const WhyUs = () => (
  <section id="why" className="py-20 md:py-28 bg-primary text-primary-foreground relative overflow-hidden">
    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
    <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-glow/40 blur-3xl" />

    <div className="container relative">
      <div className="max-w-2xl mb-14">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">Why choose Smyth</span>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 leading-tight">London trusts us because <span className="text-gradient-accent">we turn up and deliver.</span></h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reasons.map((r) => (
          <div key={r.title} className="rounded-2xl p-7 bg-white/5 backdrop-blur border border-white/10 hover:border-accent/40 transition-colors">
            <r.icon className="w-8 h-8 text-accent mb-4" />
            <h3 className="font-display font-bold text-xl">{r.title}</h3>
            <p className="text-primary-foreground/75 mt-2">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid sm:grid-cols-3 gap-6 text-center">
        {[
          { n: "4.9★", l: "Average rating" },
          { n: "81+", l: "Google reviews" },
          { n: "24/7", l: "Emergency callouts" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl p-8 bg-gradient-accent text-accent-foreground shadow-accent">
            <div className="font-display font-extrabold text-5xl">{s.n}</div>
            <div className="mt-2 font-medium">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default WhyUs;
