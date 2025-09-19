interface LoginRequest {
  email: string;
  password: string;
  userType: 'admin' | 'client';
}

interface User {
  id: string;
  name: string;
  email: string;
  type: 'admin' | 'client';
  avatar?: string;
}

export class AuthenticatedSessionController {
  // Mock users for demo
  private static mockUsers = [
    {
      id: '1',
      name: 'Administrador',
      email: 'admin@sweetdelivery.com',
      password: '123456',
      type: 'admin' as const,
      avatar: ''
    },
    {
      id: '2',
      name: 'Cliente Demo',
      email: 'cliente@email.com',
      password: '123456',
      type: 'client' as const,
      avatar: ''
    }
  ];

  static async store(loginData: LoginRequest) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = this.mockUsers.find(u => 
      u.email === loginData.email && 
      u.password === loginData.password &&
      u.type === loginData.userType
    );

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Mock token
    const token = `mock_token_${user.id}_${Date.now()}`;

    return {
      data: {
        user: userWithoutPassword,
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      },
      message: 'Login realizado com sucesso!'
    };
  }

  static async destroy() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In real app, invalidate token on server
    return {
      message: 'Logout realizado com sucesso!'
    };
  }

  static async me(token: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Extract user ID from mock token
    const userId = token.split('_')[2];
    const user = this.mockUsers.find(u => u.id === userId);

    if (!user) {
      throw new Error('Token inválido');
    }

    const { password, ...userWithoutPassword } = user;

    return {
      data: userWithoutPassword
    };
  }
}