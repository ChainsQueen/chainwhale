# Security Guidelines

## 🔒 Protecting Sensitive Information

This repository is configured to keep your API keys and secrets safe.

### ✅ What's Protected

1. **Environment Variables**
   - All `.env*` files are gitignored (except `.env.example`)
   - Your actual API keys in `.env.local` will NEVER be committed

2. **API Keys**
   - OpenAI API keys are loaded from environment variables
   - No hardcoded secrets in the codebase

### 📝 How to Set Up Your API Keys

1. **Create `.env.local` file** (this file is gitignored):
   ```bash
   cp .env.example .env.local
   ```

2. **Add your actual API key**:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Never commit `.env.local`**:
   - It's already in `.gitignore`
   - Git will automatically ignore it

### ⚠️ Important Rules

**DO:**
- ✅ Use `process.env.OPENAI_API_KEY` in code
- ✅ Keep API keys in `.env.local`
- ✅ Commit `.env.example` with placeholder values
- ✅ Add new secret variables to `.gitignore`

**DON'T:**
- ❌ Hardcode API keys in source code
- ❌ Commit `.env.local` or `.env`
- ❌ Share API keys in issues or pull requests
- ❌ Include API keys in screenshots

### 🔍 Verify Before Pushing

Before pushing to GitHub, always check:

```bash
# Check what files will be committed
git status

# Make sure no .env files are staged
git ls-files | grep "\.env"

# Should only show: .env.example
```

### 🚨 If You Accidentally Commit a Secret

1. **Immediately revoke the API key** at https://platform.openai.com/api-keys
2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Generate a new API key**
4. **Force push** (if already pushed to GitHub)

### 📚 Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Best practices for API keys](https://cloud.google.com/docs/authentication/api-keys)

---

**Remember:** Your `.env.local` file is your personal secret. Never share it!
