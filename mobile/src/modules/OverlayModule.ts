import { Alert, Linking, NativeModules, Platform } from 'react-native';

/**
 * Native Module Interface for Android Overlay Service
 * 
 * IMPLEMENTATION NOTE:
 * This module provides the JavaScript interface for the native Android overlay.
 * The actual native implementation needs to be added in:
 * - android/app/src/main/java/com/expensetracker/app/OverlayModule.java
 * - android/app/src/main/java/com/expensetracker/app/OverlayService.java
 * 
 * See NATIVE_IMPLEMENTATION.md for detailed native code requirements.
 */

// Type definitions for the native module
interface OverlayModuleInterface {
  /**
   * Check if SYSTEM_ALERT_WINDOW permission is granted
   * @returns Promise<boolean> - true if permission granted
   */
  checkOverlayPermission(): Promise<boolean>;

  /**
   * Request SYSTEM_ALERT_WINDOW permission
   * Opens system settings on Android 6.0+
   */
  requestOverlayPermission(): Promise<void>;

  /**
   * Start the overlay service (shows floating button)
   */
  startOverlayService(): Promise<void>;

  /**
   * Stop the overlay service (hides floating button)
   */
  stopOverlayService(): Promise<void>;

  /**
   * Check if overlay service is currently running
   * @returns Promise<boolean> - true if service is running
   */
  isOverlayServiceRunning(): Promise<boolean>;
}

// Get the native module (will be null until native code is implemented)
const NativeOverlayModule = NativeModules.OverlayModule as OverlayModuleInterface | undefined;

/**
 * Overlay Module Wrapper
 * Provides graceful fallback when native module is not implemented
 */
class OverlayModule {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = Platform.OS === 'android' && !!NativeOverlayModule;
  }

  /**
   * Check if the overlay module is available (native code implemented)
   */
  isModuleAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Check if overlay permission is granted
   */
  async checkOverlayPermission(): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('OverlayModule: Native module not available');
      return false;
    }

    try {
      return await NativeOverlayModule!.checkOverlayPermission();
    } catch (error) {
      console.error('OverlayModule: Error checking permission', error);
      return false;
    }
  }

  /**
   * Request overlay permission
   * On Android 6.0+, this opens system settings
   */
  async requestOverlayPermission(): Promise<boolean> {
    if (!this.isAvailable) {
      this.showNotAvailableAlert();
      return false;
    }

    try {
      await NativeOverlayModule!.requestOverlayPermission();
      
      // Show instruction to user
      Alert.alert(
        'Permission Required',
        'Please enable "Display over other apps" permission in the system settings that just opened, then return to the app.',
        [{ text: 'OK' }],
      );

      return true;
    } catch (error) {
      console.error('OverlayModule: Error requesting permission', error);
      Alert.alert(
        'Error',
        'Could not open permission settings. Please enable "Display over other apps" manually in Settings.',
      );
      return false;
    }
  }

  /**
   * Start the overlay service
   */
  async startOverlayService(): Promise<boolean> {
    if (!this.isAvailable) {
      this.showNotAvailableAlert();
      return false;
    }

    try {
      // First check permission
      const hasPermission = await this.checkOverlayPermission();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Overlay permission is required to show the floating button.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Grant Permission', 
              onPress: () => this.requestOverlayPermission() 
            },
          ],
        );
        return false;
      }

      await NativeOverlayModule!.startOverlayService();
      return true;
    } catch (error) {
      console.error('OverlayModule: Error starting service', error);
      Alert.alert('Error', 'Could not start overlay service.');
      return false;
    }
  }

  /**
   * Stop the overlay service
   */
  async stopOverlayService(): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    try {
      await NativeOverlayModule!.stopOverlayService();
      return true;
    } catch (error) {
      console.error('OverlayModule: Error stopping service', error);
      return false;
    }
  }

  /**
   * Check if overlay service is running
   */
  async isOverlayServiceRunning(): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    try {
      return await NativeOverlayModule!.isOverlayServiceRunning();
    } catch (error) {
      console.error('OverlayModule: Error checking service status', error);
      return false;
    }
  }

  /**
   * Show alert when native module is not available
   */
  private showNotAvailableAlert(): void {
    Alert.alert(
      'Feature Not Available',
      'The floating button feature requires native Android code to be implemented. ' +
      'Please run "expo prebuild" and add the native overlay module.\n\n' +
      'See NATIVE_IMPLEMENTATION.md for instructions.',
      [{ text: 'OK' }],
    );
  }

  /**
   * Open app system settings
   */
  async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('OverlayModule: Error opening settings', error);
    }
  }
}

// Export singleton instance
export default new OverlayModule();
