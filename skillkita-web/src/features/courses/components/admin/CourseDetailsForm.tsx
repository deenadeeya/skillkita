import type { ChangeEvent, ReactNode } from "react";
import { RequiredMark } from "../../../../shared/ui/RequiredMark";

type CourseFormState = {
  name: string;
  date: string;
  trainerNames: string;
  time: string;
  venue: string;
  mycoid: string;
  price: string;
  contactPerson: string;
  contactPhone: string;
  syllabus: string;
  details: string;
  isVisible: boolean;
};

type Props = {
  form: CourseFormState;
  isSaving: boolean;
  onInputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  leading?: ReactNode;
  children?: ReactNode;
  submitLabel: string;
};

export function CourseDetailsForm({
  form,
  isSaving,
  onInputChange,
  leading,
  children,
  submitLabel,
}: Props) {
  return (
    <>
      {leading}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Course Name / Nama Kursus
            <RequiredMark />
          </span>
          <input
            name="name"
            value={form.name}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Date / Tarikh</span>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
          <span className="mt-1 block text-xs text-black/60">Optional. Leave blank if the date is not confirmed yet.</span>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Time / Pukul</span>
          <input
            name="time"
            value={form.time}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
            placeholder="e.g. 9:00 AM - 5:00 PM"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Venue / Lokasi
          </span>
          <input
            name="venue"
            value={form.venue}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Trainer name(s) / Nama jurulatih
          </span>
          <input
            name="trainerNames"
            value={form.trainerNames}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">MyCOID</span>
          <input
            name="mycoid"
            value={form.mycoid}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Price / Harga
          </span>
          <input
            name="price"
            value={form.price}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
            placeholder="e.g. RM 300"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Person to contact</span>
          <input
            name="contactPerson"
            value={form.contactPerson}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Phone number</span>
          <input
            name="contactPhone"
            value={form.contactPhone}
            onChange={onInputChange}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Syllabus / Sylibus Content / Kandungan Kursus
          </span>
          <textarea
            name="syllabus"
            value={form.syllabus}
            onChange={onInputChange}
            rows={4}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
          Other Information
          
        </span>
        <textarea
          name="details"
          value={form.details}
          onChange={onInputChange}
          rows={4}
          className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
        />
      </label>

      {children}

      <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-[#7A1F1F]">
          <input
            type="checkbox"
            name="isVisible"
            checked={form.isVisible}
            onChange={onInputChange}
            className="h-4 w-4"
          />
          Show to public
        </label>

        <button type="submit" disabled={isSaving} className="sk-button-primary">
          {isSaving ? "Saving..." : submitLabel}
        </button>
      </div>
    </>
  );
}

