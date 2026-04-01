// Maps internal role codes to human-readable team names shown in the UI
export const ROLE_DISPLAY = {
  QA:    "Quality Assurance Team",
  FE:    "Frontend Engineering Team",
  BE:    "Backend Engineering Team",
  DATA:  "Data Engineering Team",
  PM:    "Product Management Team",
  ADMIN: "Product Management Team",
};

export const getRoleDisplay = (role) => ROLE_DISPLAY[role] || role;
