"use client"

import { useSyncExternalStore } from "react"

interface ImageSelectionState {
  jobId: string | null
  selectedIds: string[]
}

const initialState: ImageSelectionState = {
  jobId: null,
  selectedIds: [],
}

let state = initialState

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

function setState(nextState: ImageSelectionState) {
  state = nextState
  emit()
}

export const imageSelectionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getState() {
    return state
  },
  setJob(jobId: string) {
    if (state.jobId === jobId) return

    setState({ jobId, selectedIds: [] })
  },
  toggle(imageId: string) {
    const selectedIds = state.selectedIds.includes(imageId)
      ? state.selectedIds.filter((id) => id !== imageId)
      : [...state.selectedIds, imageId]

    setState({ ...state, selectedIds })
  },
  replaceSelected(selectedIds: string[]) {
    setState({ ...state, selectedIds: [...new Set(selectedIds)] })
  },
  clear() {
    setState({ ...state, selectedIds: [] })
  },
}

export function resetImageSelectionStore() {
  setState(initialState)
}

export function useImageSelectionStore() {
  return useSyncExternalStore(
    imageSelectionStore.subscribe,
    imageSelectionStore.getState,
    imageSelectionStore.getState,
  )
}
