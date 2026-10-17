# AGENTS.md

Rules for any AI agent (or human) working on this codebase. Read this entire file before writing or changing code. If a task conflicts with a rule here, stop and ask instead of breaking the rule.

---

## 0. The Non-Negotiables

These are checked first in every review. Violating any of them means the work is rejected.

1. **Never use the `any` type.** Not in annotations, not in `as any`, not implicitly. See section 6.
2. **Package manager is Bun.** Never run `npm`, `yarn`, or `pnpm`. See section 2.
3. **Stay inside Expo Go.** No custom native modules, no dev builds, no prebuild/eject. See section 3.
4. **Every screen is a directory** named after the screen, with `index.tsx` as its entry. See section 5.
5. **No random directories or files.** Every file lives in a directory defined in section 5. No new top-level directories without explicit approval.
6. **No hardcoded colors, spacing, font sizes, or radii in components.** Theme tokens only. See section 8.
7. **SOLID and modular design.** See section 7.
8. **No hardcoded reminder intervals.** Always read from preferences (default `[60, 30, 15]`).
9. **Do not add dependencies without asking,** and never add one that requires native code outside Expo Go.

---

## 1. Project Overview

A local-first shift-work calendar app (in the spirit of Supershift) built for nurses and other shift workers, primarily used at night. Core features:

- Month, week, and day calendar; color-coded shifts; multiple shifts per day; overnight shifts.
- Reusable shift templates (including an explicit "Off" template).
- A rotation engine (repeating patterns anchored to a date).
- Multi-reminders per shift via local notifications, user-configurable, default 60/30/15 minutes before.
- Working-hours and earnings reports (later phase).

The app is fully offline. No backend and no account are required for the MVP. The full product spec lives in `docs/PROJECT_SPEC.md`; this file defines _how_ to build it.

---

## 2. Tech Stack

| Concern              | Choice                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Runtime              | Expo (SDK version pinned in `package.json`; do not upgrade without approval)              |
| Framework            | React Native                                                                              |
| Language             | TypeScript, strict mode                                                                   |
| Package manager      | **Bun**                                                                                   |
| Navigation           | **React Navigation** only (native-stack + bottom-tabs). **Do not use expo-router.**       |
| State management     | **Zustand**                                                                               |
| Database             | `expo-sqlite` + **Drizzle ORM** (`drizzle-orm/expo-sqlite`), migrations via `drizzle-kit` |
| Notifications        | `expo-notifications` (local scheduled notifications only)                                 |
| Animation / gestures | `react-native-reanimated`, `react-native-gesture-handler`                                 |
| Haptics              | `expo-haptics`                                                                            |
| Icons                | `@react-native-vector-icons/feather` (react-native-vector-icons, Feather family)          |
| Testing              | None. No test frameworks and no test files; the developer tests manually                  |
| Lint / format        | ESLint (typescript-eslint, strict) + Prettier                                             |

### Bun rules

- Install: `bun install`. Add a dependency: `bun add <pkg>`. Dev dependency: `bun add -d <pkg>`.
- For Expo/React Native packages, use `bunx expo install <pkg>` so the version matches the installed SDK. Run `bunx expo install --check` after adding anything.
- Run scripts with `bun run <script>`. Run one-off binaries with `bunx`.
- Commit `bun.lock`. Never create or commit `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`.

### Required scripts in `package.json`

```
start       -> expo start
typecheck   -> tsc --noEmit
lint        -> eslint .
db:generate -> drizzle-kit generate
```

---

## 3. Expo Go Constraint

The app must always run in Expo Go on Android and iOS.

- Before adding any package or API, verify it works in Expo Go. If unsure, **ask**.
- Forbidden: `expo-dev-client`, `expo prebuild`, custom config plugins that require native changes, any package with its own native module not bundled in Expo Go, editing `android/` or `ios/` directories.
- If a requested feature needs a development build (home-screen widgets, native alarms, exact alarms), do **not** implement it. Explain the limitation and propose an Expo Go-compatible alternative.
- Local scheduled notifications are supported. Remote push is not used.
- Do not promise alarm-clock reliability. Notifications can be delayed or silenced by OS battery, Focus, or Do Not Disturb settings. Never write copy that implies guaranteed delivery.

---

## 4. Architecture and Dependency Direction

Layers, from top to bottom. A layer may import only from layers **below** it, never above.

```
screens  ->  components, hooks, store, theme
store    ->  repositories, services, domain
hooks    ->  store, domain, services
services ->  domain, (platform APIs through interfaces)
repositories -> db, domain
db       ->  (nothing app-specific)
domain   ->  (nothing; pure TypeScript)
```

Hard rules:

- `domain/` is **pure TypeScript**. It must not import React, React Native, Expo, Drizzle, or Zustand. It must stay pure so it can be checked in isolation by hand.
- UI code (`screens/`, `components/`) **never** imports from `db/` or calls Drizzle/SQLite directly. It goes through hooks and stores.
- Only `repositories/` talk to the database. Only `services/` talk to platform APIs (notifications, haptics, permissions).
- No circular imports.

---

## 5. Directory Structure (Strict)

This is the complete allowed structure. Do not add directories outside it. Do not create `misc/`, `helpers/`, `common/`, `lib/`, `stuff/`, `temp/`, or anything similar.

```
.
├── App.tsx                      # root: providers + navigation container only
├── docs/                        # PROJECT_SPEC.md and other documentation
├── drizzle/                     # generated migrations (never hand-edit)
├── src/
│   ├── navigation/              # navigators, route names, typed param lists
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── types.ts
│   ├── screens/                 # one directory per screen
│   │   └── <ScreenName>/
│   │       ├── index.tsx        # the screen (entry point)
│   │       ├── components/      # components used only by this screen
│   │       │   └── <ComponentName>/
│   │       │       └── index.tsx    # component + its styles in the same file
│   │       ├── hooks/           # hooks used only by this screen
│   │       └── types.ts         # types used only by this screen
│   ├── components/              # shared UI components used by 2+ screens
│   │   └── <ComponentName>/
│   │       └── index.tsx        # component + its styles in the same file
│   ├── theme/                   # design tokens, theme provider, useTheme, makeStyles
│   ├── store/                   # Zustand stores, one file per store
│   ├── hooks/                   # shared hooks used by 2+ screens
│   ├── domain/                  # pure business logic (rotation, reminders, dates)
│   ├── services/                # platform wrappers (notifications, haptics, logger)
│   ├── db/
│   │   ├── schema/              # one file per table, re-exported from index.ts
│   │   ├── repositories/        # one file per entity
│   │   ├── client.ts
│   │   └── migrate.ts
│   ├── types/                   # shared types used across layers
│   ├── constants/               # non-theme constants (route names, limits)
│   └── utils/                   # small generic pure functions with no domain meaning
```

### Screen rules

- A screen is a directory: `src/screens/<ScreenName>/index.tsx`. The directory name is the screen name in PascalCase, for example `Calendar`, `ShiftEditor`, `TemplateList`, `ReminderSettings`.
- `index.tsx` is the **only** entry file. Do not create `CalendarScreen.tsx` or `Calendar.tsx` files.
- Anything used only by that screen goes inside the screen directory (`components/`, `hooks/`, `types.ts`). Screen styles live inside the screen's `index.tsx`.
- When a component or hook is needed by a second screen, **promote** it to `src/components/` or `src/hooks/` in the same change. Never import from one screen's directory into another screen.

### Component rules

- Every component is a directory with a single `index.tsx`. One component per directory. Its styles live in the same file (see section 8.7).
- A component renders UI. It does not fetch data, schedule notifications, or contain business rules. Logic lives in hooks, stores, services, or `domain/`.
- Components are typed with explicit `Props` types. No default exports except where React Navigation requires a screen component (use named exports everywhere else).

### Where does it go? (decision guide)

| If it is...                            | It goes in...           |
| -------------------------------------- | ----------------------- |
| Pure calculation, no framework imports | `domain/`               |
| A DB query or write                    | `db/repositories/`      |
| A wrapper over an Expo/OS API          | `services/`             |
| App-wide state                         | `store/`                |
| Screen-specific UI/logic               | that screen's directory |
| Shared UI                              | `src/components/`       |
| Colors, spacing, type scale            | `theme/`                |

---

## 6. TypeScript Rules (Zero Tolerance)

### `any` is banned

- Never write `any`, `as any`, `Array<any>`, `Record<string, any>`, `Promise<any>`, or `(...args: any[])`.
- Never allow implicit `any` (untyped parameters, untyped catch variables, untyped JSON).
- Never use `@ts-ignore`. `@ts-expect-error` is allowed only with a comment explaining why, and needs approval.
- Use these instead:
  - `unknown` plus narrowing (type guards) for values of uncertain type, including `catch (error: unknown)`.
  - Generics for reusable code.
  - Discriminated unions for variants.
  - `Record<string, unknown>` for arbitrary objects.
  - Library types (`NativeStackScreenProps`, Drizzle's `InferSelectModel`, etc.).
- JSON columns are typed with Drizzle's `$type<T>()` and validated with type guards when read.
- If a third-party type forces `any`, **stop and ask**; do not paper over it.

### Other strictness

- `tsconfig.json` must set: `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, `exactOptionalPropertyTypes: true`.
- ESLint must set `@typescript-eslint/no-explicit-any: error`, `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`, `no-non-null-assertion: error`.
- Avoid type assertions (`as Foo`). `as const` is fine. If an assertion seems necessary, write a type guard instead.
- Use `import type` for type-only imports.
- Use path aliases (`@/domain/...`, `@/store/...`). No long relative paths like `../../../`.
- All exported functions have explicit return types.

---

## 7. SOLID and Modular Design

Apply these concretely, not as slogans.

- **Single Responsibility.** One reason to change per file. A repository does DB access only. A service wraps one platform API. A component renders one thing. A hook manages one concern.
- **Open/Closed.** Extend behavior by adding new implementations, not by editing switch statements in several places. Example: pay rules (overtime, holiday, weekend) are separate strategy functions that share one interface and are registered in a list.
- **Liskov Substitution.** Any implementation of an interface must be usable wherever the interface is expected. Example: a fake `NotificationScheduler` used in tests behaves like the real one.
- **Interface Segregation.** Prefer small, focused interfaces. Do not create a giant `Services` interface. Define `NotificationScheduler`, `PermissionChecker`, `Haptics` separately.
- **Dependency Inversion.** High-level code depends on interfaces, not concrete modules. `domain/` and the reminder sync logic depend on a `NotificationScheduler` interface; `services/notifications.ts` provides the Expo implementation. Repositories are passed in or imported through a single module so they can be replaced in tests.

### Modularity rules

- Each module (domain area, store, repository) exposes a small public API through its `index.ts`. Import from the module's index, not from its internals.
- Functions stay small (target under 40 lines). Components target under 150 lines of logic and JSX (the in-file styles block is excluded). If it grows, split it.
- No god files, no "utils dumping ground". A utility must be generic and pure; domain meaning means it belongs in `domain/`.
- No duplicated logic. If two places need the same calculation, extract it to `domain/` once.
- Prefer composition over inheritance. Prefer pure functions over classes unless a class has a clear reason.

---

## 8. UI Rules (Strict)

The design goal is **calm and minimal, easy on the eyes at night**. The main user is a nurse on night shifts. Glare is the enemy.

### 8.1 Hard rules

1. **Theme tokens only.** No hex colors, no raw numbers for spacing, font size, or radius inside components or style files. Everything comes from `useTheme()` / `src/theme`.
2. **No pure black (`#000`) and no pure white (`#FFF`) for backgrounds or text.** Use the tokens below.
3. **Dark and light mode both work on every screen.** Default follows the system setting, with a manual Light / Dark / Auto switch in Settings. Test both before finishing any UI task.
4. **The app has a quiet UI.** Color comes from the user's shifts, not from the app chrome. Do not add decorative gradients, glows, large colored blocks, or extra accent usage.
5. **No purple or indigo anywhere in the UI chrome.** No teal accent. The accent is dusty rose and nothing else.
6. **Minimum touch target 44x44.** Use `hitSlop` where the visual is smaller.
7. **Respect system font scaling.** Never disable `allowFontScaling`. Layouts must not break at large text sizes.
8. **Never rely on color alone.** Every shift shows its icon (a Feather icon from the curated shift icon set) in addition to its color. **Emojis are not used anywhere in the app.**
9. **Motion is minimal.** Short (150-250 ms), subtle transitions only. Honor the system "reduce motion" setting. No bouncing, shaking, or flashing.
10. **Every interactive element has an accessibility label and role.**

### 8.2 Color tokens

Defined once in `src/theme/colors.ts`.

| Token                 | Dark                        | Light                     |
| --------------------- | --------------------------- | ------------------------- |
| `background`          | `#101318`                   | `#F4F3EF`                 |
| `surface`             | `#181C23`                   | `#FBFAF8`                 |
| `surfaceRaised`       | `#1F242D`                   | `#FFFFFF`                 |
| `border`              | `#2A303B`                   | `#E4E2DC`                 |
| `text`                | `#DCE0E6`                   | `#1F2328`                 |
| `textMuted`           | `#8B93A1`                   | `#6B7280`                 |
| `accent` (dusty rose) | `#D498A0`                   | `#A8505E`                 |
| `onAccent`            | `#1A1114`                   | `#FFFFFF`                 |
| `accentSoft`          | `rgba(212, 152, 160, 0.16)` | `rgba(168, 80, 94, 0.12)` |
| `danger`              | `#F87171`                   | `#DC2626`                 |
| `weekendTint`         | `#10131A`                   | `#F1F1EE`                 |

Note: `#FFFFFF` is permitted only as `surfaceRaised` and `onAccent` in light mode, where it is a token value, not a literal used in components.

### 8.3 Accent usage (the complete list)

The dusty rose accent may be used **only** for: the today marker, the selected-day outline, primary buttons, toggles/switches in the on state, and text links. Nothing else.

### 8.4 Shift colors

Each preset has a `light` and a softer, less saturated `dark` value. Dark values must never be the bright light values. Presets:

| Name       | Light     | Dark      |
| ---------- | --------- | --------- |
| Amber      | `#F59E0B` | `#D9A441` |
| Orange     | `#F97316` | `#D98655` |
| Red        | `#EF4444` | `#D9706E` |
| Steel blue | `#5B7DB1` | `#7F9CC8` |
| Sky        | `#0EA5E9` | `#6CB4D6` |
| Green      | `#10B981` | `#6FB394` |
| Lime       | `#84CC16` | `#A3BF6B` |
| Brown      | `#A16207` | `#B08A5A` |
| Slate      | `#94A3B8` | `#8D98A8` |

Plus a custom color picker. There is intentionally no violet, indigo, teal, or rose preset.

The default **Night** template uses Steel blue. **Off** uses Slate.

### 8.5 Shift pill (the signature element)

- **Not a solid block.** Fill is the shift color at about 18% opacity, a 3 px solid left bar in the full shift color, and text in the theme `text` color.
- Shows the shift's icon (rendered with the `Icon` component, small size, `text`/`muted` tone) plus the name (name truncates). Shifts store an icon name chosen from a curated list in `src/constants/shiftIcons.ts` (about 16 Feather icon names, for example sun, moon, sunrise, sunset, coffee, home, activity, heart, briefcase, truck, clock, star, zap, cloud, flag, bell). The domain layer stores the icon as a plain string name because it must not import UI packages; the UI layer validates it against the curated list and falls back to a default icon if the stored name is unknown.
- Off days render as a muted, low-contrast marker, not a full pill.
- Overnight shifts display on the date they **start**, with a small "next day" marker.
- Month cells show at most 3 pills and a "+N" overflow indicator.
- Pill text always uses the theme `text` color, so no contrast calculation is needed. The tinted fill is the shift's `#RRGGBB` color with a hex alpha suffix appended (for example `2E` is about 18%). There is no color utility module; do not add one.

### 8.6 Spacing, radius, typography

- Spacing scale (4-pt grid): `4, 8, 12, 16, 20, 24, 32`.
- Radius: `8` (pills, inputs), `12` (cards, sheets), `999` (circles).
- Type scale: `12, 14, 16, 20, 28`. Weights: regular (`400`) and semibold (`600`) only.
- System fonts (SF Pro / Roboto). Use tabular numerals for times and hours.
- Hairline borders instead of heavy shadows. Light mode may use one very soft shadow level; dark mode uses surface elevation and borders, not shadows.

### 8.7 Styling mechanics

- Styles live **in the same `.tsx` file** as the component, in a block at the bottom of the file, built with the shared `makeStyles` helper from `src/theme`. Do not create separate `styles.ts` files.
- `makeStyles` takes a function from the theme to a style object, returns a hook, and memoizes per theme. It is implemented once in `src/theme/makeStyles.ts`, typed with generics (`StyleSheet.NamedStyles<T>`), with no `any`.
- Pattern:

```tsx
export function ShiftPill({ name, color }: ShiftPillProps): React.JSX.Element {
  const styles = useStyles();
  return <View style={styles.container}>...</View>;
}

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
}));
```

- The styles block is excluded from the component line limit in section 7, but keep it under about 80 lines. If it grows beyond that, the component is doing too much; split it.
- **Icons:** use the icon-pack-specific packages from the `@react-native-vector-icons` scope, with the **Feather** family (`@react-native-vector-icons/feather`) for the whole app. Install it with `bunx expo install` and verify it renders in Expo Go. Use only the scoped packages: do **not** install the old unscoped `react-native-vector-icons` package, and do not mix in any other icon library. Do not add font paths from `node_modules/@react-native-vector-icons/` to the `expo-font` config plugin. Run `bunx expo-doctor` after installing to confirm there are no icon package conflicts. Never use icon fonts or icon images from other sources. Ask before adding another icon family.
- Icons are rendered only through the `Icon` primitive in `src/components/Icon`. Icon color comes from theme tokens, and sizes are `16`, `20`, or `24`. Icon-only buttons need an accessibility label and a 44x44 touch target.
- No inline style objects with literal values. Inline styles are allowed only for dynamic values derived from props or theme.
- No third-party UI kit that overrides the theme. Build primitives in `src/components/` (`Text`, `Button`, `Card`, `Pill`, `Sheet`, `Switch`, `Chip`, `Icon`) and use them everywhere. Raw RN `Text` with custom styling in screens is not allowed; use the `Text` primitive.
- Haptics (`expo-haptics`) on shift add, delete, and day selection, through the haptics service only.

### 8.8 Interaction patterns

- Tapping a day opens a bottom sheet with that day's shifts and a quick-add row of template chips (one tap to add).
- Long-press a shift to copy; long-press a day to paste.
- Destructive actions (delete shift, delete template) require confirmation. The confirm button uses `danger`, not the accent.
- Empty states are short, quiet text with one clear action. No illustrations required.
- Loading states use a subtle skeleton or nothing; no full-screen spinners for local data.

### 8.9 Screen layout and safe areas

- A screen's root element is a plain `View`. **Never use `SafeAreaView`.**
- Top and bottom padding on the root `View` come from `useSafeAreaInsets()` (from `react-native-safe-area-context`), added to the theme spacing where needed, for example `paddingTop: insets.top`.
- Navigator headers are hidden by default (`headerShown: false`), and each screen renders its own header content. So every screen applies the **top** inset.
- Apply the **bottom** inset only on screens that are not shown above the bottom tab bar (for example modal and editor screens). The tab bar already handles the bottom inset for tab screens, so adding it there would double the padding.
- `SafeAreaProvider` wraps the app once, in `App.tsx`. Never read insets in a component that is not inside it.
- Because insets are dynamic values, they are applied inline in the screen (`style={[styles.container, { paddingTop: insets.top }]}`) while the static parts stay in `makeStyles`.

---

## 9. State Management (Zustand)

- One store per domain concern in `src/store/`, for example `useShiftStore`, `useTemplateStore`, `useRotationStore`, `useSettingsStore`, `useCalendarUiStore`.
- **SQLite is the source of truth** for persisted data. Stores hold in-memory working state loaded from repositories and call repositories in their actions. Do not use Zustand `persist` with AsyncStorage for data that belongs in SQLite.
- Components read state through **selectors** (`useShiftStore((s) => s.shifts)`), never the whole store.
- Do not store derived data; compute it with selectors or `domain/` functions.
- Store actions are the only place that coordinates repository writes and follow-up side effects (like reminder sync). Side effects run through services, not inline in components.
- State shapes and actions are fully typed. No `any`, no untyped `set` callbacks.

---

## 10. Database (Drizzle + expo-sqlite)

- Schema lives in `src/db/schema/`, one file per table, re-exported through `index.ts`.
- Migrations are generated with `bun run db:generate` and committed in `drizzle/`. **Never hand-edit generated migration files.** Never change a shipped migration; add a new one.
- Run migrations at app start before rendering the main navigator.
- Expo Go compatibility: the migration `.sql` files are bundled using the Drizzle-documented Babel/Metro configuration. Verify the setup against the current Drizzle docs when changing it.
- JSON columns use `$type<T>()` and are validated when read.
- Only `db/repositories/` uses the Drizzle client. Repositories return domain-shaped types, not raw rows, where the shapes differ.
- IDs are stable strings (UUIDs). Timestamps are epoch milliseconds (integer). Local dates are `YYYY-MM-DD` strings.
- Keep two separate concepts: reminder **preferences** and **scheduled reminder records**.

---

## 11. Domain Rules (Critical Logic)

### Dates and time

- A shift stores its **local date** (`YYYY-MM-DD`), local start/end times, and computed UTC `startsAt` / `endsAt` epoch ms.
- Overnight shifts end on the next calendar date.
- Day-difference math uses UTC-midnight arithmetic on date strings, never local `Date` arithmetic, to avoid DST bugs.
- All date helpers live in `domain/dates.ts` and must handle DST transition days explicitly.

### Rotation engine

- Pure, UI-independent, in `domain/`.
- `index = ((days % length) + length) % length` (correct for dates before the anchor).
- Rotations are **computed, not stored**. Only manual shifts and per-day exceptions are persisted.
- Editing a rotation must never overwrite user modifications. Past dates are frozen by closing the old rotation and starting a new one.
- One function (`resolveDay`) merges rotation output, exceptions, and manual shifts. Calendar, reports, and reminders all use it.

### Reminders

- Preferences: `{ enabled: boolean; minutesBefore: number[] }`. Default `[60, 30, 15]`. Never hardcode intervals anywhere else.
- Normalize offsets: keep positive integers only, dedupe, sort descending.
- Skip any reminder whose fire time is in the past.
- Effective offsets resolve in this order: shift override, template override, global default.
- Each notification carries the shift ID and `minutesBefore` in its data, with the title "Upcoming shift".
- **iOS allows only 64 pending local notifications.** Use a rolling window: schedule only the nearest reminders (cap around 60), and top up on app launch and foreground.
- Scheduling is done by a single **reconcile** function: compute the desired set, compare with persisted records and `getAllScheduledNotificationsAsync()`, cancel extras, schedule missing ones, persist each notification ID immediately after success. It must be **idempotent**. Create, edit, delete, preference change, launch, and foreground all call the same function.
- Unique constraint on `(shiftKey, offsetMinutes)` in `scheduled_reminders`.
- Handle denied permissions gracefully with a clear, non-nagging state. On Android, create the notification channel before scheduling.
- Changing global preferences affects future shifts without per-shift overrides. Never silently overwrite per-shift customizations.

---

## 12. Navigation

- React Navigation only. Typed param lists in `src/navigation/types.ts`.
- Bottom tabs for primary areas (Calendar, Stats, Settings). A root native stack for modals and editors (ShiftEditor, TemplateEditor, RotationWizard, ReminderSettings).
- Route names are constants in `src/constants/`; never string literals scattered in screens.
- Theme the navigators using the app theme so headers, tab bar, and modals match.

---

## 13. Code Quality and Debuggability

The code will be debugged later, often by someone reading it cold. Optimize for that.

- **Readable names.** No abbreviations beyond common ones. Booleans read as `isX` / `hasX` / `shouldX`.
- **No silent failures.** Never write empty `catch` blocks. Catch `unknown`, narrow it, log it through the logger service, and either recover meaningfully or rethrow.
- **Logging** goes through `services/logger.ts` only. No stray `console.log` left in committed code. Logs include a tag for the module.
- **No magic numbers or strings.** Name them as constants in the right module.
- **Comments explain why, not what.** Document non-obvious decisions (DST handling, the 64-notification cap, reconciliation order).
- **Errors are typed.** Prefer discriminated-union results or typed error classes over thrown strings.
- **No automated tests.** Do not add Jest, test files, or any testing library. The developer tests manually, so keep `domain/` functions small, pure, and easy to exercise by hand, and handle edge cases explicitly (negative modulo, DST days, overnight shifts, offset normalization, past-time skipping, rotation edits).
- **Small, focused changes.** One task per change. Do not refactor unrelated code while fixing something else.

---

## 14. Agent Workflow

Before starting:

1. Read this file and `docs/PROJECT_SPEC.md`.
2. Find where the change belongs using the decision guide in section 5.
3. If the task needs a new dependency, new top-level directory, or anything native, **ask first**.

Before declaring a task done, run all of these and fix every failure:

```
bun run typecheck
bun run lint
```

Then confirm this checklist:

- [ ] No `any` anywhere, including tests.
- [ ] Files are in the correct directories; each screen is `screens/<Name>/index.tsx`.
- [ ] No hardcoded colors, spacing, font sizes, or radii.
- [ ] Works in both light and dark mode.
- [ ] No imports that violate the dependency direction in section 4.
- [ ] No reminder intervals hardcoded; reconcile function used for all scheduling.
- [ ] Nothing that would break in Expo Go.
- [ ] No leftover `console.log`, dead code, or commented-out code.

If you are unsure about any rule, an API, or Expo Go compatibility, say so and ask. Do not guess and do not work around a rule.
