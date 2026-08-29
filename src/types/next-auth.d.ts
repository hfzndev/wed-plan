import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      peran: 'pria' | 'wanita';
    };
  }

  interface User {
    peran: 'pria' | 'wanita';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    peran?: 'pria' | 'wanita';
  }
}
