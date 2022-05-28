import * as path from "node:path";
import { promises as fs, Stats } from "node:fs";
import { GeneratorTemplates } from "./generatortemplates";

/**
 * @summary base args which every generator needs
 */
export type BaseARGS = {
  readonly src: string;
  readonly outDir: string;
  readonly errDir: string;
  readonly typescriptEnabled: boolean;
};

/**
 * @summary type which holds important details about an entry in a directory
 */
export type Entry = {
  readonly name: string;
  readonly stats: Stats;
  readonly fromPath: string;
  readonly directory: string;
};

/**
 * @summary returns maybe the wanted result
 */
export type Maybe<Result> = Result | null | undefined | void;

/**
 * @summary used for define supported file extensions, only readable
 */
export type SupportedExtentions = ReadonlyArray<string>;

/**
 * @summary holds entries (string types)
 */
export type Collection = Array<string>;

/**
 * @summary holds key string values
 */
export type Document = { [key: string]: string };

/**
 * @summary  holds readonly key string values
 */
export type ReadonlyDocument = { readonly [key: string]: string };

/**
 * @summary job function type
 */
export type Job = (entry: Entry) => Promise<void>;

/**
 * @summary job which is pending
 */
export type PendingJob = ReturnType<Job>;

/**
 * @summary jobs which are pending
 */
export type PendingJobs = Array<PendingJob>;

/**
 * @summary nested Json node
 */
export type NestedDoc = { readonly [key: string]: NestedDoc | string };

/**
 * @summary workstation array with only read privileges
 */
export type Workstations = ReadonlyArray<Workstation>;

/**
 * @summary used as a stage of an assembly line
 */
export type Workstation = (value: string) => string;

/**
 * @summary serves as a callback that can be invoked without any arguments
 */
export type VoidCallback<ReturnType> = () => ReturnType;

/**
 * @summary can only store a template key
 */
export type TemplateKey = keyof typeof GeneratorTemplates;

/**
 * @summary this class offers the basic functionality which every generator needs to perform its specific task
 */
export abstract class Generator<ARGS extends BaseARGS = BaseARGS> {
  /**
   * @summary name of the error file
   */
  protected readonly errFile: string = "errors.log";

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
   * @summary checks if value is a string
   * @param value
   * @returns boolean
   */
  protected isString(value: unknown): value is string {
    return typeof value === "string";
  }

  /**
   * @summary checks if value is a object
   * @param value
   * @returns boolean
   */
  protected isObject(value: unknown): value is object {
    return typeof value === "object";
  }

  /**
   * @summary swaps all hyphen to underscores
   * @param value
   * @returns string
   */
  protected swapHyphenToUnderscore(value: string): string {
    return value.replace(/-/g, "_");
  }

  /**
   * @summary makes the first letter lowercase
   * @param value
   * @returns string
   */
  protected toFirstLetterLowerCase(value: string): string {
    return value.replace(/./, (letter) => letter.toLowerCase());
  }

  /**
   * @summary makes the first letter uppercase
   * @param value
   * @returns string
   */
  protected toFirstLetterUpperCase(value: string): string {
    return value.replace(/./, (letter) => letter.toUpperCase());
  }

  /**
   * @summary specific for windows, path: user\user => user/user
   * @param value
   * @returns string
   */
  protected swapBackslashToSlash(value: string): string {
    return value.replace(/\\/g, "/");
  }

  /**
   * @summary removes the src prefix, which is determined from the passed arguments
   * @param path
   * @returns string
   */
  protected removeSrcDirectoryPrefix(path: string): string {
    return this.removeDirectoryPrefix(path, this.args.src);
  }

  /**
   * @summary removes the given prefix of the given value
   * @param path
   * @param prefix
   * @returns string
   */
  protected removeDirectoryPrefix(path: string, prefix: string): string {
    return this.swapBackslashToSlash(path).replace(
      new RegExp(`^${this.swapBackslashToSlash(prefix)}(/?)`),
      ""
    );
  }

  /**
   * @summary adds slash at the beginning
   * @param value
   * @returns string
   */
  protected addSlashAtBeginning(value: string): string {
    return "/" + value;
  }

  /**
   * @summary takes a valid source code and compresses it that it fits into one line
   * @param sourceCode
   * @returns string
   */
  protected compressSourceCodeToOneLine(sourceCode: string): string {
    return sourceCode.replace(/.*\s+.*/gm, (gap) => {
      if (gap.match(/^[a-zA-Z].*[a-zA-Z]$/)) {
        return gap.replace(/\s+/g, " ");
      }
      return gap.replace(/\s+/g, "");
    });
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
    return `${file}.g.${this.args.typescriptEnabled ? "ts" : "js"}`;
  }

  /**
   * @summary helper function, which serves in this case as an assembly line with different stops (workstations)
   * @summary each workstation will be called with this (Generator) binded
   * @param workstations
   * @returns Workstation
   */
  protected assemblyLine(...workstations: Workstations): Workstation {
    return workstations.reduce((f, g) => (value) => g.call(this, f.call(this, value)));
  }

  /**
   * @summary merges all the results of the generator functions together
   * @summary gets called with this (generator) binding
   * @param generators
   * @returns string
   */
  protected merge(...generators: ReadonlyArray<VoidCallback<string>>): string {
    let content = "";

    for (const generator of generators) {
      content += generator.call(this);
    }

    return content;
  }

  /**
   * @summary reads json file and parses it
   * @param fromPath
   * @returns Promise<NestedDoc>
   */
  protected readJSONFile(fromPath: string): Promise<NestedDoc> {
    return this.readFile(fromPath).then((data) => JSON.parse(data));
  }

  /**
   * @summary processes the directory which means iterate through each entry in the directory
   * @summary and starts the Sub-processes.
   * @summary the job will be called with this (Generator) binded
   * @param job
   * @param dir
   * @returns PendingJob
   */
  protected async processDirectory(job: Job, dir: string): PendingJob {
    const entries = await fs.readdir(dir);
    const jobs: PendingJobs = [];

    for (const entry of entries) {
      jobs.push(
        this.getEntryStats(dir, entry).then((stats) =>
          job.call(this, {
            stats,
            name: entry,
            directory: dir,
            fromPath: this.join(dir, entry),
          })
        )
      );
    }

    await this.waitForAllJobs(jobs);
  }

  /**
   * @summary waits until all jobs are finished
   * @param jobs
   * @returns PendingJob
   */
  protected async waitForAllJobs(...jobs: ReadonlyArray<PendingJob | PendingJobs>): PendingJob {
    await Promise.all(jobs.flat());
  }

  /**
   * @summary writes the successful generated template to the desired .g.ts file
   * @param data
   * @returns PendingJob
   */
  protected async writeToGeneratedFile(data: string): PendingJob {
    await this.writeFile(this.join(this.args.outDir, this.outFile), data);
  }

  /**
   * @summary logs the error message to the desired error log file
   * @param error
   * @returns PendingJob
   */
  protected async logError(error: unknown): PendingJob {
    await this.appendFile(this.join(this.args.errDir, this.errFile), this.getErrorMessage(error));
  }

  /**
   * @summary appends given data to a file
   * @param path
   * @param data
   * @returns PendingJob
   */
  protected async appendFile(path: string, data: string): PendingJob {
    await fs.appendFile(path, new Uint8Array(Buffer.from(data)));
  }

  /**
   * @summary overwrites a file with the given data
   * @param path
   * @param data
   * @returns PendingJob
   */
  protected async writeFile(path: string, data: string): PendingJob {
    await fs.writeFile(path, new Uint8Array(Buffer.from(data)));
  }

  /**
   * @summary returns an absolute path, based on the dir and the entry
   * @param dir
   * @param entry
   * @returns string
   */
  protected join(dir: string, entry: string): string {
    return path.join(dir, entry);
  }

  /**
   * @summary reads file and returns the content as a string
   * @param fromPath
   * @returns Promise<string>
   */
  protected readFile(fromPath: string): Promise<string> {
    return fs.readFile(fromPath).then((data) => data.toString());
  }

  /**
   * @summary gets Entry stats
   * @param dir
   * @param entry
   * @returns Promise<Stats>
   */
  protected getEntryStats(dir: string, entry: string): Promise<Stats> {
    return fs.stat(this.join(dir, entry));
  }

  /**
   * @summary generates the name from the file name into the constant name: e.g test_keys.g.ts => TestKeys
   * @returns string
   */
  private getGeneratorObjectName(): string {
    return this.outFile
      .replace(new RegExp(`.g.${this.args.typescriptEnabled ? "ts" : "js"}$`), "")
      .toLowerCase()
      .replace(/(^\w)|([-_][a-z])/g, (group) => group.toUpperCase().replace(/_|-/, ""));
  }

  /**
   * @summary gets the Error Message depending on the type of error that was thrown
   * @param error
   * @returns string
   */
  private getErrorMessage(error: unknown): string {
    if (typeof error === "string") {
      return `Error: ${error}, from ${this.name}\n`;
    } else if (error instanceof Error) {
      return `${error.name}: ${error.message}, from ${this.name}\n`;
    } else {
      return `Unknown Error occurred, from ${this.name}\n`;
    }
  }
}
