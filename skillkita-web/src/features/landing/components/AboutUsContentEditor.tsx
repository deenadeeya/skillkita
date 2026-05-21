import type { ChangeEvent } from "react";

type Props = {
  whoPreviewUrl: string;
  whoDescription: string;
  locationDescription: string;
  locationMapEmbedUrl: string;
  bankAccountDetails: string;
  bankQrPreviewUrl: string;
  contact1Name: string;
  contact1Phone: string;
  contact1Email: string;
  contact2Name: string;
  contact2Phone: string;
  contact2Email: string;
  companyHrEmail: string;
  isSaving: boolean;
  onWhoImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onWhoDescriptionChange: (value: string) => void;
  onLocationDescriptionChange: (value: string) => void;
  onLocationMapEmbedUrlChange: (value: string) => void;
  onBankAccountDetailsChange: (value: string) => void;
  onBankQrImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onContact1NameChange: (value: string) => void;
  onContact1PhoneChange: (value: string) => void;
  onContact1EmailChange: (value: string) => void;
  onContact2NameChange: (value: string) => void;
  onContact2PhoneChange: (value: string) => void;
  onContact2EmailChange: (value: string) => void;
  onCompanyHrEmailChange: (value: string) => void;
};

export function AboutUsContentEditor({
  whoPreviewUrl,
  whoDescription,
  locationDescription,
  locationMapEmbedUrl,
  bankAccountDetails,
  bankQrPreviewUrl,
  contact1Name,
  contact1Phone,
  contact1Email,
  contact2Name,
  contact2Phone,
  contact2Email,
  companyHrEmail,
  isSaving,
  onWhoImageChange,
  onWhoDescriptionChange,
  onLocationDescriptionChange,
  onLocationMapEmbedUrlChange,
  onBankAccountDetailsChange,
  onBankQrImageChange,
  onContact1NameChange,
  onContact1PhoneChange,
  onContact1EmailChange,
  onContact2NameChange,
  onContact2PhoneChange,
  onContact2EmailChange,
  onCompanyHrEmailChange,
}: Props) {
  return (
    <section className="sk-card mt-8 p-6">
      <h2 className="text-2xl font-bold text-[#7A1F1F]">About Us page</h2>
      <p className="mt-2 text-sm text-black/80">
        Content shown on the public <a href="/about-us" className="font-semibold text-[#7A1F1F] underline">About Us</a> page.
        Save using the button at the bottom of this form (shared with home page settings).
      </p>

      <div className="mt-6 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-[#7A1F1F]">1. Company Profile</h3>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Company photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={onWhoImageChange}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              disabled={isSaving}
            />
            <img
              src={whoPreviewUrl}
              alt="Company profile preview"
              className="mx-auto mt-3 block max-h-48 w-full max-w-sm rounded-xl object-cover"
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Description</span>
            <textarea
              value={whoDescription}
              onChange={(e) => onWhoDescriptionChange(e.currentTarget.value)}
              rows={5}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              placeholder="Company introduction..."
              disabled={isSaving}
            />
          </label>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#7A1F1F]">2. Location</h3>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Location details</span>
            <textarea
              value={locationDescription}
              onChange={(e) => onLocationDescriptionChange(e.currentTarget.value)}
              rows={4}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              placeholder="Address, directions, office hours..."
              disabled={isSaving}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Google Maps embed URL</span>
            <input
              type="url"
              value={locationMapEmbedUrl}
              onChange={(e) => onLocationMapEmbedUrlChange(e.currentTarget.value)}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 font-mono text-sm"
              placeholder="https://www.google.com/maps/embed?pb=..."
              disabled={isSaving}
            />
            <p className="mt-2 text-xs text-black/70">
              In Google Maps: Share → Embed a map → copy the <strong>src</strong> URL from the iframe code.
            </p>
          </label>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#7A1F1F]">3. Bank Account Details</h3>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Account details</span>
            <textarea
              value={bankAccountDetails}
              onChange={(e) => onBankAccountDetailsChange(e.currentTarget.value)}
              rows={4}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              placeholder="Account name, bank, account number (one per line or comma-separated)"
              disabled={isSaving}
            />
          </label>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Payment QR image</span>
            <input
              type="file"
              accept="image/*"
              onChange={onBankQrImageChange}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              disabled={isSaving}
            />
            <img
              src={bankQrPreviewUrl}
              alt="Bank QR preview"
              className="mx-auto mt-3 block max-h-48 max-w-[200px] rounded-xl border border-[#efe1db] bg-white p-2 object-contain"
            />
          </label>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#7A1F1F]">4. Contact Details</h3>
          <label className="mt-3 block max-w-xl">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Company email</span>
            <input
              type="email"
              value={companyHrEmail}
              onChange={(e) => onCompanyHrEmailChange(e.currentTarget.value)}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              placeholder="hr@company.com"
              disabled={isSaving}
            />
          </label>
          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[#efe1db] bg-[#faf7f2] p-4 space-y-3">
              <p className="text-sm font-bold text-[#7A1F1F]">Contact person 1</p>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Name</span>
                <input
                  type="text"
                  value={contact1Name}
                  onChange={(e) => onContact1NameChange(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  disabled={isSaving}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Phone</span>
                <input
                  type="tel"
                  value={contact1Phone}
                  onChange={(e) => onContact1PhoneChange(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  disabled={isSaving}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Email</span>
                <input
                  type="email"
                  value={contact1Email}
                  onChange={(e) => onContact1EmailChange(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  placeholder="name@company.com"
                  disabled={isSaving}
                />
              </label>
            </div>
            <div className="rounded-xl border border-[#efe1db] bg-[#faf7f2] p-4 space-y-3">
              <p className="text-sm font-bold text-[#7A1F1F]">Contact person 2</p>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Name</span>
                <input
                  type="text"
                  value={contact2Name}
                  onChange={(e) => onContact2NameChange(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  disabled={isSaving}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Phone</span>
                <input
                  type="tel"
                  value={contact2Phone}
                  onChange={(e) => onContact2PhoneChange(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  disabled={isSaving}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Email</span>
                <input
                  type="email"
                  value={contact2Email}
                  onChange={(e) => onContact2EmailChange(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  placeholder="name@company.com"
                  disabled={isSaving}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
