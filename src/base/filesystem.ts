import * as path from "node:path";
import { promises as fs, Stats } from "node:fs";

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
 * @summary holds entries (string types)
 */
export type Collection = Array<string>;

/**
 * @summary job which is pending
 */
export type PendingJob = Promise<void>;

/**
 * @summary jobs which are pending
 */
export type PendingJobs = Array<PendingJob>;

/**
 * @summary nested jobs which are pending
 */
export type NestedPendingJobs = ReadonlyArray<PendingJob | PendingJobs | NestedPendingJobs>;

/**

 * @summary nested Json node
 */
export type NestedDoc = { readonly [key: string]: NestedDoc | string };

/**
 * @summary job function type
 */
export type Job = (entry: Entry) => Promise<void>;

/**
 * @summary this class offers the basic functionality which every generator needs to perform its specific task
 */
export class FileSystem {
  /**
   * @summary constructor
   * @returns FileSystem
   */
  constructor() {}

  /**
   * @summary reads json file and parses it
   * @param fromPath
   * @returns Promise<NestedDoc>
   */
  public readJSONFile(fromPath: string): Promise<NestedDoc> {
    return this.readFile(fromPath).then((data) => JSON.parse(data));
  }

  /**
   * @summary processes the directory which means iterate through each entry in the directory
   * @summary and starts the Sub-processes.
   * @param job
   * @param dir
   * @returns PendingJob
   */
  public async processDirectory(job: Job, dir: string): PendingJob {
    const entries = await fs.readdir(dir);
    const jobs: PendingJobs = [];

    for (const entry of entries) {
      jobs.push(
        this.getEntryStats(dir, entry).then((stats) =>
          job({
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
  public async waitForAllJobs(...nestedJobs: NestedPendingJobs): PendingJob {
    for (const nestedJob of nestedJobs) {
      if (Array.isArray(nestedJob)) {
        await this.waitForAllJobs(...nestedJob);
      } else {
        await nestedJob;
      }
    }
  }

  /**
   * @summary appends given data to a file
   * @param path
   * @param data
   * @returns PendingJob
   */
  public async appendFile(path: string, data: string): PendingJob {
    await fs.appendFile(path, new Uint8Array(Buffer.from(data)));
  }

  /**
   * @summary overwrites a file with the given data
   * @param path
   * @param data
   * @returns PendingJob
   */
  public async writeFile(path: string, data: string): PendingJob {
    await fs.writeFile(path, new Uint8Array(Buffer.from(data)));
  }

  /**
   * @summary returns an absolute path, based on the dir and the entry
   * @param dir
   * @param entry
   * @returns string
   */
  public join(...paths: Readonly<Collection>): string {
    return path.join(...paths);
  }

  /**
   * @summary reads file and returns the content as a string
   * @param fromPath
   * @returns Promise<string>
   */
  public readFile(fromPath: string): Promise<string> {
    return fs.readFile(fromPath).then((data) => data.toString());
  }

  /**
   * @summary gets Entry stats
   * @param dir
   * @param entry
   * @returns Promise<Stats>
   */
  public getEntryStats(dir: string, entry: string): Promise<Stats> {
    return fs.stat(this.join(dir, entry));
  }
}
