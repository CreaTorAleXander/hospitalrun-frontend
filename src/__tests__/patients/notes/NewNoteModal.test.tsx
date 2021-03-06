/* eslint-disable no-console */

import { Alert, Modal } from '@hospitalrun/components'
import { act } from '@testing-library/react'
import { mount } from 'enzyme'
import React from 'react'

import NewNoteModal from '../../../patients/notes/NewNoteModal'
import TextFieldWithLabelFormGroup from '../../../shared/components/input/TextFieldWithLabelFormGroup'
import PatientRepository from '../../../shared/db/PatientRepository'
import Patient from '../../../shared/model/Patient'

describe('New Note Modal', () => {
  const mockPatient = {
    id: '123',
    givenName: 'someName',
  } as Patient

  const setup = (onCloseSpy = jest.fn()) => {
    jest.spyOn(PatientRepository, 'saveOrUpdate').mockResolvedValue(mockPatient)
    jest.spyOn(PatientRepository, 'find').mockResolvedValue(mockPatient)
    const wrapper = mount(
      <NewNoteModal
        show
        onCloseButtonClick={onCloseSpy}
        toggle={jest.fn()}
        patientId={mockPatient.id}
      />,
    )
    return { wrapper }
  }

  beforeEach(() => {
    console.error = jest.fn()
  })

  it('should render a modal with the correct labels', () => {
    const { wrapper } = setup()

    const modal = wrapper.find(Modal)
    expect(modal).toHaveLength(1)
    expect(modal.prop('title')).toEqual('patient.notes.new')
    expect(modal.prop('closeButton')?.children).toEqual('actions.cancel')
    expect(modal.prop('closeButton')?.color).toEqual('danger')
    expect(modal.prop('successButton')?.children).toEqual('patient.notes.new')
    expect(modal.prop('successButton')?.color).toEqual('success')
    expect(modal.prop('successButton')?.icon).toEqual('add')
  })

  it('should render a notes rich text editor', () => {
    const { wrapper } = setup()

    const noteTextField = wrapper.find(TextFieldWithLabelFormGroup)
    expect(noteTextField.prop('label')).toEqual('patient.note')
    expect(noteTextField.prop('isRequired')).toBeTruthy()
    expect(noteTextField).toHaveLength(1)
  })

  it('should render note error', async () => {
    const expectedError = {
      message: 'patient.notes.error.unableToAdd',
      note: 'patient.notes.error.noteRequired',
    }
    const { wrapper } = setup()

    await act(async () => {
      const modal = wrapper.find(Modal)
      const onSave = (modal.prop('successButton') as any).onClick
      await onSave({} as React.MouseEvent<HTMLButtonElement>)
    })
    wrapper.update()
    const alert = wrapper.find(Alert)
    const noteTextField = wrapper.find(TextFieldWithLabelFormGroup)

    expect(alert.prop('title')).toEqual('states.error')
    expect(alert.prop('message')).toEqual(expectedError.message)
    expect(noteTextField.prop('isInvalid')).toBeTruthy()
    expect(noteTextField.prop('feedback')).toEqual(expectedError.note)
  })

  describe('on cancel', () => {
    it('should call the onCloseButtonCLick function when the cancel button is clicked', () => {
      const onCloseButtonClickSpy = jest.fn()
      const { wrapper } = setup(onCloseButtonClickSpy)

      act(() => {
        const modal = wrapper.find(Modal)
        const { onClick } = modal.prop('closeButton') as any
        onClick()
      })

      expect(onCloseButtonClickSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('on save', () => {
    it('should dispatch add note', async () => {
      const expectedNote = 'some note'
      const { wrapper } = setup()
      const noteTextField = wrapper.find(TextFieldWithLabelFormGroup)

      await act(async () => {
        const onChange = noteTextField.prop('onChange') as any
        await onChange({ currentTarget: { value: expectedNote } })
      })

      wrapper.update()

      await act(async () => {
        const modal = wrapper.find(Modal)
        const onSave = (modal.prop('successButton') as any).onClick
        await onSave({} as React.MouseEvent<HTMLButtonElement>)
        wrapper.update()
      })

      expect(PatientRepository.saveOrUpdate).toHaveBeenCalledTimes(1)
      expect(PatientRepository.saveOrUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: [expect.objectContaining({ text: expectedNote })],
        }),
      )

      // Does the form reset value back to blank?
      expect(noteTextField.prop('value')).toEqual('')
    })
  })
})
