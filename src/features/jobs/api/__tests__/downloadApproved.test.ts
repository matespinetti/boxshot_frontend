import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_URL: "http://localhost:8000/api/v1" },
}))

import { downloadApproved } from "../downloadApproved"

describe("downloadApproved", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("creates an anchor with the correct download URL", () => {
    const clickFn = vi.fn()
    const mockAnchor = {
      href: "",
      download: "",
      click: clickFn,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor)
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

    downloadApproved("job-abc")

    expect(mockAnchor.href).toBe(
      "http://localhost:8000/api/v1/jobs/job-abc/download",
    )
    expect(mockAnchor.download).toBe("job-abc.zip")
  })

  it("calls click() on the anchor element", () => {
    const clickFn = vi.fn()
    const mockAnchor = {
      href: "",
      download: "",
      click: clickFn,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor)
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node)
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

    downloadApproved("job-abc")

    expect(clickFn).toHaveBeenCalledOnce()
  })

  it("appends and removes the anchor from document.body", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor)
    const appendSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node)
    const removeSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node)

    downloadApproved("job-abc")

    expect(appendSpy).toHaveBeenCalledWith(mockAnchor)
    expect(removeSpy).toHaveBeenCalledWith(mockAnchor)
  })
})
