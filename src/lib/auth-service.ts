import { supabase } from './supabase';
import { mapSupabaseUser } from './auth';
import { User } from '@supabase/supabase-js';
import { AuthUser } from '@/types';

class AuthService {
  mapUser(user: User): AuthUser {
    return mapSupabaseUser(user);
  }

  async signUp(email: string, password: string, username?: string) {
    const displayName = username || email.split('@')[0];
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: displayName,
        },
      },
    });
    
    if (error) throw error;
    if (!data.user) throw new Error('Failed to create account');
    // Try to create a profile row for the user so display names are available
    try {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        username: displayName,
      });
      if (profileError) console.warn('Profile insert warning:', profileError.message || profileError);
    } catch (err) {
      console.warn('Profile creation error:', err);
    }

    return data.user;
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }
}

export const authService = new AuthService();
