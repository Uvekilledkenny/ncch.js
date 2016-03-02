#!/usr/bin/env node

const ncch = require('./lib/ncch.js');
const program = require('commander');
const chalk = require('chalk');

program
  .version('0.4')
  .arguments('<file>')
  .description('Parses NCCH from a 3DS rom and generates a Ncchinfo.bin in Node.JS')
  .option('-i, --info', 'shows NCCH as a list of buffers')
  .option('-g, --generate', 'generates a ncchinfo.bin', { isDefault: true })
  .parse(process.argv);

const file = program.args;
const path = process.cwd() + '/' + file;

if (!program.args.length) {
  program.help();
}

if (!program.info && !program.generate) {
  program.help();
}

if (program.info) {
  ncch.parseMain(path, (err, res) => {
    if (err) { console.log(chalk.red(err)); }
    console.log(res);
  });
}

if (program.generate) {
  ncch.genFile(path, (err) => {
    if (err) { console.log(chalk.red(err)); }
    console.log(chalk.green('ncchinfo.bin created from ' + file + ' !'));
  });
}


