// Mock data for schools, chapters, and roles
export const SCHOOLS = [
  "University of Michigan",
  "University of Virginia",
  "Cornell University",
  "University of Georgia",
  "Vanderbilt University",
  "University of North Carolina",
  "Duke University",
  "Northwestern University",
  "University of Pennsylvania",
  "Stanford University",
  "University of California, Berkeley",
  "University of Southern California",
  "Other",
];

export const CHI_PSI_CHAPTERS = [
  { school: "University of Michigan", code: "Alpha" },
  { school: "University of Virginia", code: "Beta" },
  { school: "Cornell University", code: "Gamma" },
  { school: "University of Georgia", code: "Delta" },
  { school: "Vanderbilt University", code: "Epsilon" },
  { school: "University of North Carolina", code: "Zeta" },
  { school: "Duke University", code: "Eta" },
  { school: "Northwestern University", code: "Theta" },
  { school: "University of Pennsylvania", code: "Iota" },
  { school: "Stanford University", code: "Kappa" },
  { school: "University of California, Berkeley", code: "Lambda" },
  { school: "University of Southern California", code: "Mu" },
];

export const ROLES = [
  {
    name: "Social Chair",
    description:
      "Can create/edit/delete events, manage guest lists, view budgets",
    permissions: {
      events: ["create", "read", "update", "delete"],
      guests: ["create", "read", "update", "delete"],
      budgets: ["read"],
    },
  },
  {
    name: "Treasurer",
    description: "Can view/edit budget, view all events, no guest editing",
    permissions: {
      events: ["read"],
      budgets: ["create", "read", "update", "delete"],
    },
  },
  {
    name: "Member",
    description: "Can view events, RSVP, view guest lists they're on",
    permissions: {
      events: ["read"],
      guests: ["read"],
      rsvp: ["create", "update"],
    },
  },
];

export const TIERS = {
  free: {
    name: "Free",
    features: ["Event creation", "Basic calendar", "Guest list"],
  },
  pro: {
    name: "Pro",
    features: [
      "Budget tracking",
      "Sponsorship management",
      "Risk assessment templates",
    ],
  },
  elite: {
    name: "Elite",
    features: [
      "Team collaboration",
      "Multi-role dashboards",
      "Analytics & reporting",
    ],
  },
};
