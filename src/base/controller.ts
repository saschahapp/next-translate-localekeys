#!/usr/bin/env node

import { program, Argument } from "commander";

import { Maybe } from "./util";
import { FileSystem, PendingJob, Collection } from "./filesystem";
import { LocaleKeysCompiler } from "../localekeys/localekeyscompiler";
import { LocaleKeysGenerator } from "../localekeys/localekeysgenerator";

/**
 * @summary type that is passed to generators / compilers
 */
export type ARGS = Required<BaseARGS>;

/**
 * @summary different modes available
 */
enum Mode {
  COMPILE = "compile",
  GENERATE = "generate",
}

/**
 * @summary arguments which can or must be passed through command line
 */
type BaseARGS = {
  readonly outDir: string;
  readonly errDir?: string;
  readonly rootDir: string;
  readonly nsSeparator: string;
  readonly keySeparator: string;
  readonly typescript?: boolean;
  readonly translations?: boolean;
};

/**
 * @summary controller which is responsible for switch on the generators
 */
class Controller {
  /**
   * @summary contains the wanted mode
   */
  private mode: Maybe<Mode>;

  /**
   * @summary parsed command line arguments
   */
  private readonly args: BaseARGS;

  /**
   * @summary file system variable
   */
  private readonly fs: FileSystem;

  /**
   * @summary constructor
   * @param argv
   */
  constructor(argv: Collection) {
    this.fs = new FileSystem();
    this.args = this.getARGS(argv);
  }

  /**
   * @summary starts the execution of the generators
   * @returns PendingJob
   */
  public async exec(): PendingJob {
    const requiredARGS = {
      rootDir: this.fs.join(this.args.rootDir),
      outDir: this.fs.join(this.args.outDir),
      errDir: this.fs.join(this.args.errDir ?? this.args.outDir),
      nsSeparator: this.args.nsSeparator,
      keySeparator: this.args.keySeparator,
      typescript: this.args.typescript ?? false,
      translations: this.args.translations ?? false,
    };

    switch (this.mode) {
      case Mode.COMPILE:
        await new LocaleKeysCompiler(requiredARGS).compile();
        break;
      case Mode.GENERATE:
        await new LocaleKeysGenerator(requiredARGS).generate();
        break;
      default:
        throw new Error('Mode not found');
    }
  }

  /**
   * @summary parses and validates the command line args
   * @param argv
   * @returns BaseARGS
   */
  private getARGS(argv: Collection): BaseARGS {
    return program
      .name("Next-translate LocaleKeys")
      .description("helps working with translation keys from the next translate library")
      .version("-v, --version", "current version")
      .addArgument(new Argument("<mode>", "different modes").choices(Object.values(Mode)))
      .action((mode) => {
        this.mode = mode;
      })
      .requiredOption("--rootDir <string>", "location of the source code")
      .requiredOption("--outDir <string>", "place of the generated output")
      .option("--errDir <string>", "where the error file should be placed in. Default: outDir.")
      .option("--nsSeparator <string>", "char to split namespace from key.", ":")
      .option("--keySeparator <string>", "change the separator that is used for nested keys.", ".")
      .option("--typescript", "enables typescript")
      .option("--translations", "enables translation comments.")
      .parse(argv)
      .opts();
  }
}

/**
 * @summary with this call the complete process starts
 */
new Controller(process.argv).exec();
