/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notificationService from './android/app/src/services/notificationService';

// Register background handler
notificationService.setupBackgroundHandler();

AppRegistry.registerComponent(appName, () => App);
