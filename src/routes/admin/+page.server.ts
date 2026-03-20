import { error } from '@sveltejs/kit';

export function load() {
  // Page loads normally in production now; security is handled by the API checking the ADMIN_PASSWORD environment variable upon form submission.
  return {};
}
