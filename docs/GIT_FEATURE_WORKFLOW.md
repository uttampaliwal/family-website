# Git Feature Branch Workflow

This document provides a step-by-step guide for the complete lifecycle of a feature branch, from creation to merge. This is the standard day-to-day process for all development work.

---

### The Complete Feature Workflow: From Start to Finish

Let's imagine you need to create a new feature called "user-profile-page".

#### Step 1: Start the New Feature Branch

First, make sure you have the latest code and then create your new branch from `develop`.

```bash
# 1. Switch to the 'develop' branch
git checkout develop

# 2. Pull the latest changes from GitHub to make sure you're up-to-date
git pull origin develop

# 3. Create your new feature branch and switch to it
git checkout -b feature/user-profile-page
```

**Result:** You are now on a new branch called `feature/user-profile-page`, which is an exact copy of the latest `develop` branch.

---

#### Step 2: Do Your Work (Code and Commit)

Now, you can start making changes to the code. As you complete logical chunks of work, create commits.

```bash
# (You write some code, create new files, modify existing ones...)

# 1. Stage your changes for the commit
git add .

# 2. Commit your changes with a descriptive message (following Conventional Commits)
git commit -m "feat(profile): create basic layout for user profile page"

# (You continue to write more code, then commit again...)
git add .
git commit -m "feat(profile): add user avatar and details section"
```

**Best Practice:** Make small, frequent commits. It's easier to track changes and revert them if something goes wrong.

---

#### Step 3: Push Your Branch to GitHub

When you are ready to share your work or want to create a pull request, push your branch to the remote repository.

```bash
# Push your feature branch to GitHub. The '-u' sets it up to track the remote branch.
git push -u origin feature/user-profile-page
```

**Result:** Your branch now exists on GitHub, and others can see your changes.

---

#### Step 4: Create a Pull Request (PR)

1.  Go to your repository on GitHub.
2.  You will see a notification prompting you to create a pull request for your new branch. Click it.
3.  Set the **base branch** to `develop` and the **compare branch** to `feature/user-profile-page`.
4.  Fill out the PR template, explaining your changes and linking any relevant issues.
5.  Assign reviewers and click "Create Pull Request".

**Result:** Your team can now review your code, leave comments, and your automated CI tests will run.

---

#### Step 5: Merge the Pull Request

Once your PR has been approved and all checks have passed, it's time to merge.

1.  Go to the Pull Request page on GitHub.
2.  Click the **"Merge pull request"** button (or "Squash and merge", which is often preferred for a cleaner history).
3.  Confirm the merge.

**Result:** Your code from `feature/user-profile-page` is now officially part of the `develop` branch.

---

#### Step 6: Clean Up

After the merge, your feature branch is no longer needed. It's good practice to delete it to keep the repository clean.

1.  **On GitHub:** There is usually a "Delete branch" button that appears right after you merge the PR. Click it to delete the remote branch.

2.  **On your local machine:** You need to delete your local copy of the branch.

```bash
# 1. Switch back to the 'develop' branch
git checkout develop

# 2. Update your local 'develop' with the changes you just merged
git pull origin develop

# 3. Delete the local feature branch
git branch -d feature/user-profile-page
```

**Result:** Your repository (both local and remote) is now clean, and you are ready to start the next feature by going back to Step 1.
