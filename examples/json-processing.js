#!/usr/bin/env node

/**
 * Programmatic JSON output demonstration for EnvShield
 * Maintainer: Jatin Sharma (https://jatinsh.netlify.app/)
 */

import * as api from '../dist/index.js';

console.log('⚡ Inspecting EnvShield programmatic interfaces...');
console.log(Object.keys(api));
console.log('✔ Programmatic inspection completed.');
