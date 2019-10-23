<script>
  import { Router, Route, Link } from 'yrv';

  import NotFound from './pages/NotFound.svelte';
  import Home from './pages/Home.svelte';
</script>

<Router>
  <nav>
    <ul>
      <li>
        <Link href="/">Home</Link>
        <Link href="/not-found">ERR</Link>
      </li>
    </ul>
  </nav>
  <main>
    <Route exact path="/" component={Home} />
    <Route fallback component={NotFound} />
  </main>
</Router>
