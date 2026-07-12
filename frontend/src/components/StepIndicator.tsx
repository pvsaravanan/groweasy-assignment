import { Fragment } from "react";
import clsx from "clsx";

// Labels mirror the actual screens: confirmation happens on the preview screen,
// and step 3 is the AI extraction phase.
const STEPS = ["Upload", "Preview & confirm", "AI processing", "Result"];

// Numbered-circle stepper: each step is a circle (number, or a check once done),
// centered above its label, joined by connector segments centered on the circles.
export function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex w-full items-start">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const state = step < current ? "done" : step === current ? "active" : "upcoming";
        const isLast = step === STEPS.length;
        return (
          <Fragment key={label}>
            <li className="flex flex-1 flex-col items-center gap-2">
              <span
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-300",
                  state === "done" && "bg-primary text-white dark:bg-link dark:text-ink",
                  state === "active" && "border-2 border-primary text-primary dark:border-link dark:text-link",
                  state === "upcoming" && "border border-hairline text-ink-muted"
                )}
              >
                {state === "done" ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 0 1 0 1.415l-7.09 7.09a1 1 0 0 1-1.415 0l-3.09-3.09a1 1 0 1 1 1.415-1.414l2.382 2.382 6.383-6.383a1 1 0 0 1 1.415 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step
                )}
              </span>
              <span
                className={clsx(
                  "text-center text-sm",
                  state === "active" && "font-semibold text-ink",
                  state === "done" && "text-ink",
                  state === "upcoming" && "text-ink-muted"
                )}
              >
                <span className="hidden sm:inline">{label}</span>
              </span>
            </li>
            {!isLast && (
              <li aria-hidden className="flex h-6 w-8 shrink-0 items-center sm:w-16">
                <span
                  className={clsx(
                    "h-0.5 w-full transition-colors duration-500 ease-out",
                    state === "done" ? "bg-primary dark:bg-link" : "bg-surface-2"
                  )}
                />
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
