import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  reportsCount: number;
  ranking: number;
}

interface UserStore {
  user: User;
  addPoints: (points: number) => void;
  incrementReports: () => void;
  addReportAndPoints: (points: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    points: 150,
    reportsCount: 12,
    ranking: 45,
  },

  addPoints: (points: number) => {
    set((state) => ({
      user: {
        ...state.user,
        points: state.user.points + points,
      },
    }));
  },

  incrementReports: () => {
    set((state) => ({
      user: {
        ...state.user,
        reportsCount: state.user.reportsCount + 1,
      },
    }));
  },

  addReportAndPoints: (points: number) => {
    set((state) => ({
      user: {
        ...state.user,
        reportsCount: state.user.reportsCount + 1,
        points: state.user.points + points,
      },
    }));
  },
}));