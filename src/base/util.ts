/**
 * @summary returns maybe the wanted result
 */
export type Maybe<Result> = Result | null | undefined | void;

/**
 * @summary  holds readonly key string values
 */
export type ReadonlyDocument = { readonly [key: string]: string };

/**
 * @summary serves as a callback that can be invoked without any arguments
 */
export type VoidCallback<ReturnType> = () => ReturnType;

/**
 *
 */
export class Util {
  /**
   * @summary constructor
   * @returns Utils
   */
  constructor() {}

  /**
   * @summary swaps all hyphen to underscores
   * @param value
   * @returns string
   */
  public swapHyphenToUnderscore(value: string): string {
    return value.replace(/-/g, "_");
  }

  /**
   * @summary specific for windows, path: user\user => user/user
   * @param value
   * @returns string
   */
  public swapBackslashToSlash(value: string): string {
    return value.replace(/\\/g, "/");
  }

  /**
   * @summary checks if value is a string
   * @param value
   * @returns boolean
   */
  public isString(value: unknown): value is string {
    return typeof value === "string";
  }

  /**
   * @summary checks if value is a object
   * @param value
   * @returns boolean
   */
  public isObject(value: unknown): value is object {
    return typeof value === "object";
  }

  /**
   * @summary merges all the results of the generator functions together
   * @param generators
   * @returns string
   */
  public merge(...generators: ReadonlyArray<VoidCallback<string>>): string {
    let content = "";

    for (const generator of generators) {
      content += generator();
    }

    return content;
  }
}
