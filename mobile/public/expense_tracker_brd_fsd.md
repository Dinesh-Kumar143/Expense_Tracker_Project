# Expense Tracker Android App
## Business Requirements Document (BRD) & Functional Specifications Document (FSD)

---

## 🛑 AI ASSISTANT DIRECTIVE & INITIAL HANDSHAKE PROTOCOL
*(Instructions for AI Coding Assistant — Read carefully before executing)*

```text
CRITICAL OPERATIONAL RULES FOR AI ASSISTANT:
1. DO NOT MODIFY OR WRITE ANY CODE IMMEDIATELY.
2. FIRST, scan and read the existing project codebase in full.
3. Provide the user with a concise summary of:
   - Current directory structure.
   - Libraries/packages already installed.
   - Existing components and state management (if any).
4. ASK FOR EXPLICIT PERMISSION from the user before executing Phase 1 or editing any files.
5. Work strictly according to the task sequence provided below. Do not implement features outside the current task phase.
```

---

# 1. Business Requirements Document (BRD)

## 1.1 Executive Summary
The goal is to build a lightweight, high-performance, and visually refined Android Expense Tracker application using React Native Expo. The application serves users seeking quick financial awareness through high-level Key Performance Indicators (KPIs), seamless category filtering, and an ultra-fast expense entry experience—including an Android system-level **Assistive Touch floating widget** that operates outside the app.

## 1.2 Core Objectives & Scope
* **Frictionless Expense Logging:** Add expenses in under 3 seconds inside or outside the app.
* **Instant Financial Insight:** Provide real-time KPIs (Today, Monthly, Yearly, Daily Average, and custom metrics).
* **Customization:** Manage spending categories dynamically.
* **Android Accessibility:** System overlay floating button for background logging.
* **Aesthetic & Performance:** Clean, modern, non-funky palette with sub-100ms UI responsiveness.

## 1.3 Key Performance Indicators (KPIs)
1. **Total Amount Spent:** Cumulative lifetime expenditure logged in the system.
2. **Today's Spending:** Total expenses recorded for the current calendar date ($00:00 - 23:59$).
3. **Monthly Spending:** Total expenses recorded in the current calendar month.
4. **Yearly Spending:** Total expenses recorded in the current calendar year.
5. **Average Daily Spending:** Calculated as $\frac{\text{Current Month Spending}}{\text{Days Elapsed in Current Month}}$.
6. **Suggested KPI 1 — Top Spending Category:** The category taking up the highest percentage of current month's expenses.
7. **Suggested KPI 2 — Daily Pace Tracker:** Displays whether today's spending is above or below the average daily allowance.

## 1.4 Business Rules & Logic
* **Currency Defaults:** Support standard local numeric formatting.
* **Date Filtering Rules:** Filters affect KPI display windows without altering underlying persistent records.
* **Category Integrity:** Deleting a category prompts the user to either reassign associated expenses to "Uncategorized" or block deletion if linked expenses exist.
* **Overlay Permission Rule:** Enabling the floating button must check for Android `SYSTEM_ALERT_WINDOW` permission. If denied, gracefully guide the user to System Settings.

## 1.5 UI/UX & Visual Design Guidelines
* **Color Palette (Muted & Executive):**
  * **Primary:** Deep Slate / Navy (`#1E293B`)
  * **Accent:** Emerald / Muted Mint (`#10B981`)
  * **Background:** Clean Soft Off-White (`#F8FAFC`)
  * **Card Surface:** Crisp White (`#FFFFFF`) with subtle border (`#E2E8F0`)
  * **Text Primary:** Dark Charcoal (`#0F172A`)
  * **Text Secondary:** Cool Grey (`#64748B`)
* **Typography & Density:** Clean sans-serif (`System` / `Inter`), generous padding, high visual hierarchy, no cluttered borders or overly bright neon tones.

---

# 2. Functional Specifications Document (FSD)

## 2.1 System Architecture & Tech Stack
* **Framework:** React Native with Expo (Dev Client / Config Plugins required for Android System Overlay).
* **Storage Layer:** Local persistent storage via `MMKV` or `AsyncStorage` (lightweight, zero remote database overhead).
* **State Management:** `Zustand` or React `Context API` (fast, lightweight, predictable).
* **Android Native Overlay:** Custom Native Module / Expo Config Plugin utilizing Android `WindowManager` and `SYSTEM_ALERT_WINDOW` permissions.

## 2.2 Data Schema

### Expense Object (`Expense`)
```typescript
interface Expense {
  id: string; // UUID or timestamp string
  amount: number; // Positive float
  categoryId: string; // Foreign key to Category
  remarks?: string; // Optional text note
  createdAt: string; // ISO 8601 string (e.g. 2026-09-21T10:00:00Z)
}
```

### Category Object (`Category`)
```typescript
interface Category {
  id: string;
  name: string;
  icon?: string; // Icon identifier (e.g., Lucide / MaterialIcons)
  isDefault: boolean; // Protect default categories from accidental delete
}
```

### App Settings Object (`AppSettings`)
```typescript
interface AppSettings {
  floatingButtonEnabled: boolean;
  currencySymbol: string;
}
```

---

## 2.3 Screen & Flow Specifications

### Screen 1: Home Dashboard
* **Header:** Displays App Title and top-right **Settings Icon Button** (`Feather/settings` or similar).
* **KPI Carousel / Grid:**
  * Top Hero Card: **Today's Spending** vs **Average Daily Spending**.
  * Grid Section: **Monthly Spending**, **Yearly Spending**, **Total Spent**, and **Top Category**.
* **Filter Bar:**
  * **Date Range Picker:** Presets (Today, This Week, This Month, Custom Date Range).
  * **Category Filter Pills:** Horizontal scroll pill buttons (`All`, `Food`, `Bills`, etc.).
* **Transaction List Preview:** Shows recent logs matching active filters.
* **Primary Action:** Prominent floating/bottom **"+ Add Expense"** primary action button.

---

### Flow 1.1: Add Expense Modal
* **Trigger:** Tapping "+ Add Expense" button.
* **Fields:**
  1. **Category Selector:** Grid/Pills of active categories (Required selection).
  2. **Amount Input:** Numeric keypad input auto-focused (Required, positive number).
  3. **Remarks Input:** Single-line optional text input.
* **Actions:** `Cancel` button, `Save` button (Saves record, updates KPI state instantly, closes modal).

---

### Screen 2: Settings Screen
* **Navigation:** Accessed via Settings Icon on Home Screen.
* **Section 1: Category Management (2.1)**
  * List of existing categories with a delete button (`Trash` icon).
  * "+ Add New Category" input field/button.
  * *Logic:* Deleting a category warns if expenses are attached.
* **Section 2: Assistive Touch / Floating Button (2.2)**
  * **Toggle Switch:** "Enable System Floating Quick-Add".
  * *Permission Logic:* On toggle `ON`, app calls `Draw Over Other Apps` Android system dialog. If granted, launches background service; if denied, toggle reverts `OFF` with an explanatory toast.

---

### Flow 2.2: Android System Assistive Touch Overlay Widget
* **Behavior:** Appears as an overlay icon on the Android screen, floating over other native apps or home screen.
* **Interaction:**
  1. Tapping the widget opens a compact pop-up overlay window.
  2. Category selector pills appear -> User taps category.
  3. Quick number pad appears for Amount -> User inputs amount.
  4. Optional Remarks field -> User taps "Submit".
  5. Data writes to persistent local storage and updates state upon app reopen.

---

# 3. AI Execution Task Sequence (Phase-by-Phase)

*To prevent AI hallucination or unguided coding, enforce execution in exact order.*

```
┌──────────────────────────────────────────────────────────┐
│ PHASE 0: Inspection & Verification                        │
└───────────────────────────┬──────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│ PHASE 1: Storage Architecture & State Management          │
└───────────────────────────┬──────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│ PHASE 2: Core KPI & Calculation Engine                    │
└───────────────────────────┬──────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│ PHASE 3: Home Dashboard & Filter Bar UI                   │
└───────────────────────────┬──────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│ PHASE 4: Add Expense Flow (Modal & Logic)                 │
└───────────────────────────┬──────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│ PHASE 5: Settings Page & Category Management              │
└───────────────────────────┬──────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│ PHASE 6: Android System Overlay (Assistive Touch)        │
└───────────────────────────┬──────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│ PHASE 7: Theme Polish, Performance & Testing              │
└───────────────────────────┴──────────────────────────────┘
```

---

### Phase 0: Codebase Inspection Protocol
* **Task 0.1:** Read all files in the current repository. Identify package versioning (`package.json`), Expo version, navigation setup, and styling approach.
* **Task 0.2:** Summarize findings to the user and request permission to proceed to Phase 1.

---

### Phase 1: Data Model & Local Storage Engine
* **Task 1.1:** Setup local storage provider (`AsyncStorage` or `react-native-mmkv`).
* **Task 1.2:** Implement `CategoryStore` with default seed categories (*Food, Transport, Utilities, Entertainment, Shopping, Health*).
* **Task 1.3:** Implement `ExpenseStore` with CRUD methods (`addExpense`, `getExpenses`, `deleteExpense`).
* **Task 1.4:** Add default data initialization handler so app starts cleanly on fresh install.

---

### Phase 2: KPI Calculation Engine
* **Task 2.1:** Write pure utility functions for date utilities (start/end of today, start/end of month, start/end of year).
* **Task 2.2:** Build KPI aggregator logic:
  * `getTotalSpent(expenses)`
  * `getTodaySpent(expenses)`
  * `getMonthlySpent(expenses)`
  * `getYearlySpent(expenses)`
  * `getDailyAverageSpent(expenses)`
  * `getTopCategory(expenses, categories)`
* **Task 2.3:** Implement filter functions (`filterByDateRange`, `filterByCategory`).

---

### Phase 3: Home Dashboard UI Implementation
* **Task 3.1:** Create clean, modern theme tokens (Colors: `#1E293B`, `#10B981`, `#F8FAFC`).
* **Task 3.2:** Build top navigation header with screen title and Settings icon navigation button.
* **Task 3.3:** Build KPI Cards component with clear visual hierarchy and clean typography.
* **Task 3.4:** Build Date Range & Category filter bar components.
* **Task 3.5:** Build recent transactions list preview with formatted amounts and dates.

---

### Phase 4: In-App Add Expense Flow
* **Task 4.1:** Build `AddExpenseModal` sheet component.
* **Task 4.2:** Add Category picker grid/chips component.
* **Task 4.3:** Add formatted numeric amount input with quick validation.
* **Task 4.4:** Add optional remarks text input.
* **Task 4.5:** Connect form submission to `ExpenseStore` and trigger real-time KPI re-renders.

---

### Phase 5: Settings Page & Category Management
* **Task 5.1:** Create `SettingsScreen` route.
* **Task 5.2:** Build Section 2.1: Category List with delete buttons and "+ Add Category" modal/input.
* **Task 5.3:** Implement safety handler for category deletion (reassign connected expenses to "Uncategorized").

---

### Phase 6: Android Assistive Touch (System Overlay)
* **Task 6.1:** Add Android Overlay permission config (`SYSTEM_ALERT_WINDOW`) in `app.json`.
* **Task 6.2:** Create native module bridge / Expo config plugin for floating window background service.
* **Task 6.3:** Build floating quick-add widget layout (Compact category picker -> amount -> save).
* **Task 6.4:** Implement permission request handler inside `SettingsScreen` toggle. Handle permission grant/denial flow cleanly.

---

### Phase 7: Polish & Performance Optimization
* **Task 7.1:** Verify all lists use `FlashList` or optimized `FlatList` for zero frame drops.
* **Task 7.2:** Verify color contrast and typography scaling across different Android screen densities.
* **Task 7.3:** Conduct end-to-end user flow testing (Add expense -> Check KPIs -> Modify category -> Verify overlay quick add).