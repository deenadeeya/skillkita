import { hideImageOnError } from "../../../shared/ui/hideImageOnError";

type Props = {
  partners: HomepagePartnerRow[];
};

export function HomePartnersSection({ partners }: Props) {
  if (partners.length === 0) {
    return (
      <section className="mt-16 sm:mt-20">
        <div className="text-center">
          <h2 className="sk-heading-2">Partners &amp; Accreditations</h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
            CIDB · MoF · HRD Corp · Industry Partners
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16 sm:mt-20">
      <div className="text-center">
        <h2 className="sk-heading-2">Partners &amp; Accreditations</h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
          Trusted by leading organisations and accreditation bodies.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="group flex flex-col items-center rounded-card bg-white p-4 shadow-card transition hover:shadow-lg"
          >
            <div className="flex min-h-12 w-full items-center justify-center">
              {partner.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt=""
                  className="max-h-12 w-full object-contain grayscale transition duration-200 group-hover:grayscale-0"
                  onError={hideImageOnError}
                />
              ) : null}
            </div>
            <p className="mt-3 text-center text-xs font-medium leading-snug text-ink-muted transition group-hover:text-primary">
              {partner.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
