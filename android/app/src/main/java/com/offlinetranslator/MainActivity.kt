package com.offlinetranslator

import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity
import java.io.File

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        copyTranslationAssets()
    }

    private fun copyTranslationAssets() {
        val files = arrayOf(
            "models/nllb-int8/encoder_model.onnx",
            "models/nllb-int8/decoder_model.onnx",
            "models/nllb-int8/sentencepiece.bpe.model",
            "models/nllb-int8/tokenizer.json",
            "models/nllb-int8/tokenizer_config.json",
            "models/nllb-int8/special_tokens_map.json",
            "models/nllb-int8/config.json",
            "models/nllb-int8/ort_config.json"
        )

        try {
            for (assetPath in files) {
                val fileName = assetPath.substringAfterLast("/")
                val destination = File(filesDir, fileName)

                if (!destination.exists() || destination.length() == 0L) {
                    assets.open(assetPath).use { input ->
                        destination.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }

                    Log.d(
                        "OfflineTranslatorAssets",
                        "Copied $fileName (${destination.length()} bytes)"
                    )
                } else {
                    Log.d(
                        "OfflineTranslatorAssets",
                        "Already exists: $fileName (${destination.length()} bytes)"
                    )
                }
            }
        } catch (e: Exception) {
            Log.e(
                "OfflineTranslatorAssets",
                "Failed to copy translation assets",
                e
            )
        }
    }

    override fun getMainComponentName(): String {
        return "OfflineTranslator"
    }
}