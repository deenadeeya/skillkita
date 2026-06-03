import { Link } from "react-router-dom";

type Part = { type: "text"; value: string } | { type: "link"; label: string; href: string };

function parseInline(text: string): Part[] {
  const parts: Part[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", value: text.slice(last, m.index) });
    }
    parts.push({ type: "link", label: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts.length ? parts : [{ type: "text", value: text }];
}

function renderLine(line: string, key: number) {
  const parts = parseInline(line);
  return (
    <p key={key} className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.type === "link" ? (
          p.href.startsWith("/") ? (
            <Link key={i} to={p.href} className="font-semibold text-primary underline">
              {p.label}
            </Link>
          ) : (
            <a
              key={i}
              href={p.href}
              className="font-semibold text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {p.label}
            </a>
          )
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </p>
  );
}

type Props = {
  text: string;
  className?: string;
};

export function AssistantReplyText({ text, className = "" }: Props) {
  const lines = text.split("\n");
  return (
    <div className={`space-y-1 text-sm leading-relaxed ${className}`}>
      {lines.map((line, i) => (line.trim() ? renderLine(line, i) : <br key={i} />))}
    </div>
  );
}
