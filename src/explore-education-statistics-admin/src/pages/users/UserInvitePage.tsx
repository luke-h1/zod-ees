import Page from '@admin/components/Page';
import userService, {
  ResourceRoles,
  Role,
  UserInvite,
} from '@admin/services/userService';
import Button from '@common/components/Button';
import ButtonText from '@common/components/ButtonText';
import Form from '@common/components/form/Form';
import FormFieldSelect from '@common/components/form/FormFieldSelect';
import FormFieldTextInput from '@common/components/form/FormFieldTextInput';
import { ErrorControlState } from '@common/contexts/ErrorControlContext';
import useFormSubmit from '@common/hooks/useFormSubmit';
import { mapFieldErrors } from '@common/validation/serverValidations';
import { Formik } from 'formik';
import orderBy from 'lodash/orderBy';
import { RouteComponentProps } from 'react-router';
import useAsyncHandledRetry from '@common/hooks/useAsyncHandledRetry';
import LoadingSpinner from '@common/components/LoadingSpinner';
import { IdTitlePair } from '@admin/services/types/common';
import ButtonGroup from '@common/components/ButtonGroup';
import InviteUserReleaseRoleForm from '@admin/pages/users/components/InviteUserReleaseRoleForm';
import publicationService from '@admin/services/publicationService';
import { PublicationSummary } from '@common/services/publicationService';
import InviteUserPublicationRoleForm from '@admin/pages/users/components/InviteUserPublicationRoleForm';
import React from 'react';
import { z } from 'zod';

export interface InviteUserReleaseRole {
  releaseId: string;
  releaseTitle?: string;
  releaseRole: string;
}

export interface InviteUserPublicationRole {
  publicationId: string;
  publicationTitle?: string;
  publicationRole: string;
}

interface FormValues {
  userEmail: string;
  roleId: string;
  userReleaseRoles: InviteUserReleaseRole[];
  userPublicationRoles: InviteUserPublicationRole[];
}

const errorMappings = [
  mapFieldErrors<FormValues>({
    target: 'userEmail',
    messages: {
      UserAlreadyExists: 'User already exists',
    },
  }),
];

interface InviteUserModel {
  roles: Role[];
  resourceRoles: ResourceRoles;
  releases: IdTitlePair[];
  publications: PublicationSummary[];
}

const UserInvitePage = ({
  history,
}: RouteComponentProps & ErrorControlState) => {
  const formId = 'inviteUserForm';

  const { value: model, isLoading } = useAsyncHandledRetry<
    InviteUserModel
  >(async () => {
    const [roles, resourceRoles, releases, publications] = await Promise.all([
      userService.getRoles(),
      userService.getResourceRoles(),
      userService.getReleases(),
      publicationService.getPublicationSummaries(),
    ]);
    return { roles, resourceRoles, releases, publications };
  }, []);

  const handleSubmit = useFormSubmit<FormValues>(async values => {
    const userReleaseRoles = values.userReleaseRoles.map(userReleaseRole => {
      return {
        releaseId: userReleaseRole.releaseId,
        releaseRole: userReleaseRole.releaseRole,
      };
    });
    const userPublicationRoles = values.userPublicationRoles.map(
      userPublicationRole => {
        return {
          publicationId: userPublicationRole.publicationId,
          publicationRole: userPublicationRole.publicationRole,
        };
      },
    );
    const submission: UserInvite = {
      email: values.userEmail,
      roleId: values.roleId,
      userReleaseRoles,
      userPublicationRoles,
    };

    await userService.inviteUser(submission);

    history.push(`/administration/users/invites`);
  }, errorMappings);

  return (
    <LoadingSpinner loading={!model || isLoading}>
      <Page
        title="Invite user"
        caption="Manage access to this service"
        wide
        breadcrumbs={[
          { name: 'Platform administration', link: '/administration' },
          { name: 'Invites', link: '/administration/users/invites' },
          { name: 'Invite user' },
        ]}
      >
        <Formik<FormValues>
          enableReinitialize
          initialValues={{
            userEmail: '',
            roleId: orderBy(model?.roles, role => role.name)?.[0]?.id ?? '',
            userReleaseRoles: [],
            userPublicationRoles: [],
          }}
          validationSchema={z.object<FormValues>({
            userEmail: z.string({
              required_error: 'Provide the users email',
            })
              .email('Provide a valid email address'),
            roleId: z.string({
              required_error: 'Choose role for the user',
            }),
            userReleaseRoles: z.array<InviteUserReleaseRole>({
              required_error: 'Choose at least one release role',
            }),
            userPublicationRoles: z.array<InviteUserPublicationRole>({
              required_error: 'Choose at least one publication role',
            }),
          })}
          onSubmit={handleSubmit}
        >
          {form => {
            return (
              <Form id={formId}>
                <FormFieldTextInput<FormValues>
                  label="User email"
                  name="userEmail"
                  width={20}
                  hint="The invited user must be on the DfE AAD. Contact explore.statistics@education.gov.uk if unsure."
                />

                <FormFieldSelect<FormValues>
                  label="Role"
                  name="roleId"
                  hint="The user's role within the service."
                  placeholder="Choose role"
                  options={model?.roles?.map(role => ({
                    label: role.name,
                    value: role.id,
                  }))}
                />

                <InviteUserReleaseRoleForm
                  releases={model?.releases}
                  releaseRoles={model?.resourceRoles.Release}
                  userReleaseRoles={form.values.userReleaseRoles}
                  onAddUserReleaseRole={newUserReleaseRole => {
                    form.setFieldValue('userReleaseRoles', [
                      ...form.values.userReleaseRoles,
                      newUserReleaseRole,
                    ]);
                  }}
                  onRemoveUserReleaseRole={userReleaseRoleToRemove => {
                    form.setFieldValue(
                      'userReleaseRoles',
                      form.values.userReleaseRoles.filter(
                        userReleaseRole =>
                          userReleaseRoleToRemove !== userReleaseRole,
                      ),
                    );
                  }}
                />

                <InviteUserPublicationRoleForm
                  publications={model?.publications}
                  publicationRoles={model?.resourceRoles.Publication}
                  userPublicationRoles={form.values.userPublicationRoles}
                  onAddUserPublicationRole={newUserPublicationRole => {
                    form.setFieldValue('userPublicationRoles', [
                      ...form.values.userPublicationRoles,
                      newUserPublicationRole,
                    ]);
                  }}
                  onRemoveUserPublicationRole={userPublicationRoleToRemove => {
                    form.setFieldValue(
                      'userPublicationRoles',
                      form.values.userPublicationRoles.filter(
                        userPublicationRole =>
                          userPublicationRoleToRemove !== userPublicationRole,
                      ),
                    );
                  }}
                />

                <ButtonGroup className="govuk-!-margin-top-6">
                  <Button type="submit">Send invite</Button>
                  <ButtonText
                    onClick={() =>
                      history.push('/administration/users/invites')
                    }
                  >
                    Cancel
                  </ButtonText>
                </ButtonGroup>
              </Form>
            );
          }}
        </Formik>
      </Page>
    </LoadingSpinner>
  );
};

export default UserInvitePage;
