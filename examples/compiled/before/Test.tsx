import useTranslation from "next-translate/useTranslation";

import { LocaleKeys } from "../../generated/locale_keys.g";

export const Test = () => {
  const { t } = useTranslation(LocaleKeys.common);

  return (
    <div>
      <div>{t(LocaleKeys._common.title)}</div>
      <div>{t(LocaleKeys._home.description)}</div>
      <div>{t(`${LocaleKeys._more_examples._nested_example.very_nested}.nested`)}</div>
    </div>
  );
};
