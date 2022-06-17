/**
 * @summary holds all the templates which are used in the generators to produce a certain output
 * @summary "{{}}" notation means, this is a variable in which the generator will insert its output
 */
export const GeneratorTemplates = {
  /**
   * @summary holds the layout for an list of translations
   */
  translationLayout: `
/**
* Translations: {{ translations }}
*/
  `,
  /**
   * @summary holds a parent translation
   */
  parentTranslation: `
** {{ name }}: ...
  `,
  /**
   * @summary holds a child translation
   */
  childTranslation: `
** {{ name }}: "{{ translation }}"
  `,
  /**
   * @summary holds a parent type declaration
   */
  parentTypeDeclaration: `
readonly {{ name }}:string;
readonly _{{ name }}:{ {{ descendantTypeDeclaration }} }
       `,
  /**
   * @summary holds a parent type declaration with its children translations
   */
  parentTypeDeclarationWithTranslations: `
{{ translations }}readonly {{ name }}:string;
{{ translations }}readonly _{{ name }}:{ {{ descendantTypeDeclaration }} }
  `,
  /**
   * @summary holds a child type declaration
   */
  childTypeDelaration: `
readonly {{ name }}:string;
       `,
  /**
   * @summary holds a child type declaration with its translation
   */
  childTypeDelarationWithTranslation: `
/**
* @example "{{ translation }}"
*/readonly {{ name }}:string;
  `,
  /**
   * @summary holds a parent translation object
   */
  translationObject: `{{ key }}:"{{ value }}",_{{ key }}:{ {{ descendants }} },
  `,
  /**
   * @summary holds a parent translation object with its children translations
   */
  translationObjectWithTranslations: `
{{ translations }}{{ key }}:"{{ value }}",
{{ translations }}_{{ key }}:{ {{ descendants }} },
     `,
  /**
   * @summary presents a key string pair
   */
  keyStringValue: `{{ key }}:"{{ value }}",
  `,
  /**
   * @summary presents a key string pair with its translation
   */
  keyStringValueWithTranslation: `
  /**
 * @example "{{ translation }}"
 */{{ key }}:"{{ value }}",
     `,
  /**
   * @summary holds the header used in every generated output file
   */
  header: `// DO NOT EDIT. This code was generated from the {{ generatorName }}.
// Any changes will be lost when it will be generated again.
{{ addendum }}
export const {{ objectName }}
  `,
  /**
   * @summary holds the footer used in every generated output file
   */
  footer: `{{ addendum }}
// Developed by Sascha Happ.
  `,
};
