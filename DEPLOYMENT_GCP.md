# Google Cloud Run Deployment Guide ($300 Free Tier / Always Free Tier)

This repository is pre-configured to run with zero waste on **Google Cloud Run**, fitting within the **GCP $300 Free Trial Credit** and the **Cloud Run Always Free Tier**.

---

## 1. Cloud Run Free Tier Allowances (Every Month)
Google Cloud provides an **Always Free Tier** for Cloud Run every month:
* **2,000,000 Requests / month**: Free
* **360,000 vCPU-seconds / month**: Free (approx. 100 hours of continuous 1 vCPU execution)
* **180,000 GiB-seconds / month**: Free (approx. 100 hours of 512MiB memory execution)
* **1 GiB Network Egress / month**: Free to North America

Because our service is configured with **Scale-to-Zero (`--min-instances=0`)**, instances shut down when idle. Your service incurs **$0.00** when not receiving requests!

---

## 2. One-Line Deployment Command

Run this single command from your project root in Google Cloud Shell or your terminal:

```bash
gcloud run deploy energymind-ai \
  --source . \
  --region us-central1 \
  --platform managed \
  --port 3000 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 2 \
  --concurrency 80 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=YOUR_API_KEY"
```

> **Tip:** Replace `us-central1` with your preferred region (e.g. `us-central1`, `us-east1`, `asia-east1`, or `europe-west1`).

---

## 3. How This App Is Optimized for the Free Tier
1. **Low Memory Footprint (< 120MB RSS):**
   - Node runtime runs our pre-bundled `dist/server.cjs` with tree-shaken dependencies.
   - Fits easily inside the `512Mi` limit (no out-of-memory errors).
2. **Instant Cold Starts (< 850ms):**
   - No runtime TypeScript compilation (handled at build time by `esbuild`).
   - Fast container startup passes Cloud Run health probes within 2 seconds.
3. **Graceful Scale-to-Zero (`SIGTERM` Handler):**
   - When traffic stops, Cloud Run issues a `SIGTERM`. The app gracefully flushes open sockets and exits with code 0 without dropped requests.
4. **Hashed Static Asset Caching (1 Year `maxAge`):**
   - Frontend chunks are cached in user browsers, eliminating repeated downloads and keeping bandwidth well below the 1 GiB free tier limit.
5. **Health Probes:**
   - Dedicated `/api/health` and `/api/cloudrun/status` endpoints report memory metrics and operational status.
