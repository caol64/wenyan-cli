#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainModulePath = join(__dirname, "..", "dist", 'index.js');

import(pathToFileURL(mainModulePath).href);
