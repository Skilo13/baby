# Baby Gender Bets 🎀👶

A fun web application for betting on a baby's gender! Built with Next.js and ready to deploy on Vercel.

## Features

- 🎲 **Virtual Betting System**: Users can bet virtual money (tenge) on baby's gender
- 💰 **Dynamic Coefficients**: Starting at 1.5x, coefficients adjust based on betting activity
- 👨‍👩‍👧 **Parent Portal**: Separate admin page for parents to reveal the gender
- 🎨 **Baby-themed UI**: Beautiful, colorful design with baby-themed elements
- 💵 **Virtual Currency**: Each user starts with 1000 tenge

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the betting page.

Open [http://localhost:3000/admin](http://localhost:3000/admin) to access the parent portal.

### Deployment to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Deploy!

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## How It Works

### For Bettors
1. Enter your name
2. Choose to bet on BOY or GIRL
3. Enter your bet amount (starting balance: 1000 ₸)
4. Watch the coefficients change as more people bet
5. Wait for the parent to reveal the gender
6. See your winnings (if you bet correctly)!

### For Parents
1. Access the `/admin` page (keep this link private!)
2. Select the baby's gender
3. Click "Reveal" to show the result to all bettors
4. The gender will appear on everyone's betting page

## Important Notes

⚠️ **Storage Limitations:**
- The current implementation uses in-memory storage for the betting state
- **On Vercel serverless**: State resets between deployments and may not persist across multiple serverless instances
- User balances are stored in localStorage (client-side, per-user)
- **For production with multiple concurrent users**, you should integrate persistent storage:
  - **Vercel KV (Recommended)**: Free tier available, easy integration
  - **Database**: PostgreSQL, MongoDB, etc.

🔒 **Security:**
- The parent/admin link (`/admin`) should be kept private and secure
- Consider adding authentication/password protection for the admin page
- Share the admin URL only with the parent

💡 **Tips for Testing:**
- The app works well for small groups (< 10 people) during a single session
- For longer-term use, integrate Vercel KV or a database

## Technology Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## License

This is a fun project for entertainment purposes only!
# baby
