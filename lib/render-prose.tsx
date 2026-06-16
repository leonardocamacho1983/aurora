import type { ReactNode } from "react";

// Converte ênfase em markdown (*x* / _x_ / **x**) em itálico/negrito — o texto
// nunca mostra asteriscos crus. Sem HTML perigoso: monta nós React.
export function renderInline(text: string, kp: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const isStrong = m[1] != null;
    const content = m[1] ?? m[2] ?? m[3] ?? "";
    nodes.push(
      isStrong ? (
        <strong key={`${kp}-${i}`}>{content}</strong>
      ) : (
        <em key={`${kp}-${i}`}>{content}</em>
      ),
    );
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function renderProse(text: string): ReactNode {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, idx) => (
      <p key={idx} style={{ margin: 0 }}>
        {renderInline(p.replace(/\n/g, " "), `p${idx}`)}
      </p>
    ));
}
