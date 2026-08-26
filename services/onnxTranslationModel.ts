import {InferenceSession} from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';

let encoderSession: InferenceSession | null = null;
let decoderSession: InferenceSession | null = null;

const MODEL_ASSET_PATH = 'models/nllb-int8';
const MODEL_DIR = `${RNFS.DocumentDirectoryPath}/models/nllb-int8`;

const ENCODER_NAME = 'encoder_model.onnx';
const DECODER_NAME = 'decoder_model.onnx';

async function copyAssetToFile(
  assetPath: string,
  destinationPath: string,
): Promise<void> {
  const destinationExists =
    await RNFS.exists(destinationPath);

  if (destinationExists) {
    return;
  }

  await RNFS.mkdir(MODEL_DIR);

  await RNFS.copyFileAssets(
    assetPath,
    destinationPath,
  );
}

export async function loadTranslationModels(): Promise<void> {
  if (encoderSession && decoderSession) {
    return;
  }

  try {
    await RNFS.mkdir(MODEL_DIR);

    const encoderPath =
      `${MODEL_DIR}/${ENCODER_NAME}`;

    const decoderPath =
      `${MODEL_DIR}/${DECODER_NAME}`;

    await copyAssetToFile(
      `${MODEL_ASSET_PATH}/${ENCODER_NAME}`,
      encoderPath,
    );

    await copyAssetToFile(
      `${MODEL_ASSET_PATH}/${DECODER_NAME}`,
      decoderPath,
    );

    encoderSession =
      await InferenceSession.create(
        encoderPath,
      );

    decoderSession =
      await InferenceSession.create(
        decoderPath,
      );
  } catch (error) {
    encoderSession = null;
    decoderSession = null;

    console.error(
      'Failed to load translation models:',
      error,
    );

    throw error;
  }
}

export function getTranslationSessions(): {
  encoder: InferenceSession;
  decoder: InferenceSession;
} {
  if (
    !encoderSession ||
    !decoderSession
  ) {
    throw new Error(
      'Translation models are not loaded.',
    );
  }

  return {
    encoder: encoderSession,
    decoder: decoderSession,
  };
}