import 'dotenv/config';
export declare class AuthService {
    register(email: string, password: string, nome: string): Promise<{
        user: {
            id: string;
            email: any;
            nome: any;
            role: any;
        };
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            id: any;
            email: any;
            nome: any;
            role: any;
        };
        token: string;
    }>;
    generateToken(userId: string, email: string, role: string): string;
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        nome: any;
        role: any;
        created_at: any;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map