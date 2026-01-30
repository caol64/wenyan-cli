#!/usr/bin/env node
import { createProgram } from "./index.js";

const program = createProgram();

program.parse(process.argv);
