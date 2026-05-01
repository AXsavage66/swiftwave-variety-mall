import { Wrench, Flame, Droplets, ShowerHead, Thermometer, FileCheck, Bath, Siren } from "lucide-react";

const services = [
  { icon: Flame, title: "Boiler Repairs & Installation", desc: "Full boiler servicing, repairs and brand-new installs by Gas Safe engineers." },
  { icon: Siren, title: "24hr Boiler Breakdown", desc: "Emergency call-outs day or night — heat and hot water restored fast." },
  { icon: Droplets, title: "Leak Detection & Repair", desc: "Pinpoint leak detection on pipes, outdoor systems and pools." },
  { icon: ShowerHead, title: "Shower & Bathroom Fitting", desc: "Showers, faucets, toilets installed and repaired to a premium finish." },
  { icon: Thermometer, title: "Water Heaters & Tanks", desc: "Installation, repair and replacement of water heaters and tanks." },
  { icon: Wrench, title: "Pipe Repair & Replacement", desc: "Burst pipes, frozen pipes and complete repipes — done cleanly." },
  { icon: Bath, title: "Garbage Disposals & Sumps", desc: "Sump pumps, waste disposals — installed, serviced, repaired." },
  { icon: FileCheck, title: "Gas Safety Certificates", desc: "Landlord gas certificates (CP12) issued same-day where possible." },
];

const Services = () => (
  <section id="services" className="py-20 md:py-28 bg-gradient-soft">
    <div className="container">
      <div className="max-w-2xl mb-14">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">What we do</span>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 leading-tight">Plumbing & heating, done properly.</h2>
        <p className="text-muted-foreground mt-4 text-lg">From a dripping tap to a full boiler swap — one trusted team for every job in your home.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {services.map((s) => (
          <article key={s.title} className="group bg-card rounded-2xl p-6 border border-border shadow-card hover:shadow-elegant hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-gradient-accent grid place-items-center text-accent-foreground shadow-accent mb-5 group-hover:scale-110 transition-transform">
              <s.icon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg">{s.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Services;
