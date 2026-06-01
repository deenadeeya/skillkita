import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_HERO,
  DEFAULT_STATS,
  deleteHomepagePartner,
  getHomepageHero,
  getHomepageStats,
  insertHomepagePartner,
  listHomepagePartners,
  upsertHomepageHero,
  upsertHomepageStats,
  type HomepageHeroRow,
  type HomepagePartnerRow,
} from "../../api/homepageApi";
import { uploadSiteAssetPartnerLogo } from "../../../landing/api/landingStorage";

type Props = {
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
  onError: (msg: string | null) => void;
};

export function HomepageCmsEditors({ isSaving, setIsSaving, onError }: Props) {
  const [hero, setHero] = useState<HomepageHeroRow | null>(null);
  const [heroTitle, setHeroTitle] = useState(DEFAULT_HERO.title);

  const [studentsValue, setStudentsValue] = useState(String(DEFAULT_STATS.students_value));
  const [studentsSuffix, setStudentsSuffix] = useState(DEFAULT_STATS.students_suffix);
  const [studentsLabel, setStudentsLabel] = useState(DEFAULT_STATS.students_label);
  const [coursesValue, setCoursesValue] = useState(String(DEFAULT_STATS.courses_value));
  const [coursesSuffix, setCoursesSuffix] = useState(DEFAULT_STATS.courses_suffix);
  const [coursesLabel, setCoursesLabel] = useState(DEFAULT_STATS.courses_label);
  const [partnersValue, setPartnersValue] = useState(String(DEFAULT_STATS.partners_value));
  const [partnersSuffix, setPartnersSuffix] = useState(DEFAULT_STATS.partners_suffix);
  const [partnersLabel, setPartnersLabel] = useState(DEFAULT_STATS.partners_label);
  const [satisfactionValue, setSatisfactionValue] = useState(String(DEFAULT_STATS.satisfaction_value));
  const [satisfactionSuffix, setSatisfactionSuffix] = useState(DEFAULT_STATS.satisfaction_suffix);
  const [satisfactionLabel, setSatisfactionLabel] = useState(DEFAULT_STATS.satisfaction_label);

  const [partners, setPartners] = useState<HomepagePartnerRow[]>([]);

  const loadAll = useCallback(async () => {
    const [heroRow, statsRow, partnerRows] = await Promise.all([
      getHomepageHero(),
      getHomepageStats(),
      listHomepagePartners(),
    ]);

    setHero(heroRow);
    if (heroRow) {
      setHeroTitle(heroRow.title);
    }

    if (statsRow) {
      setStudentsValue(String(statsRow.students_value));
      setStudentsSuffix(statsRow.students_suffix);
      setStudentsLabel(statsRow.students_label);
      setCoursesValue(String(statsRow.courses_value));
      setCoursesSuffix(statsRow.courses_suffix);
      setCoursesLabel(statsRow.courses_label);
      setPartnersValue(String(statsRow.partners_value));
      setPartnersSuffix(statsRow.partners_suffix);
      setPartnersLabel(statsRow.partners_label);
      setSatisfactionValue(String(statsRow.satisfaction_value));
      setSatisfactionSuffix(statsRow.satisfaction_suffix);
      setSatisfactionLabel(statsRow.satisfaction_label);
    }

    setPartners(partnerRows);
  }, []);

  useEffect(() => {
    void loadAll().catch((err) =>
      onError(err instanceof Error ? err.message : "Failed to load homepage CMS.")
    );
  }, [loadAll, onError]);

  const saveHero = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    onError(null);
    try {
      await upsertHomepageHero({
        id: 1,
        title: heroTitle.trim(),
        subtitle: DEFAULT_HERO.subtitle,
        hero_image: hero?.hero_image ?? null,
        button_1_text: DEFAULT_HERO.button_1_text,
        button_1_link: DEFAULT_HERO.button_1_link,
        button_2_text: DEFAULT_HERO.button_2_text,
        button_2_link: DEFAULT_HERO.button_2_link,
        updated_at: new Date().toISOString(),
      });
      await loadAll();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save hero.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveStats = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    onError(null);
    try {
      await upsertHomepageStats({
        id: 1,
        students_value: Number(studentsValue) || 0,
        students_suffix: studentsSuffix.trim(),
        students_label: studentsLabel.trim(),
        courses_value: Number(coursesValue) || 0,
        courses_suffix: coursesSuffix.trim(),
        courses_label: coursesLabel.trim(),
        partners_value: Number(partnersValue) || 0,
        partners_suffix: partnersSuffix.trim(),
        partners_label: partnersLabel.trim(),
        satisfaction_value: Number(satisfactionValue) || 0,
        satisfaction_suffix: satisfactionSuffix.trim(),
        satisfaction_label: satisfactionLabel.trim(),
        updated_at: new Date().toISOString(),
      });
      await loadAll();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save statistics.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-10 space-y-6">
      <div className="border-b border-black/10 pb-4">
        <h2 className="sk-section-title">Homepage CMS</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Hero headline, statistics, and partners. Subtitle and buttons are fixed on the public site.
          Background photo:{" "}
          <a href="#site-media" className="font-semibold text-primary underline">
            Site images
          </a>
          .
        </p>
      </div>

      <form className="sk-card p-6 md:p-8" onSubmit={saveHero}>
        <h3 className="font-heading text-lg font-semibold text-ink">Hero headline</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Description and call-to-action buttons use the default site copy and cannot be edited here.
        </p>
        <label className="mt-5 block">
          <span className="sk-label">Headline</span>
          <input
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.currentTarget.value)}
            className="sk-input"
            required
          />
        </label>
        <button type="submit" disabled={isSaving} className="sk-button-primary mt-6">
          Save hero
        </button>
      </form>

      <form className="sk-card p-6 md:p-8" onSubmit={saveStats}>
        <h3 className="font-heading text-lg font-semibold text-ink">Company statistics</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <fieldset className="rounded-xl border border-black/10 p-4">
            <legend className="px-1 text-sm font-semibold text-primary">Students</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                type="number"
                value={studentsValue}
                onChange={(e) => setStudentsValue(e.currentTarget.value)}
                className="col-span-2 sk-input py-1.5"
                min={0}
              />
              <input
                value={studentsSuffix}
                onChange={(e) => setStudentsSuffix(e.currentTarget.value)}
                className="sk-input py-1.5"
              />
            </div>
            <input
              value={studentsLabel}
              onChange={(e) => setStudentsLabel(e.currentTarget.value)}
              className="mt-2 sk-input py-1.5 text-sm"
            />
          </fieldset>
          <fieldset className="rounded-xl border border-black/10 p-4">
            <legend className="px-1 text-sm font-semibold text-primary">Courses</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                type="number"
                value={coursesValue}
                onChange={(e) => setCoursesValue(e.currentTarget.value)}
                className="col-span-2 sk-input py-1.5"
                min={0}
              />
              <input
                value={coursesSuffix}
                onChange={(e) => setCoursesSuffix(e.currentTarget.value)}
                className="sk-input py-1.5"
              />
            </div>
            <input
              value={coursesLabel}
              onChange={(e) => setCoursesLabel(e.currentTarget.value)}
              className="mt-2 sk-input py-1.5 text-sm"
            />
          </fieldset>
          <fieldset className="rounded-xl border border-black/10 p-4">
            <legend className="px-1 text-sm font-semibold text-primary">Partners</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                type="number"
                value={partnersValue}
                onChange={(e) => setPartnersValue(e.currentTarget.value)}
                className="col-span-2 sk-input py-1.5"
                min={0}
              />
              <input
                value={partnersSuffix}
                onChange={(e) => setPartnersSuffix(e.currentTarget.value)}
                className="sk-input py-1.5"
              />
            </div>
            <input
              value={partnersLabel}
              onChange={(e) => setPartnersLabel(e.currentTarget.value)}
              className="mt-2 sk-input py-1.5 text-sm"
            />
          </fieldset>
          <fieldset className="rounded-xl border border-black/10 p-4">
            <legend className="px-1 text-sm font-semibold text-primary">Satisfaction</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                type="number"
                value={satisfactionValue}
                onChange={(e) => setSatisfactionValue(e.currentTarget.value)}
                className="col-span-2 sk-input py-1.5"
                min={0}
              />
              <input
                value={satisfactionSuffix}
                onChange={(e) => setSatisfactionSuffix(e.currentTarget.value)}
                className="sk-input py-1.5"
              />
            </div>
            <input
              value={satisfactionLabel}
              onChange={(e) => setSatisfactionLabel(e.currentTarget.value)}
              className="mt-2 sk-input py-1.5 text-sm"
            />
          </fieldset>
        </div>
        <button type="submit" disabled={isSaving} className="sk-button-primary mt-6">
          Save statistics
        </button>
      </form>

      <PartnersAdmin
        items={partners}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        onError={onError}
        onReload={loadAll}
      />
    </div>
  );
}

function PartnersAdmin({
  items,
  isSaving,
  setIsSaving,
  onError,
  onReload,
}: {
  items: HomepagePartnerRow[];
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
  onError: (msg: string | null) => void;
  onReload: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    onError(null);
    try {
      const logo_url = file ? await uploadSiteAssetPartnerLogo(file) : null;
      await insertHomepagePartner({
        name: name.trim(),
        logo_url,
        sort_order: items.length,
      });
      setName("");
      setFile(null);
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add partner.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="sk-card p-6 md:p-8">
      <h3 className="font-heading text-lg font-semibold text-ink">Partners &amp; accreditations</h3>
      <form className="mt-4 flex flex-wrap gap-3" onSubmit={add}>
        <input
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Organisation name"
          required
          className="min-w-[200px] flex-1 sk-input"
        />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)} />
        <button type="submit" disabled={isSaving} className="sk-button-primary">
          Add partner
        </button>
      </form>
      <ul className="mt-6 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-black/10 p-2">
            {item.logo_url ? (
              <img src={item.logo_url} alt="" className="h-10 w-24 object-contain grayscale" />
            ) : null}
            <span className="flex-1 text-sm font-medium">{item.name}</span>
            <button
              type="button"
              className="text-sm text-red-700"
              onClick={() => {
                void deleteHomepagePartner(item.id)
                  .then(onReload)
                  .catch((err) => onError(err instanceof Error ? err.message : "Delete failed."));
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
