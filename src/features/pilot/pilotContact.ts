export interface PilotContactConfiguration {
  readonly bookingUrl?: string | undefined;
  readonly contactEmail?: string | undefined;
}

export type PilotContactAction =
  | { readonly kind: 'booking'; readonly href: string; readonly label: string }
  | { readonly kind: 'email'; readonly href: string; readonly label: string }
  | { readonly kind: 'fallback'; readonly message: string };

function safeBookingUrl(value: string | undefined): string | null {
  if (value === undefined || value.trim().length === 0) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function safeEmail(value: string | undefined): string | null {
  if (value === undefined) return null;
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function resolvePilotContactAction(
  configuration: PilotContactConfiguration,
): PilotContactAction {
  const bookingUrl = safeBookingUrl(configuration.bookingUrl);
  if (bookingUrl !== null) {
    return { kind: 'booking', href: bookingUrl, label: 'Book a founding-pilot conversation' };
  }

  const contactEmail = safeEmail(configuration.contactEmail);
  if (contactEmail !== null) {
    return {
      kind: 'email',
      href: `mailto:${contactEmail}`,
      label: 'Email about a founding pilot',
    };
  }

  return {
    kind: 'fallback',
    message: 'Reply to the person who shared this demo to discuss a founding pilot.',
  };
}
