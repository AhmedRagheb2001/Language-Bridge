import onnxruntime as ort
import numpy as np

ENCODER = r".\models\nllb-int8\encoder_model.onnx"
DECODER = r".\models\nllb-int8\decoder_model.onnx"

# Exact encoder IDs from the Android log for:
# "Hello , how are you"
encoder_ids = [165, 59, 345, 145, 11656, 8, 118, 34, 224, 2, 256047]

# English -> Turkish
target_language_token = 256184
EOS = 2

print("Loading encoder...")
encoder = ort.InferenceSession(
    ENCODER,
    providers=["CPUExecutionProvider"],
)

print("Loading decoder...")
decoder = ort.InferenceSession(
    DECODER,
    providers=["CPUExecutionProvider"],
)

input_ids = np.array([encoder_ids], dtype=np.int64)
attention_mask = np.ones((1, len(encoder_ids)), dtype=np.int64)

print()
print("Encoder input IDs:")
print(encoder_ids)

encoder_result = encoder.run(
    ["last_hidden_state"],
    {
        "input_ids": input_ids,
        "attention_mask": attention_mask,
    },
)

encoder_hidden_states = encoder_result[0]

print()
print("Encoder hidden states shape:")
print(encoder_hidden_states.shape)

generated = [EOS, target_language_token]

print()
print("Initial decoder tokens:")
print(generated)

for step in range(20):
    decoder_ids = np.array(
        [generated],
        dtype=np.int64,
    )

    decoder_result = decoder.run(
        ["logits"],
        {
            "input_ids": decoder_ids,
            "encoder_attention_mask": attention_mask,
            "encoder_hidden_states": encoder_hidden_states,
        },
    )

    logits = decoder_result[0]

    print()
    print(
        f"Step {step + 1}: "
        f"logits shape={logits.shape}"
    )

    last_logits = logits[0, -1, :]

    next_token = int(np.argmax(last_logits))

    confidence = float(last_logits[next_token])

    print(
        f"Step {step + 1}: "
        f"token={next_token}, "
        f"logit={confidence}"
    )

    generated.append(next_token)

    if next_token == EOS:
        print("EOS generated.")
        break

print()
print("==============================")
print("FINAL GENERATED TOKEN IDS")
print("==============================")
print(generated)
