"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAnonKey = exports.supabaseUrl = exports.supabase = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
exports.supabaseUrl = supabaseUrl;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
exports.supabaseAnonKey = supabaseAnonKey;
// Service client for admin operations
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
// Public client for user operations
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
//# sourceMappingURL=supabase.js.map