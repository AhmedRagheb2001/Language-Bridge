import React, {useState} from 'react';
import {
  NativeModules,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const {TranslationModule} = NativeModules;

function App() {
  const [status, setStatus] = useState('Not tested');
  const [details, setDetails] = useState('');

  const testModels = async () => {
    try {
      setStatus('Loading NLLB models...');
      setDetails('');

      const result = await TranslationModule.testTranslationModels();

      setStatus(result.status);
      setDetails(
        [
          `Encoder inputs: ${result.encoderInputs}`,
          `Encoder outputs: ${result.encoderOutputs}`,
          `Decoder inputs: ${result.decoderInputs}`,
          `Decoder outputs: ${result.decoderOutputs}`,
        ].join('\n'),
      );
    } catch (error: any) {
      console.error('MODEL TEST ERROR:', error);

      setStatus('FAILED');
      setDetails(
        error?.message || JSON.stringify(error),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <Text style={styles.title}>Offline Translator</Text>

        <Text style={styles.subtitle}>
          NLLB ONNX Model Test
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={testModels}>
          <Text style={styles.buttonText}>
            Test Translation Models
          </Text>
        </TouchableOpacity>

        <View style={styles.resultBox}>
          <Text style={styles.statusLabel}>Status</Text>

          <Text style={styles.status}>
            {status}
          </Text>

          {details ? (
            <Text style={styles.details}>
              {details}
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 17,
    color: '#666666',
    marginBottom: 30,
  },

  button: {
    backgroundColor: '#111111',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  resultBox: {
    marginTop: 25,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },

  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777777',
    marginBottom: 5,
  },

  status: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },

  details: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333333',
  },
});

export default App;