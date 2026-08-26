const fs = require('fs');
const path = require('path');
const {NllbTokenizer} = require('@xenova/transformers');

async function main() {
  const modelDir = path.resolve(
    './android/app/src/main/assets/models/nllb-int8',
  );

  console.log('Model directory:', modelDir);

  const files = [
    'tokenizer.json',
    'tokenizer_config.json',
    'special_tokens_map.json',
    'sentencepiece.bpe.model',
  ];

  for (const file of files) {
    const filePath = path.join(modelDir, file);

    console.log(
      file,
      fs.existsSync(filePath)
        ? `OK (${fs.statSync(filePath).size} bytes)`
        : 'MISSING',
    );
  }

  console.log('\nTesting tokenizer construction...');

  const tokenizer = new NllbTokenizer(
    JSON.parse(
      fs.readFileSync(
        path.join(modelDir, 'tokenizer.json'),
        'utf8',
      ),
    ),
    {
      tokenizer_config: JSON.parse(
        fs.readFileSync(
          path.join(modelDir, 'tokenizer_config.json'),
          'utf8',
        ),
      ),
    },
  );

  console.log('Tokenizer object created successfully.');

  const text = 'Hello, how are you?';

  const encoded = tokenizer(text);

  console.log('Input:', text);
  console.log('Encoded:', encoded);
  console.log('Input IDs:', encoded.input_ids?.data);
  console.log('Attention mask:', encoded.attention_mask?.data);
}

main().catch(error => {
  console.error('\nTOKENIZER ERROR');
  console.error(error);
  process.exit(1);
});