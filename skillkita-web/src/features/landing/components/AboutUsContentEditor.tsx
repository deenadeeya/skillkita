type Props = {
  whoDescription: string;
  locationDescription: string;
  locationMapEmbedUrl: string;
  bankAccountDetails: string;
  contact1Name: string;
  contact1Phone: string;
  contact1Email: string;
  contact2Name: string;
  contact2Phone: string;
  contact2Email: string;
  companyHrEmail: string;
  isSaving: boolean;
  onWhoDescriptionChange: (value: string) => void;
  onLocationDescriptionChange: (value: string) => void;
  onLocationMapEmbedUrlChange: (value: string) => void;
  onBankAccountDetailsChange: (value: string) => void;
  onContact1NameChange: (value: string) => void;
  onContact1PhoneChange: (value: string) => void;
  onContact1EmailChange: (value: string) => void;
  onContact2NameChange: (value: string) => void;
  onContact2PhoneChange: (value: string) => void;
  onContact2EmailChange: (value: string) => void;
  onCompanyHrEmailChange: (value: string) => void;
};

export function AboutUsContentEditor({
  whoDescription,
  locationDescription,
  locationMapEmbedUrl,
  bankAccountDetails,
  contact1Name,
  contact1Phone,
  contact1Email,
  contact2Name,
  contact2Phone,
  contact2Email,
  companyHrEmail,
  isSaving,
  onWhoDescriptionChange,
  onLocationDescriptionChange,
  onLocationMapEmbedUrlChange,
  onBankAccountDetailsChange,
  onContact1NameChange,
  onContact1PhoneChange,
  onContact1EmailChange,
  onContact2NameChange,
  onContact2PhoneChange,
  onContact2EmailChange,
  onCompanyHrEmailChange,
}: Props) {
  return (
    <section id="about-us-content" className="sk-card scroll-mt-24 p-6 md:p-8">
      <div className="border-b border-black/5 pb-5">
        <h2 className="sk-section-title">About Us content</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Text for the public{" "}
          <a href="/about-us" className="font-semibold text-primary underline">
            About Us
          </a>{" "}
          page. Photos are in{" "}
          <a href="#site-media" className="font-semibold text-primary underline">
            Site images
          </a>
          .
        </p>
      </div>

      <div className="mt-8 space-y-10">
        <fieldset className="space-y-4">
          <legend className="font-heading text-lg font-semibold text-ink">Company profile</legend>
          <label className="block">
            <span className="sk-label">Description</span>
            <textarea
              value={whoDescription}
              onChange={(e) => onWhoDescriptionChange(e.currentTarget.value)}
              rows={5}
              className="sk-input"
              placeholder="Company introduction…"
              disabled={isSaving}
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-heading text-lg font-semibold text-ink">Location</legend>
          <label className="block">
            <span className="sk-label">Location details</span>
            <textarea
              value={locationDescription}
              onChange={(e) => onLocationDescriptionChange(e.currentTarget.value)}
              rows={4}
              className="sk-input"
              placeholder={"Short intro (optional)\n\nTB 15095, Lot 3715…"}
              disabled={isSaving}
            />
            <p className="mt-2 text-xs text-ink-muted">
              First paragraph = short line on the location hero; following paragraphs = full address.
            </p>
          </label>
          <label className="block">
            <span className="sk-label">Google Maps link</span>
            <input
              type="url"
              value={locationMapEmbedUrl}
              onChange={(e) => onLocationMapEmbedUrlChange(e.currentTarget.value)}
              className="sk-input font-mono text-sm"
              placeholder="https://maps.app.goo.gl/…"
              disabled={isSaving}
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-heading text-lg font-semibold text-ink">Bank account</legend>
          <label className="block">
            <span className="sk-label">Account details</span>
            <textarea
              value={bankAccountDetails}
              onChange={(e) => onBankAccountDetailsChange(e.currentTarget.value)}
              rows={4}
              className="sk-input"
              placeholder="Account name, bank, account number…"
              disabled={isSaving}
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-heading text-lg font-semibold text-ink">Contact details</legend>
          <label className="block max-w-xl">
            <span className="sk-label">Company email</span>
            <input
              type="email"
              value={companyHrEmail}
              onChange={(e) => onCompanyHrEmailChange(e.currentTarget.value)}
              className="sk-input"
              placeholder="hr@company.com"
              disabled={isSaving}
            />
          </label>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ContactPersonFields
              title="Contact person 1"
              name={contact1Name}
              phone={contact1Phone}
              email={contact1Email}
              isSaving={isSaving}
              onNameChange={onContact1NameChange}
              onPhoneChange={onContact1PhoneChange}
              onEmailChange={onContact1EmailChange}
            />
            <ContactPersonFields
              title="Contact person 2"
              name={contact2Name}
              phone={contact2Phone}
              email={contact2Email}
              isSaving={isSaving}
              onNameChange={onContact2NameChange}
              onPhoneChange={onContact2PhoneChange}
              onEmailChange={onContact2EmailChange}
            />
          </div>
        </fieldset>
      </div>
    </section>
  );
}

function ContactPersonFields({
  title,
  name,
  phone,
  email,
  isSaving,
  onNameChange,
  onPhoneChange,
  onEmailChange,
}: {
  title: string;
  name: string;
  phone: string;
  email: string;
  isSaving: boolean;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-card border border-black/10 bg-primary/5 p-4">
      <p className="text-sm font-bold text-primary">{title}</p>
      <label className="block">
        <span className="sk-label">Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.currentTarget.value)}
          className="sk-input"
          disabled={isSaving}
        />
      </label>
      <label className="block">
        <span className="sk-label">Phone</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhoneChange(e.currentTarget.value)}
          className="sk-input"
          disabled={isSaving}
        />
      </label>
      <label className="block">
        <span className="sk-label">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.currentTarget.value)}
          className="sk-input"
          placeholder="name@company.com"
          disabled={isSaving}
        />
      </label>
    </div>
  );
}
