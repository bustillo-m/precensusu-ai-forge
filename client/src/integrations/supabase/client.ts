// Local API client to replace Supabase functionality
// Import this client like: import { localApi } from "@/integrations/supabase/client";

const API_BASE_URL = '';

interface User {
  id: string;
  email: string;
  username?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class LocalApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  // Auth methods
  async signUp(email: string, password: string, username?: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, username })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return { data: { user: data.user }, error: null };
  }

  async signInWithPassword(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.token = data.token;
    localStorage.setItem('auth_token', data.token);
    return { data: { user: data.user }, error: null };
  }

  async signOut() {
    this.token = null;
    localStorage.removeItem('auth_token');
    return { error: null };
  }

  async getUser() {
    if (!this.token) {
      return { data: { user: null }, error: null };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.token = null;
          localStorage.removeItem('auth_token');
          return { data: { user: null }, error: null };
        }
        throw new Error('Failed to get user');
      }

      const data = await response.json();
      return { data: { user: data.user }, error: null };
    } catch (error) {
      return { data: { user: null }, error };
    }
  }

  // Database methods
  from(table: string) {
    return {
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const response = await fetch(`${API_BASE_URL}/api/${table}?${column}=${value}`, {
              headers: this.getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            return { data: data[0] || null, error: null };
          }
        }),
        order: (column: string, options?: { ascending?: boolean }) => ({
          limit: (count: number) => this.executeSelect(table, columns, { orderBy: column, ascending: options?.ascending, limit: count })
        }),
        limit: (count: number) => this.executeSelect(table, columns, { limit: count })
      }),
      insert: (values: any) => ({
        select: async () => {
          const response = await fetch(`${API_BASE_URL}/api/${table}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(values)
          });
          if (!response.ok) throw new Error('Failed to insert');
          const data = await response.json();
          return { data, error: null };
        }
      }),
      update: (values: any) => ({
        eq: (column: string, value: any) => ({
          select: async () => {
            const response = await fetch(`${API_BASE_URL}/api/${table}/${value}`, {
              method: 'PUT',
              headers: this.getHeaders(),
              body: JSON.stringify(values)
            });
            if (!response.ok) throw new Error('Failed to update');
            const data = await response.json();
            return { data, error: null };
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => ({
          select: async () => {
            const response = await fetch(`${API_BASE_URL}/api/${table}/${value}`, {
              method: 'DELETE',
              headers: this.getHeaders()
            });
            if (!response.ok) throw new Error('Failed to delete');
            return { data: null, error: null };
          }
        })
      })
    };
  }

  private async executeSelect(table: string, columns: string, options: any = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.orderBy) params.append('orderBy', options.orderBy);
    if (options.ascending !== undefined) params.append('ascending', options.ascending.toString());

    const response = await fetch(`${API_BASE_URL}/api/${table}?${params}`, {
      headers: this.getHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return { data, error: null };
  }

  // Chat specific methods
  async sendMessage(message: string, sessionId: string = 'landing-page-chat') {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message, sessionId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return await response.json();
  }

  async sendLead(name: string, email: string, details: string) {
    const response = await fetch(`${API_BASE_URL}/api/send-lead`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, details })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send lead');
    }

    return await response.json();
  }

  // Auth state management
  get auth() {
    return {
      getUser: () => this.getUser(),
      signUp: (options: { email: string; password: string; options?: { data?: { username?: string } } }) => 
        this.signUp(options.email, options.password, options.options?.data?.username),
      signInWithPassword: (options: { email: string; password: string }) => 
        this.signInWithPassword(options.email, options.password),
      signOut: () => this.signOut(),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        // For compatibility with existing code, but we'll handle auth differently
        const checkAuth = async () => {
          const { data } = await this.getUser();
          callback(data.user ? 'SIGNED_IN' : 'SIGNED_OUT', data.user ? { user: data.user } : null);
        };
        checkAuth();
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    };
  }
}

// Export the client instance
export const supabase = new LocalApiClient();

// For compatibility, also export as localApi
export const localApi = supabase;