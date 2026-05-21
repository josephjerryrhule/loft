// World countries list with ISO codes and African continent classification

export interface Country {
  code: string;
  name: string;
  isAfrica: boolean;
}

export const COUNTRIES: Country[] = [
  // African Countries
  { code: "DZ", name: "Algeria", isAfrica: true },
  { code: "AO", name: "Angola", isAfrica: true },
  { code: "BJ", name: "Benin", isAfrica: true },
  { code: "BW", name: "Botswana", isAfrica: true },
  { code: "BF", name: "Burkina Faso", isAfrica: true },
  { code: "BI", name: "Burundi", isAfrica: true },
  { code: "CV", name: "Cabo Verde", isAfrica: true },
  { code: "CM", name: "Cameroon", isAfrica: true },
  { code: "CF", name: "Central African Republic", isAfrica: true },
  { code: "TD", name: "Chad", isAfrica: true },
  { code: "KM", name: "Comoros", isAfrica: true },
  { code: "CG", name: "Congo (Congo-Brazzaville)", isAfrica: true },
  { code: "CD", name: "Democratic Republic of the Congo", isAfrica: true },
  { code: "DJ", name: "Djibouti", isAfrica: true },
  { code: "EG", name: "Egypt", isAfrica: true },
  { code: "GQ", name: "Equatorial Guinea", isAfrica: true },
  { code: "ER", name: "Eritrea", isAfrica: true },
  { code: "SZ", name: "Eswatini", isAfrica: true },
  { code: "ET", name: "Ethiopia", isAfrica: true },
  { code: "GA", name: "Gabon", isAfrica: true },
  { code: "GM", name: "Gambia", isAfrica: true },
  { code: "GH", name: "Ghana", isAfrica: true },
  { code: "GN", name: "Guinea", isAfrica: true },
  { code: "GW", name: "Guinea-Bissau", isAfrica: true },
  { code: "CI", name: "Ivory Coast (Côte d'Ivoire)", isAfrica: true },
  { code: "KE", name: "Kenya", isAfrica: true },
  { code: "LS", name: "Lesotho", isAfrica: true },
  { code: "LR", name: "Liberia", isAfrica: true },
  { code: "LY", name: "Libya", isAfrica: true },
  { code: "MG", name: "Madagascar", isAfrica: true },
  { code: "MW", name: "Malawi", isAfrica: true },
  { code: "ML", name: "Mali", isAfrica: true },
  { code: "MR", name: "Mauritania", isAfrica: true },
  { code: "MU", name: "Mauritius", isAfrica: true },
  { code: "YT", name: "Mayotte", isAfrica: true },
  { code: "MA", name: "Morocco", isAfrica: true },
  { code: "MZ", name: "Mozambique", isAfrica: true },
  { code: "NA", name: "Namibia", isAfrica: true },
  { code: "NE", name: "Niger", isAfrica: true },
  { code: "NG", name: "Nigeria", isAfrica: true },
  { code: "RE", name: "Réunion", isAfrica: true },
  { code: "RW", name: "Rwanda", isAfrica: true },
  { code: "ST", name: "São Tomé and Príncipe", isAfrica: true },
  { code: "SN", name: "Senegal", isAfrica: true },
  { code: "SC", name: "Seychelles", isAfrica: true },
  { code: "SL", name: "Sierra Leone", isAfrica: true },
  { code: "SO", name: "Somalia", isAfrica: true },
  { code: "ZA", name: "South Africa", isAfrica: true },
  { code: "SS", name: "South Sudan", isAfrica: true },
  { code: "SD", name: "Sudan", isAfrica: true },
  { code: "TZ", name: "Tanzania", isAfrica: true },
  { code: "TG", name: "Togo", isAfrica: true },
  { code: "TN", name: "Tunisia", isAfrica: true },
  { code: "UG", name: "Uganda", isAfrica: true },
  { code: "EH", name: "Western Sahara", isAfrica: true },
  { code: "ZM", name: "Zambia", isAfrica: true },
  { code: "ZW", name: "Zimbabwe", isAfrica: true },

  // Non-African / Rest of the World (common/major countries)
  { code: "US", name: "United States", isAfrica: false },
  { code: "GB", name: "United Kingdom", isAfrica: false },
  { code: "CA", name: "Canada", isAfrica: false },
  { code: "AU", name: "Australia", isAfrica: false },
  { code: "DE", name: "Germany", isAfrica: false },
  { code: "FR", name: "France", isAfrica: false },
  { code: "IT", name: "Italy", isAfrica: false },
  { code: "ES", name: "Spain", isAfrica: false },
  { code: "NL", name: "Netherlands", isAfrica: false },
  { code: "BE", name: "Belgium", isAfrica: false },
  { code: "CH", name: "Switzerland", isAfrica: false },
  { code: "SE", name: "Sweden", isAfrica: false },
  { code: "NO", name: "Norway", isAfrica: false },
  { code: "DK", name: "Denmark", isAfrica: false },
  { code: "FI", name: "Finland", isAfrica: false },
  { code: "IE", name: "Ireland", isAfrica: false },
  { code: "NZ", name: "New Zealand", isAfrica: false },
  { code: "IN", name: "India", isAfrica: false },
  { code: "CN", name: "China", isAfrica: false },
  { code: "JP", name: "Japan", isAfrica: false },
  { code: "KR", name: "South Korea", isAfrica: false },
  { code: "SG", name: "Singapore", isAfrica: false },
  { code: "AE", name: "United Arab Emirates", isAfrica: false },
  { code: "SA", name: "Saudi Arabia", isAfrica: false },
  { code: "BR", name: "Brazil", isAfrica: false },
  { code: "MX", name: "Mexico", isAfrica: false },
  { code: "AR", name: "Argentina", isAfrica: false },
  { code: "CO", name: "Colombia", isAfrica: false },
  { code: "PE", name: "Peru", isAfrica: false },
  { code: "CL", name: "Chile", isAfrica: false },
  { code: "TR", name: "Turkey", isAfrica: false },
  { code: "RU", name: "Russia", isAfrica: false },
  { code: "PL", name: "Poland", isAfrica: false },
  { code: "UA", name: "Ukraine", isAfrica: false },
  { code: "RO", name: "Romania", isAfrica: false },
  { code: "GR", name: "Greece", isAfrica: false },
  { code: "PT", name: "Portugal", isAfrica: false },
  { code: "CZ", name: "Czech Republic", isAfrica: false },
  { code: "HU", name: "Hungary", isAfrica: false },
  { code: "AT", name: "Austria", isAfrica: false },
  { code: "IL", name: "Israel", isAfrica: false },
  { code: "MY", name: "Malaysia", isAfrica: false },
  { code: "TH", name: "Thailand", isAfrica: false },
  { code: "ID", name: "Indonesia", isAfrica: false },
  { code: "PH", name: "Philippines", isAfrica: false },
  { code: "VN", name: "Vietnam", isAfrica: false },
  { code: "PK", name: "Pakistan", isAfrica: false },
  { code: "BD", name: "Bangladesh", isAfrica: false },
  { code: "EG", name: "Egypt", isAfrica: true } // Egypt is in Africa, listed again here to be safe
];

// Sort countries alphabetically
export const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Returns true if a country name or code is outside of Africa.
 * Defaults to true if the country is not found in the list,
 * but handles matching by code (case-insensitive) or name.
 */
export function isOutsideAfrica(countryIdentifier: string | null | undefined): boolean {
  if (!countryIdentifier) return true; // Default to outside Africa if empty

  const normalized = countryIdentifier.trim().toLowerCase();

  // Search by code or by name
  const match = COUNTRIES.find(
    c => c.code.toLowerCase() === normalized || c.name.toLowerCase() === normalized
  );

  if (match) {
    return !match.isAfrica;
  }

  // Fallback: Check if the string matches any known African country name as substring
  const isAfricanSubstring = COUNTRIES.some(
    c => c.isAfrica && (normalized.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(normalized))
  );

  return !isAfricanSubstring;
}
