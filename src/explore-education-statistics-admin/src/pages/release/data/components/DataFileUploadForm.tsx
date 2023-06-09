import Button from '@common/components/Button';
import ButtonGroup from '@common/components/ButtonGroup';
import ButtonText from '@common/components/ButtonText';
import { Form, FormFieldRadioGroup } from '@common/components/form';
import FormFieldFileInput from '@common/components/form/FormFieldFileInput';
import LoadingSpinner from '@common/components/LoadingSpinner';
import useFormSubmit from '@common/hooks/useFormSubmit';
import {
  FieldMessageMapper,
  mapFieldErrors,
} from '@common/validation/serverValidations';
import useMountedRef from '@common/hooks/useMountedRef';
import { Formik } from 'formik';
import React, { ReactNode } from 'react';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';

export interface DataFileUploadFormValues {
  uploadType: 'csv' | 'zip';
  dataFile: File | null;
  metadataFile: File | null;
  zipFile: File | null;
}

const baseErrorMappings = (
  values: DataFileUploadFormValues,
): FieldMessageMapper<DataFileUploadFormValues>[] => {
  if (values.uploadType === 'zip') {
    return [
      mapFieldErrors<DataFileUploadFormValues>({
        target: 'zipFile',
        messages: {
          DataZipMustBeZipFile: 'Choose a valid ZIP file',
          DataZipFileCanOnlyContainTwoFiles:
            'ZIP file can only contain two CSV files',
          DataZipFileDoesNotContainCsvFiles:
            'ZIP file does not contain any CSV files',
          DataFilenameNotUnique: 'Choose a unique ZIP data file name',
          DataAndMetadataFilesCannotHaveTheSameName:
            'ZIP data and metadata filenames cannot be the same',
          DataFileCannotBeEmpty: 'Choose a ZIP data file that is not empty',
          DataFilenameCannotContainSpacesOrSpecialCharacters:
            'ZIP data filename cannot contain spaces or special characters',
          MetadataFileCannotBeEmpty:
            'Choose a ZIP metadata file that is not empty',
          MetaFilenameCannotContainSpacesOrSpecialCharacters:
            'ZIP metadata filename cannot contain spaces or special characters',
          MetaFileIsIncorrectlyNamed:
            'ZIP metadata filename must end with .meta.csv',
        },
      }),
    ];
  }

  return [
    mapFieldErrors<DataFileUploadFormValues>({
      target: 'dataFile',
      messages: {
        DataFilenameNotUnique: 'Choose a unique data file name',
        DataAndMetadataFilesCannotHaveTheSameName:
          'Choose a different file name for data and metadata files',
        DataFileCannotBeEmpty: 'Choose a data file that is not empty',
        DataFileMustBeCsvFile: 'Data file must be a CSV with UTF-8 encoding',
        DataFilenameCannotContainSpacesOrSpecialCharacters:
          'Data filename cannot contain spaces or special characters',
      },
    }),
    mapFieldErrors<DataFileUploadFormValues>({
      target: 'metadataFile',
      messages: {
        MetadataFileCannotBeEmpty: 'Choose a metadata file that is not empty',
        MetaFileMustBeCsvFile:
          'Metadata file must be a CSV with UTF-8 encoding',
        MetaFilenameCannotContainSpacesOrSpecialCharacters:
          'Metadata filename cannot contain spaces or special characters',
        MetaFileIsIncorrectlyNamed: 'Metadata filename is incorrectly named',
      },
    }),
  ];
};

interface Props<FormValues extends DataFileUploadFormValues> {
  beforeFields?: ReactNode;
  errorMappings?: FieldMessageMapper<FormValues>[];
  id?: string;
  initialValues?: FormValues;
  validationSchema?: (
    baseSchema: z.ZodSchema<DataFileUploadFormValues>,
  ) => z.ZodSchema<FormValues>;
  submitText?: string;
  onSubmit: (values: FormValues) => void;
}

const DataFileUploadForm = <FormValues extends DataFileUploadFormValues>({
  beforeFields,
  errorMappings = [],
  id = 'dataFileUploadForm',
  initialValues,
  submitText = 'Upload data files',
  validationSchema,
  onSubmit,
}: Props<FormValues>) => {
  const isMounted = useMountedRef();

  const handleSubmit = useFormSubmit<FormValues>(
    async (values, actions) => {
      await onSubmit(values);
      if (isMounted.current) {
        actions.resetForm();
      }
    },
    values => {
      return [...baseErrorMappings(values), ...errorMappings];
    },
  );

  return (
    <Formik<FormValues>
      enableReinitialize
      initialValues={
        initialValues ??
        ({
          uploadType: 'csv',
          dataFile: null,
          metadataFile: null,
          zipFile: null,
        } as FormValues)
      }
      onReset={() => {
        document
          .querySelectorAll(`#${id} input[type='file']`)
          .forEach(input => {
            const fileInput = input as HTMLInputElement;
            fileInput.value = '';
          });
      }}
      onSubmit={handleSubmit}
      validationSchema={() => {
        // TODO: convert to zod
        const baseSchema: z.ZodSchema<DataFileUploadFormValues> = toFormikValidationSchema(
          z
            .object({
              uploadType: z.enum(['csv', 'zip']),
              dataFile: z.any().refine((data: File) => {
                return data.size > 0;
              }),
              metadataFile: z.any().refine((data: File) => {
                return data.size > 0;
              }),
              zipFile: z.any().refine((data: File) => {
                return data.size > 0;
              }),

              // uploadType: Yup.mixed<DataFileUploadFormValues['uploadType']>()
              //   .required()
              //   .oneOf(['csv', 'zip']),
              // dataFile: Yup.file().when('uploadType', {
              //   is: 'csv',
              //   then: s =>
              //     s.minSize(0, 'Choose a data file that is not empty').required(),
              // }),
              // metadataFile: Yup.file().when('uploadType', {
              //   is: 'csv',
              //   then: s =>
              //     s
              //       .minSize(0, 'Choose a metadata file that is not empty')
              //       .required('Choose a metadata file')
              // }),
              // zipFile: Yup.file().when('uploadType', {
              //   is: 'zip',
              //   then: s =>
              //     s
              //       .minSize(0, 'Choose a ZIP file that is not empty')
              //       .required('Choose a zip file')
              // }),
            })
            .superRefine((data, ctx) => {
              if (
                (data.uploadType === 'csv' && !data.dataFile) ||
                !data.metadataFile
              ) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'Choose a data file and a metadata file',
                  path: ['dataFile', 'metadataFile'],
                });
              }

              if (data.uploadType === 'zip' && !data.zipFile) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'Choose a ZIP file',
                  path: ['zipFile'],
                });
              }
            }),
        );

        return validationSchema
          ? validationSchema(baseSchema)
          : toFormikValidationSchema(baseSchema);
      }}
    >
      {form => (
        <>
          <Form id={id}>
            <div style={{ position: 'relative' }}>
              {form.isSubmitting && (
                <LoadingSpinner text="Uploading files" overlay />
              )}

              {beforeFields}

              <FormFieldRadioGroup<DataFileUploadFormValues>
                name="uploadType"
                legend="Choose upload method"
                options={[
                  {
                    label: 'CSV files',
                    value: 'csv',
                    conditional: (
                      <>
                        <FormFieldFileInput<DataFileUploadFormValues>
                          name="dataFile"
                          label="Upload data file"
                          accept=".csv"
                        />

                        <FormFieldFileInput<DataFileUploadFormValues>
                          name="metadataFile"
                          label="Upload metadata file"
                          accept=".csv"
                        />
                      </>
                    ),
                  },
                  {
                    label: 'ZIP file',
                    hint: 'Recommended for larger data files',
                    value: 'zip',
                    conditional: (
                      <FormFieldFileInput<DataFileUploadFormValues>
                        hint="Must contain both the data and metadata CSV files"
                        name="zipFile"
                        label="Upload ZIP file"
                        accept=".zip"
                      />
                    ),
                  },
                ]}
              />

              <ButtonGroup>
                <Button type="submit" disabled={form.isSubmitting}>
                  {submitText}
                </Button>

                <ButtonText
                  disabled={form.isSubmitting}
                  onClick={() => {
                    form.resetForm();
                  }}
                >
                  Cancel
                </ButtonText>
              </ButtonGroup>
            </div>
          </Form>
        </>
      )}
    </Formik>
  );
};

export default DataFileUploadForm;
