import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="future-page" aria-labelledby="not-found-title">
      <p className="phase-label">Not found</p>
      <h1 id="not-found-title">This route does not exist.</h1>
      <p>Return to the RoleKeep overview.</p>
      <Link className="text-link" to="/">
        Go to the RoleKeep home page
      </Link>
    </section>
  );
}
