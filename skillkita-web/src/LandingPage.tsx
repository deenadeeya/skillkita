import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import CoursePoster1 from "./assets/CoursePoster1.jpg";
import TRSCGroupPhoto from "./assets/TRSCGroupPhoto.png";
import SiteHeader from "./SiteHeader";

const LandingPage = () => {
  const upcomingCourses = [
    {
      id: 1,
      date: "28th May 2025",
      name: "Employment Contract & Stamping",
      details: "Practical guidance on drafting and stamping employment contracts.",
      poster: CoursePoster1,
    },
    {
      id: 2,
      date: "18th June 2025",
      name: "Industrial Relations Essentials",
      details: "Core handling techniques for workplace disputes and disciplinary actions.",
      poster: CoursePoster1,
    },
    {
      id: 3,
      date: "24th July 2025",
      name: "Payroll & HR Compliance",
      details: "A compliance-focused overview of payroll process and statutory responsibilities.",
      poster: CoursePoster1,
    },
  ];

  const [activeCourseIndex, setActiveCourseIndex] = useState(0);

  const showPreviousCourse = () => {
    setActiveCourseIndex((prev) =>
      prev === 0 ? upcomingCourses.length - 1 : prev - 1
    );
  };

  const showNextCourse = () => {
    setActiveCourseIndex((prev) =>
      prev === upcomingCourses.length - 1 ? 0 : prev + 1
    );
  };

  const activeCourse = upcomingCourses[activeCourseIndex];

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader
        menuLinks={[
          { label: "Who Are We", href: "#who-are-we" },
          { label: "Courses", href: "#courses" },
          { label: "All Courses", href: "/courses" },
        ]}
      />

      <main className="mx-auto flex w-full flex-col items-center px-3 py-12 text-center md:px-5">
        <h1 className="mb-6 mt-24 text-4xl font-bold text-[#0001fc] md:text-6xl">
          Tawau Resources & Skills Centre
        </h1>

        <p className="text-lg text-black md:text-xl">
          Offering HRD-Corp Levy Claimable Training Courses
        </p>

        <div className="mt-12 flex flex-row items-center justify-center gap-4">
          <button className="rounded-xl bg-[#7A1F1F] px-6 py-3 font-semibold text-white">
            Who Are We
          </button>
          <a
            href="/courses"
            className="rounded-xl bg-[#7A1F1F] px-6 py-3 font-semibold text-white"
          >
            Show All Courses
          </a>
        </div>

        <h2
          id="who-are-we"
          className="mb-12 mt-36 text-2xl font-bold text-[#0001fc] md:text-4xl"
        >
          Who Are We
        </h2>
        <img
          src={TRSCGroupPhoto}
          alt="TRSC group photo"
          className="w-full max-w-3xl rounded-2xl"
        />
        <p className="mt-4 text-lg text-black md:text-xl">
          TAWAU RESOURCES & SKILLS CENTRE is a Bumiputera Company. This company has been registered under the
          Trade License Ordinance 1948 in 2023 in the field of services and learning activities.
        </p>
        <p className="mt-4 text-lg text-black md:text-xl">
          This company has also been registered with the Ministry of Finance (MoF) in 2023 as a Welding Competency Assessment (Accreditation) Centre for CIDB
        </p>

        <h2
          id="upcoming-courses"
          className="mt-24 text-2xl font-bold text-[#0001fc] md:text-4xl"
        >
          Upcoming Courses
        </h2>

        <div className="mt-8 w-full max-w-5xl">
          <div className="flex items-center justify-center gap-3 md:gap-6">
            <button
              type="button"
              aria-label="Show previous upcoming course"
              onClick={showPreviousCourse}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F] text-white shadow-md transition hover:bg-[#5f1818] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:ring-offset-2"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>

            <article className="w-full max-w-md rounded-2xl bg-white p-4 shadow-sm md:p-5">
              <p className="text-sm font-semibold text-[#7A1F1F]">{activeCourse.date}</p>
              <h3 className="mt-1 text-lg font-bold text-[#0001fc] md:text-xl">
                {activeCourse.name}
              </h3>
              <p className="mt-2 text-sm text-black md:text-base">{activeCourse.details}</p>
              <img
                src={activeCourse.poster}
                alt={`${activeCourse.name} poster`}
                className="mt-4 aspect-[210/297] w-full rounded-xl object-cover"
              />
            </article>

            <button
              type="button"
              aria-label="Show next upcoming course"
              onClick={showNextCourse}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F] text-white shadow-md transition hover:bg-[#5f1818] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F] focus:ring-offset-2"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <a
          href="/courses"
          className="mt-10 rounded-xl bg-[#7A1F1F] px-6 py-3 font-semibold text-white"
        >
          Show All Courses
        </a>

        <h2 id="courses" className="mt-24 text-2xl font-bold text-[#0001fc] md:text-4xl">
          Experiences
        </h2>
      </main>
    </div>
  );
};

export default LandingPage;
