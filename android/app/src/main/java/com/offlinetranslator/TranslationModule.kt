package com.offlinetranslator

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader

class TranslationModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "TranslationModule"

        private const val TOKENIZER_ASSET =
            "models/nllb-int8/tokenizer.json"

        private const val LANGUAGE_TOKEN =
            "eng_Latn"

        private const val EOS_TOKEN_ID =
            2

        private const val UNKNOWN_TOKEN =
            "<unk>"

        private const val METASPACE =
            "\u2581"
    }

    private var tokenizerLoaded = false

    private val vocab =
        HashMap<String, Int>()

    private val idToToken =
        HashMap<Int, String>()

    private val mergeRanks =
        HashMap<String, Int>()

    override fun getName(): String {
        return "TranslationModule"
    }

    // ============================================================
    // TOKENIZER INITIALIZATION
    // ============================================================

    @Synchronized
    private fun loadTokenizer() {

        if (tokenizerLoaded) {
            return
        }

        Log.d(
            TAG,
            "Loading NLLB tokenizer.json..."
        )

        val inputStream =
            reactApplicationContext.assets.open(
                TOKENIZER_ASSET
            )

        val reader =
            BufferedReader(
                InputStreamReader(
                    inputStream,
                    Charsets.UTF_8
                )
            )

        val jsonText =
            reader.use {
                it.readText()
            }

        Log.d(
            TAG,
            "tokenizer.json loaded: ${jsonText.length} characters"
        )

        val root =
            JSONObject(jsonText)

        val model =
            root.getJSONObject("model")

        // --------------------------------------------------------
        // VOCABULARY
        // --------------------------------------------------------

        val vocabObject =
            model.getJSONObject("vocab")

        val vocabKeys =
            vocabObject.keys()

        var vocabCount =
            0

        while (vocabKeys.hasNext()) {

            val token =
                vocabKeys.next()

            val id =
                vocabObject.getInt(token)

            vocab[token] =
                id

            idToToken[id] =
                token

            vocabCount++
        }

        Log.d(
            TAG,
            "Loaded vocabulary entries: $vocabCount"
        )

        // --------------------------------------------------------
        // BPE MERGES
        // --------------------------------------------------------

        val mergesArray =
            model.getJSONArray("merges")

        for (i in 0 until mergesArray.length()) {

            val mergeValue =
                mergesArray.get(i)

            val mergeString =
                if (mergeValue is org.json.JSONArray) {

                    val first =
                        mergeValue.getString(0)

                    val second =
                        mergeValue.getString(1)

                    "$first $second"

                } else {

                    mergeValue.toString()
                }

            mergeRanks[mergeString] =
                i
        }

        Log.d(
            TAG,
            "Loaded BPE merges: ${mergesArray.length()}"
        )

        // --------------------------------------------------------
        // VERIFY SPECIAL TOKENS
        // --------------------------------------------------------

        Log.d(
            TAG,
            "LANGUAGE TOKEN: $LANGUAGE_TOKEN -> ${vocab[LANGUAGE_TOKEN]}"
        )

        Log.d(
            TAG,
            "EOS TOKEN: </s> -> ${vocab["</s>"]}"
        )

        Log.d(
            TAG,
            "UNK TOKEN: <unk> -> ${vocab[UNKNOWN_TOKEN]}"
        )

        tokenizerLoaded =
            true

        Log.d(
            TAG,
            "NLLB BPE tokenizer initialized successfully."
        )

        debugToken(133863)
        debugToken(11657)
        debugToken(2442)
        debugToken(1259)

        debugToken(6561)
        debugToken(28790)
        debugToken(24588)
        debugToken(47718)
    }

    // ============================================================
    // UNICODE DEBUG
    // ============================================================

    private fun debugToken(
        id: Int
    ) {

        val token =
            idToToken[id]

        if (token == null) {

            Log.d(
                TAG,
                "UNICODE CHECK id=$id token=NULL"
            )

            return
        }

        val codePoints =
            token
                .codePoints()
                .toArray()
                .joinToString(" ") {
                    "U+" +
                        it
                            .toString(16)
                            .uppercase()
                            .padStart(
                                4,
                                '0'
                            )
                }

        Log.d(
            TAG,
            "UNICODE CHECK id=$id token=${token.inspectUnicode()} codePoints=[$codePoints]"
        )
    }

    private fun String.inspectUnicode(): String {

        return buildString {

            append("\"")

            for (character in this@inspectUnicode) {

                when (character) {

                    '\\' ->
                        append("\\\\")

                    '"' ->
                        append("\\\"")

                    '\n' ->
                        append("\\n")

                    '\r' ->
                        append("\\r")

                    '\t' ->
                        append("\\t")

                    else ->
                        append(character)
                }
            }

            append("\"")
        }
    }

    // ============================================================
    // BPE
    // ============================================================

    private fun getPairKey(
        first: String,
        second: String
    ): String {

        return "$first $second"
    }

    private fun bpe(
        word: String
    ): List<String> {

        if (word.isEmpty()) {
            return emptyList()
        }

        val symbols =
            ArrayList<String>()

        var index =
            0

        while (index < word.length) {

            val codePoint =
                word.codePointAt(index)

            symbols.add(
                String(
                    Character.toChars(
                        codePoint
                    )
                )
            )

            index +=
                Character.charCount(
                    codePoint
                )
        }

        if (symbols.size <= 1) {
            return symbols
        }

        while (symbols.size > 1) {

            var bestRank =
                Int.MAX_VALUE

            var bestIndex =
                -1

            for (
                i in 0 until symbols.size - 1
            ) {

                val pairKey =
                    getPairKey(
                        symbols[i],
                        symbols[i + 1]
                    )

                val rank =
                    mergeRanks[pairKey]

                if (
                    rank != null &&
                    rank < bestRank
                ) {

                    bestRank =
                        rank

                    bestIndex =
                        i
                }
            }

            if (bestIndex < 0) {
                break
            }

            val merged =
                symbols[bestIndex] +
                    symbols[bestIndex + 1]

            symbols.removeAt(
                bestIndex + 1
            )

            symbols[bestIndex] =
                merged
        }

        return symbols
    }

    // ============================================================
    // METASPACE PRE-TOKENIZATION
    // ============================================================

    private fun preTokenize(
        text: String
    ): List<String> {

        if (text.isEmpty()) {
            return emptyList()
        }

        val result =
            ArrayList<String>()

        val words =
            text.trim().split(
                Regex("\\s+")
            )

        for (word in words) {

            if (word.isEmpty()) {
                continue
            }

            result.add(
                METASPACE + word
            )
        }

        return result
    }

    // ============================================================
    // TOKENIZE
    // ============================================================

    private fun tokenizeInternal(
        text: String
    ): List<Int> {

        loadTokenizer()

        Log.d(
            TAG,
            "Original text: $text"
        )

        val preTokenized =
            preTokenize(text)

        Log.d(
            TAG,
            "Pre-tokenized pieces: ${preTokenized.joinToString(" | ")}"
        )

        val ids =
            ArrayList<Int>()

        /*
         * IMPORTANT:
         *
         * This native method now returns ONLY the BPE
         * token IDs.
         *
         * The React Native translation service is responsible
         * for constructing the complete NLLB encoder sequence:
         *
         * [source language] + [BPE tokens] + [EOS]
         *
         * This prevents the source language and EOS tokens
         * from being added twice.
         */

        for (piece in preTokenized) {

            val bpePieces =
                bpe(piece)

            Log.d(
                TAG,
                "BPE word=$piece -> ${bpePieces.joinToString(" | ")}"
            )

            for (bpePiece in bpePieces) {

                val id =
                    vocab[bpePiece]

                if (id != null) {

                    ids.add(
                        id
                    )

                } else {

                    val unknownId =
                        vocab[UNKNOWN_TOKEN]

                    if (unknownId != null) {

                        ids.add(
                            unknownId
                        )

                    } else {

                        throw IllegalStateException(
                            "Tokenizer vocabulary does not contain token: $bpePiece"
                        )
                    }
                }
            }
        }

        Log.d(
            TAG,
            "Final BPE token IDs: ${ids.joinToString(", ")}"
        )

        return ids
    }

    // ============================================================
    // DECODE
    // ============================================================

    private fun decodeInternal(
        ids: List<Int>
    ): String {

        loadTokenizer()

        val builder =
            StringBuilder()

        for (id in ids) {

            if (id == EOS_TOKEN_ID) {
                continue
            }

            val token =
                idToToken[id]
                    ?: continue

            if (
                token == "eng_Latn" ||
                token == "tur_Latn" ||
                token == "arb_Arab" ||
                token == "fra_Latn" ||
                token == "spa_Latn"
            ) {
                continue
            }

            if (
                token == "</s>" ||
                token == "<pad>"
            ) {
                continue
            }

            if (token == "<unk>") {

                builder.append(
                    " "
                )

                continue
            }

            if (
                token.startsWith(
                    METASPACE
                )
            ) {

                if (builder.isNotEmpty()) {

                    builder.append(
                        " "
                    )
                }

                builder.append(
                    token.substring(
                        METASPACE.length
                    )
                )

            } else {

                builder.append(
                    token
                )
            }
        }

        return builder
            .toString()
            .trim()
    }

    // ============================================================
    // RUNTIME TEST
    // ============================================================

    @ReactMethod
    fun testModelRuntime(
        promise: Promise
    ) {

        try {

            loadTokenizer()

            val result =
                Arguments.createMap()

            result.putString(
                "status",
                "success"
            )

            result.putString(
                "message",
                "NLLB BPE tokenizer is working"
            )

            promise.resolve(
                result
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Tokenizer runtime test failed.",
                e
            )

            promise.reject(
                "TRANSLATION_MODULE_ERROR",
                e.message,
                e
            )
        }
    }

    // ============================================================
    // MODEL ASSET TEST
    // ============================================================

    @ReactMethod
    fun testTranslationModels(
        promise: Promise
    ) {

        try {

            val assetManager =
                reactApplicationContext.assets

            val encoderExists =
                assetExists(
                    assetManager,
                    "models/nllb-int8/encoder_model.onnx"
                )

            val decoderExists =
                assetExists(
                    assetManager,
                    "models/nllb-int8/decoder_model.onnx"
                )

            val tokenizerExists =
                assetExists(
                    assetManager,
                    TOKENIZER_ASSET
                )

            val result =
                Arguments.createMap()

            result.putString(
                "status",
                "success"
            )

            result.putBoolean(
                "encoderExists",
                encoderExists
            )

            result.putBoolean(
                "decoderExists",
                decoderExists
            )

            result.putBoolean(
                "tokenizerExists",
                tokenizerExists
            )

            promise.resolve(
                result
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "Failed to check model files.",
                e
            )

            promise.reject(
                "MODEL_TEST_ERROR",
                "Failed to check model files",
                e
            )
        }
    }

    // ============================================================
    // TOKENIZE REACT METHOD
    // ============================================================

    @ReactMethod
    fun tokenize(
        text: String,
        promise: Promise
    ) {

        try {

            if (text.isBlank()) {

                promise.resolve(
                    Arguments.createArray()
                )

                return
            }

            val tokenIds =
                tokenizeInternal(
                    text
                )

            val result =
                Arguments.createArray()

            for (id in tokenIds) {

                result.pushInt(
                    id
                )
            }

            promise.resolve(
                result
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "BPE tokenization failed.",
                e
            )

            promise.reject(
                "TOKENIZATION_ERROR",
                "BPE tokenization failed: ${e.message}",
                e
            )
        }
    }

    // ============================================================
    // DECODE REACT METHOD
    // ============================================================

    @ReactMethod
    fun decode(
        tokenIds: ReadableArray,
        promise: Promise
    ) {

        try {

            val ids =
                ArrayList<Int>()

            for (
                i in 0 until tokenIds.size()
            ) {

                ids.add(
                    tokenIds.getInt(i)
                )
            }

            Log.d(
                TAG,
                "Decoding IDs: ${ids.joinToString(", ")}"
            )

            if (ids.isEmpty()) {

                promise.resolve(
                    ""
                )

                return
            }

            val result =
                decodeInternal(
                    ids
                )

            Log.d(
                TAG,
                "Decoded result: $result"
            )

            promise.resolve(
                result
            )

        } catch (e: Exception) {

            Log.e(
                TAG,
                "BPE decoding failed.",
                e
            )

            promise.reject(
                "DECODING_ERROR",
                "BPE decoding failed: ${e.message}",
                e
            )
        }
    }

    // ============================================================
    // ASSET CHECK
    // ============================================================

    private fun assetExists(
        assetManager: android.content.res.AssetManager,
        path: String
    ): Boolean {

        return try {

            assetManager
                .open(path)
                .use {
                    true
                }

        } catch (
            e: Exception
        ) {

            false
        }
    }
}