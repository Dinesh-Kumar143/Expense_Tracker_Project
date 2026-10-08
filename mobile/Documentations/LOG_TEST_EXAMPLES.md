# Logging System Test Examples

## Quick Test Guide

Here's how to test each log type in your expense tracker app:

---

## 1. Testing Crash Logs

### Test A: Trigger ErrorBoundary

**Add this code temporarily to any component:**

```typescript
// In App.tsx, add inside the component:
useEffect(() => {
  if (expenses.length === 0) {
    // Uncomment to test crash logging:
    // throw new Error('Test crash: Simulating component error');
  }
}, [expenses]);
```

**Expected Result:**
- ErrorBoundary catches the error
- Shows "Something went wrong" screen
- Creates log file: `logs/crashes/2026-09-21.log`

**Log Entry:**
```
2026-09-21T10:30:00.123Z | [FATAL] | [crashes] | App Crash: Test crash: Simulating component error | Data: { componentStack: "..." } | Stack: Error: Test crash...
```

---

### Test B: Failed Operation

**Just try to delete a category that has expenses:**

1. Go to Settings
2. Try to delete "Food" category (if it has expenses)
3. Confirm deletion
4. If it fails, check crash logs

**Expected Log:**
```
2026-09-21T10:35:00.000Z | [ERROR] | [crashes] | Failed to delete category | Data: { categoryId: "cat_1" }
```

---

## 2. Testing Build Logs

### Test: App Startup

**This happens automatically every time you launch the app:**

1. Close the app completely
2. Reopen the app
3. Check `logs/build/2026-09-21.log`

**Expected Logs:**
```
2026-09-21T09:00:00.000Z | [INFO] | [build] | App Started | Device: { platform: "android", platformVersion: "13", appVersion: "1.0.0" }
2026-09-21T09:00:00.100Z | [INFO] | [build] | Build Information | Data: { environment: "development", timestamp: "2026-09-21T09:00:00.100Z" }
```

---

## 3. Testing User Action Logs

### Test A: Add Expense

1. Open the app
2. Tap "+ Add" button
3. Fill in details:
   - Amount: 50
   - Description: "Coffee"
   - Category: Food
4. Tap "Save expense"

**Expected Logs (in order):**
```
2026-09-21T14:00:00.000Z | [INFO] | [user-actions] | User Action: Button Click on Home | Data: { button: "Add Expense" }
2026-09-21T14:00:10.000Z | [INFO] | [user-actions] | User Action: Form Submit on ExpenseModal | Data: { success: true, action: "add", amount: 50, category: "cat_1" }
2026-09-21T14:00:10.100Z | [INFO] | [user-actions] | User Action: Add Expense on Home | Data: { amount: 50, category: "cat_1" }
```

---

### Test B: Edit Expense

1. Tap on any expense row
2. Edit modal opens
3. Change amount to 75
4. Save

**Expected Logs:**
```
2026-09-21T14:05:00.000Z | [INFO] | [user-actions] | User Action: Edit Expense on Home | Data: { expenseId: "exp_123" }
2026-09-21T14:05:10.000Z | [INFO] | [user-actions] | User Action: Form Submit on ExpenseModal | Data: { success: true, action: "edit", amount: 75, category: "cat_1" }
2026-09-21T14:05:10.100Z | [INFO] | [user-actions] | User Action: Update Expense on Home | Data: { expenseId: "exp_123", amount: 75, category: "cat_1" }
```

---

### Test C: Delete Expense

1. Long-press or swipe an expense row
2. Tap delete button
3. Confirm deletion

**Expected Log:**
```
2026-09-21T14:10:00.000Z | [INFO] | [user-actions] | User Action: Delete Expense on Home | Data: { expenseId: "exp_123" }
```

---

### Test D: Navigate to Settings

1. Tap Settings icon (⚙️) in top right
2. Settings screen opens

**Expected Log:**
```
2026-09-21T14:15:00.000Z | [INFO] | [user-actions] | User Action: Screen View on Settings
```

---

### Test E: Add Category

1. Go to Settings
2. Tap "+ Add Category"
3. Enter name: "Gym"
4. Select emoji: 💪
5. Tap "Add Category"

**Expected Log:**
```
2026-09-21T14:20:00.000Z | [INFO] | [user-actions] | User Action: Add Category on Settings | Data: { categoryId: "cat_10", categoryName: "Gym", emoji: "💪" }
```

---

### Test F: Delete Category

1. Go to Settings
2. Tap 🗑️ on a non-default category
3. Confirm deletion

**Expected Log:**
```
2026-09-21T14:25:00.000Z | [INFO] | [user-actions] | User Action: Delete Category on Settings | Data: { categoryId: "cat_10", categoryName: "Gym", movedToCategory: "cat_other" }
```

---

### Test G: Toggle Floating Button

1. Go to Settings
2. Toggle "Enable Floating Button" switch
3. Grant permission if prompted

**Expected Logs:**
```
2026-09-21T14:30:00.000Z | [INFO] | [user-actions] | User Action: Toggle Overlay on Settings | Data: { enabled: true }
2026-09-21T14:30:05.000Z | [INFO] | [user-actions] | User Action: Overlay Enabled on Settings | Data: { success: true }
```

---

### Test H: Form Validation Failure

1. Open "+ Add" modal
2. Leave description empty
3. Enter amount: 50
4. Tap "Save"

**Expected Log:**
```
2026-09-21T14:35:00.000Z | [INFO] | [user-actions] | User Action: Form Validation Failed on ExpenseModal | Data: { reason: "missing_title" }
```

---

## 4. Testing Performance Logs

### Test A: KPI Calculation Performance

**This happens automatically when you have many expenses:**

1. Add 100+ expenses (you can import test data)
2. Navigate back to home screen
3. KPIs recalculate
4. Check `logs/performance/2026-09-21.log`

**Expected Log (if calculation takes >10ms):**
```
2026-09-21T15:00:00.000Z | [INFO] | [performance] | Performance: KPI Calculation | Data: { metric: "KPI Calculation", value: 45, unit: "ms", expenseCount: 120, categoryCount: 8 }
```

---

### Test B: Save Operation Performance

**This happens automatically every time you save:**

1. Add a new expense
2. Check performance logs

**Expected Log:**
```
2026-09-21T15:05:00.000Z | [INFO] | [performance] | Performance: Save Expense | Data: { metric: "Save Expense", value: 120, unit: "ms", operation: "add" }
```

---

## Complete Test Sequence

To test all log types in one session:

```
1. ✅ Open app → BUILD logs created
2. ✅ Add expense → USER ACTION + PERFORMANCE logs
3. ✅ Edit expense → USER ACTION + PERFORMANCE logs
4. ✅ Delete expense → USER ACTION logs
5. ✅ Go to Settings → USER ACTION logs
6. ✅ Add category → USER ACTION logs
7. ✅ Delete category → USER ACTION logs
8. ✅ Toggle overlay → USER ACTION logs
9. ✅ Try invalid form → USER ACTION logs (validation failure)
10. ✅ Trigger crash (optional) → CRASH logs
```

---

## Viewing Logs on Device

### Android (via adb)

```bash
# Connect device
adb devices

# Navigate to logs directory
adb shell
cd /data/data/com.expensetracker.app/files/logs/

# List log folders
ls -la

# View crash logs
cat crashes/2026-09-21.log

# View user action logs
cat user-actions/2026-09-21.log

# View performance logs
cat performance/2026-09-21.log

# View build logs
cat build/2026-09-21.log

# Pull all logs to computer
exit
adb pull /data/data/com.expensetracker.app/files/logs/ ./device_logs/
```

### iOS (via Xcode or Finder)

1. Connect device to Mac
2. Open Xcode → Window → Devices and Simulators
3. Select your device
4. Find app container → Download Container
5. Navigate to: `AppData/Documents/logs/`

---

## Expected File Structure After Testing

```
logs/
├── crashes/
│   └── 2026-09-21.log       (if crash was triggered)
├── build/
│   └── 2026-09-21.log       (app startup events)
├── user-actions/
│   └── 2026-09-21.log       (10+ entries from all tests)
└── performance/
    └── 2026-09-21.log       (2+ entries from save operations)
```

---

## Automated Test Script

For automated testing, you can create a test function:

```typescript
// Add to App.tsx for testing only
async function runLogTests() {
  console.log('Starting log tests...');

  // Test 1: User actions
  await Logger.logButtonClick('Test Button', 'TestScreen');
  await Logger.logScreenView('TestScreen');
  await Logger.logUserAction('Test Action', 'TestScreen', { test: true });

  // Test 2: Performance
  await Logger.logPerformance('Test Metric', 150, 'ms', { test: true });
  await Logger.logRenderTime('TestComponent', 50);

  // Test 3: Build info
  await Logger.logBuildInfo({ test: true, timestamp: new Date().toISOString() });

  // Test 4: Errors
  await Logger.logError('Test Error', new Error('Test error message'), { test: true });

  console.log('Log tests complete! Check logs/ directory.');

  // Test 5: Get stats
  const stats = await Logger.getLogStats();
  console.log('Log stats:', stats);

  // Test 6: Export logs
  const exported = await Logger.exportLogs();
  console.log('Exported logs length:', exported.length);
}

// Call this in useEffect for testing:
// useEffect(() => {
//   runLogTests();
// }, []);
```

---

## Troubleshooting

### Problem: No logs appearing

**Solution:**
1. Check if Logger.initialize() is called in App.tsx
2. Verify app has storage permissions
3. Check console for any Logger errors

### Problem: Logs not on device

**Solution:**
1. Logs are stored in app's private directory
2. Use adb (Android) or Xcode (iOS) to access
3. Or implement export feature in Settings

### Problem: Too many logs

**Solution:**
```typescript
// Clear logs older than 1 day
await Logger.clearOldLogs(1);

// Or clear all logs manually:
// Delete logs/ directory from device
```

---

## Next Steps

After testing, you can:

1. **Add Export Feature**: Create a button in Settings to export logs via email/share
2. **Add Log Viewer**: Build an in-app log viewer screen
3. **Enable Analytics**: Parse logs to show usage statistics
4. **Cloud Backup**: Optionally sync logs to cloud storage

---

## Summary

✅ **4 log types** tested  
✅ **10+ user actions** logged  
✅ **Performance metrics** captured  
✅ **Error handling** verified  
✅ **All logs organized by date**  

Your logging system is now fully integrated and ready to help you debug issues and understand user behavior!
