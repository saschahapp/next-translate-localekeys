import { ARGS } from "./controller";
import { Util, ReadonlyDocument } from "./util";
import { FileSystem, PendingJob } from "./filesystem";
import { GeneratorTemplates } from "./generatortemplates";

/**
 * @summary can only store a template key
 */
export type TemplateKey = keyof typeof GeneratorTemplates;

/**
 * @summary this class offers the basic functionality which every generator needs to perform its specific task
 */
export abstract class Generator {
  /**
   * @summary name of the error file
   */
  protected readonly errFile: string = "errors.log";

  /**
   * @summary holds the file system instance
   */
  protected readonly fs: FileSystem;

  /**
   * @summary holds the util instance
   */
  protected readonly util: Util;

  /**
   * @summary the filename of the file which contains the generated output
   */
  protected readonly outFile: string;

  /**
   * @summary arguments which the generator needs to perform the desired output
   */
  protected readonly args: ARGS;

  /**
   * @summary constructor
   * @param outFile
   * @param args
   * @returns Generator<ARGS>
   */
  constructor(file: string, args: ARGS) {
    this.args = args;
    this.util = new Util();
    this.fs = new FileSystem();
    this.outFile = this.getGeneratedFileName(file);
  }

  /**
   * @summary api is public accessible to start the generate process
   * @summary every specific generator needs to implement it
   * @returns PendingJob
   */
  abstract generate(): PendingJob;

  /**
   * @summary used for the error messages, to print specific information based on each generator
   */
  abstract readonly name: string;

  /**
   * @summary contains the header for every generated output regardless its main job
   * @param addendum
   * @returns string
   */
  protected getHeader(addendum: string = ""): string {
    return this.getTemplate("header", {
      addendum,
      generatorName: this.name,
      objectName: this.getGeneratorObjectName(),
    });
  }

  /**
   * @summary contains the footer for every generated output regardless its main job
   * @param addendum
   * @returns string
   */
  protected getFooter(addendum: string = ""): string {
    return this.getTemplate("footer", { addendum });
  }

  /**
   * @summary returns the template from generator templates with trimed end and inserts variables
   * @param templateKey
   * @param variables
   * @returns string
   */
  protected getTemplate(templateKey: TemplateKey, variables?: ReadonlyDocument): string {
    return GeneratorTemplates[templateKey]
      .trimEnd()
      .replace(/{{.*?}}/gm, (variable) =>
        variables ? variables[variable.replace(/{|}|\s/g, "")] ?? "" : ""
      );
  }

  /**
   * @summary returns the generated file name
   * @param file
   * @returns string
   */
  protected getGeneratedFileName(file: string): string {
    return `${file}.g.${this.args.typescript ? "ts" : "js"}`;
  }

  /**
   * @summary writes the successful generated template to the desired .g.ts file
   * @param data
   * @returns PendingJob
   */
  protected async writeToGeneratedFile(data: string): PendingJob {
    await this.fs.writeFile(this.fs.join(this.args.outDir, this.outFile), data);
  }

  /**
   * @summary logs the error message to the desired error log file
   * @param error
   * @returns PendingJob
   */
  protected async logError(error: unknown): PendingJob {
    await this.fs.appendFile(
      this.fs.join(this.args.errDir, this.errFile),
      this.getErrorMessage(error)
    );
  }

  /**
   * @summary generates the name from the file name into the constant name: e.g test_keys.g.ts => TestKeys
   * @returns string
   */
  private getGeneratorObjectName(): string {
    return this.outFile
      .replace(new RegExp(`.g.${this.args.typescript ? "ts" : "js"}$`), "")
      .toLowerCase()
      .replace(/(^\w)|([-_][a-z])/g, (group) => group.toUpperCase().replace(/_|-/, ""));
  }

  /**
   * @summary gets the Error Message depending on the type of error that was thrown
   * @param error
   * @returns string
   */
  private getErrorMessage(error: unknown): string {
    if (this.util.isString(error)) {
      return `Error: ${error}, from ${this.name}\n`;
    } else if (error instanceof Error) {
      return `${error.name}: ${error.message}, from ${this.name}\n`;
    } else {
      return `Unknown Error occurred, from ${this.name}\n`;
    }
  }
}
