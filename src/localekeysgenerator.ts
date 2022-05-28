import { BaseARGS, Entry, Generator, Maybe, NestedDoc, PendingJob } from "./generator";

/**
 * @summary args which can or should be received in ordner to perform the desired output
 */
type ARGS = BaseARGS & {
  readonly nsSeparator: string;
  readonly keySeparator: string;
  readonly translationsEnabled: boolean;
};

/**
 * @summary array of descendants which can not be modified
 */
type Descendants = ReadonlyArray<Descendant>;

/**
 * @summary descendant type which establishes the relation between ancestors and descendants
 */
type Descendant = {
  readonly name: string;
  readonly ancestorChain: string;
  readonly translation: Maybe<string>;
  readonly descendants: Maybe<Descendants>;
};

/**
 * @summary data type which is used for the originals in this case "namespaces"
 */
type Original = {
  readonly name: string;
  readonly descendants: Descendants;
};

/**
 * @summary class which provides the functionality for the generation
 */
export class LocaleKeysGenerator extends Generator<ARGS> {
  /**
   * @summary name of the class
   */
  public readonly name: string = "LocaleKeysGenerator";

  /**
   * @summary the translation file format
   */
  private readonly transFileExt: string = ".json";

  /**
   * @summary contains all the translation namespaces
   */
  private readonly originals: Array<Original> = [];

  /**
   * @summary constructor
   * @param args
   * @returns LocaleKeysGenerator
   */
  constructor(args: ARGS) {
    super("locale_keys", args);
  }

  /**
   * @summary api is public accessible to start the generate process
   * @summary logs errors if errors occur during the process
   * @returns PendingJob
   */
  public async generate(): PendingJob {
    try {
      await this.processLocaleDirectory(this.args.src);
      await this.writeToGeneratedFile(this.getLocaleKeysContent());
    } catch (error) {
      await this.logError(error);
    }
  }

  /**
   * @summary generates the template which will be written to the .g.ts file
   * @returns string
   */
  private getLocaleKeysContent(): string {
    if (this.args.typescriptEnabled) {
      return this.merge(
        this.getHeader,
        this.getLocaleKeysTypeDeclaration,
        this.getLocaleKeysObject,
        this.getFooter
      );
    }

    return this.merge(this.getHeader, this.getLocaleKeysObject, this.getFooter);
  }

  /**
   * @summary returns the complete type declaration for the locale keys
   * @returns string
   */
  private getLocaleKeysTypeDeclaration(): string {
    let content = ":{";

    for (const { name, descendants } of this.originals) {
      content += this.args.translationsEnabled
        ? this.getTemplate("parentTypeDeclarationWithTranslations", {
            name: this.getValidLocaleKeyName(name),
            translations: this.getLocaleKeyTranslationLayout(
              this.getLocaleKeyTranslations(descendants!)
            ),
            descendantTypeDeclaration: this.getLocaleKeyDescendantsTypeDeclaration(descendants!),
          })
        : this.getTemplate("parentTypeDeclaration", {
            name: this.getValidLocaleKeyName(name),
            descendantTypeDeclaration: this.getLocaleKeyDescendantsTypeDeclaration(descendants!),
          });
    }

    return content + "}";
  }

  /**
   * @summary returns the translation object
   * @returns string
   */
  private getLocaleKeysObject(): string {
    let content = "={";

    for (const { name, descendants } of this.originals) {
      content +=
        !this.args.typescriptEnabled && this.args.translationsEnabled
          ? this.getTemplate("translationObjectWithTranslations", {
              value: name,
              key: this.getValidLocaleKeyName(name),
              translations: this.getLocaleKeyTranslationLayout(
                this.getLocaleKeyTranslations(descendants!)
              ),
              descendants: this.getLocaleKeyDescendantsTemplate(descendants),
            })
          : this.getTemplate("translationObject", {
              value: name,
              key: this.getValidLocaleKeyName(name),
              descendants: this.getLocaleKeyDescendantsTemplate(descendants),
            });
    }

    return content + "};";
  }

  /**
   * @summary processes the directory
   * @param dir
   * @returns PendingJob
   */
  private processLocaleDirectory(dir: string): PendingJob {
    return this.processDirectory(this.processLocaleEntry, dir);
  }

  /**
   * @summary process the entry in the directory and checks whether it is a translation file or directory
   * @summary and handles it appropriately
   * @param entry
   * @returns PendingJob
   */
  private async processLocaleEntry(entry: Entry): PendingJob {
    if (entry.stats.isFile() && entry.name.endsWith(this.transFileExt)) {
      await this.processTranslationFile(entry.name.replace(this.transFileExt, ""), entry.fromPath);
    } else if (entry.stats.isDirectory()) {
      await this.processLocaleDirectory(entry.fromPath);
    }
  }

  /**
   * @summary reads the translation file and processes it's data
   * @param fileName
   * @param fromPath
   * @returns PendingJob
   */
  private async processTranslationFile(fileName: string, fromPath: string): PendingJob {
    const doc = await this.readJSONFile(fromPath);

    this.originals.push({
      name: fileName,
      descendants: this.generateLocaleKeyDescendants(doc, fileName + this.args.nsSeparator),
    });
  }

  /**
   * @summary generates the formatted string for a childless descendant
   * @param descendant
   * @returns string
   */
  private getLocaleKeyChildTemplate({ name, ancestorChain, translation }: Descendant): string {
    return !this.args.typescriptEnabled && this.args.translationsEnabled
      ? this.getTemplate("keyStringValueWithTranslation", {
          key: this.getValidLocaleKeyName(name),
          value: ancestorChain + name,
          translation: translation ?? "",
        })
      : this.getTemplate("keyStringValue", {
          key: this.getValidLocaleKeyName(name),
          value: ancestorChain + name,
        });
  }

  /**
   * @summary generates the type declaration for a childless descendant
   * @param descendant
   * @returns string
   */
  private getLocaleKeyChildTypeDeclaration({ name, translation }: Descendant): string {
    return this.args.translationsEnabled
      ? this.getTemplate("childTypeDelarationWithTranslation", {
          name: this.getValidLocaleKeyName(name),
          translation: translation ?? "",
        })
      : this.getTemplate("childTypeDelaration", {
          name: this.getValidLocaleKeyName(name),
        });
  }

  /**
   * @summary generates the formatted string for a not childless descendant
   * @param descendant
   * @returns string
   */
  private getLocaleKeyParentTemplate({ name, ancestorChain, descendants }: Descendant): string {
    return !this.args.typescriptEnabled && this.args.translationsEnabled
      ? this.getTemplate("translationObjectWithTranslations", {
          key: this.getValidLocaleKeyName(name),
          value: ancestorChain + name,
          translations: this.getLocaleKeyTranslationLayout(
            this.getLocaleKeyTranslations(descendants!)
          ),
          descendants: this.getLocaleKeyDescendantsTemplate(descendants!),
        })
      : this.getTemplate("translationObject", {
          key: this.getValidLocaleKeyName(name),
          value: ancestorChain + name,
          descendants: this.getLocaleKeyDescendantsTemplate(descendants!),
        });
  }

  /**
   * @summary generates the type declarations for a not childless descendant
   * @param descendant
   * @returns string
   */
  private getLocaleKeyParentTypeDeclaration({ name, descendants }: Descendant): string {
    return this.args.translationsEnabled
      ? this.getTemplate("parentTypeDeclarationWithTranslations", {
          name: this.getValidLocaleKeyName(name),
          translations: this.getLocaleKeyTranslationLayout(
            this.getLocaleKeyTranslations(descendants!)
          ),
          descendantTypeDeclaration: this.getLocaleKeyDescendantsTypeDeclaration(descendants!),
        })
      : this.getTemplate("parentTypeDeclaration", {
          name: this.getValidLocaleKeyName(name),
          descendantTypeDeclaration: this.getLocaleKeyDescendantsTypeDeclaration(descendants!),
        });
  }

  /**
   * @summary wraps the translations to receive the right structure
   * @param translations
   * @returns string
   */
  private getLocaleKeyTranslationLayout(translations: string): string {
    return this.getTemplate("translationLayout", { translations });
  }

  /**
   * @summary returns the translation for all their descendants
   * @param descendants
   * @returns string
   */
  private getLocaleKeyTranslations(descendants: Descendants): string {
    let translations = "";

    for (const { name, translation } of descendants) {
      translations += translation
        ? this.getTemplate("childTranslation", { name, translation })
        : this.getTemplate("parentTranslation", { name });
    }

    return translations;
  }

  /**
   * @summary used to format name that is later used in the .{} notation
   * @param name
   * @returns string
   */
  private getValidLocaleKeyName(name: string): string {
    return this.swapHyphenToUnderscore(name);
  }

  /**
   * @summary maps all descendants together in the right template format
   * @param descendants
   * @returns string
   */
  private getLocaleKeyDescendantsTemplate(descendants: Descendants): string {
    let template = "";

    for (const descendant of descendants) {
      template += descendant.descendants
        ? this.getLocaleKeyParentTemplate(descendant)
        : this.getLocaleKeyChildTemplate(descendant);
    }

    return template;
  }

  /**
   * @summary maps all type declaration for all descendants togehter
   * @param descendants
   * @returns string
   */
  private getLocaleKeyDescendantsTypeDeclaration(descendants: Descendants): string {
    let declaration = "";

    for (const descendant of descendants) {
      declaration += descendant.descendants
        ? this.getLocaleKeyParentTypeDeclaration(descendant)
        : this.getLocaleKeyChildTypeDeclaration(descendant);
    }

    return declaration;
  }

  /**
   * @summary generates descendants
   * @param doc
   * @param ancestorChain
   * @returns Descendants
   */
  private generateLocaleKeyDescendants(doc: NestedDoc, ancestorChain: string): Descendants {
    const descendants: Array<Descendant> = [];

    for (const key in doc) {
      const entry = doc[key];

      descendants.push({
        name: key,
        ancestorChain,
        translation: this.isString(entry) ? entry : null,
        descendants: this.isObject(entry)
          ? this.generateLocaleKeyDescendants(entry, ancestorChain + key + this.args.keySeparator)
          : null,
      });
    }

    return descendants;
  }
}
