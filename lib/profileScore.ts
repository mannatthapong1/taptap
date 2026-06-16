import type { SeekerProfile } from "./types";

export function calcProfileScore(p: Partial<SeekerProfile>): number {
  let score = 0;
  if (p.name && p.name.trim().length > 0) score += 25;
  if (p.photo_url) score += 25;
  if (p.skills && p.skills.length >= 3) score += 25;
  else if (p.skills && p.skills.length > 0) score += 10;
  if (p.availability && p.availability.length > 0) score += 15;
  if (p.location_text && p.location_text.trim().length > 0) score += 10;
  return Math.min(score, 100);
}
