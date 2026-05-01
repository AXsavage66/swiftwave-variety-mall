import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-smyth.png";

const Navbar = () => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="container flex items-center justify-between h-16">
        <a href="#home" className="flex items-center gap-2 font-display font-extrabold text-lg">
          <img src={logo} alt="Smyth Plumbing & Heating" className="h-9 w-auto object-contain" />
          <span className="sr-only">Smyth Plumbing & Heating</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#services" className="hover:text-accent transition-colors">Services</a>
          <a href="#why" className="hover:text-accent transition-colors">Why us</a>
          <a href="#gallery" className="hover:text-accent transition-colors">Work</a>
          <a href="#testimonials" className="hover:text-accent transition-colors">Reviews</a>
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
