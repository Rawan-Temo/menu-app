import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useParams } from "react-router-dom";
import {
  AtSign,
  ChevronDown,
  Languages,
  Phone,
  Search,
  Star,
  X,
} from "lucide-react";
import { repo } from "../data";
import type { Item, Menu } from "../lib/types";
import { LANGS, tr } from "../lib/i18n";
import { assetUrl, fmtPrice } from "../lib/format";
import { TagBadge, Thumb } from "../components/Thumb";

export default function PublicMenu() {
  const { slug = "" } = useParams();
  const [menu, setMenu] = useState<Menu | null | undefined>(undefined);
  const [alt, setAlt] = useState(
    () => localStorage.getItem("menu_alt") === "1",
  );
  const [q, setQ] = useState("");
  const [active, setActive] = useState("");
  const [open, setOpen] = useState<Item | null>(null);
  const [past, setPast] = useState(false);
  const [ind, setInd] = useState({ left: 0, width: 0 });
  const pills = useRef<Record<string, HTMLButtonElement | null>>({});
  const heroRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    repo
      .getPublicMenu(slug)
      .then(setMenu)
      .catch(() => setMenu(null));
  }, [slug]);
  useEffect(() => {
    if (menu) document.title = menu.name;
  }, [menu]);

  const lang = menu ? (alt ? menu.altLang : menu.lang) : "en";
  const rtl = LANGS[lang].dir === "rtl";
  const pick = (a: string, b?: string | null) => (alt && b ? b : a);
  const needle = q.trim().toLowerCase();

  const cats = useMemo(
    () =>
      (menu?.categories ?? [])
        .map((c) => ({
          ...c,
          items: needle
            ? c.items.filter((i) =>
                [i.name, i.nameAlt, i.description, i.descriptionAlt].some((s) =>
                  s?.toLowerCase().includes(needle),
                ),
              )
            : c.items,
        }))
        .filter((c) => c.items.length),
    [menu, needle],
  );

  // parallax hero + reading-progress bar + "past the hero" flag (one rAF-throttled handler)
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const h = heroRef.current?.offsetHeight ?? 600;
        if (bgRef.current && y < h)
          bgRef.current.style.transform = `translate3d(0, ${y * 0.3}px, 0) scale(1.12)`;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (barRef.current)
          barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
        setPast(y > h - 90);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [menu]);

  // scroll-spy: highlight the category currently under the sticky bar
  useEffect(() => {
    const els = cats
      .map((c) => document.getElementById("cat-" + c.id))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    setActive((a) => (cats.some((c) => c.id === a) ? a : cats[0].id));
    const io = new IntersectionObserver(
      (entries) => {
        const v = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (v) setActive(v.target.id.slice(4));
      },
      { rootMargin: "-150px 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [cats]);

  // sliding pill indicator + keep the active pill in view
  const measure = () => {
    const el = pills.current[active];
    if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
  };
  useLayoutEffect(measure, [active, cats, alt]);
  useEffect(() => {
    pills.current[active]?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, cats, alt]);

  // reveal-on-scroll for cards
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    document
      .querySelectorAll("[data-reveal]:not(.in)")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [cats]);

  if (menu === undefined)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="size-8 animate-spin rounded-full border-4 border-line border-t-accent" />
      </div>
    );
  if (menu === null)
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="font-display text-6xl">🍽️</p>
          <h1 className="mt-4 font-display text-2xl font-semibold">
            Menu not found
          </h1>
          <p className="mt-1 text-muted">
            Check the link or scan the QR code again.
          </p>
        </div>
      </div>
    );

  const toggleLang = () => {
    const n = !alt;
    setAlt(n);
    localStorage.setItem("menu_alt", n ? "1" : "0");
  };
  const name = pick(menu.name, menu.nameAlt);
  const tagline = pick(menu.tagline ?? "", menu.taglineAlt);
  const nextLang = LANGS[alt ? menu.lang : menu.altLang];
  const canSwitch = menu.altLang !== menu.lang;
  const style = { "--accent": menu.accent } as CSSProperties;
  const goMenu = () =>
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });

  const LangBtn = ({ dark }: { dark?: boolean }) => (
    <button
      onClick={toggleLang}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold backdrop-blur transition active:scale-95 ${dark ? "border border-white/25 bg-white/15 text-white hover:bg-white/25" : "bg-white shadow-card"}`}
    >
      <Languages className={`size-4 ${dark ? "" : "text-accent"}`} />
      {nextLang.label}
    </button>
  );

  return (
    <div
      style={style}
      dir={LANGS[lang].dir}
      lang={lang}
      className="min-h-screen pb-24"
    >
      {/* reading progress */}
      <div
        ref={barRef}
        className="fixed inset-x-0 top-0 z-50 h-[3px] scale-x-0 bg-accent"
        style={{ transformOrigin: rtl ? "right" : "left" }}
      />

      {/* Full-bleed hero: the cover IS the background */}
      <header
        ref={heroRef}
        className="relative isolate flex min-h-[85svh] flex-col overflow-hidden text-white"
      >
        <div
          ref={bgRef}
          className="absolute inset-0 -z-20 will-change-transform"
        >
          {menu.coverUrl ? (
            <img
              src={assetUrl(menu.coverUrl)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <div
              className="size-full"
              style={{
                background:
                  "radial-gradient(circle at 18% 22%, rgb(255 255 255 / .3), transparent 42%), radial-gradient(circle at 85% 80%, rgb(255 255 255 / .16), transparent 40%), linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 45%, black))",
              }}
            />
          )}
        </div>
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-black/60 via-black/25 to-black/80" />

        <div className="flex justify-end p-4 sm:p-6">
          {canSwitch && <LangBtn dark />}
        </div>

        <div className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
          <div className="hero-in size-24 overflow-hidden rounded-full bg-white shadow-2xl ring-4 ring-white/30 sm:size-28">
            <Thumb src={menu.logoUrl} label={name} className="size-full" />
          </div>
          <h1
            className="hero-in mt-6 font-display text-5xl font-semibold leading-[1.05] drop-shadow-lg sm:text-7xl"
            style={{ animationDelay: ".08s" }}
          >
            {name}
          </h1>
          {tagline && (
            <p
              className="hero-in mt-4 max-w-xl text-lg text-white/85 sm:text-xl"
              style={{ animationDelay: ".16s" }}
            >
              {tagline}
            </p>
          )}
          <div
            className="hero-in mt-7 flex flex-wrap justify-center gap-2.5"
            style={{ animationDelay: ".24s" }}
          >
            {menu.phone && (
              <a
                href={`tel:${menu.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur hover:bg-white/25"
              >
                <Phone className="size-4" />
                {tr(lang, "call")}
              </a>
            )}
            {menu.instagram && (
              <a
                href={`https://instagram.com/${menu.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur hover:bg-white/25"
              >
                <AtSign className="size-4" />
                {menu.instagram.replace("@", "")}
              </a>
            )}
          </div>
        </div>

        <button
          onClick={goMenu}
          aria-label="Menu"
          className="absolute inset-x-0 bottom-14 mx-auto grid size-11 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur animate-bounce"
        >
          <ChevronDown className="size-5" />
        </button>
      </header>

      {/* Sticky bar – slides the brand + language switch in once the hero has scrolled away */}
      <div
        className={`sticky top-0 z-30 -mt-7 transition-all duration-300 ${past ? "border-b border-line bg-cream/90 shadow-sm backdrop-blur-md" : "rounded-t-[2rem] bg-cream"}`}
      >
        <div className="mx-auto max-w-3xl px-5 pt-4">
          <div className="flex items-center">
            <div
              className={`flex items-center gap-2.5 overflow-hidden whitespace-nowrap transition-all duration-300 ${past ? "me-3 max-w-[11rem] opacity-100" : "max-w-0 opacity-0"}`}
            >
              <span className="size-9 shrink-0 overflow-hidden rounded-full">
                <Thumb src={menu.logoUrl} label={name} className="size-full" />
              </span>
              <span className="truncate font-display font-semibold">
                {name}
              </span>
            </div>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tr(lang, "search")}
                className="w-full rounded-2xl border border-line bg-white py-2.5 pe-10 ps-10 text-[15px] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  aria-label="Clear"
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-black/5"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {canSwitch && (
              <div
                className={`overflow-hidden transition-all duration-300 ${past ? "ms-2 max-w-24 opacity-100" : "max-w-0 opacity-0"}`}
              >
                <LangBtn />
              </div>
            )}
          </div>
          <nav className="no-scrollbar -mx-5 overflow-x-auto px-5 py-3">
            <div className="relative flex w-max gap-1 rounded-full bg-black/[.04] p-1">
              <span
                className="absolute top-1 bottom-1 rounded-full bg-accent shadow-md transition-all duration-300 ease-out"
                style={{ left: ind.left, width: ind.width }}
              />
              {cats.map((c) => (
                <button
                  key={c.id}
                  ref={(el) => {
                    pills.current[c.id] = el;
                  }}
                  onClick={() =>
                    document
                      .getElementById("cat-" + c.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className={`relative z-10 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300 ${active === c.id ? "text-white" : "text-ink/65 hover:text-ink"}`}
                >
                  {pick(c.name, c.nameAlt)}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </div>

      {/* Menu */}
      <main id="menu" className="mx-auto max-w-3xl space-y-14 px-5 pt-8">
        {cats.length === 0 && (
          <p className="py-16 text-center text-muted">{tr(lang, "empty")}</p>
        )}
        {cats.map((c) => (
          <section key={c.id} id={"cat-" + c.id} className="scroll-mt-40">
            <div className="mb-5 flex items-end gap-4" data-reveal>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl">
                {pick(c.name, c.nameAlt)}
              </h2>
              <span className="mb-2 h-px flex-1 bg-linear-to-r from-accent/40 to-transparent rtl:bg-linear-to-l" />
              <span className="mb-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                {c.items.length}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {c.items.map((i, idx) => (
                <div
                  key={i.id}
                  data-reveal
                  style={{ transitionDelay: `${(idx % 2) * 70}ms` }}
                >
                  <button
                    onClick={() => setOpen(i)}
                    className={`group flex h-full w-full gap-3.5 rounded-3xl bg-white p-3 text-start shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[.98] ${i.available ? "" : "opacity-60"}`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col py-1 ps-1">
                      <h3 className="text-[17px] font-semibold leading-snug">
                        {pick(i.name, i.nameAlt)}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                        {pick(i.description ?? "", i.descriptionAlt)}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                        <span className="font-display text-xl font-semibold text-accent">
                          {fmtPrice(i.price, menu.currency)}
                        </span>
                        <span className="flex gap-1">
                          {i.tags.map((t) => (
                            <TagBadge key={t} tag={t} lang={lang} />
                          ))}
                        </span>
                      </div>
                    </div>
                    <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl sm:size-32">
                      <Thumb
                        src={i.imageUrl}
                        label={pick(i.name, i.nameAlt)}
                        className="size-full transition duration-500 group-hover:scale-110"
                      />
                      {i.featured && i.available && (
                        <span className="absolute start-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-accent shadow">
                          <Star className="size-3 fill-current" />
                          {tr(lang, "popular")}
                        </span>
                      )}
                      {!i.available && (
                        <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs font-bold text-white">
                          {tr(lang, "soldOut")}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {open && (
        <Sheet
          item={open}
          menu={menu}
          alt={alt}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function Sheet({
  item,
  menu,
  alt,
  onClose,
}: {
  item: Item;
  menu: Menu;
  alt: boolean;
  onClose: () => void;
}) {
  const lang = alt ? menu.altLang : menu.lang;
  const pick = (a: string, b?: string | null) => (alt && b ? b : a);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  const nm = pick(item.name, item.nameAlt);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/50 backdrop-blur-[2px] fade-in sm:place-items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="sheet-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-cream shadow-2xl sm:rounded-[2rem]"
      >
        <div className="relative">
          <Thumb
            src={item.imageUrl}
            label={nm}
            className="h-64 w-full sm:h-72"
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute end-3 top-3 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3 p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold leading-tight">
              {nm}
            </h2>
            <span className="shrink-0 font-display text-xl font-semibold text-accent">
              {fmtPrice(item.price, menu.currency)}
            </span>
          </div>
          {item.description && (
            <p className="leading-relaxed text-ink/75">
              {pick(item.description, item.descriptionAlt)}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {item.tags.map((t) => (
              <TagBadge key={t} tag={t} lang={lang} long />
            ))}
            {!item.available && (
              <span className="rounded-full bg-black/80 px-3 py-1 text-xs font-bold text-white">
                {tr(lang, "soldOut")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
