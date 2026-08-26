import React, {useEffect, useRef, useState} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  translateOffline,
  SupportedLanguage,
} from '../services/translationService';

const LANGUAGES: SupportedLanguage[] = [
  'English',
  'Turkish',
  'Arabic',
  'French',
  'Spanish',
];

const LANGUAGE_LOCALES: Record<
  SupportedLanguage,
  string
> = {
  English: 'en-US',
  Turkish: 'tr-TR',
  Arabic: 'ar-SA',
  French: 'fr-FR',
  Spanish: 'es-ES',
};

const {
  SpeechRecognitionModule,
} = NativeModules;

type SpeechRecognitionEvent = {
  text?: string;
  errorCode?: number;
};

function TranslatorScreen() {
  const [sourceLanguage, setSourceLanguage] =
    useState<SupportedLanguage>('English');

  const [targetLanguage, setTargetLanguage] =
    useState<SupportedLanguage>('Turkish');

  const [inputText, setInputText] =
    useState('');

  const [translatedText, setTranslatedText] =
    useState('');

  const [isTranslating, setIsTranslating] =
    useState(false);

  const [isListening, setIsListening] =
    useState(false);

  const [speechAvailable, setSpeechAvailable] =
    useState<boolean | null>(null);

  const partialListener =
    useRef<any>(null);

  const resultListener =
    useRef<any>(null);

  const errorListener =
    useRef<any>(null);

  const endListener =
    useRef<any>(null);

  const checkSpeechAvailability =
    async () => {
      try {
        if (!SpeechRecognitionModule) {
          setSpeechAvailable(false);
          return;
        }

        const available =
          await SpeechRecognitionModule.isAvailable();

        setSpeechAvailable(
          Boolean(available),
        );

        console.log(
          'On-device speech recognition available:',
          available,
        );
      } catch (error) {
        console.error(
          'Speech availability check failed:',
          error,
        );

        setSpeechAvailable(false);
      }
    };

  useEffect(() => {
    if (!SpeechRecognitionModule) {
      console.warn(
        'SpeechRecognitionModule is not available.',
      );

      setSpeechAvailable(false);

      return;
    }

    const emitter =
      new NativeEventEmitter(
        SpeechRecognitionModule,
      );

    partialListener.current =
      emitter.addListener(
        'SpeechRecognitionPartial',
        (event: SpeechRecognitionEvent) => {
          if (event?.text) {
            setInputText(event.text);
          }
        },
      );

    resultListener.current =
      emitter.addListener(
        'SpeechRecognitionResult',
        (event: SpeechRecognitionEvent) => {
          if (event?.text) {
            setInputText(event.text);
          }
        },
      );

    errorListener.current =
      emitter.addListener(
        'SpeechRecognitionError',
        (event: SpeechRecognitionEvent) => {
          console.warn(
            'Speech recognition error:',
            event,
          );
        },
      );

    endListener.current =
      emitter.addListener(
        'SpeechRecognitionEnd',
        () => {
          setIsListening(false);
        },
      );

    checkSpeechAvailability();

    return () => {
      partialListener.current?.remove();
      resultListener.current?.remove();
      errorListener.current?.remove();
      endListener.current?.remove();

      try {
        SpeechRecognitionModule?.destroy();
      } catch (error) {
        console.warn(
          'Speech recognizer cleanup error:',
          error,
        );
      }
    };
  }, []);

  const requestMicrophonePermission =
    async (): Promise<boolean> => {
      if (Platform.OS !== 'android') {
        return true;
      }

      if (Platform.Version < 23) {
        return true;
      }

      const result =
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title:
              'Microphone Permission',
            message:
              'Offline Translator needs access to your microphone for speech-to-text.',
            buttonPositive:
              'Allow',
            buttonNegative:
              'Deny',
          },
        );

      return (
        result ===
        PermissionsAndroid.RESULTS.GRANTED
      );
    };

  const handleMicrophone =
    async () => {
      if (!SpeechRecognitionModule) {
        console.warn(
          'SpeechRecognitionModule is not available. Rebuild the Android app.',
        );

        return;
      }

      if (isListening) {
        try {
          await SpeechRecognitionModule.stopListening();
        } catch (error) {
          console.error(
            'Failed to stop speech recognition:',
            error,
          );
        }

        setIsListening(false);

        return;
      }

      const permissionGranted =
        await requestMicrophonePermission();

      if (!permissionGranted) {
        console.warn(
          'Microphone permission denied.',
        );

        return;
      }

      try {
        const available =
          await SpeechRecognitionModule.isAvailable();

        if (!available) {
          console.warn(
            'On-device speech recognition is not available on this device.',
          );

          setSpeechAvailable(false);

          return;
        }

        setInputText('');
        setTranslatedText('');
        setSpeechAvailable(true);
        setIsListening(true);

        const locale =
          LANGUAGE_LOCALES[
            sourceLanguage
          ];

        console.log(
          'Starting speech recognition:',
          locale,
        );

        await SpeechRecognitionModule.startListening(
          locale,
        );
      } catch (error) {
        console.error(
          'Failed to start speech recognition:',
          error,
        );

        setIsListening(false);
      }
    };

  const handleTranslate =
    async () => {
      if (!inputText.trim()) {
        setTranslatedText('');
        return;
      }

      try {
        setIsTranslating(true);

        const result =
          await translateOffline(
            inputText,
            sourceLanguage,
            targetLanguage,
          );

        setTranslatedText(result);
      } catch (error) {
        console.error(
          'Translation error:',
          error,
        );

        setTranslatedText(
          'Translation failed.',
        );
      } finally {
        setIsTranslating(false);
      }
    };

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }>

      <Text style={styles.title}>
        Offline Translator
      </Text>

      <View style={styles.offlineBadge}>
        <View style={styles.dot} />

        <Text style={styles.offlineText}>
          Offline Mode
        </Text>
      </View>

      <Text style={styles.label}>
        From
      </Text>

      <View
        style={
          styles.languageContainer
        }>

        {LANGUAGES.map(
          language => (
            <TouchableOpacity
              key={language}
              style={[
                styles.languageButton,
                sourceLanguage ===
                  language &&
                  styles.selectedLanguage,
              ]}
              onPress={() =>
                setSourceLanguage(
                  language,
                )}>

              <Text
                style={[
                  styles.languageText,
                  sourceLanguage ===
                    language &&
                    styles.selectedLanguageText,
                ]}>

                {language}

              </Text>

            </TouchableOpacity>
          ),
        )}

      </View>

      <Text style={styles.label}>
        To
      </Text>

      <View
        style={
          styles.languageContainer
        }>

        {LANGUAGES.map(
          language => (
            <TouchableOpacity
              key={language}
              style={[
                styles.languageButton,
                targetLanguage ===
                  language &&
                  styles.selectedLanguage,
              ]}
              onPress={() =>
                setTargetLanguage(
                  language,
                )}>

              <Text
                style={[
                  styles.languageText,
                  targetLanguage ===
                    language &&
                    styles.selectedLanguageText,
                ]}>

                {language}

              </Text>

            </TouchableOpacity>
          ),
        )}

      </View>

      <View style={styles.inputHeader}>
        <Text style={styles.label}>
          Enter text
        </Text>

        <TouchableOpacity
          style={[
            styles.microphoneButton,
            isListening &&
              styles.microphoneButtonActive,
          ]}
          onPress={
            handleMicrophone
          }>

          <Text
            style={
              styles.microphoneIcon
            }>

            {isListening
              ? '■'
              : '🎤'}

          </Text>

        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder={
          isListening
            ? 'Listening...'
            : 'Type something to translate...'
        }
        placeholderTextColor="#888"
        multiline
        value={inputText}
        onChangeText={
          setInputText
        }
      />

      {isListening ? (
        <Text
          style={
            styles.listeningText
          }>
          🎙️ Listening in{' '}
          {sourceLanguage}...
        </Text>
      ) : null}

      {speechAvailable ===
      false ? (
        <Text
          style={
            styles.warningText
          }>
          On-device speech recognition
          is not available on this device.
        </Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.translateButton,
          isTranslating &&
            styles.disabledButton,
        ]}
        onPress={
          handleTranslate
        }
        disabled={
          isTranslating
        }>

        <Text
          style={
            styles.translateButtonText
          }>

          {isTranslating
            ? 'Translating...'
            : 'Translate'}

        </Text>

      </TouchableOpacity>

      {translatedText ? (
        <View
          style={
            styles.resultContainer
          }>

          <Text
            style={
              styles.resultLabel
            }>

            {targetLanguage}{' '}
            translation

          </Text>

          <Text
            style={
              styles.resultText
            }>

            {translatedText}

          </Text>

        </View>
      ) : null}

    </ScrollView>
  );
}

const styles =
  StyleSheet.create({

    container: {
      flexGrow: 1,
      padding: 20,
      backgroundColor:
        '#FFFFFF',
    },

    title: {
      fontSize: 30,
      fontWeight: '700',
      color: '#111111',
      marginTop: 20,
      marginBottom: 12,
    },

    offlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf:
        'flex-start',
      backgroundColor:
        '#E8F5E9',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      marginBottom: 25,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        '#2E7D32',
      marginRight: 7,
    },

    offlineText: {
      color: '#2E7D32',
      fontWeight: '600',
    },

    label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333333',
      marginBottom: 10,
    },

    languageContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 20,
    },

    languageButton: {
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      marginRight: 8,
      marginBottom: 8,
    },

    selectedLanguage: {
      backgroundColor:
        '#111111',
      borderColor:
        '#111111',
    },

    languageText: {
      color: '#333333',
    },

    selectedLanguageText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },

    inputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 10,
    },

    microphoneButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        '#111111',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 8,
    },

    microphoneButtonActive: {
      backgroundColor:
        '#B00020',
    },

    microphoneIcon: {
      fontSize: 22,
      color: '#FFFFFF',
    },

    input: {
      minHeight: 140,
      borderWidth: 1,
      borderColor:
        '#CCCCCC',
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      textAlignVertical:
        'top',
      color: '#111111',
      marginBottom: 8,
    },

    listeningText: {
      color: '#B00020',
      fontWeight: '600',
      marginBottom: 12,
    },

    warningText: {
      color: '#B26A00',
      fontSize: 13,
      marginBottom: 12,
    },

    translateButton: {
      backgroundColor:
        '#111111',
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
    },

    disabledButton: {
      opacity: 0.6,
    },

    translateButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '700',
    },

    resultContainer: {
      marginTop: 25,
      padding: 18,
      borderRadius: 12,
      backgroundColor:
        '#F5F5F5',
    },

    resultLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666666',
      marginBottom: 8,
    },

    resultText: {
      fontSize: 18,
      color: '#111111',
      lineHeight: 27,
    },

  });

export default TranslatorScreen;