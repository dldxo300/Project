import { createClient } from "@supabase/supabase-js";

/**
 * 인증이 불필요한 공개 데이터 조회용 Supabase 클라이언트
 *
 * - anon key만 사용하여 공개 데이터(RLS 정책이 `to anon`인 데이터)에 접근
 * - 인증 토큰 없이 동작
 * - 싱글톤 인스턴스로 제공
 *
 * 사용 시나리오:
 * - 로그인하지 않은 사용자가 접근 가능한 공개 데이터
 * - 상품 목록, 카테고리 등 누구나 볼 수 있는 데이터
 *
 * @example
 * ```ts
 * import { supabase } from '@/lib/supabase/client';
 *
 * // 공개 상품 조회
 * const { data } = await supabase.from('products').select('*');
 * ```
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
