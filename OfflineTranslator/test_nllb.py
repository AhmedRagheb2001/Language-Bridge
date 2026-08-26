import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer


MODEL_DIR = r".\models\nllb-int8"

LANGUAGE_IDS = {
    "arb_Arab": 256011,
    "eng_Latn": 256047,
    "fra_Latn": 256057,
    "spa_Latn": 256161,
    "tur_Latn": 256184,
}

DECODER_START_TOKEN_ID = 2
EOS_TOKEN_ID = 2
MAX_LENGTH = 100


def load_tokenizer():
    return Tokenizer.from_file(
        MODEL_DIR + r"\tokenizer.json"
    )


def load_models():
    encoder = ort.InferenceSession(
        MODEL_DIR + r"\encoder_model.onnx",
        providers=["CPUExecutionProvider"],
    )

    decoder = ort.InferenceSession(
        MODEL_DIR + r"\decoder_model.onnx",
        providers=["CPUExecutionProvider"],
    )

    return encoder, decoder


def translate(text, source_lang, target_lang, tokenizer, encoder, decoder):

    encoding = tokenizer.encode(text)
    input_ids = np.array([encoding.ids], dtype=np.int64)
    attention_mask = np.ones_like(input_ids, dtype=np.int64)

    encoder_hidden_states = encoder.run(
        ["last_hidden_state"],
        {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
        },
    )[0]

    generated_ids = [
        DECODER_START_TOKEN_ID,
        LANGUAGE_IDS[target_lang],
    ]

    for _ in range(MAX_LENGTH):

        decoder_input_ids = np.array(
            [generated_ids],
            dtype=np.int64,
        )

        logits = decoder.run(
            ["logits"],
            {
                "input_ids": decoder_input_ids,
                "encoder_attention_mask": attention_mask,
                "encoder_hidden_states": encoder_hidden_states,
            },
        )[0]

        next_token_id = int(
            np.argmax(logits[0, -1, :])
        )

        generated_ids.append(next_token_id)

        if next_token_id == EOS_TOKEN_ID:
            break

    text_ids = generated_ids[2:]

    if EOS_TOKEN_ID in text_ids:
        text_ids = text_ids[:text_ids.index(EOS_TOKEN_ID)]

    return tokenizer.decode(text_ids)


def main():

    print("Loading tokenizer and ONNX models...")
    tokenizer = load_tokenizer()
    encoder, decoder = load_models()

    tests = [
        ("Hello, how are you?", "eng_Latn", "tur_Latn"),
        ("Hello, how are you?", "eng_Latn", "arb_Arab"),
        ("Hello, how are you?", "eng_Latn", "fra_Latn"),
        ("Hello, how are you?", "eng_Latn", "spa_Latn"),
        ("Merhaba, nasılsın?", "tur_Latn", "eng_Latn"),
    ]

    print()
    print("=" * 60)
    print("NLLB OFFLINE TRANSLATION TEST")
    print("=" * 60)

    for text, source, target in tests:

        print()
        print(f"{source} -> {target}")
        print("Input :", text)

        result = translate(
            text,
            source,
            target,
            tokenizer,
            encoder,
            decoder,
        )

        print("Output:", result)

    print()
    print("=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()