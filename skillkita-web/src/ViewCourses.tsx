import CoursePoster1 from "./assets/CoursePoster1.jpg";
import SiteHeader from "./SiteHeader";

type PublicCourse = {
  id: number;
  name: string;
  date: string;
  details: string;
  poster: string;
};

const publicCourses: PublicCourse[] = [
  {
    id: 1,
    name: "Employment Contract & Stamping",
    date: "2025-05-28",
    details:
      "Practical workshop on employment contracts, legal clauses, and document stamping requirements.",
    poster: CoursePoster1,
  },
];

const ViewCourses = () => {
  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader
        menuLinks={[
          { label: "Home", href: "/" },
          { label: "View Courses", href: "/courses" },
        ]}
      />

      <main className="mx-auto w-full px-3 py-12 md:px-5">
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">
          Available Courses
        </h1>
        <p className="mt-3 text-lg text-black md:text-xl">
          Browse our current public training programs.
        </p>

        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {publicCourses.map((course) => (
            <article key={course.id} className="rounded-xl bg-white p-4 shadow-sm">
              <img
                src={course.poster}
                alt={`${course.name} poster`}
                className="aspect-[210/297] w-full rounded-lg object-cover"
              />
              <h2 className="mt-4 text-xl font-semibold text-[#0001fc]">
                {course.name}
              </h2>
              <p className="mt-2 text-sm font-medium text-[#7A1F1F]">
                Date: {course.date}
              </p>
              <p className="mt-2 text-sm text-black">{course.details}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default ViewCourses;