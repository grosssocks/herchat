# Cycle Chart 6-Month View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the existing 30-day period bar view in the "Your cycle at a glance" card with a 6-calendar-month daily view while preserving the current styling and data sources.

**Architecture:** Keep all logic in `app/page.tsx` near the existing chart code, replacing the `last30Days` helper with a calendar-based 6-month helper and deriving bar layout values from the resulting array length. Reuse `periodEntries` as the source of truth and compute per-day flow by date lookup, without changing how data is stored or fetched.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, inline SVG.

---

### Task 1: Introduce 6-month date helper

**Files:**
- Modify: `app/page.tsx` (around the existing `last30Days` helper)

**Steps:**
1. Replace the `last30Days` IIFE with a new IIFE (e.g. `lastSixMonthsDays`) that:
   - Computes a `sixMonthsAgo` `Date` by cloning `today` and calling `setMonth(today.getMonth() - 6)`.
   - Iterates from `sixMonthsAgo` up to `today`, one day at a time, pushing `{ date, flow }` objects into an array.
   - For each date string (`toISOString().slice(0, 10)`), finds any matching `periodEntries` record for `flow`.
2. Ensure the resulting array is ordered from oldest to newest, matching the existing chart behavior.

### Task 2: Wire 6-month data into SVG

**Files:**
- Modify: `app/page.tsx` (SVG section inside the "Your cycle at a glance" card)

**Steps:**
1. Rename the JSX usage of `last30Days` in the `<svg>` map to the new 6-month helper.
2. Update the chart title text node from "Period days (last 30 days)" to "Period days (last 6 months)".

### Task 3: Make bar layout dynamic

**Files:**
- Modify: `app/page.tsx` (same chart section)

**Steps:**
1. Define constants near the helper, e.g. `const periodChartWidth = 560; const periodChartStartX = 20;`.
2. Compute `const totalDays = Math.max(lastSixMonthsDays.length, 1); const slotWidth = periodChartWidth / totalDays; const barWidth = Math.max(2, slotWidth - 2);`.
3. In the map, use `x = periodChartStartX + i * slotWidth` and `width={barWidth}` instead of hard-coded 30-day values.

### Task 4: Verify behavior and lint

**Files:**
- Modify/Check: `app/page.tsx`

**Steps:**
1. Run the app and load the dashboard, visually confirming that:
   - The header text reflects "last 6 months".
   - The bars appear continuous from ~6 months ago through today, with reasonable spacing.
2. Run the linter/TypeScript checks (or use the workspace lint tooling) to ensure no new errors were introduced in `app/page.tsx`.

