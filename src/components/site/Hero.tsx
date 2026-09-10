import { Phone, Star, ShieldCheck, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import heroImg from "@/assets/hero-plumber.jpg";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(7, "Please enter a valid phone").max(20),
  postcode: z.string().trim().min(3, "Postcode required").max(12),
  message: z.string().trim().max(500).optional(),
});

const Hero = () => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Got it! We'll call you back within 15 minutes.");
      (e.target as HTMLFormElement).reset();
    }, 800);
  };

  return (
    <section id="home" className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={heroImg} alt="Professional Battersea plumber repairing pipework" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      <div className="container grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-primary-foreground space-y-7 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-white/10 backdrop-blur border border-white/20 text-sm">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span className="font-medium">Rated 4.9 / 5 — 81 Google reviews</span>
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-[1.05]">
            Battersea's most trusted <span className="text-gradient-accent">plumbers & heating</span> engineers.
          </h1>
          <p className="text-lg text-primary-foreground/85 leading-relaxed">
            Boiler breakdowns, leaks, installations and emergencies — fixed fast by Gas Safe registered engineers. Available 24 hours, every day, across London.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl">
              <a href="tel:+448001234567"><Phone /> Call 08001 234567</a>
            </Button>
            <Button asChild variant="outline" size="xl" className="bg-white/5 border-white/30 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
              <a href="#services">View services</a>
            </Button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4 text-sm text-primary-foreground/80">
            <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /> Open 24 hours</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent" /> Gas Safe Registered</span>
            <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Serving all London</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-accent rounded-2xl blur-xl opacity-30" />
          <form onSubmit={handleSubmit} className="relative bg-card rounded-2xl shadow-elegant p-6 md:p-8 space-y-4 border border-border">
            <div>
              <h2 className="font-display text-2xl font-bold">Get a free callback</h2>
              <p className="text-sm text-muted-foreground mt-1">Tell us what's wrong — we'll ring you back in 15 mins.</p>
            </div>
            <div className="space-y-3">
              <Input name="name" placeholder="Your name" maxLength={80} required />
              <Input name="phone" type="tel" placeholder="Phone number" maxLength={20} required />
              <Input name="postcode" placeholder="Postcode (e.g. SW8 2AH)" maxLength={12} required />
              <Textarea name="message" placeholder="Briefly describe the issue (optional)" rows={3} maxLength={500} />
            </div>
            <Button type="submit" variant="accent" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Sending..." : "Request my callback"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">No obligation. We never share your details.</p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Hero;
