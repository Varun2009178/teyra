This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🌵 Daily Countdown Timer Feature

The Teyra app includes a sophisticated 24-hour countdown timer system that manages daily resets and email notifications.

### Features

- **Real-time Countdown**: Shows time until next daily reset (24 hours) and email notification (48 hours)
- **Visual Progress Bars**: Animated progress bars showing completion percentage
- **Timezone Support**: Displays user's local timezone
- **Automatic Notifications**: Celebration notifications when timers reach zero
- **Email Integration**: Triggers email notifications when users are inactive for 48+ hours

### How It Works

#### Daily Reset Timer (24 hours)
- Resets daily limits for mood check-ins and AI task splits
- Based on `last_daily_reset` timestamp in user_stats table
- Automatically resets when timer reaches 00:00:00
- Shows progress bar filling up over 24 hours

#### Email Notification Timer (48 hours)
- Triggers email reminders when users are inactive
- Based on `last_activity_at` timestamp in user_stats table
- Sends motivational emails to encourage user engagement
- Shows progress bar filling up over 48 hours

### Components

#### DailyCountdownTimer
Located in `src/components/DailyCountdownTimer.tsx`
- Displays both timers with real-time updates
- Shows progress bars and status indicators
- Updates every second
- Calls parent callbacks when timers reach zero

#### DailyResetNotification
Located in `src/components/DailyResetNotification.tsx`
- Celebration notification that appears when timers reach zero
- Animated entrance with particle effects
- Auto-dismisses after 10 seconds
- Provides action buttons for user interaction

### Testing

#### Manual Testing
1. Enable dev mode in the dashboard
2. Use "Test Reset" button to simulate 24-hour reset
3. Use "Test Notification" button to show notification
4. Watch countdown timer update in real-time

#### Automated Testing
```bash
# Test countdown timer functionality
npm run test:timer

# Test email system
npm run test:email

# Test cron jobs
npm run test:cron
```

### Database Schema

The timer system uses these fields in the `user_stats` table:

```sql
last_daily_reset TIMESTAMP -- When daily limits were last reset
last_activity_at TIMESTAMP -- When user was last active
timezone TEXT -- User's timezone for accurate timing
mood_checkins_today INTEGER -- Daily mood check-in count (resets to 0)
ai_splits_today INTEGER -- Daily AI split count (resets to 0)
```

### Email System Integration

The countdown timer integrates with the existing email system:

- **Daily Check-in Emails**: Sent when users are inactive for 24+ hours
- **First Task Reminders**: Special emails for new users or first-time completers
- **Timezone-aware**: Emails are sent considering user's local timezone
- **Cron Job**: Automated email sending via Vercel cron jobs

### Configuration

The timer system is configured via environment variables:

```env
CRON_SECRET=your_cron_secret
RESEND_API_KEY=your_email_api_key
NEXT_PUBLIC_APP_URL=your_app_url
```

### Future Enhancements

- [ ] Customizable reset intervals
- [ ] Multiple notification types
- [ ] Push notifications
- [ ] Calendar integration
- [ ] Timezone-based scheduling
