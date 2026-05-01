import { Star, Quote } from "lucide-react";
import logo from "@/assets/logo-smyth.png";
import boiler from "@/assets/gallery-boiler.jpg";
import bathroom from "@/assets/gallery-bathroom.jpg";
import pipework from "@/assets/gallery-pipework.jpg";
import kitchen from "@/assets/gallery-kitchen.jpg";
import bathtub from "@/assets/gallery-bathtub.jpg";
import van from "@/assets/gallery-van.jpg";

const reviews = [
  {
    name: "Olivia R.",
    area: "Battersea, SW11",
    rating: 5,
    text: "Boiler died on the coldest night of the year. Smyth had an engineer at my door within the hour and a new boiler fitted the next morning. Genuinely brilliant service.",
    project: "Worcester Bosch boiler swap",
    image: boiler,
  },
  {
    name: "James P.",
    area: "Clapham, SW4",
    rating: 5,
    text: "Found a hidden leak behind the shower wall that two other plumbers had missed. Tidy work, fair price, explained everything as he went. Won't use anyone else now.",
    project: "Leak detection & shower refit",
    image: bathroom,
  },
  {
    name: "Priya K.",
    area: "Wandsworth, SW18",
    rating: 5,
    text: "Re-piped the entire kitchen and bathroom during our renovation. Showed up every day on time, left the place spotless. The pipework is honestly a work of art.",
    project: "Full pipework re-route",
    image: pipework,
  },
  {
    name: "Daniel M.",
    area: "Pimlico, SW1V",
    rating: 5,
    text: "New brass tap and undersink filter installed in under an hour. Polite, quick, and charged exactly what he quoted on the phone. Highly recommended.",
    project: "Kitchen tap installation",
    image: kitchen,
  },
  {
    name: "Sophie & Tom",
    area: "Nine Elms, SW8",
    rating: 5,
    text: "Installed our freestanding bath and rerouted the waste perfectly. Took real pride in the finish — sealant lines are razor sharp. Couldn't be happier.",
    project: "Freestanding bath fit",
    image: bathtub,
  },
  {
    name: "Michael H.",
    area: "Stockwell, SW9",
    rating: 5,
    text: "Annual boiler service plus a Gas Safe certificate for our rental. Smooth booking, clear paperwork, friendly engineer. The whole process was effortless.",
    project: "Boiler service & gas cert",
    image: van,
  },
];

const Testimonials = () => (
  <section id="testimonials" className="py-20 md:py-28 bg-gradient-soft relative overflow-hidden">
    <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

    <div className="container relative">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
        <div className="max-w-2xl">
          <span className="text-accent font-semibold text-sm uppercase tracking-widest">What Battersea says</span>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl mt-3 leading-tight">
            81 reviews. <span className="text-gradient-accent">4.9 stars.</span> Zero corners cut.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Real highlights from our Google reviews — the people of South London tell it best.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-card border border-border shadow-card p-4 pr-6">
          <img src={logo} alt="Smyth Plumbing & Heating logo" width={120} height={68} className="h-14 w-auto object-contain" />
          <div className="border-l border-border pl-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <div className="font-display font-bold text-2xl leading-none mt-1">4.9 / 5</div>
            <div className="text-xs text-muted-foreground mt-1">81 Google reviews</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((r) => (
          <article
            key={r.name}
            className="group rounded-2xl bg-card border border-border shadow-card overflow-hidden flex flex-col hover:shadow-elegant hover:-translate-y-1 transition-all duration-500"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={r.image}
                alt={r.project}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/10 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-primary-foreground text-xs font-semibold tracking-wide uppercase">
                  {r.project}
                </span>
                <Quote className="w-5 h-5 text-accent" />
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed flex-1">"{r.text}"</p>
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="font-display font-bold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.area}</div>
                </div>
                <div className="text-xs font-semibold text-accent">Verified · Google</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
