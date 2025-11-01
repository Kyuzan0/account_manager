# Account Generator Backend API

Backend API untuk aplikasi Generator Akun Multi-Platform dengan stack MERN.

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

3. Jalankan MongoDB server

4. Start development server:
```bash
npm run dev
```

5. Start production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get info user saat ini (protected)
- `PUT /api/auth/profile` - Update profile user (protected)

### Accounts
- `GET /api/accounts` - Get semua akun user (protected)
- `POST /api/accounts` - Create akun baru (protected)
- `GET /api/accounts/:id` - Get akun by ID (protected)
- `PUT /api/accounts/:id` - Update akun (protected)
- `DELETE /api/accounts/:id` - Delete akun (protected)
- `GET /api/accounts/platform/:platform` - Get akun by platform (protected)

### Names
- `GET /api/names` - Get semua nama (protected)
- `POST /api/names` - Tambah nama manual (protected)
- `POST /api/names/upload` - Upload file CSV/Excel (protected)
- `GET /api/names/random/:platform` - Get random name untuk platform (protected)
- `DELETE /api/names/:id` - Delete nama (protected)

### Platforms
- `GET /api/platforms` - Get semua platform (public)
- `GET /api/platforms/:id` - Get platform by ID (public)
- `POST /api/platforms` - Tambah platform baru (admin only)
- `PUT /api/platforms/:id` - Update platform (admin only)
- `DELETE /api/platforms/:id` - Delete platform (admin only)
- `POST /api/platforms/initialize` - Initialize default platforms (admin only)

### Health Check
- `GET /api/health` - Health check endpoint
- `GET /` - Root endpoint dengan info API

## Struktur Database

### Users
```javascript
{
  username: String (unique, 3-30 chars),
  email: String (unique),
  password: String (hashed),
  role: String (user/admin, default: user),
  createdAt: Date,
  updatedAt: Date
}
```

### Accounts
```javascript
{
  userId: ObjectId (ref: User),
  platform: String (roblox/google/facebook/etc),
  username: String,
  password: String,
  additionalData: {
    birthDate: { day: Number, month: Number, year: Number },
    gender: String,
    firstName: String,
    lastName: String,
    recoveryEmail: String,
    phoneNumber: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### NameData
```javascript
{
  name: String,
  platform: String (roblox/google/facebook/general),
  source: String (manual/file),
  createdAt: Date
}
```

### Platforms
```javascript
{
  name: String (unique),
  displayName: String,
  fields: [{
    name: String,
    label: String,
    type: String (text/email/password/number/date/select),
    required: Boolean,
    options: [String], // untuk select type
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      message: String
    }
  }],
  usernameFormat: {
    pattern: String,
    minLength: Number,
    maxLength: Number,
    example: String
  },
  passwordRequirements: {
    minLength: Number,
    requireUppercase: Boolean,
    requireLowercase: Boolean,
    requireNumbers: Boolean,
    requireSpecialChars: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication

API menggunakan JWT (JSON Web Token) untuk authentication:
1. Login/registrasi untuk mendapatkan token
2. Include token di header: `Authorization: Bearer <token>`
3. Token berlaku selama 7 hari (default)

## File Upload

- Format yang didukung: CSV, Excel (.xlsx, .xls)
- Maximum file size: 5MB
- Field yang dibutuhkan: `name` (header column)
- Upload endpoint: `POST /api/names/upload`

## Error Response

Format error response:
```javascript
{
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field validation error"
    }
  ]
}
```

## Environment Variables

```bash
MONGODB_URI=mongodb://localhost:27017/account-generator
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
```

## Default Platforms

Aplikasi secara otomatis menginisialisasi platform default:
- Roblox
- Google
- Facebook

Setiap platform memiliki konfigurasi field dan validation yang berbeda.