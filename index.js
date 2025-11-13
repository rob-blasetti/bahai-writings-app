/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './src/app/App';
import { name as appName } from './app.json';
import './config';

AppRegistry.registerComponent(appName, () => App);
