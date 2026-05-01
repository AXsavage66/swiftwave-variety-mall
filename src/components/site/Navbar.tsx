import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="container flex items-center justify-between h-16">
        <a href="#home" className="flex items-center gap-2 font-display font-extrabold text-lg">
          <span className="w-9 h-9 rounded-lg bg-gradient-accent grid place-items-center text-accent-foreground shadow-accent">S</span>
          <span>Smyth <span className="text-muted-foreground font-medium">Plumbing</span></span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#services" className="hover:text-accent transition-colors">Services</a>
          <a href="#why" className="hover:text-accent transition-colors">Why us</a>
          <a href="#gallery" className="hover:text-accent transition-colors">Work</a>
          <a href="#faq" className="hover:text-accent transition-colors">FAQ</a>
        </nav>
        <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
          <a href="tel:+447591115721"><Phone className="w-4 h-4" /> 07591 115721</a>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
