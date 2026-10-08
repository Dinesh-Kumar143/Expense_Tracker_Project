import { registerRootComponent } from 'expo';
import { ErrorBoundary } from './src/components/ErrorBoundary';

import App from './App';

// Wrap App with ErrorBoundary
function AppWithErrorBoundary() {
    return (
        <ErrorBoundary>
        <App />
        </ErrorBoundary>
    );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(AppWithErrorBoundary);
