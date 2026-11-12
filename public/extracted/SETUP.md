# Watch Ads & Earn – Setup Guide

Is folder me 4 files hain:
- `index.html` : user wali website
- `admin.html` : admin panel (kisi ko link na dein)
- `schema.sql` : Supabase ka database aur rules
- `SETUP.md` : ye guide

## Step 1: Supabase project
1. https://supabase.com par free account banayein aur **New project** banayein.
2. Left menu me **SQL Editor** > New query. `schema.sql` poori copy karke paste karein aur **Run** dabayein. "Success" aana chahiye.

## Step 2: Email setting
**Authentication > Providers > Email** me **"Confirm email" ko OFF** kar dein, warna naye users login nahi kar paenge jab tak email confirm na karein.

## Step 3: Admin account
1. **Authentication > Users > Add user** me apni admin email aur password dalein. Password sirf aap ke paas rahe.
2. **SQL Editor** me ye chalayein (apni email likh kar):
   `update profiles set is_admin=true where id=(select id from auth.users where email='YOUR_ADMIN_EMAIL');`

## Step 4: Keys paste karein
1. **Project Settings > API** se **Project URL** aur **anon public key** copy karein.
2. `index.html` aur `admin.html` dono me script ke shuru me `YOUR_SUPABASE_URL` aur `YOUR_SUPABASE_ANON_KEY` ki jagah paste karein.
3. **`service_role` key kabhi kisi file me ya kisi ko mat dein.**

## Step 5: Hosting
1. Netlify (netlify.com/drop) par is folder ko drag and drop karein, ya Vercel ya GitHub Pages use karein.
2. Admin page ka naam `admin.html` se badal kar koi mushkil sa naam rakhein (jaise `panel-x8k2.html`). Ye sirf chhupane ke liye hai. Asli security Supabase ke rules se hai, jo sirf is_admin user ko ijazat dete hain.
3. Site khol kar ek test account banayein aur check karein.

## Step 6: Ads lagana
Admin panel > **Ad Slots** me apne ad network ka code ya URL paste karein, aur purane placeholder slots **Turn off** kar dein.
Pehle ye zaroor check karein ke network har view ka kitna deta hai, aur ke wo PTC/rewarded traffic allow karta hai. Rs. 4.50 per ad aur 15% commission ke baad site nuksan me na jaye.

## Rozana ka kaam
1. Admin panel kholein, **Withdrawals > Pending** dekhein.
2. Account title aur number dekh kar JazzCash/Easypaisa se payment bhejein.
3. Payment bhejne **ke baad** **Approve** dabayein. Galat ya shak wali request ho to **Reject** dabayein, balance user ko wapis mil jata hai.

## Rules (agar badalne hon)
Sab rules `schema.sql` ke functions me hain: `claim_ad` (reward Rs. 4.5, commission 8/5/2%, 20 ads), `start_ad` (rozana 10 ads), `claim_bonus` (Rs. 50), `request_withdraw` (Rs. 200 pehli dafa, phir Rs. 800). Badal kar SQL dobara run karein.

## Kamzoriyan
- "Ek device = ek account" ki checking browser ke device ID par hai. VPN ya incognito se koi bach sakta hai.
- WhatsApp channel join karna verify nahi hota.
- Fake users ko dekhte rahein (Admin > Users me ads aur balance dekh kar).

## Update (version 2)
Naye features ke liye **`upgrade.sql`** bhi SQL Editor me run karein (`schema.sql` ke baad). Is me ye sab hai: settings, 24 ghante ka ad cooldown, block/delete user, maintenance mode, reset data aur admin stats.
Naye `index.html` aur `admin.html` me keys dobara paste karni hongi.
Reward, timer, limits aur commission ab Admin > **Settings** se badalte hain, SQL badalne ki zaroorat nahi.

## Update (naye features): update.sql
Supabase SQL Editor me **`update.sql` run karein** (schema.sql ke baad). `upgrade.sql` ki zarurat nahi, `update.sql` us ki jagah leti hai.
Isme hai: reward Rs. 2.5, timer 20 second, har ad 24 ghante baad dobara, settings, maintenance mode, block/delete user, withdrawals edit/delete, stats, reset data.
Phir naya `index.html` aur `admin.html` dobara upload karein (keys dobara paste karna na bhoolein).

## Forgot password
1. Supabase > Authentication > URL Configuration me apni site ka URL **Site URL** aur **Redirect URLs** dono me dalein.
2. Supabase ka built-in email service sirf testing ke liye hai aur limit rakhta hai. Asli users ko mail bhejne ke liye **Authentication > SMTP Settings** me apna SMTP lagayein (Brevo, Resend ya Gmail app password).
3. Jab tak email na chale: user WhatsApp channel par bata de, aur aap Admin > Users > **Set password** se temporary password set kar dein.
