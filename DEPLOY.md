# Deploy AIWMS to Render (GitHub)

Bu rehber projeyi GitHub'a yükleyip Render üzerinde canlı test etmenizi sağlar.

## Mimari

| Servis | Render adı | Açıklama |
|---|---|---|
| PostgreSQL | `aiwms-db` | Veritabanı |
| NestJS API | `aiwms-api` | Backend (`/auth`, `/jobs`, …) |
| Next.js Web | `aiwms-web` | Frontend (tarayıcı arayüzü) |

`render.yaml` dosyası bu üç bileşeni otomatik oluşturur.

---

## 1. GitHub'a yükle

Proje klasöründe (Git Bash veya terminal):

```bash
cd C:\Users\esegu\Projects\aiwms
git init
git add .
git commit -m "Initial commit — AIWMS ready for Render"
```

GitHub'da yeni repo oluşturun (ör. `aiwms`), sonra:

```bash
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/aiwms.git
git push -u origin main
```

---

## 2. Render'da Blueprint ile deploy

1. [render.com](https://render.com) → giriş yapın (GitHub ile bağlayın)
2. **New +** → **Blueprint**
3. GitHub repo'nuzu seçin (`aiwms`)
4. Render `render.yaml` dosyasını okur — **3 servis + 1 DB** görünür
5. **Apply** / **Create** ile deploy başlatın

İlk deploy 10–15 dakika sürebilir (monorepo build).

---

## 3. Deploy sonrası test

Deploy bitince Render panelinde URL'ler görünür:

- **Web:** `https://aiwms-web.onrender.com` (veya benzeri)
- **API:** `https://aiwms-api.onrender.com`

Tarayıcıdan **Web URL**'ini açın.

### Demo giriş

| E-posta | Şifre | Rol |
|---|---|---|
| `admin@aiwms.local` | `password123` | Admin |
| `owner@aiwms.local` | `password123` | Owner |
| `worker1@aiwms.local` | `password123` | Worker |

> Ücretsiz planda servisler ~15 dk hareketsizlikten sonra uyur; ilk istek 30–60 sn sürebilir.

---

## Ortam değişkenleri (otomatik)

Render Blueprint şunları ayarlar:

| Değişken | Servis | Kaynak |
|---|---|---|
| `DATABASE_URL` | API | PostgreSQL |
| `JWT_SECRET` | API | Otomatik üretilir |
| `JWT_REFRESH_SECRET` | API | Otomatik üretilir |
| `CORS_ORIGIN` | API | Web URL |
| `API_URL` | Web | API URL |

Manuel müdahale gerekmez.

---

## Sorun giderme

### API build hatası
Render loglarında `aiwms-api` → **Logs** sekmesine bakın. Genelde Prisma veya TypeScript hatasıdır.

### Web açılıyor ama giriş çalışmıyor
- API servisinin **Live** olduğundan emin olun
- Web servisinde `API_URL` = API'nin `https://...onrender.com` adresi olmalı

### Veritabanı boş
Render artık **Docker** ile deploy eder (`Dockerfile.api`, `Dockerfile.web`). Blueprint sync sonrası **Manual Deploy → Clear build cache** yapın.

API `startCommand` migration + seed çalıştırır (free tier `preDeployCommand` desteklemez).

### Ücretsiz PostgreSQL
Render free DB 90 gün sonra silinir; kalıcı kullanım için ücretli plan gerekir.

---

## Yerel geliştirme (değişmeden)

```bash
docker compose up -d
pnpm install
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

---

## Güvenlik notu

Canlı ortamda demo şifrelerini (`password123`) değiştirmeniz önerilir. JWT secret'lar Render tarafından otomatik üretilir.
