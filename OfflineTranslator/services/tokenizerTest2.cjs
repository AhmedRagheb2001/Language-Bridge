const {
  AutoTokenizer,
  env,
} = require('@xenova/transformers');

async function main() {
  console.log('Configuring Transformers.js for local files...');

  env.allowRemoteModels = false;
  env.allowLocalModels = true;

  const modelPath =
    './android/app/src/main/assets/models/nllb-int8';

  console.log('Model path:', modelPath);

  console.log('Loading tokenizer...');

  const tokenizer = await AutoTokenizer.from_pretrained(modelPath);

  console.log('Tokenizer loaded successfully.');

  const text = 'Hello, how are you?';

  const encoded = tokenizer(text);

  console.log('Input:', text);
  console.log('Encoded:', encoded);
  console.log('Input IDs:', encoded.input_ids?.data);
  console.log('Attention mask:', encoded.attention_mask?.data);

  console.log(
    'Input ID count:',
    encoded.input_ids?.data?.length,
  );
}

main().catch(error => {
  console.error('\nTOKENIZER ERROR');
  console.error(error);
  process.exit(1);
});