import { CheckIcon } from "@heroicons/react/24/solid";
import { CoursePosterMedia } from "../../courses/components/CoursePosterMedia";

const BENEFITS = [
  "Accredited Training",
  "Industry Experienced Trainers",
  "Hands-On Workshops",
  "Recognised Certifications",
  "Modern Learning Facilities",
] as const;

type Props = {
  imageUrl: string;
  description: string;
};

export function HomeWhyChooseSection({ imageUrl, description }: Props) {
  return (
    <section className="mt-16 sm:mt-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="overflow-hidden rounded-hero shadow-card">
          <CoursePosterMedia
            url={imageUrl}
            alt="TRSC training facilities"
            className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
            optimizeWidth={800}
          />
        </div>

        <div>
          <h2 className="sk-heading-2">Why Choose TRSC</h2>
          <p className="mt-4 whitespace-pre-line text-ink-muted">{description}</p>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckIcon className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-medium text-ink">{benefit}</span>
              </li>
            ))}
          </ul>
          <a href="/about-us" className="sk-button-primary mt-8">
            Learn more about us
          </a>
        </div>
      </div>
    </section>
  );
}
