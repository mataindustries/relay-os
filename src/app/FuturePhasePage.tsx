interface FuturePhasePageProps {
  readonly title: string;
  readonly description: string;
}

export function FuturePhasePage({ title, description }: FuturePhasePageProps) {
  return (
    <section className="future-page" aria-labelledby="future-page-title">
      <p className="phase-label">Later-phase feature</p>
      <h1 id="future-page-title">{title}</h1>
      <p className="future-page-description">{description}</p>
      <p className="future-page-note">
        This route is present only to establish the RoleKeep information architecture.
      </p>
    </section>
  );
}
