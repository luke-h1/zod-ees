import { useEditingContext } from '@admin/contexts/EditingContext';
import { EditableRelease } from '@admin/services/releaseContentService';
import releaseNoteService from '@admin/services/releaseNoteService';
import Button from '@common/components/Button';
import ButtonGroup from '@common/components/ButtonGroup';
import Details from '@common/components/Details';
import { Form } from '@common/components/form';
import FormFieldDateInput from '@common/components/form/FormFieldDateInput';
import FormFieldTextArea from '@common/components/form/FormFieldTextArea';
import FormattedDate from '@common/components/FormattedDate';
import ModalConfirm from '@common/components/ModalConfirm';
import { ReleaseNote } from '@common/services/publicationService';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { z } from 'zod';

interface Props {
  release: EditableRelease;
}

interface CreateFormValues {
  reason: string;
}

interface EditFormValues {
  on: Date;
  reason: string;
}

const emptyReleaseNote: ReleaseNote = {
  id: '',
  on: new Date(),
  reason: '',
};

const ReleaseNotesSection = ({ release }: Props) => {
  const [addFormOpen, setAddFormOpen] = useState<boolean>(false);
  const [editFormOpen, setEditFormOpen] = useState<boolean>(false);
  const [deletedReleaseNote, setDeletedReleaseNote] = useState<ReleaseNote>(
    emptyReleaseNote,
  );
  const [selectedReleaseNote, setSelectedReleaseNote] = useState<ReleaseNote>(
    emptyReleaseNote,
  );
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>(
    release.updates,
  );
  const { editingMode } = useEditingContext();

  const addReleaseNote = async (releaseNote: CreateFormValues) => {
    const newReleaseNotes = await releaseNoteService.create(
      release.id,
      releaseNote,
    );

    setReleaseNotes(newReleaseNotes);
  };

  const editReleaseNote = async (id: string, releaseNote: EditFormValues) => {
    const newReleaseNotes = await releaseNoteService.edit(id, release.id, {
      on: releaseNote.on,
      reason: releaseNote.reason,
    });

    setReleaseNotes(newReleaseNotes);
  };

  const openAddForm = () => {
    setAddFormOpen(true);
    setEditFormOpen(false);
  };

  const openEditForm = (selected: ReleaseNote) => {
    setAddFormOpen(false);
    setEditFormOpen(true);
    setSelectedReleaseNote(selected);
  };

  const renderAddForm = () => {
    const formId = 'createReleaseNoteForm';

    return !addFormOpen ? (
      <Button onClick={openAddForm}>Add note</Button>
    ) : (
      <Formik<CreateFormValues>
        initialValues={{ reason: '' }}
        validationSchema={z.object({
          reason: z.string({
            required_error: 'Release note must be provided',
          }),
        })}
        onSubmit={async ({ reason }) => {
          await addReleaseNote({
            reason,
          });
          setAddFormOpen(false);
        }}
      >
        {form => {
          return (
            <Form id={formId}>
              <FormFieldTextArea<CreateFormValues>
                label="New release note"
                name="reason"
                rows={3}
              />

              <ButtonGroup>
                <Button type="submit">Save note</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    form.resetForm();
                    setAddFormOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </Form>
          );
        }}
      </Formik>
    );
  };

  const renderEditForm = () => {
    const formId = 'editReleaseNoteForm';

    return (
      <Formik<EditFormValues>
        initialValues={
          selectedReleaseNote
            ? {
                on: new Date(selectedReleaseNote.on),
                reason: selectedReleaseNote.reason,
              }
            : ({
                reason: '',
              } as EditFormValues)
        }
        validationSchema={z.object({
          on: z.date({
            required_error: 'Enter a valid edit date',
          }),
          reason: z.string({
            required_error: 'Release note must be provided',
          }),
        })}
        onSubmit={async values => {
          await editReleaseNote(selectedReleaseNote.id, values);
          setEditFormOpen(false);
        }}
      >
        {form => {
          return (
            <Form id={formId}>
              <FormFieldDateInput<EditFormValues>
                name="on"
                legend="Edit date"
                legendSize="s"
              />
              <FormFieldTextArea<EditFormValues>
                label="Edit release note"
                name="reason"
                rows={3}
              />

              <ButtonGroup>
                <Button type="submit">Update note</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    form.resetForm();
                    setEditFormOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </ButtonGroup>
            </Form>
          );
        }}
      </Formik>
    );
  };

  return (
    releaseNotes && (
      <>
        <Details
          summary={`See all updates (${releaseNotes.length})`}
          id="releaseNotes"
          open={editingMode === 'edit'}
        >
          <ol className="govuk-list">
            {releaseNotes.map(note => (
              <li key={note.id}>
                {editingMode === 'edit' &&
                editFormOpen &&
                selectedReleaseNote.id === note.id ? (
                  renderEditForm()
                ) : (
                  <>
                    <FormattedDate className="govuk-body govuk-!-font-weight-bold">
                      {note.on}
                    </FormattedDate>
                    <p>{note.reason}</p>

                    {editingMode === 'edit' && (
                      <ButtonGroup>
                        <Button
                          variant="secondary"
                          onClick={() => openEditForm(note)}
                        >
                          Edit note
                        </Button>
                        <Button
                          variant="warning"
                          onClick={() => setDeletedReleaseNote(note)}
                        >
                          Remove note
                        </Button>
                      </ButtonGroup>
                    )}
                  </>
                )}
              </li>
            ))}
          </ol>
          {editingMode === 'edit' && renderAddForm()}
        </Details>

        <ModalConfirm
          open={deletedReleaseNote.id.length > 0}
          title="Confirm deletion of release note"
          onExit={() => setDeletedReleaseNote(emptyReleaseNote)}
          onCancel={() => setDeletedReleaseNote(emptyReleaseNote)}
          onConfirm={async () => {
            await releaseNoteService
              .delete(deletedReleaseNote.id, release.id)
              .then(setReleaseNotes)
              .finally(() => setDeletedReleaseNote(emptyReleaseNote));
          }}
        >
          <p>This release note will be removed from this release</p>
        </ModalConfirm>
      </>
    )
  );
};

export default ReleaseNotesSection;
