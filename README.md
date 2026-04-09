# AI 뉴스 분석 대시보드  : 내용을 추가해서 깃헙에 저장 추가함

네이버 뉴스 검색 API로 실시간 뉴스를 가져오고, OpenAI로 요약·감성·카테고리·주가 영향도를 분석한 뒤 차트와 카드로 보여주는 [Next.js](https://nextjs.org/) 웹 앱입니다.

## 주요 기능

- 키워드 검색 및 프리셋 주제로 네이버 뉴스 수집 (최신순)
- GPT 기반: 전체 요약, 인사이트, 감성 비율, 카테고리 분포, 핵심 키워드
- 뉴스와 연관된 한국 상장 종목에 대한 **AI 주가 영향도** 및 **Yahoo Finance 기준 현재가·등락률** 표시

## API 키와 보안

**저장소에는 API 키를 두지 마세요.**  
아래 환경 변수는 **로컬 전용** `.env.local` 파일에만 넣고, 이 파일은 `.gitignore`에 의해 Git에 포함되지 않습니다.

| 변수 | 용도 |
|------|------|
| `NAVER_CLIENT_ID` | 네이버 검색 API Client ID |
| `NAVER_CLIENT_SECRET` | 네이버 검색 API Client Secret |
| `OPENAI_API_KEY` | OpenAI API 키 |

- 키 발급: [네이버 개발자센터](https://developers.naver.com/) · [OpenAI API Keys](https://platform.openai.com/api-keys)

## 시작하기

```bash
npm install
```

프로젝트 루트에 `.env.local`을 만들고 **값은 본인 키로만** 채웁니다 (예시 형식):

```env
NAVER_CLIENT_ID=여기에_클라이언트_ID
NAVER_CLIENT_SECRET=여기에_클라이언트_시크릿
OPENAI_API_KEY=여기에_OpenAI_키
```

개발 서버:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 모드 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint |

## 기술 스택

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- OpenAI SDK, Recharts, 네이버 뉴스 검색 API, Yahoo Finance(비공식 차트/메타 API, 서버 측 조회)

## 라이선스

Private 프로젝트로 두었을 수 있습니다. 저장소 설정에 따릅니다.
