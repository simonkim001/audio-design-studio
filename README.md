# Audio Design Studio

An audio-design and acoustic-simulation project with a ChatGPT-powered assistant for questions about acoustics, audio design, recording, soundscapes, and visualization.

## Run and deploy

This is a static site with a Netlify Function. To deploy, connect this repository to Netlify and use the repository root as the publish directory; `netlify.toml` configures the function directory.

In the Netlify site dashboard, add an environment variable under **Site configuration → Environment variables**:

- `OPENAI_API_KEY` — your OpenAI API key (keep it secret; never put it in browser code)
- `OPENAI_MODEL` — optional model override; defaults to `gpt-4.1-mini`

Allow the function to access those variables, then trigger a new deploy. Chat uses the OpenAI API, which is billed separately from a ChatGPT subscription. For local development, install the Netlify CLI and run `netlify dev` after setting the same variables in your local environment.

## Files

- `index.html`, `styles.css`, `app.js` — chat interface
- `netlify/functions/chat.mjs` — server-side API proxy; the API key remains on the server
- `netlify.toml` — Netlify publish and function configuration
