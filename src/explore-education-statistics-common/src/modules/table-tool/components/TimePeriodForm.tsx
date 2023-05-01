import { Form, FormFieldSelect, FormFieldset } from '@common/components/form';
import { SelectOption } from '@common/components/form/FormSelect';
import SummaryList from '@common/components/SummaryList';
import SummaryListItem from '@common/components/SummaryListItem';
import ResetFormOnPreviousStep from '@common/modules/table-tool/components/ResetFormOnPreviousStep';
import WizardStepSummary from '@common/modules/table-tool/components/WizardStepSummary';
import {
  SubjectMeta,
  TimePeriodQuery,
} from '@common/services/tableBuilderService';
import { z } from 'zod';
import { Formik } from 'formik';
import React, { useMemo } from 'react';
import { InjectedWizardProps } from './Wizard';
import WizardStepFormActions from './WizardStepFormActions';
import WizardStepHeading from './WizardStepHeading';

interface FormValues {
  start: string;
  end: string;
}

export type TimePeriodFormSubmitHandler = (values: FormValues) => void;

const formId = 'timePeriodForm';

interface Props extends InjectedWizardProps {
  initialValues?: Partial<TimePeriodQuery>;
  options: SubjectMeta['timePeriod']['options'];
  onSubmit: TimePeriodFormSubmitHandler;
}

const TimePeriodForm = ({
  initialValues = {},
  options,
  onSubmit,
  ...stepProps
}: Props) => {
  const { isActive, goToNextStep } = stepProps;

  const timePeriodOptions: SelectOption[] = [
    {
      label: 'Please select',
      value: '',
    },
    ...options.map(option => {
      return {
        label: option.label,
        value: `${option.year}_${option.code}`,
      };
    }),
  ];

  const getOptionLabel = (optionValue: string) => {
    const matchingOption = timePeriodOptions.find(
      option => option.value === optionValue,
    );

    return matchingOption ? matchingOption.label : '';
  };

  const getDisplayTimePeriod = (
    startValue: string,
    endValue: string,
  ): string => {
    if (startValue === endValue) {
      return getOptionLabel(startValue);
    }
    return `${getOptionLabel(startValue)} to ${getOptionLabel(endValue)}`;
  };

  const formInitialValues = useMemo(() => {
    const { startYear, startCode, endYear, endCode } = initialValues;

    const start = startYear && startCode ? `${startYear}_${startCode}` : '';
    const end = endYear && endCode ? `${endYear}_${endCode}` : '';

    return {
      start,
      end,
    };
  }, [initialValues]);

  const stepHeading = (
    <WizardStepHeading {...stepProps} fieldsetHeading>
      Choose time period
    </WizardStepHeading>
  );

  return (
    <Formik<FormValues>
      enableReinitialize
      initialValues={formInitialValues}
      validateOnBlur={false}
      validationSchema={z
        .object({
          start: z.string({
            required_error: 'Start date required',
          }),
          end: z.string({
            required_error: 'End date required',
          }),
        })
        .superRefine((data, ctx) => {
          const { start, end } = data;

          if (start && end) {
            const startIndex = timePeriodOptions.findIndex(
              option => option.value === start,
            );
            const endIndex = timePeriodOptions.findIndex(
              option => option.value === end,
            );

            if (startIndex > endIndex) {
              ctx.addIssue({
                code: 'custom',
                message: 'End date must be after start date',
              });
            }
          }

          return data;
        })}
      onSubmit={async values => {
        await goToNextStep(async () => {
          await onSubmit(values);
        });
      }}
    >
      {form => {
        return isActive ? (
          <Form id={formId} showSubmitError>
            <FormFieldset id="timePeriod" legend={stepHeading}>
              <FormFieldSelect
                name="start"
                label="Start date"
                disabled={form.isSubmitting}
                options={timePeriodOptions}
                order={[]}
              />
              <FormFieldSelect
                name="end"
                label="End date"
                disabled={form.isSubmitting}
                options={timePeriodOptions}
                order={[]}
              />
            </FormFieldset>

            <WizardStepFormActions
              {...stepProps}
              isSubmitting={form.isSubmitting}
            />
          </Form>
        ) : (
          <WizardStepSummary {...stepProps} goToButtonText="Edit time period">
            {stepHeading}

            <SummaryList noBorder>
              <SummaryListItem term="Time period">
                {form.values.start &&
                  form.values.end &&
                  getDisplayTimePeriod(form.values.start, form.values.end)}
              </SummaryListItem>
            </SummaryList>

            <ResetFormOnPreviousStep {...stepProps} onReset={form.resetForm} />
          </WizardStepSummary>
        );
      }}
    </Formik>
  );
};

export default TimePeriodForm;
