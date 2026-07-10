import { supabaseBrowser } from "./supabase";

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  let token: string | undefined;
  try {
    const { data } = await supabaseBrowser().auth.getSession();
    token = data.session?.access_token;
  } catch {
    // signed-out requests are fine — public queries still work
  }
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data as T;
}

export const PERSON_FIELDS = /* GraphQL */ `
  fragment PersonFields on Person {
    id
    name
    persona
    roles
    headline
    bio
    location
    availability
    yearsExp
    skills
    connections
    hue
    reelTitle
    reelDuration
    avatarUrl
    connectionStatus
    credits { id role project kind year note }
    portfolio { id title kind year tone aspect }
  }
`;

export const ME_FIELDS = /* GraphQL */ `
  fragment MeFields on Me {
    id
    email
    name
    persona
    registrationType
    roles
    location
    headline
    bio
    availability
    yearsExp
    skills
    connections
    hue
    reelTitle
    reelDuration
    avatarUrl
    credits { id role project kind year note }
    portfolio { id title kind year tone aspect }
    details {
      firstName middleName lastName dateOfBirth countryOfOrigin resumeName
      companyName category registrationNumber stateOfRegistration countryOfRegistration handbookName
      contactNumber emailAddress address languagesSpoken languagesWritten qualification
      experience { theater mainstreamMovie television imdb }
      certifications honors targetAudience profilePicture gallery
    }
  }
`;

export const ME_QUERY = /* GraphQL */ `
  ${ME_FIELDS}
  query { me { ...MeFields } }
`;
