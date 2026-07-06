export function hasFinalConsonant(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  const last = value[value.length - 1];
  const code = last.charCodeAt(0);
  const hangulStart = 0xac00;
  const hangulEnd = 0xd7a3;

  if (code < hangulStart || code > hangulEnd) {
    return false;
  }

  return (code - hangulStart) % 28 !== 0;
}

export function particle(text, withFinal, withoutFinal) {
  return hasFinalConsonant(text) ? withFinal : withoutFinal;
}

export function withParticle(text, withFinal, withoutFinal) {
  return `${text}${particle(text, withFinal, withoutFinal)}`;
}
