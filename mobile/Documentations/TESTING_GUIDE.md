# Testing Guide - Expense Tracker

Complete end-to-end testing procedures for all app features.

---

## 🧪 Test Environment Setup

### Prerequisites
```bash
# Development Build (Expo Go)
npm start
# Press 'a' for Android

# Production Build (With Overlay)
npx expo run:android
```

---

## 📋 Test Scenarios

### Test Suite 1: First Launch (Fresh Install)

**Objective:** Verify app initializes correctly with default data.

**Steps:**
1. Install app on clean device/emulator
2. Launch app

**Expected Results:**
- ✅ App loads without crashes
- ✅ Loading indicator shows briefly
- ✅ Home screen appears
- ✅ 7 default categories visible in filters:
  - 🍽️ Food
  - 🚌 Transport
  - 🛍️ Shopping
  - 💡 Bills
  - 💊 Health
  - 🎬 Entertainment
  - 📦 Other
- ✅ Empty state message: "No expenses yet"
- ✅ KPI cards show Rs.0.00
- ✅ Settings icon (⚙️) visible
- ✅ "+ Add" button visible

---

### Test Suite 2: Add Expense Flow

**Test 2.1: Basic Expense Entry**

**Steps:**
1. Tap "+ Add" button
2. Select "Food" category
3. Type "150" in amount field
4. Type "Lunch at restaurant" in description
5. Leave date as today
6. Tap "Save expense"

**Expected Results:**
- ✅ Modal opens with bottom sheet animation
- ✅ Amount input auto-focused
- ✅ Category "Food" gets selected (highlighted)
- ✅ Save button enabled after entering required fields
- ✅ Modal closes after save
- ✅ New expense appears at top of list
- ✅ Today's spending shows Rs.150.00
- ✅ Monthly spending shows Rs.150.00
- ✅ Total spending shows Rs.150.00

---

**Test 2.2: Quick Amount Buttons**

**Steps:**
1. Tap "+ Add"
2. Select "Transport" category
3. Tap "Rs.50" quick button
4. Type "Bus fare" in description
5. Tap "Save"

**Expected Results:**
- ✅ Amount field auto-fills with "50"
- ✅ Can still edit amount after quick button
- ✅ Expense saves successfully
- ✅ Today's spending updates to Rs.200.00

---

**Test 2.3: Input Validation**

**Steps:**
1. Tap "+ Add"
2. Try to type letters in amount: "abc"
3. Try to type multiple decimals: "10.5.5"
4. Try to save without category
5. Try to save without amount
6. Try to save without description

**Expected Results:**
- ✅ Amount field blocks letters
- ✅ Amount field blocks multiple decimal points
- ✅ Save button disabled when incomplete
- ✅ Alert shown: "Missing title" when no description
- ✅ Alert shown: "Invalid amount" when no amount
- ✅ Alert shown: "No category selected" when no category

---

**Test 2.4: Character Limit**

**Steps:**
1. Tap "+ Add"
2. Type 85 characters in description

**Expected Results:**
- ✅ Character counter appears: "85/100"
- ✅ Can type up to 100 characters
- ✅ Cannot type beyond 100 characters

---

**Test 2.5: Date Validation**

**Steps:**
1. Tap "+ Add"
2. Change date to tomorrow (e.g., 2026-09-22)
3. Try to save

**Expected Results:**
- ✅ Alert shown: "Future date - Cannot add expenses for future dates"
- ✅ Expense not saved

---

### Test Suite 3: Edit & Delete Expense

**Test 3.1: Edit Expense**

**Steps:**
1. Tap on any expense row
2. Change amount from Rs.150 to Rs.175
3. Change description
4. Tap "Update expense"

**Expected Results:**
- ✅ Modal opens with pre-filled data
- ✅ Button text shows "Update expense"
- ✅ Changes save successfully
- ✅ List updates immediately
- ✅ KPIs recalculate

---

**Test 3.2: Delete Expense**

**Steps:**
1. Tap "Delete" on an expense
2. Tap "Delete" in confirmation

**Expected Results:**
- ✅ Confirmation alert appears
- ✅ Message shows: "Remove '[title]'?"
- ✅ Expense removed from list
- ✅ KPIs update immediately

---

### Test Suite 4: Filtering

**Test 4.1: Filter by Time Period**

**Steps:**
1. Add expenses for different dates
2. Tap "This month" filter
3. Tap "All" filter

**Expected Results:**
- ✅ "This month" shows only current month expenses
- ✅ "All" shows all expenses
- ✅ Filter chip highlights when selected
- ✅ Count updates in list

---

**Test 4.2: Filter by Category**

**Steps:**
1. Add expenses in multiple categories
2. Tap "Food" category filter
3. Verify list shows only food expenses
4. Tap "Transport" category filter
5. Verify list updates

**Expected Results:**
- ✅ Only selected category expenses shown
- ✅ Filter chip highlights with category color
- ✅ Smooth transitions between filters

---

### Test Suite 5: KPI Calculations

**Test 5.1: Today's Spending**

**Setup:** Add 3 expenses today (Rs.100, Rs.50, Rs.75)

**Expected Results:**
- ✅ Today's spending card shows Rs.225.00
- ✅ Daily average matches or is close to Rs.225

---

**Test 5.2: Monthly Spending**

**Setup:** Add expenses across current month

**Expected Results:**
- ✅ Monthly card shows correct sum
- ✅ Daily average = Monthly total / Days elapsed
- ✅ "Above Avg" badge appears when today > average

---

**Test 5.3: Top Category**

**Setup:**
- Food: Rs.500
- Transport: Rs.200
- Bills: Rs.100

**Expected Results:**
- ✅ Top category card shows "Food"
- ✅ Percentage shows "62%" (500/800 * 100)

---

**Test 5.4: Daily Pace Tracker**

**Setup:**
- Monthly spending: Rs.3000
- Days elapsed: 15
- Average: Rs.200/day
- Today's spending: Rs.250

**Expected Results:**
- ✅ "Above Avg" badge visible
- ✅ Difference shows "+Rs.50.00" in red

---

### Test Suite 6: Category Management

**Test 6.1: Add Category**

**Steps:**
1. Go to Settings
2. Scroll to Categories section
3. Tap "+ Add Category"
4. Type "Rent" in name
5. Select 🏠 emoji
6. Tap "Add Category"

**Expected Results:**
- ✅ Modal opens with bottom sheet
- ✅ Emoji grid shows 10 choices
- ✅ Save button disabled until name entered
- ✅ New category appears in list
- ✅ Category available in expense form
- ✅ Category appears in filters

---

**Test 6.2: Duplicate Category Name**

**Steps:**
1. Try to add category named "Food"

**Expected Results:**
- ✅ Alert: "Duplicate - Category 'Food' already exists"
- ✅ Category not added

---

**Test 6.3: Delete Custom Category (No Expenses)**

**Steps:**
1. Add category "Test" (no expenses)
2. Tap delete (🗑️) button
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation shows
- ✅ Category removed from list
- ✅ Category removed from filters

---

**Test 6.4: Delete Custom Category (With Expenses)**

**Steps:**
1. Add expenses to custom category
2. Try to delete category
3. Confirm deletion

**Expected Results:**
- ✅ Alert shows expense count: "This category has X expense(s)"
- ✅ Message: "Delete anyway? All expenses will be moved to 'Other' category"
- ✅ After confirm: expenses reassigned to "Other"
- ✅ Category removed

---

**Test 6.5: Try to Delete Default Category**

**Steps:**
1. Tap delete on "Food" category

**Expected Results:**
- ✅ Delete button appears grayed out
- ✅ If clicked: Alert "Cannot delete - This is a default category"
- ✅ Category remains in list

---

### Test Suite 7: Settings Screen

**Test 7.1: Navigation**

**Steps:**
1. Tap Settings icon (⚙️)
2. Verify Settings screen appears
3. Tap "← Back"
4. Verify return to home

**Expected Results:**
- ✅ Smooth transition to Settings
- ✅ Back button returns to Home
- ✅ Data preserved during navigation

---

**Test 7.2: Overlay Toggle (Expo Go)**

**Steps:**
1. Toggle "Enable Floating Button" ON

**Expected Results:**
- ✅ Alert: "Feature Not Available"
- ✅ Message explains native module required
- ✅ Toggle reverts to OFF

---

**Test 7.3: Overlay Toggle (Native Build)**

**Steps:**
1. Toggle "Enable Floating Button" ON
2. Grant permission in system settings
3. Return to app

**Expected Results:**
- ✅ Permission settings open
- ✅ After grant: green floating button appears
- ✅ Notification shows: "Expense Tracker - Quick-add button is active"
- ✅ Button visible over other apps
- ✅ Button draggable

---

### Test Suite 8: Android Overlay (Native Build Only)

**Test 8.1: Floating Button Visibility**

**Steps:**
1. Enable overlay from Settings
2. Navigate to home screen (Android)
3. Open another app

**Expected Results:**
- ✅ Floating button visible on home screen
- ✅ Button visible over other apps
- ✅ Button stays in position

---

**Test 8.2: Drag Functionality**

**Steps:**
1. Touch and hold floating button
2. Drag to different screen positions

**Expected Results:**
- ✅ Button follows finger movement
- ✅ Button doesn't disappear off screen
- ✅ Smooth dragging animation

---

**Test 8.3: Button Tap**

**Steps:**
1. Tap floating button

**Expected Results:**
- ✅ App opens to home screen (current implementation)
- ✅ No crashes

---

**Test 8.4: Disable Overlay**

**Steps:**
1. Open app Settings
2. Toggle OFF "Enable Floating Button"

**Expected Results:**
- ✅ Floating button disappears
- ✅ Notification dismissed
- ✅ Service stops

---

### Test Suite 9: Data Persistence

**Test 9.1: Data Survives App Restart**

**Steps:**
1. Add several expenses
2. Add custom category
3. Change settings
4. Close app completely (swipe from recents)
5. Reopen app

**Expected Results:**
- ✅ All expenses present
- ✅ Custom categories preserved
- ✅ Settings preserved
- ✅ KPIs calculate correctly

---

**Test 9.2: Data Migration (If Testing Upgrade)**

**Setup:** Install old version, add data, upgrade to new version

**Expected Results:**
- ✅ Old data migrated automatically
- ✅ All expenses preserved
- ✅ Categories converted correctly
- ✅ No data loss

---

### Test Suite 10: Performance

**Test 10.1: Large Dataset**

**Setup:** Add 100+ expenses

**Steps:**
1. Scroll through list
2. Filter by category
3. Add new expense
4. Delete expense

**Expected Results:**
- ✅ Smooth scrolling (no lag)
- ✅ Filter changes instant
- ✅ No memory warnings
- ✅ KPIs calculate quickly (<500ms)

---

**Test 10.2: Rapid Input**

**Steps:**
1. Quickly add 10 expenses in a row
2. Rapidly change filters

**Expected Results:**
- ✅ No crashes
- ✅ All expenses saved
- ✅ UI remains responsive

---

### Test Suite 11: Edge Cases

**Test 11.1: Empty States**

**Steps:**
1. Fresh install (no expenses)
2. Delete all expenses
3. Filter with no matching expenses

**Expected Results:**
- ✅ Empty state messages show
- ✅ No crashes
- ✅ KPIs show Rs.0.00

---

**Test 11.2: Maximum Values**

**Steps:**
1. Try amount: Rs.9999999.99
2. Try amount: Rs.10000001

**Expected Results:**
- ✅ Large amounts accepted (< 10M)
- ✅ Alert for amounts > 10M: "Amount too large"

---

**Test 11.3: Special Characters**

**Steps:**
1. Type description: "Coffee @ Shop #1"
2. Type description with emojis: "Lunch 🍕🍔"

**Expected Results:**
- ✅ Special characters accepted
- ✅ Emojis display correctly
- ✅ No encoding issues

---

## 🐛 Bug Report Template

When you find a bug, report using this format:

```
**Title:** [Brief description]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
[If applicable]

**Device Info:**
- Device: [Model]
- Android Version: [Version]
- App Version: 1.0.0
- Build Type: [Expo Go / Native]

**Additional Notes:**
Any other relevant information
```

---

## ✅ Sign-Off Criteria

Before marking testing complete, ensure:

- [ ] All test suites passed
- [ ] No critical bugs found
- [ ] No crashes during testing
- [ ] All features working as expected
- [ ] Performance acceptable (60 FPS)
- [ ] Data persistence verified
- [ ] Edge cases handled gracefully

---

**Testing Complete:** ___/___/___  
**Tested By:** __________________  
**Status:** ⬜ Pass / ⬜ Fail  
**Notes:** ________________________

