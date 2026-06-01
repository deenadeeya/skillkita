export function HomeCtaBanner() {
  return (
    <section className="mt-16 sm:mt-20">
      <div className="rounded-hero bg-primary px-6 py-12 text-center sm:px-12 sm:py-16">
        <h2 className="sk-heading-2 text-white">Ready to Upskill?</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/90">
          Explore our courses and start your learning journey today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/courses" className="sk-button-gold min-w-[160px]">
            Browse Courses
          </a>
          <a
            href="/about-us"
            className="sk-button inline-flex min-w-[160px] border-2 border-white/90 bg-transparent text-white hover:bg-white/10"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
