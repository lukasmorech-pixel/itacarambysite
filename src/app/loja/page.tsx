import { getStore } from "@/lib/store";
import { getContent } from "@/lib/content";
import { StoreTabs } from "@/components/store/StoreTabs";

export default async function LojaPage() {
  const [{ products, courses }, { services, settings }] = await Promise.all([getStore(), getContent()]);
  return (
    <>
      <section className="relative overflow-hidden bg-navy pb-16 pt-36 text-ivory">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-copper/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-copper">Loja Itacaramby</p>
          <h1 className="max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            Modelos, serviços e cursos para quem vive a prótese dentária.
          </h1>
          <p className="mt-5 max-w-2xl text-ivory/70">
            Modelos de estudo para treinar na bancada, trabalhos de laboratório sob encomenda e cursos online com o método Itacaramby.
          </p>
        </div>
      </section>
      <StoreTabs products={products} courses={courses} services={services} whatsapp={settings.contact.whatsapp} />
    </>
  );
}
