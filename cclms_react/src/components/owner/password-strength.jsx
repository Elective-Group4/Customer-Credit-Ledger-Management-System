const requirements = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    key: "uppercase",
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: "lowercase",
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  { key: "number", label: "One number", test: (value) => /[0-9]/.test(value) },
];

export function PasswordStrength({ value }) {
  const passed = requirements.filter((requirement) =>
    requirement.test(value),
  ).length;
  const label =
    passed === 0
      ? "Start typing"
      : passed === requirements.length
        ? "Strong"
        : passed >= 3
          ? "Almost strong"
          : "Needs improvement";
  const color =
    passed === requirements.length
      ? "bg-green-600"
      : passed >= 3
        ? "bg-yellow-500"
        : "bg-destructive";

  return (
    <div className="grid gap-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Password strength</span>
        <span>{label}</span>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {requirements.map((requirement) => (
          <span
            key={requirement.key}
            className={`h-1.5 flex-1 rounded-full ${requirement.test(value) ? color : "bg-muted"}`}
          />
        ))}
      </div>
      <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {requirements.map((requirement) => (
          <li
            key={requirement.key}
            className={requirement.test(value) ? "text-green-700" : ""}
          >
            {requirement.test(value) ? "✓" : "○"} {requirement.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
