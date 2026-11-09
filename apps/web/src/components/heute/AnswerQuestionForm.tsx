"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";

export function AnswerQuestionForm({ fieldId }: { fieldId: string }) {
  void fieldId;
  const [answered, setAnswered] = useState<string | null>(null);

  if (answered) {
    return <p className="mt-3 text-xs text-leaf-700 font-semibold">Danke! Antwort „{answered}“ gespeichert.</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {["Ja", "Teilweise", "Nein"].map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => setAnswered(a)}
          className={buttonClass("secondary", "sm")}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
