interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export class RegisteredUserController {
  static async store(registerData: RegisterRequest) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic validation
    if (!registerData.name || !registerData.email || !registerData.password) {
      throw new Error('Nome, email e senha são obrigatórios');
    }

    if (registerData.password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }

    // Check if email already exists (mock)
    const existingUser = registerData.email === 'admin@sweetdelivery.com' || 
                        registerData.email === 'cliente@email.com';
    
    if (existingUser) {
      throw new Error('Este email já está em uso');
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name: registerData.name,
      email: registerData.email,
      type: 'client' as const,
      phone: registerData.phone,
      address: registerData.address,
      avatar: '',
      createdAt: new Date().toISOString()
    };

    // Mock token
    const token = `mock_token_${newUser.id}_${Date.now()}`;

    return {
      data: {
        user: newUser,
        token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      },
      message: 'Conta criada com sucesso!'
    };
  }
}