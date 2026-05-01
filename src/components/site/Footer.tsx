const Footer = () => (
  <footer className="bg-primary text-primary-foreground/70 border-t border-white/10 py-10">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2 font-display font-bold text-primary-foreground">
        <span className="w-8 h-8 rounded-lg bg-gradient-accent grid place-items-center text-accent-foreground">S</span>
        Smyth Plumbing & Heating
      </div>
      <div>10 Shipley House, Albion Rd, London SW8 2AH · 07591 115721</div>
      <div>© {new Date().getFullYear()} Smyth Plumbing & Heating. All rights reserved.</div>
    </div>
  </footer>
);

export default Footer;
