# Hướng dẫn triển khai Customer App

Tài liệu này áp dụng cho `customer-app` (Expo SDK 54) và ưu tiên:

- Chi phí thấp trong giai đoạn manager test.
- Không cần phát hành công khai lên App Store hoặc Google Play.
- Một source code dùng cho web, Android và iPhone.
- Bản cài mobile kết nối tới `dobtech-server` qua HTTPS.

## 1. Kiến trúc khuyến nghị

```text
GitHub (source code)
        |
        +-- Web: Vercel / Netlify / Cloudflare Pages
        |
        +-- Mobile: EAS Build
              +-- Android: APK tải trực tiếp
              +-- iPhone: TestFlight hoặc Ad Hoc

dobtech-server + PostgreSQL
        |
        +-- VPS / Docker / dịch vụ chạy Node.js lâu dài
        +-- https://api.example.com
```

GitHub chỉ lưu source code. GitHub không làm cho API hoặc mobile app tự chạy.

`dobtech-server` cần chạy liên tục trên VPS hoặc một nền tảng phù hợp với Node.js,
PostgreSQL, background jobs và file upload. Không nên đưa backend Medusa hiện tại
lên Vercel Functions nếu chưa thiết kế lại theo kiến trúc serverless.

`customer-app` native không cần đặt trên VPS. EAS Build sẽ đóng gói source thành
APK hoặc bản iOS. Chỉ bản web mới cần web hosting.

## 2. Chọn phương án theo nhu cầu

| Nhu cầu | Phương án | Chi phí nền tảng | Hạn chế chính |
| --- | --- | --- | --- |
| Demo nhanh trên iPhone/Android | Expo Go + Tunnel | Miễn phí | Máy phát triển phải tiếp tục chạy |
| Manager dùng qua link lâu dài | Web mobile | Có thể miễn phí | Không phải native app hoàn chỉnh |
| Cài trực tiếp Android | EAS APK Internal | Có quota EAS Free | Người dùng phải cho phép cài APK ngoài store |
| Test native trên iPhone | TestFlight | EAS có quota Free, Apple 99 USD/năm | Build hết hạn sau 90 ngày |
| Link cài IPA cho iPhone chỉ định | EAS Ad Hoc | EAS có quota Free, Apple 99 USD/năm | Phải đăng ký UDID từng máy |
| Cài iPhone hoàn toàn miễn phí | Xcode Personal Team | Miễn phí | Tối đa 3 thiết bị và phải ký/cài lại sau 7 ngày |

Khuyến nghị theo giai đoạn:

1. Demo ngắn: Expo Go + Tunnel.
2. Manager test thường xuyên: Web mobile miễn phí + APK Android.
3. Cần trải nghiệm iPhone sát production: Apple Developer + TestFlight.

## 3. Chuẩn bị backend public

Mobile app không thể gọi `http://localhost:9000` sau khi cài trên điện thoại.
Backend cần một URL public, ví dụ:

```text
https://api.example.com
```

Yêu cầu tối thiểu:

- VPS hoặc dịch vụ chạy `dobtech-server` liên tục.
- PostgreSQL có backup.
- Domain hoặc subdomain cho API.
- HTTPS hợp lệ.
- Firewall chỉ mở các cổng cần thiết.
- `STORE_CORS` cho phép domain web customer app nếu triển khai web.
- Không public PostgreSQL ra Internet nếu không thật sự cần.
- Có health check và log cho backend.

Biến môi trường phía app:

```env
EXPO_PUBLIC_API_URL=https://api.example.com
```

`EXPO_PUBLIC_API_URL` là giá trị public và sẽ nằm trong bundle app. Không đặt
password database, JWT secret, SMTP password hoặc private key vào biến có prefix
`EXPO_PUBLIC_`.

## 4. Đưa source lên GitHub

Nên dùng repository private trong giai đoạn thử nghiệm.

File `.env` đã được ignore. Trước mỗi lần push, cần xác nhận `.env` không xuất
hiện trong `git status`.

```bash
cd /Users/namnguyen/Workspace/DOB/chamdep/customer-app

git add .
git status --short
git commit -m "Initialize SYNA customer inventory app"
git branch -M main
git remote add origin git@github.com:YOUR_ORG/customer-app.git
git push -u origin main
```

Thay `YOUR_ORG` và tên repository bằng thông tin GitHub thực tế.

Không commit các loại file sau:

```text
.env
*.p8
*.p12
*.mobileprovision
*.jks
credentials.json
```

## 5. Phương án miễn phí: Expo Go + Tunnel

Phù hợp để gửi manager kiểm tra nhanh mà chưa cần build.

```bash
cd /Users/namnguyen/Workspace/DOB/chamdep/customer-app
nvm use
npx expo start --tunnel --clear --max-workers 1
```

Quy trình:

1. Manager cài Expo Go từ App Store hoặc Google Play.
2. Gửi QR/link do Expo CLI tạo.
3. Manager quét QR để mở app.
4. Giữ máy phát triển và Expo CLI hoạt động trong suốt buổi test.

Điều kiện:

- App phải dùng API URL mà điện thoại truy cập được.
- Không dùng `localhost`.
- Đây là development environment, không phải bản đo hiệu năng production.

## 6. Triển khai bản web mobile

Đây là cách rẻ nhất để có một link hoạt động liên tục cho cả Android, iPhone và
máy tính. Manager có thể mở bằng Safari/Chrome và chọn **Add to Home Screen**.

### 6.1 Điều chỉnh output cho route động

App có route động `/product/[id]`. Với hosting tĩnh, nên dùng SPA output và
rewrite mọi URL về `index.html`.

Trong `app.json`, đổi:

```json
{
  "expo": {
    "web": {
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

### 6.2 Build web tại máy local

Tạo `.env`:

```env
EXPO_PUBLIC_API_URL=https://api.example.com
```

Build và kiểm tra:

```bash
cd /Users/namnguyen/Workspace/DOB/chamdep/customer-app
nvm use
npx tsc --noEmit
npx expo export --platform web
npx expo serve
```

Output được tạo trong thư mục `dist/`.

### 6.3 Deploy bằng Vercel

Trong Vercel:

1. Chọn **Add New Project**.
2. Import repository GitHub `customer-app`.
3. Framework Preset: `Other`.
4. Install Command: `npm ci --legacy-peer-deps`.
5. Build Command: `npx expo export --platform web`.
6. Output Directory: `dist`.
7. Tạo biến `EXPO_PUBLIC_API_URL=https://api.example.com`.

File `vercel.json` phải nằm ở root Git repository, ngang hàng với `package.json`.
Không dán nội dung file này vào ô **Root Directory** trên Vercel:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "npm ci --legacy-peer-deps --no-audit --no-fund",
  "buildCommand": "npx expo export --platform web",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Sau mỗi push vào branch production, Vercel có thể tự build lại.

### 6.4 Deploy bằng Netlify

Thêm `netlify.toml` ở root project:

```toml
[build]
  command = "npx expo export --platform web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Trong Netlify:

1. Import repository GitHub.
2. Đặt biến `EXPO_PUBLIC_API_URL`.
3. Deploy.

Cloudflare Pages có thể dùng cùng build command và output directory. Cần cấu
hình SPA fallback tương đương.

### 6.5 Lưu ý cho web

- Backend bắt buộc dùng HTTPS nếu frontend dùng HTTPS.
- `STORE_CORS` phải cho phép domain Vercel/Netlify/Cloudflare.
- Token web nằm trong `localStorage`; native app dùng SecureStore.
- Đổi `EXPO_PUBLIC_API_URL` yêu cầu build/deploy web lại.
- Nếu refresh `/product/:id` bị 404, kiểm tra SPA rewrite.

## 7. Chuẩn bị EAS Build

EAS Build không bắt buộc GitHub integration. CLI có thể upload source local lên
EAS. GitHub vẫn nên dùng để lưu lịch sử source và phối hợp đội nhóm.

### 7.1 Tránh lỗi npm peer dependency trên cloud

Project này đã từng cần `--legacy-peer-deps` khi cài Expo SDK 54. Để EAS dùng
cùng cách cài, tạo `.npmrc` ở root:

```ini
legacy-peer-deps=true
fund=false
audit=false
```

Commit `.npmrc` cùng source trước khi build cloud.

### 7.2 Đăng nhập và khởi tạo EAS

```bash
cd /Users/namnguyen/Workspace/DOB/chamdep/customer-app
nvm use

npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build:configure
```

`eas init` sẽ liên kết source với Expo project và thêm `projectId` vào app config.

### 7.3 Đặt application identifier

Chọn identifier duy nhất và không đổi sau khi đã tạo app trên Apple/Google:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.syna.inventory",
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.syna.inventory"
    }
  }
}
```

`usesNonExemptEncryption: false` giúp trả lời phần export compliance khi app chỉ
dùng cơ chế mã hóa tiêu chuẩn của hệ điều hành/HTTPS và không tự triển khai thuật
toán mã hóa riêng. Cần đánh giá lại nếu app bổ sung cryptography tùy chỉnh.

### 7.4 Cấu hình `eas.json`

```json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "environment": "preview",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "environment": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

Ý nghĩa:

- `preview`: APK Android và Ad Hoc iOS cho test nội bộ.
- `production`: release build dùng cho TestFlight hoặc store.
- `autoIncrement`: tự tăng build number để Apple không từ chối build trùng.

### 7.5 Tạo biến môi trường trên EAS

```bash
npx eas-cli@latest env:create \
  --name EXPO_PUBLIC_API_URL \
  --value https://api.example.com \
  --environment preview \
  --visibility plaintext

npx eas-cli@latest env:create \
  --name EXPO_PUBLIC_API_URL \
  --value https://api.example.com \
  --environment production \
  --visibility plaintext
```

Kiểm tra:

```bash
npx eas-cli@latest env:list --environment preview
npx eas-cli@latest env:list --environment production
```

## 8. Tạo APK Android tải trực tiếp

Không cần Google Play Developer.

```bash
cd /Users/namnguyen/Workspace/DOB/chamdep/customer-app
nvm use
npx tsc --noEmit
npx eas-cli@latest build --platform android --profile preview
```

Khi build hoàn thành:

1. Mở link build EAS.
2. Tải APK hoặc gửi link/QR cho manager.
3. Manager cho phép trình duyệt cài app từ nguồn bên ngoài.
4. Cài APK.

Khi cập nhật:

- Chỉ đổi JavaScript/UI: có thể dùng EAS Update sau khi đã cấu hình.
- Đổi native dependency, icon, permission hoặc app config native: build APK mới.

Không dùng profile mặc định tạo AAB nếu mục tiêu là cài trực tiếp. AAB dành cho
Google Play và không thể bấm cài như APK.

## 9. iPhone qua TestFlight

Đây là cách thuận tiện nhất khi có nhiều manager dùng iPhone.

Yêu cầu:

- Apple Developer Program, hiện là 99 USD/năm.
- App Store Connect.
- Bundle ID duy nhất.
- Manager cài ứng dụng TestFlight từ App Store.

TestFlight không làm app xuất hiện công khai trên App Store. Chỉ khi chủ động
submit production release thì app mới đi qua quy trình phát hành App Store.

### 9.1 Tạo app trên App Store Connect

1. Đăng nhập App Store Connect.
2. Chọn **My Apps** → **New App**.
3. Tạo app với bundle ID khớp `ios.bundleIdentifier`.
4. Chọn tên app và SKU nội bộ.

### 9.2 Build iOS production

```bash
cd /Users/namnguyen/Workspace/DOB/chamdep/customer-app
nvm use
npx tsc --noEmit
npx eas-cli@latest build --platform ios --profile production
```

Trong lần đầu, EAS sẽ yêu cầu đăng nhập Apple và tạo/quản lý signing credentials.

### 9.3 Upload lên TestFlight

```bash
npx eas-cli@latest submit \
  --platform ios \
  --profile production \
  --latest
```

Hoặc build và submit trong một lệnh:

```bash
npx eas-cli@latest build \
  --platform ios \
  --profile production \
  --auto-submit
```

### 9.4 Mời manager

Internal Testing:

- Tối đa 100 App Store Connect users.
- Phù hợp với manager nội bộ có thể được thêm vào App Store Connect.
- Không cần TestFlight Beta App Review cho internal build thông thường.

External Testing:

- Có thể mời tối đa 10.000 tester hoặc dùng public invitation link.
- Build đầu tiên của nhóm external cần TestFlight Beta App Review.
- Không đồng nghĩa với phát hành app công khai.

Mỗi TestFlight build dùng để test tối đa 90 ngày. Trước khi hết hạn, tạo build
mới và thêm vào nhóm tester.

## 10. iPhone qua EAS Ad Hoc link

Ad Hoc tạo link cài IPA nhưng chỉ cài được trên iPhone đã đăng ký UDID.

Yêu cầu:

- Apple Developer Program trả phí.
- UDID của từng iPhone phải nằm trong provisioning profile.
- Thêm thiết bị mới có thể cần build hoặc re-sign lại.

Đăng ký thiết bị:

```bash
npx eas-cli@latest device:create
```

Gửi link/QR đăng ký thiết bị cho manager. Sau khi các thiết bị đã được đăng ký:

```bash
npx eas-cli@latest build --platform ios --profile preview
```

Gửi link build EAS cho các thiết bị đã đăng ký.

Chọn Ad Hoc khi số lượng iPhone ít và cần link cài trực tiếp. Chọn TestFlight khi
có nhiều manager hoặc thường xuyên thêm thiết bị mới.

## 11. iPhone miễn phí bằng Xcode Personal Team

Apple Account miễn phí có thể ký và cài app trực tiếp bằng Xcode, nhưng:

- Chỉ phù hợp cho test cá nhân.
- Tối đa 3 thiết bị.
- Provisioning profile hết hạn sau 7 ngày.
- Phải build và cài lại sau khi hết hạn.
- Không tạo được link phát rộng cho manager.

Không khuyến nghị phương án này cho đội vận hành.

## 12. EAS Update để giảm số lần build

Sau khi đã có APK/TestFlight build, EAS Update có thể cập nhật JavaScript và asset
qua mạng mà không tạo binary mới.

Phù hợp với:

- Chỉnh giao diện.
- Sửa logic TypeScript/JavaScript.
- Thay ảnh nằm trong JavaScript bundle.

Không phù hợp với:

- Thêm hoặc đổi native package.
- Đổi permission native.
- Đổi bundle identifier/package name.
- Đổi cấu hình cần native rebuild.
- Nâng Expo SDK/React Native.

Project hiện chưa cấu hình `expo-updates`. Khi quyết định dùng OTA:

```bash
npx eas-cli@latest update:configure
```

Sau đó cần tạo build mới một lần để binary có runtime/update configuration. Các
lần cập nhật JavaScript tiếp theo có thể dùng:

```bash
npx eas-cli@latest update \
  --channel production \
  --environment production \
  --message "Update inventory UI"
```

Luôn test trên preview channel trước khi update production. Không dùng OTA để
thay đổi API contract chưa tương thích với backend hiện tại.

## 13. Tối ưu chi phí EAS

EAS Free hiện công bố quota 15 Android builds và 15 iOS builds. Chính sách và
quota có thể thay đổi, nên kiểm tra trang pricing trước mỗi giai đoạn release.

Cách tiết kiệm quota:

- Dùng Expo Go trong lúc phát triển.
- Chạy `npx tsc --noEmit` trước khi gửi cloud build.
- Chỉ build APK khi một nhóm thay đổi đã ổn.
- Không cấu hình GitHub Action build sau mọi commit.
- Dùng EAS Update cho thay đổi JavaScript/UI sau khi đã kiểm thử.
- Build Android và iOS riêng; không dùng `--platform all` nếu chỉ cần một nền tảng.
- Dùng web preview cho review giao diện trước khi build native.

Chi phí tối thiểu dự kiến:

| Hạng mục | Chi phí |
| --- | --- |
| GitHub private repository | Có thể miễn phí |
| Vercel/Netlify/Cloudflare web | Có free tier |
| EAS Build | Có free tier và quota |
| Android APK direct | Không cần Google Play |
| Apple Developer | 99 USD/năm nếu phát build cho manager |
| VPS/backend/domain | Tùy nhà cung cấp |

EAS Free chỉ miễn phí tài nguyên build trong quota. EAS không thay thế phí Apple
Developer và không vượt qua quy định ký/phân phối ứng dụng của Apple.

## 14. Hiệu năng các bản test

Expo Go:

- Tiện cho phát triển.
- Chạy trong app container chung.
- Có Metro/dev tooling.
- Không nên dùng để kết luận hiệu năng production.

APK preview và TestFlight production:

- JavaScript bundle nằm trong binary.
- Không cần Metro server.
- Chạy release mode.
- Hiệu năng gần với bản production thực tế.

Với app này, các yếu tố ảnh hưởng lớn nhất thường là:

- Độ trễ VPS/API.
- Query database và index.
- Dung lượng ảnh sản phẩm.
- Cache/CDN ảnh.
- Chất lượng mạng của manager.

Danh sách đang phân trang và `expo-image` có cache, phù hợp cho giai đoạn test.

## 15. Checklist trước khi phát bản test

```text
[ ] Source đã commit và push GitHub
[ ] .env và credentials không nằm trong Git
[ ] API public chạy bằng HTTPS
[ ] Migration database đã chạy
[ ] Có backup PostgreSQL
[ ] EXPO_PUBLIC_API_URL đúng môi trường
[ ] STORE_CORS cho phép web domain
[ ] Đăng nhập customer hoạt động
[ ] Customer bị khóa không dùng lại token cũ
[ ] Search sản phẩm hoạt động
[ ] Tổng tồn và tồn variant khớp admin warehouse
[ ] Hình ảnh tải được ngoài mạng nội bộ
[ ] npx tsc --noEmit thành công
[ ] Version/build number được tăng
[ ] Test trên ít nhất một Android và một iPhone thật
```

## 16. Lỗi thường gặp

### App cài được nhưng không đăng nhập

- Kiểm tra `EXPO_PUBLIC_API_URL`.
- Không dùng `localhost` hoặc IP LAN trong cloud build.
- Kiểm tra HTTPS certificate.
- Kiểm tra backend và route `/store/customer-inventory/auth/token`.

### Web gọi API bị CORS

- Thêm domain web vào `STORE_CORS`.
- Restart backend sau khi đổi biến môi trường.
- Không trộn frontend HTTPS với backend HTTP.

### Refresh trang chi tiết web bị 404

- Dùng `web.output: "single"`.
- Cấu hình rewrite mọi route về `/index.html`.

### Android tạo AAB thay vì APK

- Dùng profile có `distribution: "internal"` hoặc `android.buildType: "apk"`.
- Chạy `--profile preview`.

### EAS npm install báo ERESOLVE

- Commit `.npmrc` có `legacy-peer-deps=true`.
- Kiểm tra `package.json` và `package-lock.json` cùng trạng thái.
- Không dùng `--force` nếu chưa hiểu dependency bị thay đổi.

### iPhone không cài được link Ad Hoc

- Thiết bị chưa đăng ký UDID trước lúc build.
- Provisioning profile chưa chứa thiết bị.
- Build cần được re-sign hoặc tạo lại.

### TestFlight chưa thấy build

- Chờ App Store Connect xử lý.
- Kiểm tra build number có bị trùng không.
- Kiểm tra signing, export compliance và App Store Connect app ID.
- External group cần Beta App Review cho build đầu tiên.

## 17. Tài liệu chính thức

- [Expo: Internal distribution](https://docs.expo.dev/build/internal-distribution/)
- [Expo: Build APK](https://docs.expo.dev/build-reference/apk/)
- [Expo: EAS Build configuration](https://docs.expo.dev/build/eas-json/)
- [Expo: EAS environment variables](https://docs.expo.dev/eas/environment-variables/)
- [Expo: Submit iOS](https://docs.expo.dev/submit/ios/)
- [Expo: Publish websites](https://docs.expo.dev/guides/publishing-websites/)
- [Expo: SDK 54](https://expo.dev/changelog/sdk-54)
- [Expo: Pricing](https://expo.dev/pricing)
- [Apple: TestFlight](https://developer.apple.com/testflight/)
- [Apple: Free and paid developer accounts](https://developer.apple.com/help/account/basics/about-your-developer-account)
- [Apple: App Store Connect upload requirements](https://developer.apple.com/news/upcoming-requirements/)

Các mức giá, quota và yêu cầu của Apple/Expo có thể thay đổi. Kiểm tra lại các
trang chính thức trên trước khi mở rộng phát hành.
