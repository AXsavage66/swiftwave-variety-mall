import { Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => (
  <section className="py-20 md:py-28 bg-primary text-primary-foreground relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-accent opacity-10" />
    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl" />

    <div className="container relative text-center max-w-3xl">
      <h2 className="font-display font-extrabold text-4xl md:text-6xl leading-[1.05]">
        Got a leak? A dead boiler? <br />
        <span className="text-gradient-accent">We're 60 seconds away.</span>
      </h2>
      <p className="mt-6 text-lg text-primary-foreground/80">
        Call now and speak to a Battersea plumber today — or have us ring you back in minutes.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button asChild variant="hero" size="xl">
          <a href="tel:+447591115721"><Phone /> Call 07591 115721</a>
        </Button>
        <Button asChild variant="outline" size="xl" className="bg-white/5 border-white/30 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
          <a href="#home">Request a callback</a>
        </Button>
      </div>
      <p className="mt-8 inline-flex items-center gap-2 text-primary-foreground/70 text-sm">
        <MapPin className="w-4 h-4 text-accent" /> 10 Shipley House, Albion Rd, London SW8 2AH
      </p>
    </div>
  </section>
);

export default FinalCTA;
