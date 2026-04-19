import { describe, expect, it } from "vitest"

import {
  imageSelectionStore,
  resetImageSelectionStore,
} from "../useImageSelectionStore"

describe("useImageSelectionStore", () => {
  it("tracks selected ids for the active job", () => {
    resetImageSelectionStore()

    imageSelectionStore.setJob("job-1")
    imageSelectionStore.toggle("img-1")
    imageSelectionStore.toggle("img-2")

    expect(imageSelectionStore.getState().selectedIds).toEqual([
      "img-1",
      "img-2",
    ])
  })

  it("resets selection when the job changes", () => {
    resetImageSelectionStore()

    imageSelectionStore.setJob("job-1")
    imageSelectionStore.toggle("img-1")
    imageSelectionStore.setJob("job-2")

    expect(imageSelectionStore.getState().selectedIds).toEqual([])
    expect(imageSelectionStore.getState().jobId).toBe("job-2")
  })

  it("replaces selection with visible ids", () => {
    resetImageSelectionStore()

    imageSelectionStore.setJob("job-1")
    imageSelectionStore.replaceSelected(["img-3", "img-4"])

    expect(imageSelectionStore.getState().selectedIds).toEqual([
      "img-3",
      "img-4",
    ])
  })

  it("clears selection", () => {
    resetImageSelectionStore()

    imageSelectionStore.setJob("job-1")
    imageSelectionStore.toggle("img-1")
    imageSelectionStore.clear()

    expect(imageSelectionStore.getState().selectedIds).toEqual([])
  })
})
