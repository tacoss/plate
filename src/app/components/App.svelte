<script>
  import { Router, Route, Link } from 'svero';

  import NotFound from './pages/NotFound.svelte';
  import Home from './pages/Home.svelte';

  const base = document.querySelector('base');
  const baseHref = base && base.href;
</script>

<Router path={baseHref}>
  <nav>
    <ul>
      <li>
        <Link href="/">Home</Link>
        <Link href="/not-found">ERR</Link>
      </li>
    </ul>
  </nav>
  <main>
    <Route fallback path="*" component={NotFound} />
    <Route exact path="/" component={Home} />
  </main>
</Router>
