#!/usr/bin/env node

import { program, Argument } from "commander";

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
 * @summary options which can or must be passed through command line
 */
type BaseARGS = {
  readonly rootDir: string;
  readonly outDir?: string;
  readonly errDir?: string;
  readonly typescript: boolean;
  readonly nsSeparator: string;
  readonly keySeparator: string;
  readonly translations: boolean;
};

/**
 * @summary controller which is responsible for switch on the generators
 */
class Controller {
  /**
   * @summary contains the wanted mode
   */
  private readonly mode: Mode;

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
    [this.mode, this.args] = this.getARGS(argv);
  }

  /**
   * @summary starts the execution of the generators
   * @returns PendingJob
   */
  public async exec(): PendingJob {
    const requiredARGS = {
      rootDir: this.fs.join(this.args.rootDir),
      outDir: this.fs.join(this.args.outDir ?? this.args.rootDir),
      errDir: this.fs.join(this.args.errDir ?? this.args.rootDir),
      typescript: this.args.typescript,
      nsSeparator: this.args.nsSeparator,
      keySeparator: this.args.keySeparator,
      translations: this.args.translations,
    };

    switch (this.mode) {
      case Mode.COMPILE:
        await new LocaleKeysCompiler(requiredARGS).compile();
        break;
      default:
        await new LocaleKeysGenerator(requiredARGS).generate();
        break;
    }
  }

  /**
   * @summary parses and validates the command line args
   * @param argv
   * @returns BaseARGS
   */
  private getARGS(argv: Collection): [Mode, BaseARGS] {
    const command = program
      .name("Next-translate LocaleKeys")
      .description("helps working with translation keys from the next translate library")
      .version("-v, --version", "current version")
      .helpOption("-h, --help", "displays all the options and arguments")
      .addArgument(new Argument("mode", "current mode").choices(Object.values(Mode)).argRequired())
      .requiredOption("--rootDir <string>", "location of the source code")
      .option("--outDir <string>", "place of the generated output. Default: rootDir.")
      .option("--errDir <string>", "location of error file. Default: rootDir.")
      .option("--nsSeparator <string>", "char to split namespace from key.", ":")
      .option("--keySeparator <string>", "change the separator that is used for nested keys.", ".")
      .option("--typescript", "enables typescript", false)
      .option("--translations", "enables translation comments.", false)
      .parse(argv);

    return [command.args[0] as Mode, command.opts()];
  }
}

/**
 * @summary with this call the complete process starts
 */
new Controller(process.argv).exec();
