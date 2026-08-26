import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import TranslatorScreen from './screens/TranslatorScreen';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <TranslatorScreen />
    </SafeAreaProvider>
  );
}

export default App;
