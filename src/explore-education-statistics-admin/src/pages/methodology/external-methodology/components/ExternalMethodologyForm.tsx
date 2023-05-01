import { FormFieldset, FormGroup } from '@common/components/form';
import Form from '@common/components/form/Form';
import ButtonGroup from '@common/components/ButtonGroup';
import Button from '@common/components/Button';
import FormFieldTextInput from '@common/components/form/FormFieldTextInput';
import { ExternalMethodology } from '@admin/services/publicationService';
import { z } from 'zod';
import { Formik } from 'formik';
import React, { useMemo } from 'react';
import { toFormikValidationSchema } from 'zod-formik-adapter';

interface Props {
  initialValues?: ExternalMethodology;
  onCancel: () => void;
  onSubmit: (values: ExternalMethodology) => void;
}

const ExternalMethodologyForm = ({
  initialValues,
  onCancel,
  onSubmit,
}: Props) => {
  const validationSchema = useMemo(() => {
    const schema = z.object({
      title: z.string({
        required_error: 'Enter an external methodology link title',
      }),
      url: z
        .string({
          required_error: 'Enter an external methodology URL',
        })
        .url('Enter a valid external methodology URL')
        .refine(
          value => {
            return Boolean(
              value &&
                !value.includes(window.location.host) &&
                !value.includes('localhost'),
            );
          },
          {
            message: 'URL must be on a permitted domain',
            path: ['url'],
          },
        ),
    });
    return schema;
  }, []);

  return (
    <Formik<ExternalMethodology>
      enableReinitialize
      initialValues={
        initialValues ?? {
          title: '',
          url: 'https://',
        }
      }
      onSubmit={values => {
        onSubmit(values);
      }}
      validationSchema={toFormikValidationSchema(validationSchema)}
    >
      {form => (
        <Form id="methodology-external">
          <FormFieldset
            id="methodology-external-fieldset"
            legend="Link to an externally hosted methodology"
            legendHidden
          >
            <FormGroup>
              <FormFieldTextInput
                label="Link title"
                name="title"
                className="govuk-!-width-two-thirds"
              />
              <FormFieldTextInput
                label="URL"
                name="url"
                className="govuk-!-width-two-thirds"
              />
            </FormGroup>
            <ButtonGroup>
              <Button type="submit">Save</Button>
              <Button
                type="reset"
                variant="secondary"
                onClick={() => {
                  form.resetForm();
                  onCancel();
                }}
              >
                Cancel
              </Button>
            </ButtonGroup>
          </FormFieldset>
        </Form>
      )}
    </Formik>
  );
};

export default ExternalMethodologyForm;
