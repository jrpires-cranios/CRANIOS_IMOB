"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
require("dotenv/config");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_js_1 = require("../config/supabase.js");
class AuthService {
    async register(email, password, nome) {
        // Check if user exists
        const { data: existing } = await supabase_js_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        if (existing) {
            throw new Error('Email já cadastrado');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase_js_1.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });
        if (authError)
            throw authError;
        // Create user profile
        const { data: user, error } = await supabase_js_1.supabaseAdmin
            .from('users')
            .insert([{
                id: authData.user.id,
                email,
                password: hashedPassword,
                nome,
                role: 'agent',
            }])
            .select()
            .maybeSingle();
        if (error)
            throw error;
        const token = this.generateToken(authData.user.id, email, 'agent');
        return {
            user: {
                id: authData.user.id,
                email: user.email,
                nome: user.nome,
                role: user.role,
            },
            token,
        };
    }
    async login(email, password) {
        const { data: user, error } = await supabase_js_1.supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        if (error || !user) {
            throw new Error('Credenciais inválidas');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Credenciais inválidas');
        }
        const token = this.generateToken(user.id, email, user.role);
        return {
            user: {
                id: user.id,
                email: user.email,
                nome: user.nome,
                role: user.role,
            },
            token,
        };
    }
    generateToken(userId, email, role) {
        const secret = process.env.JWT_SECRET || 'cranios-imob-default-secret';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        return jsonwebtoken_1.default.sign({ userId, email, role }, secret, { expiresIn });
    }
    async getProfile(userId) {
        const { data, error } = await supabase_js_1.supabaseAdmin
            .from('users')
            .select('id, email, nome, role, created_at')
            .eq('id', userId)
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map