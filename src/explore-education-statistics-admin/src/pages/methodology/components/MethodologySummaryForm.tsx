import Button from '@common/components/Button';
import ButtonGroup from '@common/components/ButtonGroup';
import ButtonText from '@common/components/ButtonText';
import Form from '@common/components/form/Form';
import FormFieldTextInput from '@common/components/form/FormFieldTextInput';
import FormFieldRadioGroup from '@common/components/form/FormFieldRadioGroup';
import useFormSubmit from '@common/hooks/useFormSubmit';
import { mapFieldErrors } from '@common/validation/serverValidations';
import { Formik } from 'formik';
import React from 'react';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';

export interface MethodologySummaryFormValues {
  title: string;
  titleType: 'default' | 'alternative';
}

const errorMappings = [
  mapFieldErrors<MethodologySummaryFormValues>({
    target: 'title',
    messages: {
      SlugNotUnique: 'Choose a unique title',
    },
  }),
];

interface Props {
  id: string;
  initialValues?: MethodologySummaryFormValues;
  defaultTitle: string;
  submitText: string;
  onCancel: () => void;
  onSubmit: (values: MethodologySummaryFormValues) => void;
}

const MethodologySummaryForm = ({
  id,
  initialValues,
  defaultTitle,
  submitText,
  onCancel,
  onSubmit,
}: Props) => {
  const handleSubmit = useFormSubmit<MethodologySummaryFormValues>(
    async values => {
      onSubmit({
        ...values,
        title: values.titleType === 'default' ? defaultTitle : values.title,
      });
    },
    errorMappings,
  );

  return (
    <Formik<MethodologySummaryFormValues>
      enableReinitialize
      initialValues={
        initialValues ??
        ({
          title: '',
          titleType: 'default',
        } as MethodologySummaryFormValues)
      }
      validationSchema={toFormikValidationSchema(
        z
          .object({
            titleType: z.union([
              z.literal('default'),
              z.literal('alternative'),
            ]),

            // title: Yup.string().when('titleType', {
            //   is: 'alternative',
            //   then: s => s.required('Enter a methodology title'),
            // }),

            title: z.string(),
          })
          .superRefine((data, ctx) => {
            if (data.titleType === 'alternative' && !data.title) {
              ctx.addIssue({
                path: ['title'],
                message: 'Enter a methodology title',
                code: 'custom',
              });
            }
          }),
      )}
      onSubmit={handleSubmit}
    >
      <Form id={id}>
        <FormFieldRadioGroup<MethodologySummaryFormValues>
          legend="Methodology title"
          name="titleType"
          order={[]}
          options={[
            {
              label: 'Use publication title',
              value: 'default',
            },
            {
              label: 'Set an alternative title',
              value: 'alternative',
              conditional: (
                <FormFieldTextInput<MethodologySummaryFormValues>
                  label="Enter methodology title"
                  name="title"
                />
              ),
            },
          ]}
        />
        <ButtonGroup>
          <Button type="submit">{submitText}</Button>
          <ButtonText onClick={onCancel}>Cancel</ButtonText>
        </ButtonGroup>
      </Form>
    </Formik>
  );
};

export default MethodologySummaryForm;
