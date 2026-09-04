Welcome to your new TanStack Start app!

# Getting Started

To run this application:

```bash
bun install
bun --bun run dev
```

# Building For Production

To build this application for production:

```bash
bun --bun run build
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

### Removing Tailwind CSS

If you prefer not to use Tailwind CSS:

1. Remove the demo pages in `src/routes/demo/`
2. Replace the Tailwind import in `src/styles.css` with your own styles
3. Remove `tailwindcss()` from the plugins array in `vite.config.ts`
4. Remove `@tailwindcss/vite` and `tailwindcss` from `package.json`

## Linting & Formatting

The monorepo uses [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html). Run them from the repository root:

```bash
bun run lint
bun run format
bun run check
```

## Setting up Convex

- Set the `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT` environment variables in your `.env.local`. (Or run `bunx --bun convex init` to set them automatically.)
- Run `bunx --bun convex dev` to start the Convex server.
- Configure token validation in each Convex deployment with `bunx --bun convex env set WORKOS_CLIENT_ID client_...`.

## Setting up WorkOS

This integration uses WorkOS AuthKit's full-stack TanStack Start SDK and requires
Node.js 22.11 or newer.

1. Copy your client ID and API key from the [WorkOS dashboard](https://dashboard.workos.com/api-keys).
2. Fill in `.env.local`:

   ```bash
   WORKOS_CLIENT_ID=client_...
   WORKOS_API_KEY=sk_test_...
   WORKOS_REDIRECT_URI=http://localhost:3000/api/auth/callback
   WORKOS_COOKIE_PASSWORD=a-random-value-at-least-32-characters-long
   WORKOS_API_HOSTNAME=api.workos.com
   ```

3. On the dashboard's [Redirects page](https://dashboard.workos.com/redirects), add
   `http://localhost:3000/api/auth/callback` as a redirect URI and
   `http://localhost:3000/api/auth/sign-in` as the sign-in endpoint.
4. Start the app and use the sign-in action on `/`.

### What's wired up

- `authkitMiddleware()` manages the encrypted server-side session in `src/start.ts`.
- `/api/auth/callback` completes the OAuth callback.
- `/api/auth/sign-in` initiates sign-in and supports a `returnPathname` query parameter.
- `<AuthKitProvider>` supplies reactive auth state and `ConvexProviderWithAuth` forwards WorkOS access tokens to Convex.

For authorization in loaders and server functions, use `getAuth()` from
`@workos/authkit-tanstack-react-start`. Keep `WORKOS_API_KEY` and
`WORKOS_COOKIE_PASSWORD` server-only, and replace the local callback and sign-in URLs
with their production equivalents when deploying.

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/).

```bash
bunx --bun shadcn@latest add button
```

## Tinybird

Tinybird Pipe endpoints are queried through the Worker-native, server-only helper in `src/server/tinybird.ts`. Set `TINYBIRD_API_URL` and a token scoped to `PIPE:READ` in `TINYBIRD_PIPE_READ_TOKEN`. Never expose that token through a `VITE_` variable or import it into browser code.

## Deploy to Cloudflare Workers

This project uses the Cloudflare Vite plugin (configured in `vite.config.ts`) and `wrangler.jsonc`:

1. Authenticate with `bunx wrangler login`.
2. Provide `VITE_CONVEX_URL` to the build environment. It is compiled into the client bundle and cannot be supplied later as a Worker secret.
3. Add `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, and `TINYBIRD_PIPE_READ_TOKEN` with `bunx wrangler secret put <NAME>`.
4. Configure `WORKOS_CLIENT_ID`, `WORKOS_REDIRECT_URI`, `WORKOS_API_HOSTNAME`, and `TINYBIRD_API_URL` as Worker variables in Cloudflare. Register the production callback and sign-in URLs in WorkOS.
5. Run `bun run deploy`.

Cloudflare and Convex are separate deployments. Deploy Convex schema/functions and set its `WORKOS_CLIENT_ID` independently before deploying a Worker build that uses them.

KV, D1, R2, and Durable Object bindings are configured in `wrangler.jsonc` — see https://developers.cloudflare.com/workers/wrangler/configuration/.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you render `{children}` in the `shellComponent`.

Here is an example layout that includes a header:

```tsx
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'My App' },
    ],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
          </nav>
        </header>
        {children}
        <Scripts />
      </body>
    </html>
  ),
})
```

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Server Functions

TanStack Start provides server functions that allow you to write server-side code that seamlessly integrates with your client components.

```tsx
import { createServerFn } from '@tanstack/react-start'

const getServerTime = createServerFn({
  method: 'GET',
}).handler(async () => {
  return new Date().toISOString()
})

// Use in a component
function MyComponent() {
  const [time, setTime] = useState('')

  useEffect(() => {
    getServerTime().then(setTime)
  }, [])

  return <div>Server time: {time}</div>
}
```

## API Routes

You can create API routes by using the `server` property in your route definitions:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: () => json({ message: 'Hello, World!' }),
    },
  },
})
```

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/people')({
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json()
  },
  component: PeopleComponent,
})

function PeopleComponent() {
  const data = Route.useLoaderData()
  return (
    <ul>
      {data.results.map((person) => (
        <li key={person.name}>{person.name}</li>
      ))}
    </ul>
  )
}
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).

For TanStack Start specific documentation, visit [TanStack Start](https://tanstack.com/start).
