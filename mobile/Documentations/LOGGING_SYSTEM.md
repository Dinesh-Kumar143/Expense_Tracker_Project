# Logging System Documentation

## Overview

The expense tracker app now includes a comprehensive logging system that records different types of events in separate, organized folders. All logs are stored locally on the device using the expo-file-system API.

## Log Types

The system categorizes logs into four distinct types:

### 1. **Crash Logs** (`logs/crashes/`)
Records application crashes, errors, and exceptions with full stack traces.

**Use cases:**
- App crashes caught by ErrorBoundary
- Runtime errors during operations
- Failed operations with error details

**Example entries:**
```
2026-09-21T10:15:30.123Z | [FATAL] | [crashes] | App Crash: TypeError: Cannot read property 'id' of null | Data: {...} | Stack: at Component...
2026-09-21T11:20:15.456Z | [ERROR] | [crashes] | Failed to save expense | Data: {...}
```

### 2. **Build Logs** (`logs/build/`)
Records app startup information, build metadata, and configuration details.

**Use cases:**
- App startup events
- Build version information
- Environment configuration
- Device and platform details

**Example entries:**
```
2026-09-21T09:00:00.000Z | [INFO] | [build] | App Started | Device: { platform: "android", version: "13" }
2026-09-21T09:00:01.123Z | [INFO] | [build] | Build Information | Data: { environment: "production", version: "1.0.0" }
```

### 3. **User Action Logs** (`logs/user-actions/`)
Records user interactions, button clicks, form submissions, and navigation.

**Use cases:**
- Screen views and navigation
- Button clicks
- Form submissions
- CRUD operations (add, edit, delete expenses)
- Settings changes

**Example entries:**
```
2026-09-21T14:30:00.000Z | [INFO] | [user-actions] | User Action: Button Click on Home | Data: { button: "Add Expense" }
2026-09-21T14:30:15.123Z | [INFO] | [user-actions] | User Action: Form Submit on ExpenseModal | Data: { success: true, amount: 50 }
2026-09-21T14:31:00.000Z | [INFO] | [user-actions] | User Action: Add Expense on Home | Data: { amount: 50, category: "cat_1" }
```

### 4. **Performance Logs** (`logs/performance/`)
Records performance metrics, timing data, and resource usage.

**Use cases:**
- KPI calculation duration
- Save/load operation timing
- API call durations
- Memory usage tracking
- Render performance

**Example entries:**
```
2026-09-21T15:00:00.000Z | [INFO] | [performance] | Performance: KPI Calculation | Data: { metric: "KPI Calculation", value: 45, unit: "ms", expenseCount: 100 }
2026-09-21T15:00:05.123Z | [INFO] | [performance] | Performance: Save Expense | Data: { metric: "Save Expense", value: 120, unit: "ms", operation: "add" }
```

## Directory Structure

```
logs/
├── crashes/
│   ├── 2026-09-21.log
│   ├── 2026-09-22.log
│   └── 2026-09-23.log
├── build/
│   ├── 2026-09-21.log
│   └── 2026-09-22.log
├── user-actions/
│   ├── 2026-09-21.log
│   ├── 2026-09-22.log
│   └── 2026-09-23.log
└── performance/
    ├── 2026-09-21.log
    ├── 2026-09-22.log
    └── 2026-09-23.log
```

Each log file is named with the date in ISO format (`YYYY-MM-DD.log`). Logs for each day are appended to the same file.

## Log Entry Format

Each log entry follows this structure:

```
[TIMESTAMP] | [LEVEL] | [TYPE] | [MESSAGE] | Data: {...} | Stack: {...}
```

**Components:**
- **TIMESTAMP**: ISO 8601 format (e.g., `2026-09-21T14:30:00.123Z`)
- **LEVEL**: Log level (DEBUG, INFO, WARN, ERROR, FATAL)
- **TYPE**: Log type (crashes, build, user-actions, performance)
- **MESSAGE**: Human-readable description
- **Data**: Optional JSON data payload
- **Stack**: Optional stack trace (for errors)

## Integration Points

The logging system is integrated into the following components:

### App.tsx
- **App startup**: Logs when the app initializes
- **Screen navigation**: Logs screen views
- **Expense operations**: Logs add, edit, delete operations
- **Performance**: Tracks save operation duration

### ErrorBoundary.tsx
- **Crash logging**: Logs any React component crashes with full context

### ExpenseModal.tsx
- **Form submissions**: Logs successful saves and validation failures
- **User interactions**: Tracks form field changes

### SettingsScreen.tsx
- **Category management**: Logs add/delete category operations
- **Settings changes**: Logs overlay toggle, permission requests

### kpi.ts
- **Performance monitoring**: Tracks KPI calculation duration (if > 10ms)

## API Reference

### Logger Methods

#### Crash Logging
```typescript
// Log a fatal crash
Logger.logCrash(error: Error, context?: any): Promise<void>

// Log an error
Logger.logError(message: string, error?: Error, data?: any): Promise<void>
```

#### Build Logging
```typescript
// Log app startup
Logger.logAppStart(): Promise<void>

// Log build information
Logger.logBuildInfo(buildInfo: any): Promise<void>
```

#### User Action Logging
```typescript
// Generic user action
Logger.logUserAction(action: string, screen: string, data?: any): Promise<void>

// Screen view
Logger.logScreenView(screenName: string): Promise<void>

// Button click
Logger.logButtonClick(buttonName: string, screen: string): Promise<void>

// Form submission
Logger.logFormSubmit(formName: string, success: boolean, data?: any): Promise<void>
```

#### Performance Logging
```typescript
// Generic performance metric
Logger.logPerformance(metric: string, value: number, unit: string, context?: any): Promise<void>

// Render time
Logger.logRenderTime(component: string, duration: number): Promise<void>

// API duration
Logger.logApiDuration(endpoint: string, duration: number, success: boolean): Promise<void>

// Memory usage
Logger.logMemoryUsage(usage: number): Promise<void>
```

#### Log Management
```typescript
// Get logs of a specific type
Logger.getLogs(type: LogType, limit?: number): Promise<string[]>

// Clear old logs (default: 7 days)
Logger.clearOldLogs(daysToKeep?: number): Promise<void>

// Get log statistics
Logger.getLogStats(): Promise<{
  crashes: number;
  userActions: number;
  performance: number;
  totalSize: string;
}>

// Export all logs as text
Logger.exportLogs(type?: LogType): Promise<string>
```

## Usage Examples

### Example 1: Log a button click
```typescript
import Logger from './src/logging/Logger';

function handleButtonClick() {
  Logger.logButtonClick('Save', 'SettingsScreen');
  // ... rest of the logic
}
```

### Example 2: Log an operation with timing
```typescript
async function saveData(data: any) {
  const startTime = Date.now();
  
  try {
    await performSave(data);
    
    const duration = Date.now() - startTime;
    Logger.logPerformance('Data Save', duration, 'ms', { dataSize: data.length });
  } catch (error) {
    Logger.logError('Save failed', error as Error, { data });
  }
}
```

### Example 3: Log a user action
```typescript
async function deleteExpense(id: string) {
  try {
    await performDelete(id);
    Logger.logUserAction('Delete Expense', 'Home', { expenseId: id });
  } catch (error) {
    Logger.logError('Delete failed', error as Error, { expenseId: id });
  }
}
```

## Log Retention & Cleanup

By default, logs older than **7 days** are automatically retained. You can configure this by calling:

```typescript
// Keep logs for 30 days
Logger.clearOldLogs(30);

// Keep logs for 1 day (aggressive cleanup)
Logger.clearOldLogs(1);
```

## Viewing Logs

### During Development

In development mode (`__DEV__ === true`), all logs are also output to the console with appropriate log levels:

- **DEBUG** → `console.log()`
- **INFO** → `console.info()`
- **WARN** → `console.warn()`
- **ERROR/FATAL** → `console.error()`

### On Device

Logs are stored in the app's document directory:

**Android**: `/data/data/com.yourpackage.app/files/logs/`
**iOS**: `<app-sandbox>/Documents/logs/`

### Exporting Logs

To export logs for debugging or support:

```typescript
const allLogs = await Logger.exportLogs();
console.log(allLogs);

// Or export specific type
const crashLogs = await Logger.exportLogs(LogType.CRASH);
```

You can add a "Export Logs" feature in the Settings screen to email or share logs.

## Privacy & Security

- **All logs are stored locally** on the device
- **No logs are sent to external servers** automatically
- **User data** (amounts, descriptions) is logged for debugging
- **Sensitive data** (passwords, tokens) should never be logged

## Performance Impact

The logging system is designed to have minimal performance impact:

- All write operations are **asynchronous** (non-blocking)
- Logs are written only when actions occur (no polling)
- Performance logging only triggers for slow operations (>10ms for KPIs)
- File I/O uses expo-file-system's optimized native modules

## Troubleshooting

### Logs not appearing

1. **Check initialization**: Ensure `Logger.initialize()` is called in `App.tsx`
2. **Check permissions**: Ensure the app has storage permissions
3. **Check directory**: Verify `logs/` folder exists in document directory

### Performance issues

1. **Reduce log verbosity**: Comment out verbose user action logs
2. **Increase cleanup frequency**: Call `clearOldLogs(1)` to keep only 1 day of logs
3. **Disable in production**: Wrap logging calls in `if (__DEV__)` for development-only logging

### Large log files

1. **Enable auto-cleanup**: Call `Logger.clearOldLogs(7)` periodically
2. **Limit log size**: Modify Logger.ts to truncate long messages
3. **Export and clear**: Regularly export logs and delete old files

## Future Enhancements

Potential improvements for the logging system:

1. **Log rotation**: Automatically split large log files
2. **Compression**: Compress old log files to save space
3. **Cloud sync**: Optional cloud backup for logs
4. **Log viewer UI**: Built-in screen to browse logs
5. **Filtering**: Query logs by date range, level, or keyword
6. **Analytics**: Aggregate user action data for insights
7. **Crash reporting**: Auto-submit crash logs to a service

## Testing

To test the logging system:

1. **Trigger a crash**: Add `throw new Error('Test crash')` in a component
2. **Check crash logs**: Verify error appears in `logs/crashes/YYYY-MM-DD.log`
3. **Perform user actions**: Add/edit/delete expenses
4. **Check user logs**: Verify actions in `logs/user-actions/YYYY-MM-DD.log`
5. **Check performance**: Add many expenses, check KPI calculation time in `logs/performance/`

## Summary

The logging system provides comprehensive tracking of app behavior across four dimensions:

✅ **Crashes** - Debug errors and exceptions  
✅ **Build** - Track app lifecycle and configuration  
✅ **User Actions** - Understand user behavior  
✅ **Performance** - Optimize slow operations  

All logs are organized by date and type, making it easy to diagnose issues and analyze app usage patterns.
