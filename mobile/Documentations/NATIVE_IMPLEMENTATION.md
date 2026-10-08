# Android Overlay Native Implementation Guide

This document provides detailed instructions for implementing the native Android code required for the floating overlay feature (Phase 6).

## Overview

The floating overlay feature requires native Android development to create:
1. A Native Module that bridges React Native to Android's WindowManager
2. A Foreground Service that manages the overlay lifecycle
3. Native UI rendering for the floating button

## Prerequisites

- Android Studio installed
- Basic knowledge of Java/Kotlin
- Expo development build environment setup

---

## Step 1: Generate Native Android Code

Run the following command to generate native Android folders:

```bash
npx expo prebuild
```

This creates `android/` folder with native project structure.

---

## Step 2: Create Native Module

Create the following file:
**`android/app/src/main/java/com/expensetracker/app/OverlayModule.java`**

```java
package com.expensetracker.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class OverlayModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "OverlayModule";
    private final ReactApplicationContext reactContext;

    public OverlayModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Check if SYSTEM_ALERT_WINDOW permission is granted
     */
    @ReactMethod
    public void checkOverlayPermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                boolean canDraw = Settings.canDrawOverlays(reactContext);
                promise.resolve(canDraw);
            } else {
                // Permission automatically granted on Android < 6.0
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Request SYSTEM_ALERT_WINDOW permission
     * Opens system settings page
     */
    @ReactMethod
    public void requestOverlayPermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(reactContext)) {
                    Intent intent = new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + reactContext.getPackageName())
                    );
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    reactContext.startActivity(intent);
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Start the overlay service
     */
    @ReactMethod
    public void startOverlayService(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                Intent serviceIntent = new Intent(activity, OverlayService.class);
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    activity.startForegroundService(serviceIntent);
                } else {
                    activity.startService(serviceIntent);
                }
                
                promise.resolve(null);
            } else {
                promise.reject("ERROR", "Activity is null");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Stop the overlay service
     */
    @ReactMethod
    public void stopOverlayService(Promise promise) {
        try {
            Activity activity = getCurrentActivity();
            if (activity != null) {
                Intent serviceIntent = new Intent(activity, OverlayService.class);
                activity.stopService(serviceIntent);
                promise.resolve(null);
            } else {
                promise.reject("ERROR", "Activity is null");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Check if overlay service is running
     */
    @ReactMethod
    public void isOverlayServiceRunning(Promise promise) {
        try {
            // Implementation: Check if service is active
            // For simplicity, always return false for now
            promise.resolve(false);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
```

---

## Step 3: Create Overlay Service

Create the following file:
**`android/app/src/main/java/com/expensetracker/app/OverlayService.java`**

```java
package com.expensetracker.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class OverlayService extends Service {
    private WindowManager windowManager;
    private View floatingView;
    private static final String CHANNEL_ID = "OverlayServiceChannel";
    private static final int NOTIFICATION_ID = 1001;

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Start as foreground service
        Notification notification = createNotification();
        startForeground(NOTIFICATION_ID, notification);

        // Create floating window
        showFloatingButton();

        return START_STICKY;
    }

    private void showFloatingButton() {
        // Inflate layout for floating button
        floatingView = LayoutInflater.from(this).inflate(
            R.layout.overlay_floating_button, 
            null
        );

        // Set up WindowManager layout parameters
        int layoutType;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        } else {
            layoutType = WindowManager.LayoutParams.TYPE_PHONE;
        }

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        );

        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 100;
        params.y = 100;

        // Get WindowManager
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        windowManager.addView(floatingView, params);

        // Set up touch listener for dragging
        setupTouchListener(floatingView, params);

        // Set up click listener
        floatingView.setOnClickListener(v -> {
            // Open expense entry UI
            openExpenseEntry();
        });
    }

    private void setupTouchListener(View view, WindowManager.LayoutParams params) {
        view.setOnTouchListener(new View.OnTouchListener() {
            private int initialX, initialY;
            private float initialTouchX, initialTouchY;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialX = params.x;
                        initialY = params.y;
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;
                        
                    case MotionEvent.ACTION_MOVE:
                        params.x = initialX + (int) (event.getRawX() - initialTouchX);
                        params.y = initialY + (int) (event.getRawY() - initialTouchY);
                        windowManager.updateViewLayout(floatingView, params);
                        return true;
                }
                return false;
            }
        });
    }

    private void openExpenseEntry() {
        // TODO: Open React Native modal or expand overlay
        // This requires communication with React Native layer
        // You can use DeviceEventEmitter to send events to React Native
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Expense Tracker Overlay",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Floating button for quick expense entry");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Expense Tracker")
            .setContentText("Quick-add button is active")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .build();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (floatingView != null && windowManager != null) {
            windowManager.removeView(floatingView);
        }
    }
}
```

---

## Step 4: Create Overlay Layout

Create the following file:
**`android/app/src/main/res/layout/overlay_floating_button.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="56dp"
    android:layout_height="56dp">

    <ImageView
        android:id="@+id/floating_button"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:background="@drawable/floating_button_bg"
        android:src="@drawable/ic_add"
        android:scaleType="center"
        android:elevation="8dp" />
</FrameLayout>
```

Create drawable background:
**`android/app/src/main/res/drawable/floating_button_bg.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <solid android:color="#10B981" />
</shape>
```

---

## Step 5: Register Module and Service

Update **`android/app/src/main/java/com/expensetracker/app/MainApplication.java`**:

```java
// Add to imports
import com.expensetracker.app.OverlayModule;
import com.expensetracker.app.OverlayPackage;

// Add to getPackages() method:
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new OverlayPackage());  // Add this line
    return packages;
}
```

Create **`OverlayPackage.java`**:

```java
package com.expensetracker.app;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class OverlayPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new OverlayModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
```

---

## Step 6: Update AndroidManifest.xml

Update **`android/app/src/main/AndroidManifest.xml`**:

```xml
<!-- Add permissions -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

<!-- Add service inside <application> tag -->
<service
    android:name=".OverlayService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="mediaProjection" />
```

---

## Step 7: Build and Run

```bash
# Build the app
npx expo run:android

# Or create APK
cd android
./gradlew assembleRelease
```

---

## Testing

1. Enable the floating button in Settings
2. Grant overlay permission when prompted
3. Return to app - floating button should appear
4. Tap button to open quick-add interface

---

## Troubleshooting

### Permission not working
- Check AndroidManifest.xml has SYSTEM_ALERT_WINDOW permission
- Verify Build.VERSION.SDK_INT >= Build.VERSION_CODES.M

### Service not starting
- Check if foreground service notification is created
- Verify service is registered in AndroidManifest.xml

### Button not showing
- Confirm Settings.canDrawOverlays() returns true
- Check WindowManager.LayoutParams type is correct for Android version

---

## Advanced: React Native Communication

To send data from overlay to React Native:

```java
// In OverlayService.java
private void sendEventToReactNative(String eventName, WritableMap params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
}

// Usage
WritableMap params = Arguments.createMap();
params.putString("categoryId", "cat-food");
params.putDouble("amount", 50.0);
sendEventToReactNative("onQuickExpenseAdd", params);
```

Then in React Native:

```typescript
import { DeviceEventEmitter } from 'react-native';

DeviceEventEmitter.addListener('onQuickExpenseAdd', (data) => {
  // Handle expense data
  console.log(data.categoryId, data.amount);
});
```

---

## Summary

This implementation provides:
- ✅ Native module for permission management
- ✅ Foreground service for persistent overlay
- ✅ Draggable floating button
- ✅ System-wide accessibility

The React Native code is already complete. Add this native code to enable the feature.
