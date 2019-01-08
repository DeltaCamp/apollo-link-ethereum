// Import this named export into your test file:
export const mockGetAbi = jest.fn();

export default jest.fn().mockImplementation(() => {
  return {
    getAbi: mockGetAbi
  }
})
