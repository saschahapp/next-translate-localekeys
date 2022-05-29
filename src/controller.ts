#!/usr/bin/env node

import { join } from "path";
import { program } from "commander";

import { Collection, PendingJob } from "./generator";
import { LocaleKeysGenerator } from "./localekeysgenerator";

/**
 * @summary arguments which can or must be passed through command line
 */
type ARGS = {
  readonly outDir: string;
  readonly rootDir: string;
  readonly errDir?: string;
  readonly nsSeparator: string;
  readonly keySeparator: string;
  readonly typescriptEnabled?: boolean;
  readonly translationsEnabled?: boolean;
};

/**
 * @summary controller which is responsible for switch on the generators
 */
class Controller {
  /**
   * @summary parsed command line arguments
   */
  private readonly args: ARGS;

  /**
   * @summary constructor
   * @param argv
   */
  constructor(argv: Collection) {
    this.args = this.getARGS(argv);
  }

  /**
   * @summary starts the execution of the generators
   * @returns PendingJob
   */
  public async exec(): PendingJob {
    await new LocaleKeysGenerator({
      src: join(this.args.rootDir),
      outDir: join(this.args.outDir),
      errDir: join(this.args.errDir ?? this.args.outDir),
      nsSeparator: this.args.nsSeparator,
      keySeparator: this.args.keySeparator,
      typescriptEnabled: this.args.typescriptEnabled ?? false,
      translationsEnabled: this.args.translationsEnabled ?? false,
    }).generate();
  }

  /**
   * @summary parses and validates the command line args
   * @param argv
   * @returns ARGS
   */
  private getARGS(argv: Collection): ARGS {
    return program
      .requiredOption("--rootDir <string>", "where the locale translation json files are located")
      .requiredOption("--outDir <string>", "where the generated output should placed in")
      .option("--errDir <string>", "where the error file should be placed in. Default: outDir.")
      .option("--nsSeparator <string>", "char to split namespace from key.", ":")
      .option("--keySeparator <string>", "change the separator that is used for nested keys.", ".")
      .option("--typescriptEnabled", "enables typescript with type safety and readonly modifier.")
      .option("--translationsEnabled", "enables translation comments.")
      .parse(argv)
      .opts();
  }
}

/**
 * @summary with this call the complete process starts
 */
new Controller(process.argv).exec();
