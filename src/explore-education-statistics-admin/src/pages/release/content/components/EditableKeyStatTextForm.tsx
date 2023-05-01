import FormFieldEditor from '@admin/components/form/FormFieldEditor';
import { toolbarConfigs } from '@admin/config/ckEditorConfig';
import toHtml from '@admin/utils/markdown/toHtml';
import toMarkdown from '@admin/utils/markdown/toMarkdown';
import Button from '@common/components/Button';
import ButtonGroup from '@common/components/ButtonGroup';
import { Form, FormFieldTextInput } from '@common/components/form';
import useFormSubmit from '@common/hooks/useFormSubmit';
import styles from '@common/modules/find-statistics/components/KeyStat.module.scss';
import { KeyStatisticText } from '@common/services/publicationService';
import { Formik } from 'formik';
import classNames from 'classnames';
import { z } from 'zod';
import React from 'react';

export interface KeyStatTextFormValues {
  title: string;
  statistic: string;
  trend: string;
  guidanceTitle: string;
  guidanceText: string;
}

interface EditableKeyStatTextFormProps {
  keyStat?: KeyStatisticText;
  isReordering?: boolean;
  onSubmit: (values: KeyStatTextFormValues) => Promise<void>;
  onCancel: () => void;
  testId: string;
}

export default function EditableKeyStatTextForm({
  keyStat,
  isReordering,
  onSubmit,
  onCancel,
  testId,
}: EditableKeyStatTextFormProps) {
  const handleSubmit = useFormSubmit<KeyStatTextFormValues>(async values => {
    await onSubmit({
      ...values,
      guidanceTitle: values.guidanceTitle.trim(),
      guidanceText: toMarkdown(values.guidanceText),
    });
  });

  return (
    <div data-testid={testId}>
      <Formik<KeyStatTextFormValues>
        initialValues={{
          title: keyStat?.title ?? '',
          statistic: keyStat?.statistic ?? '',
          trend: keyStat?.trend ?? '',
          guidanceTitle: keyStat?.guidanceTitle ?? 'Help',
          guidanceText: keyStat?.guidanceText
            ? toHtml(keyStat.guidanceText)
            : '',
        }}
        validationSchema={z.object({
          title: z.string({
            required_error: 'Enter a title',
          }).max(60),
          statistic: z.string({
            required_error: 'Enter a statistic',
          }).max(12),
          trend: z.string().max(230),
          guidanceTitle: z.string().max(65),
          guidanceText: z.string(),
        })}
        onSubmit={handleSubmit}
      >
        {form => (
          <Form
            id={
              keyStat
                ? `editableKeyStatTextForm-${keyStat.id}`
                : 'editableKeyStatTextForm-create'
            }
          >
            <div className={styles.textTile}>
              <FormFieldTextInput<KeyStatTextFormValues>
                name="title"
                className={classNames({
                  'govuk-!-width-one-third': isReordering,
                })}
                label={<span>Title</span>}
              />
              <FormFieldTextInput<KeyStatTextFormValues>
                name="statistic"
                className={classNames({
                  'govuk-!-width-one-third': isReordering,
                })}
                label={<span>Statistic</span>}
              />
              <FormFieldTextInput<KeyStatTextFormValues>
                name="trend"
                className={classNames({
                  'govuk-!-width-one-third': isReordering,
                })}
                label={<span>Trend</span>}
              />
            </div>

            <FormFieldTextInput<KeyStatTextFormValues>
              formGroupClass="govuk-!-margin-top-2"
              name="guidanceTitle"
              className={classNames({
                'govuk-!-width-one-third': isReordering,
              })}
              label="Guidance title"
            />

            <FormFieldEditor<KeyStatTextFormValues>
              name="guidanceText"
              toolbarConfig={toolbarConfigs.simple}
              label="Guidance text"
            />

            <ButtonGroup>
              <Button disabled={form.isSubmitting} type="submit">
                Save
              </Button>
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            </ButtonGroup>
          </Form>
        )}
      </Formik>
    </div>
  );
}
