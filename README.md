# Next-translate LocaleKeys Generator
Intended for use in conjunction with [next-translate](https://github.com/vinissimus/next-translate).
Used for generating all possible keys for the useTranslation hook with type safety.

### How to install
`npm install --save-dev next-translate-localekeys-generator`

### How to run
`npx next-translate-localekeys-generate`


### Code Example

#### Requirements
1. Translation Files are in /examples/locales/en
2. Goal to get all my locale keys in the generated (/examples/generated) folder with typescript support and translation comments
3. Using [default seperator](https://github.com/vinissimus/next-translate#3-configuration) for next-translate

#### Actions
1. run `npm next-translate-localekeys-generate --rootDir ./examples/locales/en --outDir ./examples/generated --typescriptEnabled --translationsEnabled`
2. Go to your file where you want to use the useTranslation hook
3. 
```tsx
import { FC } from 'react'; 
import useTranslation from 'next-translate/useTranslation';
import { LocaleKeys } from './examples/generated/locale_keys.g';

export const DivWithTitleFromCommonNamespace: FC = () => {
    const { t } = useTranslation(LocaleKeys.common);

    return <div>{t(LocaleKeys._common.title)}</div>;
}
```


### Configuration
To get all configurations possible:
`npx next-translate-localekeys-generate --help`

| Flag | Description | Type | Default | Required |
| ---- | ----------- | ---- | ------- | -------- |
| `rootDir` | where the locale translation json files are located. | `string` | - |  *
| `outDir` | where the generated output should be placed in. | `string` | - | *
| `errDir` | where the error file should be placed in. | `string` | `outDir` | 
| `typescriptEnabled` | enables typescript with type safety and readonly modifier. | `boolean` | `false` | 
| `translationsEnabled` | enables translation comments. | `boolean` | `false` |
| `nsSeparator` | char to split namespace from key. | `string` | `":"` |
| `keySeparator` | change the separator that is used for nested keys. | `string` | `"."` |