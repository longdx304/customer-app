# Customer App — Xem tồn kho

App đọc tồn kho cho khách hàng (iOS + Android + web), một codebase Expo + expo-router.
Đăng nhập bằng **số điện thoại + mật khẩu**; tài khoản do nhân viên tạo trong admin.

## Triển khai

Xem hướng dẫn tối ưu chi phí cho Web, Android APK, iPhone TestFlight/Ad Hoc và
Expo Go tại [DEPLOYMENT.md](./DEPLOYMENT.md).

## Cấu hình

`.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:9000
```

- Chạy trên **web / simulator**: `http://localhost:9000` là đủ.
- Chạy trên **thiết bị thật** (Expo Go): đổi sang IP LAN của máy chạy server, vd `http://192.168.1.10:9000` (điện thoại không hiểu `localhost`).

## Chạy app

```bash
npm install
npm run web      # mở trên trình duyệt
npm run ios      # simulator iOS (cần Xcode)
npm run android  # emulator/thiết bị Android
# hoặc: npx expo start  rồi quét QR bằng Expo Go
```

## Verify end-to-end (cần backend)

1. Trong `dobtech-server`: áp migration rồi chạy server
   ```bash
   medusa migrations run
   npm run dev
   ```
2. Trong `adminfront`: mở 1 khách hàng → mục **"Đăng nhập App tồn kho"** → đặt mật khẩu (đảm bảo khách đã có số điện thoại). Đây là tài khoản đăng nhập app.
3. Mở app, đăng nhập bằng SĐT + mật khẩu vừa đặt → xem danh sách tồn, search, mở chi tiết, kéo để refresh.
4. Đối chiếu vài SKU với màn warehouse inventory trong admin (cùng họ query nên số phải khớp).

## Cấu trúc

```
src/
  lib/
    api.ts           # fetch wrapper, tự gắn Bearer token, bắt 401 → logout
    auth.tsx         # AuthProvider: token + customer + login/logout
    tokenStorage.ts  # SecureStore (native) / localStorage (web)
  app/
    _layout.tsx          # QueryClient + AuthProvider + Stack
    login.tsx            # đăng nhập SĐT + mật khẩu
    (app)/
      _layout.tsx        # guard: chưa có token → /login
      index.tsx          # danh sách + search + phân trang + pull-to-refresh
      product/[id].tsx   # chi tiết: variant + tổng tồn + đơn vị
```

Endpoint backend dùng: `POST /store/customer-inventory/auth/token`, `GET /store/customer-inventory/auth/me`,
`GET /store/customer-inventory/products`, `GET /store/customer-inventory/products/:id`.
