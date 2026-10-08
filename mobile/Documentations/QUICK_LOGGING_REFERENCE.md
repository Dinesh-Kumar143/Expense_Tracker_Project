# Quick Logging Reference

## 📁 Log Folder Structure

```
logs/
├── crashes/          # App errors and exceptions
├── build/            # App startup and version info
├── user-actions/     # User interactions and events
└── performance/      # Timing and performance metrics
```

## 🚀 Quick Start

```typescript
import Logger from './src/logging/Logger';

// Initialize (done automatically in App.tsx)
await Logger.initialize();

// Log app start (done automatically in App.tsx)
await Logger.logAppStart();
```

## 📝 Most Common Logging Patterns

### 1. Log User Action
```typescript
Logger.logUserAction('Button Click', 'Home', { button: 'Add' });
Logger.logUserAction('Delete Item', 'Home', { itemId: '123' });
```

### 2. Log Screen Navigation
```typescript
Logger.logScreenView('Settings');
Logger.logScreenView('Details');
```

### 3. Log Form Submission
```typescript
Logger.logFormSubmit('ExpenseForm', true, { amount: 50 });
Logger.logFormSubmit('CategoryForm', false, { error: 'duplicate' });
```

### 4. Log Performance
```typescript
const start = Date.now();
// ... do work ...
const duration = Date.now() - start;
Logger.logPerformance('Data Save', duration, 'ms', { itemCount: 10 });
```

### 5. Log Errors
```typescript
try {
  // ... operation ...
} catch (error) {
  Logger.logError('Operation failed', error as Error, { context: 'data' });
}
```

### 6. Log Crash
```typescript
// In ErrorBoundary
Logger.logCrash(error, { componentStack: errorInfo.componentStack });
```

## 🔍 Where Logging is Already Integrated

| Component | What's Logged |
|-----------|---------------|
| **App.tsx** | App start, screen views, expense CRUD, save performance |
| **ErrorBoundary.tsx** | All crashes with stack traces |
| **ExpenseModal.tsx** | Form submissions, validation failures |
| **SettingsScreen.tsx** | Category CRUD, overlay toggle, permissions |
| **kpi.ts** | KPI calculation performance (if >10ms) |

## 📊 Log File Naming

Files are named by date: `YYYY-MM-DD.log`

Example:
- `logs/crashes/2026-09-21.log`
- `logs/user-actions/2026-09-21.log`

## 🧹 Log Management

```typescript
// Get all crash logs
const crashes = await Logger.getLogs(LogType.CRASH);

// Clear logs older than 7 days (default)
await Logger.clearOldLogs(7);

// Get log statistics
const stats = await Logger.getLogStats();
// Returns: { crashes: 2, userActions: 150, performance: 30 }

// Export all logs as text
const allLogs = await Logger.exportLogs();
const crashLogsOnly = await Logger.exportLogs(LogType.CRASH);
```

## 🎯 Log Levels

| Level | Use Case |
|-------|----------|
| **DEBUG** | Detailed debug info (development only) |
| **INFO** | General information (user actions, performance) |
| **WARN** | Warning messages (non-critical issues) |
| **ERROR** | Error conditions (failed operations) |
| **FATAL** | Critical failures (app crashes) |

## 📱 Accessing Logs on Device

### Android
```bash
adb shell
cd /data/data/com.expensetracker.app/files/logs/
ls -la
cat user-actions/2026-09-21.log
```

### iOS
Use Xcode → Devices → Download Container → Documents/logs/

## 🧪 Testing Logs

1. **Open app** → Check `build/` logs
2. **Add expense** → Check `user-actions/` and `performance/`
3. **Trigger error** → Check `crashes/`
4. **View Settings** → Check `user-actions/`

## 💡 Pro Tips

1. **Development vs Production**
   - Logs show in console during development (`__DEV__`)
   - Silent in production (only written to files)

2. **Performance Impact**
   - All logging is async (non-blocking)
   - Minimal overhead (microseconds per log)

3. **Privacy**
   - All logs stored locally
   - No data sent to external servers
   - Export manually if needed

4. **Log Rotation**
   - One file per day
   - Auto-cleanup after 7 days
   - Configure with `clearOldLogs(days)`

## 🛠️ Common Patterns

### Pattern 1: Timed Operation
```typescript
async function saveData(data: any) {
  const start = Date.now();
  try {
    await performSave(data);
    Logger.logPerformance('Save', Date.now() - start, 'ms');
    Logger.logUserAction('Save Success', 'Screen');
  } catch (error) {
    Logger.logError('Save failed', error, { data });
  }
}
```

### Pattern 2: User Flow Tracking
```typescript
function navigateToDetails(id: string) {
  Logger.logUserAction('Navigate', 'Home', { destination: 'Details', id });
  navigation.navigate('Details', { id });
}
```

### Pattern 3: Form Validation
```typescript
function validateForm(data: FormData) {
  if (!data.title) {
    Logger.logUserAction('Validation Failed', 'Form', { field: 'title' });
    return false;
  }
  Logger.logFormSubmit('ExpenseForm', true, { fields: Object.keys(data) });
  return true;
}
```

## 📖 Full Documentation

- **Comprehensive Guide**: See `LOGGING_SYSTEM.md`
- **Test Examples**: See `LOG_TEST_EXAMPLES.md`
- **Source Code**: See `src/logging/Logger.ts`

## 🆘 Troubleshooting

**Problem**: Logs not appearing  
**Solution**: Check `Logger.initialize()` is called in App.tsx

**Problem**: Too many logs  
**Solution**: Call `Logger.clearOldLogs(1)` to keep only 1 day

**Problem**: Can't find logs  
**Solution**: Use adb or Xcode to access app's document directory

---

## ✅ Checklist

- [x] Logger integrated in App.tsx
- [x] Logger integrated in ErrorBoundary.tsx
- [x] Logger integrated in ExpenseModal.tsx
- [x] Logger integrated in SettingsScreen.tsx
- [x] Logger integrated in kpi.ts
- [x] TypeScript compiles without errors
- [x] 4 log types (crashes, build, user-actions, performance)
- [x] Logs organized in separate folders
- [x] Date-based log files (YYYY-MM-DD.log)
- [x] Auto-cleanup after 7 days
- [x] Export functionality available

---

**You're all set!** 🎉 

Your expense tracker now has comprehensive logging across all 4 categories.
