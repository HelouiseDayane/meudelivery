interface PasswordResetRequest {
  email: string;
}

export class PasswordResetLinkController {
  static async store(resetData: PasswordResetRequest) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Basic validation
    if (!resetData.email) {
      throw new Error('Email é obrigatório');
    }

    // Check if email exists (mock validation)
    const emailExists = resetData.email.includes('@');
    
    if (!emailExists) {
      throw new Error('Email inválido');
    }

    // Simulate sending reset email
    return {
      message: 'Link de recuperação enviado para seu email!'
    };
  }
}