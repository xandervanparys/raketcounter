# 🚀 Raketcounter

Raketcounter is a social web app that lets users log how many "raketten" (pints, points, or rockets) they've launched. Users can sign in with Google, track their total, view the leaderboard, and personalize their profile with a username and avatar.

---

## 🌐 Live Links

* **Production**: [https://raketcounter.be](https://raketcounter.be)
* **Development**: [https://raketcounter-dev.vercel.app](https://raketcounter-dev.vercel.app)

---

## ✨ Features

* 🔐 Google OAuth via Supabase
* 📊 Real-time leaderboard
* 🫲 Animated launch counter
* 🧑‍🎨 Custom usernames and avatars
* 🌙 Dark mode with Tailwind + Shadcn UI
* ⚙️ Secure with Supabase RLS policies

---

## 🧰 Tech Stack

| Layer        | Tech                                          |
| ------------ | --------------------------------------------- |
| Frontend     | Next.js (App Router), Tailwind CSS, Shadcn UI |
| Backend      | Supabase (PostgreSQL, Auth, Storage)          |
| Auth         | Supabase OAuth (Google)                       |
| Deployment   | Vercel                                        |
| Dev/Prod Env | Separate Supabase + Vercel projects           |

---

## 🧑‍💻 Local Development

### 1. Clone the Repo

```bash
git clone https://github.com/xandervanparys/raketcounter.git
cd raketcounter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Copy the example `.env`:

```bash
cp .env.example .env.local
```

And fill in the variables (from Supabase + Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=your-dev-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Google Auth Setup (Supabase)

Make sure you’ve added the correct **redirect URLs** in Supabase Auth → Settings → Google Provider:

* `http://localhost:3000/`
* `https://raketcounter.vercel.app/`
* `https://raketcounter.be/`

Also ensure this function is installed on your Supabase dev project to auto-create profiles:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
```

---

## 📂 Database Schema

### `profiles`

| Column      | Type | Notes                      |
| ----------- | ---- | -------------------------- |
| id          | uuid | PK / references auth.users |
| username    | text | Unique, must be ≥ 3 chars  |
| full\_name  | text | From Google metadata       |
| avatar\_url | text | Google or Supabase Storage |

### `raket_logs`

| Column      | Type              | Notes               |
| ----------- | ----------------- | ------------------- |
| id          | uuid              | PK                  |
| profile\_id | uuid              | FK → profiles.id    |
| timestamp   | timestamp with tz | Defaults to `now()` |
| amount      | integer           | Defaults to 1       |

---

## 🧪 Testing with Google Auth

If you're testing login locally with Google OAuth:

* Make sure Supabase Auth Google provider is enabled
* Ensure the function `on_auth_user_created` is added
* You can use a different browser profile or incognito to test new logins

---

## 🚀 Deploying with Vercel

```bash
# Link to Vercel
vercel link

# Pull your environment variables locally
vercel env pull .env.local

# Deploy to the correct project (dev or prod)
vercel --prod
```

Make sure you’ve created separate **Vercel projects** for dev and prod with their own Supabase env variables.

---

## 🧠 Tips

* Local `.env` files are still useful to match dev behavior or do selective testing
* Google Auth will redirect to the domain in your Supabase config, so make sure `redirectTo` is set to `window.location.origin`
* You can script or automate syncing env vars using the Vercel CLI if needed

---

## 🖼️ Screenshots

*Add screenshots or animations here if you'd like.*

---

## 📜 License

MIT License

---

## ✍️ Author

Made by [@xandervanparys](https://github.com/xandervanparys)
