import type { ChangeEvent, FormEvent } from "react";

type Props = {
  coverDescription: string;
  whoDescription: string;
  whoPreviewUrl: string;
  isSaving: boolean;
  onChangeCover: (next: string) => void;
  onChangeWhoDescription: (next: string) => void;
  onWhoImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LandingCoverEditor({
  coverDescription,
  whoDescription,
  whoPreviewUrl,
  isSaving,
  onChangeCover,
  onChangeWhoDescription,
  onWhoImageChange,
  onSubmit,
}: Props) {
  return (
    <section className="sk-card p-6">
      <h2 className="text-2xl font-bold text-[#7A1F1F]">Cover</h2>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Cover description</span>
          <textarea
            value={coverDescription}
            onChange={(e) => onChangeCover(e.currentTarget.value)}
            rows={3}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            placeholder="Offering HRD-Corp Levy Claimable Training Courses"
            required
          />
        </label>

        <h3 className="pt-2 text-xl font-bold text-[#7A1F1F]">Who are we</h3>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Picture</span>
          <input
            type="file"
            accept="image/*"
            onChange={onWhoImageChange}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            disabled={isSaving}
          />
          <img src={whoPreviewUrl} alt="Who are we preview" className="mt-3 w-full rounded-xl object-cover" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Description</span>
          <textarea
            value={whoDescription}
            onChange={(e) => onChangeWhoDescription(e.currentTarget.value)}
            rows={6}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            placeholder="Write a short company introduction..."
            required
          />
        </label>

        <div className="pt-2">
          <button type="submit" disabled={isSaving} className="sk-button-primary">
            {isSaving ? "Saving..." : "Save cover"}
          </button>
        </div>
      </form>
    </section>
  );
}

