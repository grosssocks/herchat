## Goal

Update the "Your cycle at a glance" dashboard card so that the period bars represent the **last 6 calendar months** of data instead of a fixed **last 30 days** window.

## Current behavior

- The chart uses a computed `last30Days` array built from today going back 29 days.
- Each element represents a single day with an optional `flow` value from `periodEntries`.
- The SVG renders 30 vertical bars, one per day, evenly spaced across a 560px-wide area.
- The chart title reads: "Period days (last 30 days)".

## Proposed behavior

- Compute a new array (e.g. `lastSixMonthsDays`) that:
  - Starts from the date 6 months ago (based on today, using calendar months).
  - Iterates forward day by day until today (inclusive).
  - For each date, looks up any matching `periodEntries` entry and attaches its `flow`.
- Use this new array as the data source for the period bars.
- Update the chart title text to: **"Period days (last 6 months)"**.
- Adjust bar positioning and width so that an arbitrary number of days (typically ~180) still fits within the existing 560px chart width:
  - Compute the total day count from the data.
  - Derive a per-bar slot width (`slotWidth = 560 / totalDays`).
  - Use a bar width slightly smaller than the slot (e.g. `Math.max(2, slotWidth - 2)`) to preserve a bit of spacing.
  - Place each bar at `x = 20 + i * slotWidth`.

## Constraints and assumptions

- "Last 6 months" is interpreted as 6 calendar months relative to today, not a fixed 180-day window.
- The visual style (colors, gradients, typography) should remain consistent with the existing card.
- No additional UI controls (e.g. toggles between 30 days vs 6 months) are introduced for now.
- The change should be implemented within `app/page.tsx` where the existing chart logic lives.

## Acceptance criteria

- The chart title says **"Period days (last 6 months)"**.
- Inspecting the rendered SVG shows one bar per calendar day from 6 months ago through today.
- Period flow colors and legend semantics remain unchanged.
- No TypeScript/ESLint errors are introduced in `app/page.tsx`.

