import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Comprehensive Logging System
 * 
 * Logs are stored in separate folders:
 * - logs/crashes/ - App crashes and errors
 * - logs/build/ - Build information and app metadata
 * - logs/user-actions/ - User interactions and events
 * - logs/performance/ - Performance metrics and monitoring
 */

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

// Log types
export enum LogType {
  CRASH = 'crashes',
  BUILD = 'build',
  USER_ACTION = 'user-actions',
  PERFORMANCE = 'performance',
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  type: LogType;
  message: string;
  data?: any;
  stack?: string;
  deviceInfo?: DeviceInfo;
}

// Device information
interface DeviceInfo {
  platform: string;
  platformVersion: string;
  appVersion: string;
  buildNumber: string;
}

class Logger {
  private static instance: Logger;
  private logsDirectory: Directory;
  private deviceInfo: DeviceInfo;
  private isInitialized: boolean = false;

  private constructor() {
    this.logsDirectory = new Directory(Paths.document, 'logs');
    this.deviceInfo = this.getDeviceInfo();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize logging system
   * Creates log directories if they don't exist
   */
  public async initialize(): Promise<void> {
    try {
      if (!this.logsDirectory.exists) {
        this.logsDirectory.create();
      }

      // Create subdirectories for each log type
      const subdirs = [
        LogType.CRASH,
        LogType.BUILD,
        LogType.USER_ACTION,
        LogType.PERFORMANCE,
      ];

      for (const subdir of subdirs) {
        const dir = new Directory(this.logsDirectory.uri, subdir);
        if (!dir.exists) {
          dir.create();
        }
      }

      this.isInitialized = true;
      console.log('Logger initialized successfully');
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  /**
   * Get device and app information
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      platformVersion: Platform.Version.toString(),
      appVersion: '1.0.0',
      buildNumber: '1',
    };
  }

  /**
   * Format timestamp for log entry
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  /**
   * Get log file name based on date
   */
  private getLogFileName(type: LogType): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${dateStr}.log`;
  }

  /**
   * Write log entry to file
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const fileName = this.getLogFileName(entry.type);
      const logDir = new Directory(this.logsDirectory.uri, entry.type);
      const logFile = new File(logDir.uri, fileName);

      // Format log entry
      const logLine = this.formatLogEntry(entry);

      // Append to file
      if (logFile.exists) {
        const existing = logFile.text();
        logFile.write(existing + '\n' + logLine);
      } else {
        logFile.create();
        logFile.write(logLine);
      }

      // Also log to console in development
      if (__DEV__) {
        this.logToConsole(entry);
      }
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  /**
   * Format log entry as string
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      entry.timestamp,
      `[${entry.level}]`,
      `[${entry.type}]`,
      entry.message,
    ];

    if (entry.data) {
      parts.push(`Data: ${JSON.stringify(entry.data)}`);
    }

    if (entry.stack) {
      parts.push(`Stack: ${entry.stack}`);
    }

    return parts.join(' | ');
  }

  /**
   * Log to console with colors (development only)
   */
  private logToConsole(entry: LogEntry): void {
    const message = `[${entry.level}] ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.log(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }

  // ============================================
  // CRASH LOGGING
  // ============================================

  /**
   * Log app crash
   */
  public async logCrash(error: Error, context?: any): Promise<void> {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.FATAL,
      type: LogType.CRASH,
      message: `App Crash: ${error.message}`,
      data: context,
      stack: error.stack,
      deviceInfo: this.deviceInfo,
    };

    await this.writeLog(entry);
  }

  /**
   * Log error
   */
  public async logError(message: string, error?: Error, data?: any): Promise<void> {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.ERROR,
      type: LogType.CRASH,
      message,
      data,
      stack: error?.stack,
      deviceInfo: this.deviceInfo,
    };

    await this.writeLog(entry);
  }

  // ============================================
  // BUILD LOGGING
  // ============================================

  /**
   * Log app startup
   */
  public async logAppStart(): Promise<void> {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.INFO,
      type: LogType.BUILD,
      message: 'App Started',
      deviceInfo: this.deviceInfo,
    };

    await this.writeLog(entry);
  }

  /**
   * Log app version info
   */
  public async logBuildInfo(buildInfo: any): Promise<void> {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.INFO,
      type: LogType.BUILD,
      message: 'Build Information',
      data: {
        ...buildInfo,
        ...this.deviceInfo,
      },
    };

    await this.writeLog(entry);
  }

  // ============================================
  // USER ACTION LOGGING
  // ============================================

  /**
   * Log user action
   */
  public async logUserAction(
    action: string,
    screen: string,
    data?: any,
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.INFO,
      type: LogType.USER_ACTION,
      message: `User Action: ${action} on ${screen}`,
      data,
    };

    await this.writeLog(entry);
  }

  /**
   * Log screen view
   */
  public async logScreenView(screenName: string): Promise<void> {
    await this.logUserAction('Screen View', screenName);
  }

  /**
   * Log button click
   */
  public async logButtonClick(buttonName: string, screen: string): Promise<void> {
    await this.logUserAction('Button Click', screen, { button: buttonName });
  }

  /**
   * Log form submission
   */
  public async logFormSubmit(
    formName: string,
    success: boolean,
    data?: any,
  ): Promise<void> {
    await this.logUserAction('Form Submit', formName, {
      success,
      ...data,
    });
  }

  // ============================================
  // PERFORMANCE LOGGING
  // ============================================

  /**
   * Log performance metric
   */
  public async logPerformance(
    metric: string,
    value: number,
    unit: string,
    context?: any,
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: LogLevel.INFO,
      type: LogType.PERFORMANCE,
      message: `Performance: ${metric}`,
      data: {
        metric,
        value,
        unit,
        ...context,
      },
    };

    await this.writeLog(entry);
  }

  /**
   * Log app render time
   */
  public async logRenderTime(
    component: string,
    duration: number,
  ): Promise<void> {
    await this.logPerformance('Render Time', duration, 'ms', { component });
  }

  /**
   * Log API call duration
   */
  public async logApiDuration(
    endpoint: string,
    duration: number,
    success: boolean,
  ): Promise<void> {
    await this.logPerformance('API Call', duration, 'ms', {
      endpoint,
      success,
    });
  }

  /**
   * Log memory usage
   */
  public async logMemoryUsage(usage: number): Promise<void> {
    await this.logPerformance('Memory Usage', usage, 'MB');
  }

  // ============================================
  // LOG MANAGEMENT
  // ============================================

  /**
   * Get all logs of a specific type
   */
  public async getLogs(type: LogType, limit?: number): Promise<string[]> {
    try {
      const logDir = new Directory(this.logsDirectory.uri, type);
      if (!logDir.exists) {
        return [];
      }

      const files = logDir.list();
      const logs: string[] = [];

      // Sort files by date (newest first)
      const sortedFiles = files.sort().reverse();
      const filesToRead = limit ? sortedFiles.slice(0, limit) : sortedFiles;

      for (const fileItem of filesToRead) {
        const fileName = typeof fileItem === 'string' ? fileItem : fileItem.name;
        const file = new File(logDir.uri, fileName);
        if (file.exists) {
          logs.push(await file.text());
        }
      }

      return logs;
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  /**
   * Clear old logs (older than X days)
   */
  public async clearOldLogs(daysToKeep: number = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      const types = [
        LogType.CRASH,
        LogType.BUILD,
        LogType.USER_ACTION,
        LogType.PERFORMANCE,
      ];

      for (const type of types) {
        const logDir = new Directory(this.logsDirectory.uri, type);
        if (!logDir.exists) continue;

        const files = logDir.list();
        for (const fileItem of files) {
          const fileName = typeof fileItem === 'string' ? fileItem : fileItem.name;
          // Extract date from filename (YYYY-MM-DD.log)
          const fileDate = fileName.replace('.log', '');
          if (fileDate < cutoffStr) {
            const file = new File(logDir.uri, fileName);
            if (file.exists) {
              file.delete();
            }
          }
        }
      }

      console.log(`Cleared logs older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Failed to clear old logs:', error);
    }
  }

  /**
   * Get log statistics
   */
  public async getLogStats(): Promise<{
    crashes: number;
    userActions: number;
    performance: number;
    totalSize: string;
  }> {
    try {
      const stats = {
        crashes: 0,
        userActions: 0,
        performance: 0,
        totalSize: '0 KB',
      };

      const types: Array<{ type: LogType; key: 'crashes' | 'userActions' | 'performance' }> = [
        { type: LogType.CRASH, key: 'crashes' },
        { type: LogType.USER_ACTION, key: 'userActions' },
        { type: LogType.PERFORMANCE, key: 'performance' },
      ];

      for (const { type, key } of types) {
        const logDir = new Directory(this.logsDirectory.uri, type);
        if (logDir.exists) {
          const files = logDir.list();
          stats[key] = files.length;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return {
        crashes: 0,
        userActions: 0,
        performance: 0,
        totalSize: '0 KB',
      };
    }
  }

  /**
   * Export logs as text
   */
  public async exportLogs(type?: LogType): Promise<string> {
    try {
      const types = type
        ? [type]
        : [LogType.CRASH, LogType.BUILD, LogType.USER_ACTION, LogType.PERFORMANCE];

      let exportText = `Expense Tracker - Log Export\n`;
      exportText += `Exported: ${new Date().toISOString()}\n`;
      exportText += `Device: ${this.deviceInfo.platform} ${this.deviceInfo.platformVersion}\n`;
      exportText += `App Version: ${this.deviceInfo.appVersion}\n`;
      exportText += `\n${'='.repeat(80)}\n\n`;

      for (const logType of types) {
        exportText += `\n### ${logType.toUpperCase()} LOGS ###\n\n`;
        const logs = await this.getLogs(logType);
        exportText += logs.join('\n\n');
        exportText += `\n\n${'='.repeat(80)}\n`;
      }

      return exportText;
    } catch (error) {
      console.error('Failed to export logs:', error);
      return 'Failed to export logs';
    }
  }
}

// Export singleton instance
export default Logger.getInstance();
