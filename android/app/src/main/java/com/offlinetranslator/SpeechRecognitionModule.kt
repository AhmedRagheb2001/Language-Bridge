package com.offlinetranslator

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognitionModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val MODULE_NAME =
            "SpeechRecognitionModule"

        private const val EVENT_PARTIAL =
            "SpeechRecognitionPartial"

        private const val EVENT_RESULT =
            "SpeechRecognitionResult"

        private const val EVENT_ERROR =
            "SpeechRecognitionError"

        private const val EVENT_END =
            "SpeechRecognitionEnd"
    }

    private val mainHandler =
        Handler(Looper.getMainLooper())

    private var speechRecognizer:
        SpeechRecognizer? = null

    private var currentLocale =
        "en-US"

    override fun getName(): String {
        return MODULE_NAME
    }

    // ============================================================
    // REACT NATIVE EVENT LISTENER SUPPORT
    // ============================================================

    @ReactMethod
    fun addListener(
        eventName: String
    ) {
        // Required by NativeEventEmitter.
    }

    @ReactMethod
    fun removeListeners(
        count: Int
    ) {
        // Required by NativeEventEmitter.
    }

    // ============================================================
    // EVENT EMITTER
    // ============================================================

    private fun emitEvent(
        eventName: String,
        text: String? = null,
        errorCode: Int? = null
    ) {

        val params =
            Arguments.createMap()

        if (text != null) {
            params.putString(
                "text",
                text
            )
        }

        if (errorCode != null) {
            params.putInt(
                "errorCode",
                errorCode
            )
        }

        reactContext
            .getJSModule(
                DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
            )
            .emit(
                eventName,
                params
            )
    }

    // ============================================================
    // SPEECH RECOGNITION LISTENER
    // ============================================================

    private val recognitionListener =
        object : RecognitionListener {

            override fun onReadyForSpeech(
                params: Bundle?
            ) {

                android.util.Log.d(
                    MODULE_NAME,
                    "Speech recognition ready."
                )
            }

            override fun onBeginningOfSpeech() {

                android.util.Log.d(
                    MODULE_NAME,
                    "Speech detected."
                )
            }

            override fun onRmsChanged(
                rmsdB: Float
            ) {
                // Not needed.
            }

            override fun onBufferReceived(
                buffer: ByteArray?
            ) {
                // Not needed.
            }

            override fun onEndOfSpeech() {

                android.util.Log.d(
                    MODULE_NAME,
                    "End of speech."
                )
            }

            override fun onError(
                error: Int
            ) {

                android.util.Log.e(
                    MODULE_NAME,
                    "Speech recognition error: $error"
                )

                emitEvent(
                    EVENT_ERROR,
                    errorCode = error
                )

                emitEvent(
                    EVENT_END
                )
            }

            override fun onResults(
                results: Bundle?
            ) {

                val matches =
                    results?.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION
                    )

                val text =
                    matches
                        ?.firstOrNull()
                        ?: ""

                android.util.Log.d(
                    MODULE_NAME,
                    "Speech recognition result: $text"
                )

                if (text.isNotBlank()) {

                    emitEvent(
                        EVENT_RESULT,
                        text = text
                    )
                }

                emitEvent(
                    EVENT_END
                )
            }

            override fun onPartialResults(
                partialResults: Bundle?
            ) {

                val matches =
                    partialResults?.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION
                    )

                val text =
                    matches
                        ?.firstOrNull()
                        ?: ""

                if (text.isNotBlank()) {

                    android.util.Log.d(
                        MODULE_NAME,
                        "Speech partial result: $text"
                    )

                    emitEvent(
                        EVENT_PARTIAL,
                        text = text
                    )
                }
            }

            override fun onEvent(
                eventType: Int,
                params: Bundle?
            ) {
                // Not needed.
            }
        }

    // ============================================================
    // AVAILABILITY
    // ============================================================

    @ReactMethod
    fun isAvailable(
        promise: Promise
    ) {

        try {

            val available =
                SpeechRecognizer.isRecognitionAvailable(
                    reactContext
                )

            android.util.Log.d(
                MODULE_NAME,
                "Speech recognition available: $available"
            )

            promise.resolve(
                available
            )

        } catch (e: Exception) {

            android.util.Log.e(
                MODULE_NAME,
                "Failed to check speech recognition availability.",
                e
            )

            promise.resolve(
                false
            )
        }
    }

    // ============================================================
    // START LISTENING
    // ============================================================

    @ReactMethod
    fun startListening(
        locale: String,
        promise: Promise
    ) {

        currentLocale =
            if (locale.isBlank()) {
                "en-US"
            } else {
                locale
            }

        android.util.Log.d(
            MODULE_NAME,
            "Requesting speech recognition on main thread. Locale: $currentLocale"
        )

        mainHandler.post {

            try {

                stopRecognizerOnly()

                if (
                    !SpeechRecognizer.isRecognitionAvailable(
                        reactContext
                    )
                ) {

                    promise.reject(
                        "SPEECH_UNAVAILABLE",
                        "Speech recognition is not available on this device."
                    )

                    return@post
                }

                speechRecognizer =
                    SpeechRecognizer.createSpeechRecognizer(
                        reactContext
                    )

                speechRecognizer?.setRecognitionListener(
                    recognitionListener
                )

                val intent =
                    Intent(
                        RecognizerIntent.ACTION_RECOGNIZE_SPEECH
                    )

                intent.putExtra(
                    RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                )

                intent.putExtra(
                    RecognizerIntent.EXTRA_LANGUAGE,
                    currentLocale
                )

                intent.putExtra(
                    RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE,
                    currentLocale
                )

                intent.putExtra(
                    RecognizerIntent.EXTRA_PARTIAL_RESULTS,
                    true
                )

                intent.putExtra(
                    RecognizerIntent.EXTRA_MAX_RESULTS,
                    5
                )

                speechRecognizer?.startListening(
                    intent
                )

                android.util.Log.d(
                    MODULE_NAME,
                    "Speech recognition started successfully."
                )

                promise.resolve(
                    true
                )

            } catch (e: Exception) {

                android.util.Log.e(
                    MODULE_NAME,
                    "Failed to start speech recognition.",
                    e
                )

                stopRecognizerOnly()

                promise.reject(
                    "SPEECH_START_ERROR",
                    e.message,
                    e
                )
            }
        }
    }

    // ============================================================
    // STOP LISTENING
    // ============================================================

    @ReactMethod
    fun stopListening(
        promise: Promise
    ) {

        mainHandler.post {

            try {

                android.util.Log.d(
                    MODULE_NAME,
                    "Stopping speech recognition."
                )

                speechRecognizer?.stopListening()

                promise.resolve(
                    true
                )

            } catch (e: Exception) {

                android.util.Log.e(
                    MODULE_NAME,
                    "Failed to stop speech recognition.",
                    e
                )

                promise.reject(
                    "SPEECH_STOP_ERROR",
                    e.message,
                    e
                )
            }
        }
    }

    // ============================================================
    // DESTROY
    // ============================================================

    @ReactMethod
    fun destroy() {

        mainHandler.post {
            stopRecognizerOnly()
        }
    }

    private fun stopRecognizerOnly() {

        try {

            speechRecognizer?.setRecognitionListener(
                null
            )

            speechRecognizer?.cancel()

            speechRecognizer?.destroy()

        } catch (e: Exception) {

            android.util.Log.w(
                MODULE_NAME,
                "Error while destroying speech recognizer.",
                e
            )
        }

        speechRecognizer =
            null
    }

    override fun invalidate() {

        mainHandler.post {
            stopRecognizerOnly()
        }

        super.invalidate()
    }
}