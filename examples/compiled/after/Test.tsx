import useTranslation from "next-translate/useTranslation";



export const Test = () => {
  const { t } = useTranslation('common');

  return (
    <div>
      <div>{t('common:title')}</div>
      <div>{t('home:description')}</div>
      <div>{t(`${'more_examples:nested-example.very-nested'}.nested`)}</div>
    </div>
  );
};
