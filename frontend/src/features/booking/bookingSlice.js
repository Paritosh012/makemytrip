import { createSlice } from '@reduxjs/toolkit'

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    pendingBookingId: null,
    pendingPackage: null,
  },
  reducers: {
    setPendingBooking(state, action) {
      state.pendingBookingId = action.payload.bookingId
      state.pendingPackage = action.payload.pkg
    },
    clearPendingBooking(state) {
      state.pendingBookingId = null
      state.pendingPackage = null
    },
  },
})

export const { setPendingBooking, clearPendingBooking } = bookingSlice.actions
export default bookingSlice.reducer
