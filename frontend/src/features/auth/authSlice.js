import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../../services/auth.service";

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const data = await authService.getMe();
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.loading = false;
      })

      .addCase(fetchMe.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
