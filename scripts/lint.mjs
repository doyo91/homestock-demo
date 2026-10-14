// Load the project configuration explicitly before constructing ESLint.
const { default: config } = await import('../eslint.config.js');
const { ESLint } = await import('eslint');

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
const results = await eslint.lintFiles(['.']);
const formatter = await eslint.loadFormatter('stylish');
const output = formatter.format(results);

if (output) {
	console.log(output);
}

process.exitCode = results.some((result) => result.errorCount > 0) ? 1 : 0;
