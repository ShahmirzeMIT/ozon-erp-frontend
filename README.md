# Ozon ERP — Frontend (Demo, Backend-siz)

React 19 + TypeScript + Vite + Ant Design 5 üzərində qurulmuş, **tamamilə frontend-only** Ozon marketplace ERP demo interfeysi. Bu layihədə heç bir real Ozon API çağırışı, backend, cron, email göndərilməsi və ya AI (LLM) inteqrasiyası YOXDUR — bütün data deterministik şəkildə brauzerdə generasiya olunan mock datasetdən gəlir.

## Sürətli başlanğıc

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build -> dist/
npm run preview   # build nəticəsini lokal yoxlamaq üçün
```

Node.js 20+ tövsiyə olunur.

## Arxitektura

```
src/
  types/            Bütün domen tipləri (Product, Posting, ReturnRecord, ...)
  data/mock/         Seed edilmiş (deterministik) mock dataset generatoru
    seed.ts          mulberry32 PRNG, sabit SEED və "bugünkü tarix"
    catalog.ts       40 məhsul (8 kateqoriya) + 3 anbar + qiymət tarixçəsi
    transactions.ts  60 günlük postinglər, qaytarmalar, maliyyə, sync, qalıq
    index.ts         Hər şeyi bir dəfə quraşdırıb keşləyən vahid mənbə
  services/
    ErpDataSource.ts       Backend-agnostik interfeys (kontrakt)
    MockErpDataSource.ts   Hazırkı aktiv implementasiya (200-500ms süni gecikmə ilə)
    HttpErpDataSource.ts   Gələcək backend üçün BOŞ skelet (indi işləmir)
    normalizers/           Ozon xam JSON -> UI tipləri (yalnız imza, backend qoşulanda doldurulacaq)
    DemoPreferencesStore.ts  localStorage-only: watchlist, alarm qaydaları, email abunəliyi, maya dəyəri, tema
  hooks/             useDataSource, useAppState (tema/tarix aralığı), useWatchlist
  layout/            Responsiv AppLayout (Sider / mobil Drawer), Topbar, SidebarMenu
  pages/             11 səhifə (aşağıda)
```

### Niyə bu şəkildə?

`ErpDataSource` interfeysi UI-ın etibar etdiyi YEGANƏ kontraktdır. Bu gün onu `MockErpDataSource` doldurur. Backend hazır olanda:

1. `src/services/HttpErpDataSource.ts` daxilindəki hər metodu öz REST endpoint-inizə `fetch` çağırışı ilə tamamlayın.
2. Ozon-un (və ya öz backend-inizin) xam cavabını `src/services/normalizers/index.ts` daxilində UI tiplərinə çevirin.
3. `src/hooks/useDataSource.ts` daxilində `mockErpDataSource`-i `new HttpErpDataSource()` ilə əvəz edin.

Heç bir səhifə və ya komponent DƏYİŞDİRİLMİR — hamısı yalnız `ErpDataSource` interfeysinə bağlıdır.

## Səhifələr

| Route | Səhifə | Qısa təsvir |
|---|---|---|
| `/` | İcmal | KPI-lər, satış trendi, FBO/FBS bölgüsü, top məhsullar, kritik alarmlar, son sifarişlər, sync statusu |
| `/products`, `/products/:id` | Məhsullar | Axtarış/filtr/sort/pagination, CSV export, izləmə (⭐), detal səhifəsi (qiymət/qalıq tarixçəsi, maya dəyəri) |
| `/orders`, `/orders/:postingNumber` | Sifarişlər | FBO/FBS tab, status/tarix filtri, detal (mallar, status addımları, əlaqəli maliyyə) |
| `/inventory` | Anbar və qalıq | Anbar/tip filtri, kritiklik həddi, tükənmə günü hesablaması, anbar müqayisə qrafiki |
| `/returns` | Qaytarmalar | Trend, top qaytarılan məhsullar, filtrlər, detal drawer |
| `/finance` | Maliyyə | Əməliyyatlar, cəmlər, günlük/aylıq realizasiya tabları, CSV export |
| `/analytics` | Analitika | Çoxfiltrli trend, əvvəlki dövrlə müqayisə, ən yaxşı/zəif məhsullar, stok riski |
| `/ai` | AI analitik | Hazır sual çipləri + sərbəst sual — dataset üzərində **deterministik** (LLM-siz) cavablar |
| `/alerts` | Alarm və email | İzlənilən məhsullar, alarm qaydası qurucusu, email abunəlik forması (heç nə göndərilmir) |
| `/sync` | Sinxronizasiya | 16 Ozon endpoint statusu, demo rejim seçimi (normal/boş/hamısı xəta) |
| `/settings` | Ayarlar | Tema, mağaza məlumatı (salt-oxu), demo datanın sıfırlanması |

## Demo dataset qaydaları

- **Determinizm**: sabit seed (`SEED = 20260101`) və sabit "bugün" (`2026-09-24`) istifadə olunur — hər səhifə açılışında eyni rəqəmlər görünür.
- **Vahid mənbə**: KPI-lər hər yerdə postinglər/maliyyə əməliyyatlarından canlı aqreqasiya olunur, ayrıca təsadüfi ədədlər kimi generasiya olunmur — buna görə səhifələr arasında ziddiyyət yoxdur.
- Ən azı 3 məhsulda **kritik az qalıq**, 2 məhsulda **satış azalması**, 1 məhsulda **yüksək qaytarma faizi**, 16 endpoint-dən 1-də **sync xətası** qəsdən qurulub ki, UI-ın bu vəziyyətləri necə göstərdiyi yoxlana bilsin.
- Bəzi məhsullarda **maya dəyəri** qəsdən boşdur ("Maya dəyəri daxil edilməyib" göstərilir, detal səhifəsindən doldurula bilər).

## "Demo əməliyyatları" (localStorage-only)

Aşağıdakılar HEÇ BİR şəbəkə sorğusu göndərmədən yalnız cari brauzerdə saxlanılır və `DemoTag` ilə işarələnib:

- İzlənilən məhsullar (⭐)
- Alarm qaydaları
- Email bildiriş abunəliyi
- Maya dəyəri düzəlişləri
- Tema seçimi (light/dark)
- Sync demo rejimi

Ayarlar səhifəsindən "Demo üstünlükləri sıfırla" ilə hamısı silinə bilər.

## Bilinən məhdudiyyətlər

- Analitika səhifəsində konversiya göstəricisi hesablanmır, çünki mock datasetdə baxış/klik sayı (denominator) yoxdur — bu, UI-da açıq şəkildə izah olunur, uydurma rəqəm göstərilmir.
- Bundle ölçüsü demo məqsədləri üçün optimallaşdırılmayıb (kod bölünməsi edilməyib); istehsalatda `React.lazy` ilə route-based code-splitting tövsiyə olunur.
- `HttpErpDataSource` və `normalizers` yalnız imza səviyyəsindədir — çağırıldıqda bilərəkdən aydın xəta atır ki, backend inteqrasiyası unudulmasın.
