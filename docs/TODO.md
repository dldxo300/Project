# 나만의 피규어 제작 플랫폼 MVP - 개발 TODO

## 진행 상황 체크리스트

### Phase 1: 기본 인프라 (1주)
- [x] Next.js 프로젝트 셋업 (pnpm, App Router, React 19)
- [x] Clerk 연동 (로그인/회원가입, 미들웨어 보호)
- [x] 기본 레이아웃/네비게이션 구성 (`app/layout.tsx`, `components/Navbar.tsx`)
- [x] Supabase 프로젝트 연결 및 환경변수 세팅 (`.env.local`)
- [x] DB 스키마 작성 완료
  - [x] `profiles` - 사용자 프로필 (Clerk 연동)
  - [x] `categories` - 상품 카테고리 (Anime, Gaming, Original Character, Diorama, Props, Mecha, Creature)
  - [x] `products` - 재판매 상품 (base_price, painting_price 옵션 포함)
  - [x] `custom_orders` - 주문제작 의뢰
  - [x] `cart_items` - 장바구니
  - [x] `orders` - 마켓플레이스 주문
  - [x] `order_items` - 주문 상세
  - [x] `reviews` - 상품 후기
  - [x] `qna` - 상품 문의
- [x] 마이그레이션 적용 (`supabase/migrations/update_shopping_mall_schema.sql`)
- [x] RLS 비활성화 (개발 환경)
- [x] 샘플 데이터 20개 시딩 완료

### Phase 2: 주문제작 기능 (2주)
#### 2.1 주문제작 의뢰 페이지
- [ ] 주문제작 의뢰 페이지 UI 구현 (`app/custom-order/page.tsx`)
  - [ ] 2D 이미지 업로드 컴포넌트 (Supabase Storage 연동)
  - [ ] 주문서 양식 폼 (react-hook-form + Zod)
    - [ ] 피규어 사이즈 선택
    - [ ] 추가 요구사항 텍스트 입력
    - [ ] 참고 이미지 추가 업로드 (선택)
  - [ ] 주문서 제출 기능
- [ ] Server Action: 주문제작 의뢰 생성 (`actions/custom-order.ts`)
  - [ ] 이미지 업로드 및 URL 저장
  - [ ] `custom_orders` 테이블에 데이터 삽입
  - [ ] 상태: `pending_review`로 초기화
- [ ] 주문 접수 확인 페이지 구현

#### 2.2 나의 주문제작 내역
- [ ] 주문제작 내역 목록 페이지 (`app/my-custom-orders/page.tsx`)
  - [ ] 내 주문 목록 조회 (clerk_id 기반)
  - [ ] 주문 상태별 필터링 (pending_review, quote_provided, in_progress, completed, shipped, delivered, cancelled)
  - [ ] 주문서 상세보기 모달/페이지
- [ ] Server Action: 주문 취소 기능 (상태가 `pending_review`일 때만)

### Phase 3: 관리자 - 주문제작 관리 (1.5주)
- [ ] 관리자 인증 미들웨어 구현
  - [ ] Clerk의 조직(Organization) 또는 메타데이터로 관리자 권한 체크
  - [ ] 관리자 전용 라우트 보호 (`/admin/*`)
- [ ] 주문제작 관리 대시보드 (`app/admin/custom-orders/page.tsx`)
  - [ ] 모든 주문 목록 조회 (상태별 탭)
  - [ ] 주문서 상세 확인 모달
  - [ ] 주문 상태 변경 (승인/반려/진행중/완료)
  - [ ] 견적 금액 입력 및 제공 (`quote_provided` 상태로 변경)
- [ ] Server Action: 관리자 주문 상태 업데이트 (`actions/admin/update-custom-order.ts`)
- [ ] 완성 이미지 업로드 기능
  - [ ] 제작 완료 시 완성품 이미지 업로드
  - [ ] `completed_image_urls` 필드에 저장

### Phase 4: 마켓플레이스 - 상품 목록 & 상세 (1.5주)
#### 4.1 홈페이지
- [ ] 홈 페이지 UI 구현 (`app/page.tsx`)
  - [ ] 히어로 섹션 (플랫폼 소개)
  - [ ] 인기 상품 섹션 (조회수 또는 판매량 기준, 상위 6-8개)
  - [ ] 카테고리별 추천 상품
  - [ ] 주문제작 의뢰 CTA 버튼
- [ ] Server Component: 인기 상품 데이터 페칭

#### 4.2 상품 목록 페이지
- [ ] 상품 목록 페이지 (`app/products/page.tsx`)
  - [ ] 카테고리 필터 (Anime, Gaming, Original Character, Diorama, Props, Mecha, Creature)
  - [ ] 정렬 옵션 (최신순, 가격 낮은순/높은순, 인기순)
  - [ ] 페이지네이션 또는 무한 스크롤
  - [ ] 상품 카드 컴포넌트 (`components/ProductCard.tsx`)
- [ ] Server Component: 상품 목록 데이터 페칭 (필터/정렬 적용)

#### 4.3 상품 상세 페이지
- [ ] 상품 상세 페이지 (`app/products/[id]/page.tsx`)
  - [ ] 상품 이미지 갤러리 (여러 이미지 슬라이드)
  - [ ] 상품 정보 표시 (이름, 설명, 가격, 재고)
  - [ ] 옵션 선택
    - [ ] 기본 3D 프린팅만 (base_price)
    - [ ] 도색 추가 옵션 (base_price + painting_price)
  - [ ] 수량 선택
  - [ ] 장바구니 담기 버튼
  - [ ] 바로 구매 버튼
  - [ ] 상품 문의(Q&A) 섹션
  - [ ] 리뷰 섹션
- [ ] Server Component: 상품 상세 데이터 페칭
- [ ] Server Action: 장바구니 추가 (`actions/cart.ts`)

### Phase 5: 장바구니 & 주문 (1.5주)
#### 5.1 장바구니
- [ ] 장바구니 페이지 (`app/cart/page.tsx`)
  - [ ] 장바구니 상품 목록 표시
  - [ ] 수량 변경 기능
  - [ ] 개별 상품 삭제
  - [ ] 선택 상품 삭제
  - [ ] 총 금액 계산 (상품가 + 옵션가)
  - [ ] 주문하기 버튼
- [ ] Server Action: 장바구니 항목 수정/삭제

#### 5.2 주문 프로세스
- [ ] 주문서 작성 페이지 (`app/checkout/page.tsx`)
  - [ ] 주문 상품 확인
  - [ ] 배송지 정보 입력 (수령인명, 연락처, 주소)
  - [ ] 총 결제 금액 확인
  - [ ] 결제 진행 버튼
- [ ] Server Action: 주문 생성 (`actions/order.ts`)
  - [ ] `orders` 테이블에 주문 헤더 생성
  - [ ] `order_items` 테이블에 주문 상세 항목 생성
  - [ ] 상태: `payment_pending`으로 초기화
  - [ ] 장바구니 비우기

### Phase 6: 결제 통합 (1주)
- [ ] Toss Payments MCP 연동
  - [ ] Toss Payments 클라이언트 키 환경변수 설정
  - [ ] 결제 위젯 SDK 통합
- [ ] 결제 페이지 (`app/payment/[orderId]/page.tsx`)
  - [ ] 결제 위젯 렌더링
  - [ ] 주문 정보 표시 (주문번호, 금액)
  - [ ] 결제 요청 처리
- [ ] 결제 성공 콜백 (`app/payment/success/page.tsx`)
  - [ ] 결제 결과 검증 (Toss Payments API)
  - [ ] 주문 상태 업데이트 (`paid`)
  - [ ] 재고 차감
  - [ ] 결제 정보 저장 (`payment_info` JSONB)
  - [ ] 주문 완료 페이지로 리다이렉트
- [ ] 결제 실패 콜백 (`app/payment/fail/page.tsx`)
  - [ ] 실패 사유 표시
  - [ ] 재시도 옵션 제공
- [ ] Server Action: 결제 검증 및 주문 완료 처리

### Phase 7: 마이페이지 (0.5주)
- [ ] 마이페이지 레이아웃 (`app/my-page/layout.tsx`)
  - [ ] 사이드바 네비게이션 (주문내역, 주문제작 내역, 리뷰 관리, 문의 내역, 회원정보)
- [ ] 마켓플레이스 주문 내역 (`app/my-page/orders/page.tsx`)
  - [ ] 주문 목록 조회 (날짜 역순)
  - [ ] 주문 상태별 필터
  - [ ] 주문 상세 보기
- [ ] 주문 상세 페이지 (`app/my-page/orders/[id]/page.tsx`)
  - [ ] 주문 정보 (주문번호, 날짜, 상태)
  - [ ] 주문 상품 목록
  - [ ] 배송 정보
  - [ ] 결제 정보
  - [ ] 주문 취소 버튼 (취소 가능 상태일 때만)

### Phase 8: 커뮤니티 기능 (1주)
#### 8.1 리뷰 시스템
- [ ] 리뷰 작성 페이지 (`app/my-page/orders/[orderId]/review/[productId]/page.tsx`)
  - [ ] 구매 완료 상품에 대한 리뷰만 작성 가능
  - [ ] 별점 선택 (1-5점)
  - [ ] 리뷰 텍스트 입력
  - [ ] 리뷰 이미지 업로드 (선택)
- [ ] Server Action: 리뷰 생성 (`actions/review.ts`)
  - [ ] 구매 확인 검증
  - [ ] `reviews` 테이블에 저장
  - [ ] 중복 리뷰 방지 (order_item_id UNIQUE)
- [ ] 상품 상세 페이지 리뷰 섹션 구현
  - [ ] 평균 별점 표시
  - [ ] 리뷰 목록 (페이지네이션)
  - [ ] 리뷰 이미지 갤러리

#### 8.2 Q&A 시스템
- [ ] 상품 문의 작성 (`components/ProductQnA.tsx`)
  - [ ] 문의 작성 폼 (로그인 필수)
  - [ ] 비밀글 옵션 (본인과 관리자만 볼 수 있음)
- [ ] Server Action: 문의 생성 (`actions/qna.ts`)
- [ ] Q&A 목록 표시
  - [ ] 질문과 답변 쌍으로 표시
  - [ ] 미답변 질문 표시
- [ ] 관리자 답변 기능 (`app/admin/qna/page.tsx`)
  - [ ] 미답변 문의 목록
  - [ ] 답변 작성 및 저장
  - [ ] 답변 상태 업데이트 (`answered_at`, `answerer_is_admin`)

### Phase 9: 관리자 - 상품 관리 (1주)
- [ ] 완성 작품 재판매 등록 (`app/admin/products/create/page.tsx`)
  - [ ] 주문제작 완료건에서 상품 전환 기능
  - [ ] 상품 정보 입력 폼
    - [ ] 상품명, 설명
    - [ ] 카테고리 선택
    - [ ] 기본 가격 (base_price)
    - [ ] 도색 추가 가격 (painting_price)
    - [ ] 초기 재고 수량
    - [ ] 상품 이미지 (최소 1개, 최대 5개)
    - [ ] 3D 모델 데이터 URL (선택)
  - [ ] `linked_product_id` 연결 (custom_orders → products)
- [ ] Server Action: 상품 등록 (`actions/admin/create-product.ts`)
- [ ] 상품 목록 관리 (`app/admin/products/page.tsx`)
  - [ ] 등록된 모든 상품 조회
  - [ ] 상품 활성화/비활성화 (`is_active`)
  - [ ] 상품 편집 페이지로 이동
  - [ ] 상품 삭제 (주문이 없는 경우에만)
- [ ] 상품 편집 페이지 (`app/admin/products/[id]/edit/page.tsx`)
  - [ ] 기존 상품 정보 불러오기
  - [ ] 정보 수정 및 저장
  - [ ] 재고 조정
- [ ] Server Action: 상품 수정/삭제

### Phase 10: 테스트 & 개선 (1주)
- [ ] E2E 플로우 테스트
  - [ ] 회원가입 → 주문제작 의뢰 → 관리자 처리 → 결제
  - [ ] 상품 조회 → 장바구니 → 주문 → 결제 → 리뷰 작성
  - [ ] Q&A 작성 → 관리자 답변
- [ ] 예외 처리 강화
  - [ ] 네트워크 오류 처리
  - [ ] 권한 없음 처리
  - [ ] 재고 부족 처리
  - [ ] 중복 요청 방지
- [ ] 성능 최적화
  - [ ] 이미지 최적화 (Next.js Image)
  - [ ] 데이터베이스 쿼리 최적화
  - [ ] 페이지 로딩 성능 개선
- [ ] UI/UX 개선
  - [ ] 로딩 상태 표시 (Skeleton, Spinner)
  - [ ] 에러 메시지 개선
  - [ ] 빈 상태 UI (empty state)
  - [ ] 반응형 디자인 점검 (모바일/태블릿/데스크톱)
  - [ ] 다크 모드 지원 확인
- [ ] 접근성 개선
  - [ ] 키보드 네비게이션
  - [ ] 스크린 리더 지원
  - [ ] ARIA 레이블

### Phase 11: 배포 & 문서화 (0.5주)
- [ ] Vercel 배포 설정
  - [ ] 환경변수 설정 (Production)
  - [ ] 도메인 연결 (선택)
  - [ ] 빌드 오류 수정
- [ ] 프로덕션 준비
  - [ ] RLS 정책 검토 및 활성화 고려
  - [ ] 보안 취약점 점검
  - [ ] Toss Payments 프로덕션 키 준비 (실제 결제 시)
- [ ] 문서화
  - [ ] README.md 업데이트
    - [ ] 프로젝트 소개
    - [ ] 기능 목록
    - [ ] 설치 및 실행 방법
    - [ ] 환경변수 설정 가이드
  - [ ] AGENTS.md / CLAUDE.md 업데이트
  - [ ] 관리자 가이드 작성
    - [ ] 주문제작 관리 방법
    - [ ] 상품 등록 방법
    - [ ] Q&A 관리 방법
  - [ ] API 문서화 (Server Actions)

---

## 공통 작업 (진행 중 계속 관리)
- [ ] 타입 안전성 강화
  - [ ] Supabase 데이터베이스 타입 생성 (`supabase gen types typescript`)
  - [ ] `types/database.types.ts` 활용
  - [ ] Zod 스키마 정의 및 적용
- [ ] 오류 처리
  - [ ] 전역 에러 바운더리 (`app/error.tsx`)
  - [ ] Not Found 페이지 (`app/not-found.tsx`)
  - [ ] 커스텀 에러 컴포넌트
- [ ] SEO 최적화
  - [ ] 메타 태그 설정 (각 페이지 `metadata`)
  - [ ] Open Graph 이미지
  - [ ] `robots.txt` (`app/robots.ts`)
  - [ ] `sitemap.xml` (`app/sitemap.ts`)
  - [ ] `manifest.json` (`app/manifest.ts`)
- [ ] 아이콘 및 이미지
  - [ ] 파비콘 업데이트 (`app/favicon.ico`)
  - [ ] 로고 이미지 (`public/logo.png`)
  - [ ] PWA 아이콘 (`public/icons/`)
  - [ ] OG 이미지 (`public/og-image.png`)
- [ ] 코드 품질
  - [ ] ESLint 설정 확인 및 오류 수정
  - [ ] Prettier 설정 (`.prettierrc`, `.prettierignore`)
  - [ ] 코드 리뷰 및 리팩토링
- [ ] Git 관리
  - [ ] `.gitignore` 정비
  - [ ] `.cursorignore` 정비
  - [ ] 커밋 컨벤션 준수 (Conventional Commits)
  - [ ] 브랜치 전략 수립 (GitFlow)
- [ ] 모니터링 & 로깅
  - [ ] 에러 트래킹 설정 (Sentry 등 고려)
  - [ ] 사용자 분석 (Google Analytics 등 고려)
  - [ ] 핵심 기능에 로그 추가 (개발 중)

---

## MVP 성공 지표 (검증 기준)
### 정량적 지표
- [ ] 회원가입 수: 최소 100명
- [ ] 주문제작 의뢰 수: 최소 20건
- [ ] 주문제작 완료율: 80% 이상
- [ ] 마켓플레이스 상품 구매: 최소 30건
- [ ] 구매 전환율: 방문자 대비 5% 이상
- [ ] 사용자 재방문율: 30% 이상
- [ ] 리뷰 작성율: 구매자 대비 40% 이상

### 정성적 지표
- [ ] 사용자 피드백 수집 (설문 또는 인터뷰)
  - [ ] AI 3D 모델링 만족도
  - [ ] 제작 과정 투명성 만족도
  - [ ] 완성품 품질 만족도
  - [ ] 마켓플레이스 사용성
- [ ] 주요 개선 포인트 파악
- [ ] 기술 스택 검증 (Next.js + Supabase + Clerk + Toss Payments)

---

## 주의사항
- Supabase RLS는 개발 중 비활성화 (프로덕션 배포 전 정책 검토)
- Toss Payments는 테스트 모드로만 운영
- 실제 배송 기능은 구현하지 않음 (주문 상태만 관리)
- AI 3D 모델링은 MVP에서 수동 또는 외부 솔루션 활용 (실시간 미리보기 제외)
- 관리자 기능은 별도 어드민 페이지로 구현 (작가용 페이지는 제외)

---

**총 예상 개발 기간: 12-14주**
