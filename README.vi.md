# Wolvesville Discord Bot

[English](README.md) · [Tiếng Việt](README.vi.md)

Bot Discord mã nguồn mở dùng slash commands để tra cứu dữ liệu từ **Wolvesville Public API chính thức**. Mỗi người tự host bot bằng Discord token và Wolvesville API key của riêng mình.

Project sử dụng các endpoint tra cứu/tích hợp chính thức, trong đó các lệnh clan được chủ đích giới hạn ở thao tác chỉ đọc.

## Lệnh có sẵn

- `/wov-player username` — tìm player theo username chính xác.
- `/wov-highscores period [limit]` — top XP ngày/tuần/tháng/mọi thời đại.
- `/wov-roles [query] [team] [locale]` — tra cứu và lọc vai trò.
- `/wov-rotation [mode] [locale]` — role rotation hiện tại.
- `/wov-ranked view [language]` — mùa hiện tại hoặc leaderboard.
- `/clan search name [exact]` — tìm clan.
- `/clan authorized` — clan đã thêm Wolvesville bot và các quyền đã cấp.
- `/clan info clan-id` — thông tin clan.
- `/clan members clan-id` — danh sách thành viên.
- `/clan quest clan-id` — quest đang hoạt động (chỉ đọc).

## Yêu cầu

- [Node.js](https://nodejs.org/) 20.11 trở lên; khuyến nghị bản LTS hiện hành.
- Một Discord application có bot user.
- Một Wolvesville Public API key.
- Một máy tính hoặc máy chủ có thể chạy tiến trình Node.js liên tục.

## 1. Lấy Wolvesville API key

Theo [hướng dẫn chính thức của Wolvesville](https://api-docs.wolvesville.com/):

1. Đăng nhập đúng tài khoản Wolvesville sẽ sở hữu bot/API key.
2. Mở **Settings** trong Wolvesville.
3. Chọn **Wolvesville public API**.
4. Tạo API bot nếu tài khoản chưa có. Mỗi tài khoản chỉ có thể tạo một API bot.
5. Sao chép **Khóa bảo mật / API key** và lưu ở nơi an toàn.

Màn hình này cung cấp hai giá trị khác nhau:

- **API key / Khóa bảo mật**: dùng để xác thực request dưới dạng `Authorization: Bot <apiKey>`. Đây là bí mật và được đặt vào `WOLVESVILLE_API_KEY` trong `.env`.
- **Bot ID / ID bot**: không dùng để xác thực request. Clan leader chỉ cần Bot ID khi muốn thêm bot làm clan bot và cấp quyền truy cập dữ liệu clan riêng.

Không đăng API key lên GitHub, Discord, ảnh chụp màn hình hoặc log công khai. Nếu key bị lộ, hãy thiết lập lại khóa trong Wolvesville rồi cập nhật `.env`.

Tài liệu liên quan:

- [Wolvesville Public API documentation](https://api-docs.wolvesville.com/)
- [OpenAPI specification](https://api-docs.wolvesville.com/api/openapi.json)
- [Wolvesville Terms of Service](https://legal.wolvesville.com/tos.html)
- API base URL: `https://api.wolvesville.com`

## 2. Tạo Discord bot

1. Mở [Discord Developer Portal](https://discord.com/developers/applications) và chọn **New Application**.
2. Vào trang **Bot**, tạo bot user nếu Discord yêu cầu, rồi sao chép/reset token.
3. Đặt token vào `DISCORD_TOKEN`. Không chia sẻ token và không commit `.env`.
4. Ở **General Information**, sao chép **Application ID** vào `DISCORD_CLIENT_ID`.
5. Để thử nghiệm theo một server, bật Developer Mode trong Discord, nhấp phải server → **Copy Server ID**, rồi đặt ID vào `DISCORD_GUILD_ID`.
6. Trong phần cài đặt OAuth2/Installation, dùng **Guild Install** với scopes `bot` và `applications.commands`.
7. Chỉ cấp các bot permissions cần thiết: **View Channels**, **Send Messages** và **Embed Links**. Bot không cần Administrator hay Message Content Intent.
8. Dùng install link do Discord tạo để thêm bot vào server.

`DISCORD_GUILD_ID` là tùy chọn. Có giá trị này thì command được đăng ký riêng vào server thử nghiệm và cập nhật gần như tức thì. Để trống thì command được đăng ký toàn cục và có thể cần một thời gian để xuất hiện trên mọi server.

## 3. Cài đặt project

Clone repository và cài dependency:

```bash
git clone https://github.com/xVanDat/Wolvesville-Discord-Bot.git
cd Wolvesville-Discord-Bot
npm install
```

Tạo `.env` từ file mẫu:

```bash
cp .env.example .env
```

PowerShell trên Windows:

```powershell
Copy-Item .env.example .env
```

Điền các giá trị của riêng bạn:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_application_id
DISCORD_GUILD_ID=your_test_server_id
WOLVESVILLE_API_KEY=your_wolvesville_api_key
```

Các biến tùy chọn đã có giá trị mặc định trong `.env.example`:

```env
WOLVESVILLE_API_BASE_URL=https://api.wolvesville.com
WOLVESVILLE_API_TIMEOUT_MS=10000
```

`.env` đã được thêm vào `.gitignore`. Hãy kiểm tra lại trước mỗi lần commit để chắc chắn không có token hoặc API key thật.

## 4. Đăng ký slash commands và chạy bot

Đăng ký hoặc cập nhật commands:

```bash
npm run deploy
```

Khởi động bot:

```bash
npm start
```

Trong lúc phát triển, có thể tự khởi động lại khi source thay đổi:

```bash
npm run dev
```

Sau khi đổi tên, mô tả hoặc options của command, phải chạy lại `npm run deploy`.

## 5. Tự host lâu dài

Bot phải giữ tiến trình `npm start` đang chạy. Bạn có thể đặt project trên VPS, máy chủ tại nhà hoặc nền tảng hỗ trợ Node.js. Trên dịch vụ hosting, khai báo bốn biến môi trường giống `.env`; không upload file `.env` nếu nền tảng có trang quản lý secrets riêng.

Khi triển khai production, nên để trống `DISCORD_GUILD_ID` rồi chạy `npm run deploy` một lần để đăng ký commands toàn cục. Sau đó chạy `npm start` như một long-running service và cấu hình nền tảng tự khởi động lại khi tiến trình dừng.

## Clan bot

Dữ liệu clan công khai hoạt động với clan ID. Một số dữ liệu riêng chỉ xuất hiện nếu clan leader thêm **Wolvesville Bot ID** vào clan và cấp quyền phù hợp. API key không phải Bot ID và tuyệt đối không đưa API key cho clan leader.

Nhóm `/clan` trong project này cố ý chỉ gọi các endpoint `GET`. Những endpoint có thể đăng chat, kick/block thành viên, sửa flair hoặc thao tác quest không được triển khai.

## Xử lý lỗi và rate limit

- Mọi command gọi mạng đều dùng `deferReply()` để tránh interaction hết hạn.
- Request timeout mặc định sau 10 giây; có thể đổi bằng `WOLVESVILLE_API_TIMEOUT_MS`.
- Client thử lại tối đa hai lần với HTTP `429` và lỗi máy chủ tạm thời, tôn trọng `Retry-After` và giới hạn thời gian chờ mỗi lần.
- Lỗi xác thực, không tìm thấy và rate limit được chuyển thành phản hồi riêng tư trên Discord.
- Username, giới hạn số dòng, locale, game mode và clan UUID đều được validate.

## Kiểm tra project

```bash
npm run check
npm test
```

## Bảo mật

- Không commit `.env` hay ghi token/API key vào source.
- Không log `DISCORD_TOKEN` hoặc `WOLVESVILLE_API_KEY`.
- Chỉ dùng Wolvesville Public API đúng tài liệu và điều khoản hiện hành.

Request Wolvesville gửi các header `Accept: application/json`, `Content-Type: application/json` và `Authorization: Bot <API key>` theo tài liệu chính thức.

## Giấy phép

Project được phát hành theo [MIT License](LICENSE). Bạn có thể sử dụng, sao chép, chỉnh sửa, hợp nhất, xuất bản, phân phối, cấp phép lại và bán các bản sao của phần mềm theo các điều khoản của giấy phép.

