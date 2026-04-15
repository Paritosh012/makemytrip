import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as adminService from "./admin.service";

/*
-------------------------------------------------------
THUNKS
-------------------------------------------------------
*/

// Get all users
export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, thunkAPI) => {
    try {
      const res = await adminService.getUsers();
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message);
    }
  },
);

// Promote user
export const promoteUser = createAsyncThunk(
  "admin/promoteUser",
  async (userId, thunkAPI) => {
    try {
      await adminService.promoteToAdmin(userId);
      return userId;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message);
    }
  },
);

// Update permissions
export const updateUserPermissions = createAsyncThunk(
  "admin/updatePermissions",
  async ({ userId, permissions }, thunkAPI) => {
    try {
      await adminService.updatePermissions(userId, permissions);
      return { userId, permissions };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message);
    }
  },
);

// Suspend / Activate
export const toggleUserStatus = createAsyncThunk(
  "admin/toggleUserStatus",
  async (userId, thunkAPI) => {
    try {
      await adminService.toggleSuspend(userId);
      return userId;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message);
    }
  },
);

/*
-------------------------------------------------------
SLICE
-------------------------------------------------------
*/

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // FETCH USERS
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // PROMOTE
      .addCase(promoteUser.fulfilled, (state, action) => {
        const user = state.users.find((u) => u._id === action.payload);
        if (user) user.role = "ADMIN";
      })

      // UPDATE PERMISSIONS
      .addCase(updateUserPermissions.fulfilled, (state, action) => {
        const { userId, permissions } = action.payload;
        const user = state.users.find((u) => u._id === userId);
        if (user) user.permissions = permissions;
      })

      // TOGGLE STATUS
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const user = state.users.find((u) => u._id === action.payload);
        if (user) user.isSuspended = !user.isSuspended;
      });
  },
});

export default adminSlice.reducer;
