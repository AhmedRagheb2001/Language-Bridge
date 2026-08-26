import {NativeModules} from 'react-native';
import {Tensor} from 'onnxruntime-react-native';

import {
  getTranslationSessions,
  loadTranslationModels,
} from './onnxTranslationModel';

export type SupportedLanguage =
  | 'English'
  | 'Turkish'
  | 'Arabic'
  | 'French'
  | 'Spanish';

/**
 * NLLB language IDs from tokenizer.json.
 */
const LANGUAGE_TOKENS: Record<
  SupportedLanguage,
  number
> = {
  English: 256047,
  Turkish: 256184,
  Arabic: 256011,
  French: 256057,
  Spanish: 256161,
};

const EOS_TOKEN_ID = 2;

const MAX_NEW_TOKENS = 128;

const {TranslationModule} =
  NativeModules;

if (!TranslationModule) {
  console.warn(
    'TranslationModule is not available. ' +
      'Rebuild the Android application.',
  );
}

/**
 * ============================================================
 * CREATE INT64 TENSOR
 * ============================================================
 */

function createInt64Tensor(
  values: number[],
  dims: number[],
): Tensor {
  return new Tensor(
    'int64',
    BigInt64Array.from(
      values.map(
        value => BigInt(value),
      ),
    ),
    dims,
  );
}

/**
 * ============================================================
 * ARGMAX
 * ============================================================
 */

function argMax(
  values: Float32Array | number[],
): number {

  if (!values.length) {
    throw new Error(
      'Decoder returned empty logits.',
    );
  }

  let bestIndex = 0;

  let bestValue =
    values[0];

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      values[i] >
      bestValue
    ) {

      bestValue =
        values[i];

      bestIndex =
        i;
    }
  }

  return bestIndex;
}

/**
 * ============================================================
 * TOKENIZATION
 * ============================================================
 */

async function tokenizeText(
  text: string,
  sourceLanguage: SupportedLanguage,
): Promise<{
  inputIds: number[];
  attentionMask: number[];
}> {

  if (!TranslationModule) {
    throw new Error(
      'TranslationModule is not available.',
    );
  }

  console.log(
    'NLLB TOKENIZATION',
  );

  console.log(
    'Input text:',
    text,
  );

  /*
   * Native module now uses the actual
   * tokenizer.json BPE tokenizer.
   */
  const tokenIds: number[] =
    await TranslationModule.tokenize(
      text,
    );

  if (!tokenIds.length) {
    throw new Error(
      'Tokenizer returned no tokens.',
    );
  }

  const sourceLanguageToken =
    LANGUAGE_TOKENS[
      sourceLanguage
    ];

  /*
   * NLLB encoder input:
   *
   * [source language]
   * [BPE tokens]
   * [EOS]
   *
   * Example:
   *
   * Hello, how are you?
   *
   * [
   *   256047,
   *   94124,
   *   248079,
   *   11657,
   *   2442,
   *   1259,
   *   248130,
   *   2
   * ]
   */

  const inputIds = [
    sourceLanguageToken,
    ...tokenIds,
    EOS_TOKEN_ID,
  ];

  const attentionMask =
    new Array(
      inputIds.length,
    ).fill(1);

  console.log(
    'SentencePiece/BPE IDs:',
    tokenIds,
  );

  console.log(
    'Correct NLLB encoder input IDs:',
    inputIds,
  );

  console.log(
    'Source language:',
    sourceLanguage,
  );

  console.log(
    'Source language ID:',
    sourceLanguageToken,
  );

  return {
    inputIds,
    attentionMask,
  };
}

/**
 * ============================================================
 * DECODE
 * ============================================================
 */

async function decodeTokens(
  tokenIds: number[],
): Promise<string> {

  if (!TranslationModule) {
    throw new Error(
      'TranslationModule is not available.',
    );
  }

  console.log(
    'Token IDs before decoding:',
    tokenIds,
  );

  /*
   * The native decoder understands
   * tokenizer.json IDs directly.
   *
   * Remove decoder control tokens here.
   */

  let ids =
    [...tokenIds];

  /*
   * Remove decoder start EOS.
   */
  if (
    ids.length > 0 &&
    ids[0] === EOS_TOKEN_ID
  ) {

    ids =
      ids.slice(1);
  }

  /*
   * Remove target language token.
   */
  if (
    ids.length > 0 &&
    Object.values(
      LANGUAGE_TOKENS,
    ).includes(
      ids[0],
    )
  ) {

    ids =
      ids.slice(1);
  }

  /*
   * Remove EOS.
   */
  ids =
    ids.filter(
      id =>
        id !==
        EOS_TOKEN_ID,
    );

  console.log(
    'IDs sent to native BPE decoder:',
    ids,
  );

  if (!ids.length) {
    return '';
  }

  const result: string =
    await TranslationModule.decode(
      ids,
    );

  return result.trim();
}

/**
 * ============================================================
 * OFFLINE TRANSLATION
 * ============================================================
 */

export async function translateOffline(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
): Promise<string> {

  if (!text.trim()) {
    return '';
  }

  if (
    sourceLanguage ===
    targetLanguage
  ) {
    return text;
  }

  console.log(
    '================================================',
  );

  console.log(
    'OFFLINE NLLB TRANSLATION',
  );

  console.log(
    '================================================',
  );

  console.log(
    `Language: ${sourceLanguage} -> ${targetLanguage}`,
  );

  console.log(
    'Input:',
    text,
  );

  /**
   * ========================================================
   * STEP 1
   * Load ONNX models
   * ========================================================
   */

  console.log(
    'STEP 1: Loading ONNX models...',
  );

  await loadTranslationModels();

  const {
    encoder,
    decoder,
  } =
    getTranslationSessions();

  console.log(
    'ONNX encoder and decoder loaded successfully.',
  );

  /**
   * ========================================================
   * STEP 2
   * Tokenize
   * ========================================================
   */

  console.log(
    'STEP 2: Tokenizing input...',
  );

  const {
    inputIds,
    attentionMask,
  } =
    await tokenizeText(
      text,
      sourceLanguage,
    );

  /**
   * ========================================================
   * STEP 3
   * Create encoder tensors
   * ========================================================
   */

  console.log(
    'STEP 3: Creating encoder tensors...',
  );

  const encoderInputIds =
    createInt64Tensor(
      inputIds,
      [
        1,
        inputIds.length,
      ],
    );

  const encoderAttentionMask =
    createInt64Tensor(
      attentionMask,
      [
        1,
        attentionMask.length,
      ],
    );

  /**
   * ========================================================
   * STEP 4
   * Run encoder
   * ========================================================
   */

  console.log(
    'STEP 4: Running NLLB encoder...',
  );

  const encoderResult =
    await encoder.run({
      input_ids:
        encoderInputIds,

      attention_mask:
        encoderAttentionMask,
    });

  const encoderHiddenStates =
    encoderResult.last_hidden_state;

  if (!encoderHiddenStates) {
    throw new Error(
      'Encoder did not return last_hidden_state.',
    );
  }

  console.log(
    'NLLB encoder completed successfully.',
  );

  console.log(
    'Encoder hidden state dimensions:',
    encoderHiddenStates.dims,
  );

  /**
   * ========================================================
   * STEP 5
   * Initialize decoder
   * ========================================================
   */

  console.log(
    'STEP 5: Initializing decoder...',
  );

  const targetLanguageToken =
    LANGUAGE_TOKENS[
      targetLanguage
    ];

  /*
   * NLLB decoder starts with:
   *
   * [EOS]
   * [target language]
   */

  let generatedTokens: number[] = [
    EOS_TOKEN_ID,
    targetLanguageToken,
  ];

  console.log(
    'Target language:',
    targetLanguage,
  );

  console.log(
    'Target language ID:',
    targetLanguageToken,
  );

  console.log(
    'Initial decoder tokens:',
    generatedTokens,
  );

  /**
   * ========================================================
   * STEP 6
   * Autoregressive generation
   * ========================================================
   */

  console.log(
    'STEP 6: Starting decoder generation...',
  );

  for (
    let step = 0;
    step < MAX_NEW_TOKENS;
    step++
  ) {

    const decoderInputIds =
      createInt64Tensor(
        generatedTokens,
        [
          1,
          generatedTokens.length,
        ],
      );

    const decoderResult =
      await decoder.run({
        input_ids:
          decoderInputIds,

        encoder_attention_mask:
          encoderAttentionMask,

        encoder_hidden_states:
          encoderHiddenStates,
      });

    const logits =
      decoderResult.logits;

    if (!logits) {
      throw new Error(
        'Decoder did not return logits.',
      );
    }

    const dims =
      logits.dims;

    if (
      dims.length !== 3
    ) {

      throw new Error(
        `Unexpected decoder logits dimensions: ${dims.join(
          'x',
        )}`,
      );
    }

    const sequenceLength =
      dims[1];

    const vocabularySize =
      dims[2];

    const data =
      logits.data as Float32Array;

    const lastPositionOffset =
      (
        sequenceLength - 1
      ) *
      vocabularySize;

    const lastLogits =
      data.slice(
        lastPositionOffset,
        lastPositionOffset +
          vocabularySize,
      );

    const nextToken =
      argMax(
        lastLogits,
      );

    generatedTokens.push(
      nextToken,
    );

    console.log(
      `Decoder step ${
        step + 1
      }: token=${nextToken}`,
    );

    if (
      nextToken ===
      EOS_TOKEN_ID
    ) {

      console.log(
        'Decoder generated EOS.',
      );

      break;
    }
  }

  /**
   * ========================================================
   * STEP 7
   * Decode
   * ========================================================
   */

  console.log(
    'STEP 7: Decoding generated tokens...',
  );

  console.log(
    'Generated token IDs:',
    generatedTokens,
  );

  const result =
    await decodeTokens(
      generatedTokens,
    );

  if (!result.trim()) {

    throw new Error(
      'NLLB generated an empty translation.',
    );
  }

  console.log(
    'Final offline translation:',
    result,
  );

  console.log(
    '================================================',
  );

  console.log(
    'OFFLINE TRANSLATION COMPLETE',
  );

  console.log(
    '================================================',
  );

  return result;
}