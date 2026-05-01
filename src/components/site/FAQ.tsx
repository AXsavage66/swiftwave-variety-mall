import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Do you really answer 24 hours a day?", a: "Yes — our line is staffed around the clock, every day of the year. Boiler breakdowns and leaks don't wait for office hours, and neither do we." },
  { q: "Are you Gas Safe registered?", a: "Absolutely. All our heating engineers are fully Gas Safe registered, qualified and insured to work on boilers, gas appliances and certificates." },
  { q: "Which areas of London do you cover?", a: "We're based on Albion Rd in Battersea (SW8) and serve all of London and surrounding areas — Clapham, Chelsea, Wandsworth, Kensington, Fulham and beyond." },
  { q: "How quickly can someone come out?", a: "For emergencies in central London we typically arrive within 60–90 minutes. For booked jobs we'll offer the soonest convenient slot." },
  { q: "Do you provide free quotes?", a: "Yes — quotes are free and there's no obligation. We give you an honest, upfront price before any work begins." },
  { q: "Can you issue a Landlord Gas Safety Certificate (CP12)?", a: "Yes, we issue CP12 gas certificates and can usually do it same-day for properties in London." },
];

const FAQ = () => (
  <section id="faq" className="py-20 md:py-28 bg-gradient-soft">
    <div className="container max-w-3xl">
      <div className="text-center mb-12">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">FAQ</span>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 leading-tight">Quick answers, no waffle.</h2>
      </div>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-2xl border border-border shadow-card px-6 data-[state=open]:shadow-elegant transition-shadow">
            <AccordionTrigger className="font-display font-semibold text-left text-lg hover:no-underline py-5">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-5">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQ;
