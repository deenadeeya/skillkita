import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useState, type ComponentProps } from "react";

type Props = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ className = "", disabled, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={`w-full rounded-lg border border-[#d8c9c2] bg-white py-2 pl-3 pr-10 ${className}`.trim()}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-black/45 hover:text-[#7A1F1F] focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/25 disabled:pointer-events-none disabled:opacity-40"
      >
        {visible ? (
          <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <EyeIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
