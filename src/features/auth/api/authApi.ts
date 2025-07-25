/**
 * Supabase authentication API implementation.
 */
import { supabase } from '../../../lib/supabase';
import type { AuthResponse } from '../types/auth';

/**
 * Log in a user using Supabase authentication.
 * @param email - User's email
 * @param password - User's password
 * @returns AuthResponse with user and session
 */
export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Provide user-friendly error messages
    let userFriendlyMessage = 'Login failed';

    if (error.message.includes('Invalid login credentials')) {
      userFriendlyMessage =
        'Invalid email or password. Please check your credentials and try again.';
    } else if (
      error.message.includes('Email not confirmed') ||
      error.message.includes('Email not verified')
    ) {
      userFriendlyMessage =
        'Please verify your email address before logging in. Check your inbox for a verification link.';
    } else if (error.message.includes('Too many requests')) {
      userFriendlyMessage = 'Too many login attempts. Please wait a moment before trying again.';
    } else if (error.message.includes('User not found')) {
      userFriendlyMessage =
        'No account found with this email address. Please check your email or register a new account.';
    }

    throw new Error(userFriendlyMessage);
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed');
  }

  return {
    user: {
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
      email: data.user.email!,
    },
    token: data.session.access_token,
  };
}

/**
 * Register a new user using Supabase authentication.
 * @param name - User's name
 * @param email - User's email
 * @param password - User's password
 * @returns AuthResponse with user and session
 */
export async function registerApi(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Registration failed');
  }

  return {
    user: {
      id: data.user.id,
      name: data.user.user_metadata?.name || name,
      email: data.user.email!,
    },
    token: data.session ? data.session.access_token : '', // empty string if not verified yet
  };
}

/**
 * Resend verification email to the specified email address.
 * @param email - Email address to send verification to
 */
export async function resendVerificationEmailApi(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current user session from Supabase.
 * @returns AuthResponse if user is authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<AuthResponse | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return {
    user: {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email!,
    },
    token: session.access_token,
  };
}

/**
 * Sign out the current user from Supabase.
 */
export async function logoutApi(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}
