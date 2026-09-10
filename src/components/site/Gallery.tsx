import bathroom from "@/assets/gallery-bathroom.jpg";
import boiler from "@/assets/gallery-boiler.jpg";
import pipework from "@/assets/gallery-pipework.jpg";
import kitchen from "@/assets/gallery-kitchen.jpg";
import van from "@/assets/gallery-van.jpg";
import bathtub from "@/assets/gallery-bathtub.jpg";
import engineerBoiler from "@/assets/gallery-engineer-boiler.jpg";
import heatingWiring from "@/assets/gallery-heating-wiring.jpg";
import manifold from "@/assets/gallery-manifold.jpg";
import kitchenBoiler from "@/assets/gallery-kitchen-boiler.jpg";

const items = [
  { src: engineerBoiler, alt: "Smyth engineer servicing a wall-mounted boiler", label: "Boiler service" },
  { src: heatingWiring, alt: "Wiring in heating system with copper pipework", label: "Wiring in heating system", wide: true },
  { src: manifold, alt: "Engineer wiring a heating manifold", label: "Manifold install" },
  { src: kitchenBoiler, alt: "New boiler fitted under kitchen worktop", label: "New boiler fitted under kitchen worktop" },
  { src: bathroom, alt: "Modern shower installation in Battersea", label: "Shower install" },
  { src: boiler, alt: "New boiler installation with copper pipework", label: "Boiler install", wide: true },
  { src: pipework, alt: "Plumber repairing copper pipework", label: "Pipe repair" },
  { src: kitchen, alt: "Brushed brass kitchen faucet installation", label: "Kitchen tap" },
  { src: bathtub, alt: "Freestanding bathtub installation in London home", label: "Bathroom fit" },
  { src: van, alt: "Apex Stratum Heating Ltd service van in London", label: "On the road", wide: true },
];

const Gallery = () => (
  <section id="gallery" className="py-20 md:py-28">
    <div className="container">
      <div className="max-w-2xl mb-14">
        <span className="text-accent font-semibold text-sm uppercase tracking-widest">Recent work</span>
        <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 leading-tight">A small look at the jobs we love.</h2>
        <p className="text-muted-foreground mt-4 text-lg">Quality you can see — finished neat, every time.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[260px]">
        {items.map((it, i) => (
          <figure key={i} className={`relative overflow-hidden rounded-2xl group shadow-card ${it.wide ? "md:col-span-2" : ""}`}>
            <img src={it.src} alt={it.alt} loading="lazy" width={1024} height={1024} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/0 to-transparent" />
            <figcaption className="absolute bottom-4 left-4 right-4 text-primary-foreground font-semibold tracking-wide text-sm">
              {it.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default Gallery;
