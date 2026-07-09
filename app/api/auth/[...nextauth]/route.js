import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Database is not configured.');
        }

        // Query our custom public.users table
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email.toLowerCase())
          .maybeSingle();

        if (error || !user) {
          throw new Error('No user found with this email');
        }

        if (!user.password) {
          throw new Error('This account was created with a social provider. Please sign in with Google.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Incorrect password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          image: user.image
        };
      }
    }),
    // Conditionally load Google Provider if configured
    ...( (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) && (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET)
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET
          })
        ]
      : [])
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Sync OAuth profile to public.users database on sign-in
      if (account?.provider === 'google') {
        const supabase = getSupabaseClient();
        if (!supabase) return true; // Let them log in locally

        const email = user.email.toLowerCase();
        
        // Check if user exists
        const { data: dbUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (checkError) {
          console.error('NextAuth OAuth check error:', checkError);
          return true;
        }

        if (!dbUser) {
          // Register new user from Google profile
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              email,
              name: user.name || email.split('@')[0],
              image: user.image
            })
            .select('*')
            .single();

          if (insertError) {
            console.error('NextAuth OAuth insert error:', insertError);
            return true;
          }
          user.id = newUser.id;
        } else {
          // Bind our database UUID back to Google profile token mapping
          user.id = dbUser.id;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const supabase = getSupabaseClient();
        if (supabase && user.email) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();

          if (dbUser) {
            token.id = dbUser.id;
          } else {
            token.id = user.id;
          }
        } else {
          token.id = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-stark-wallet-secret-key-1234567890'
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
