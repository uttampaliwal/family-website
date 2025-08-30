import passport from "passport";
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from "passport-github2";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
  VerifyCallback,
} from "passport-google-oauth20";

import { logger } from "../utils/logger.js";

// Serialize user for session
import User from "../models/User";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    logger.error({ err: error }, "Error deserializing user");
    done(error as Error, null);
  }
});

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL:
          process.env.GITHUB_CALLBACK_URL || "/api/auth/github/callback",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GitHubProfile,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        done: (error: any, user?: any) => void,
      ) => {
        try {
          // Check if user already exists with this GitHub ID
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with the same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              // Link GitHub account to existing user
              user.githubId = profile.id;
              user.avatar = profile.photos?.[0]?.value || user.avatar;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const username =
            profile.username ||
            profile.displayName?.replace(/\s+/g, "").toLowerCase() ||
            `github_${profile.id}`;

          user = new User({
            githubId: profile.id,
            username: await generateUniqueUsername(username),
            email: email || `${profile.id}@github.local`,
            name: profile.displayName || profile.username || "GitHub User",
            dateOfBirth: new Date("1990-01-01"), // Default date, should be updated by user
            gender: "prefer not to say",
            avatar: profile.photos?.[0]?.value,
            isVerified: !!email, // Verify if we have a real email
            authProvider: "github",
          });

          await user.save();
          logger.info(`New user created via GitHub: ${user.username}`);
          done(null, user);
        } catch (error) {
          logger.error({ err: error }, "GitHub OAuth error");
          done(error as Error, undefined);
        }
      },
    ),
  );
}

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: VerifyCallback,
      ) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with the same email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.avatar = profile.photos?.[0]?.value || user.avatar;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const username =
            profile.displayName?.replace(/\s+/g, "").toLowerCase() ||
            `google_${profile.id}`;

          user = new User({
            googleId: profile.id,
            username: await generateUniqueUsername(username),
            email: email || `${profile.id}@google.local`,
            name: `${profile.name?.givenName || "Google"} ${profile.name?.familyName || "User"}`,
            dateOfBirth: new Date("1990-01-01"), // Default date, should be updated by user
            gender: "prefer not to say",
            avatar: profile.photos?.[0]?.value,
            isVerified: true, // Google emails are pre-verified
            authProvider: "google",
          });

          await user.save();
          logger.info(`New user created via Google: ${user.username}`);
          done(null, user);
        } catch (error) {
          logger.error({ err: error }, "Google OAuth error");
          done(error as Error, undefined);
        }
      },
    ),
  );
}

// Helper function to generate unique username
async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

export default passport;
