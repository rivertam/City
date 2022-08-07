import { resolveSoa } from "dns";
import { Role, RolesData } from "./Role";

// queries specify all roles they read to by passing in the role object
export type RoleGroup<RoleData = any> = Array<Role<RoleData>>;

// a query split as an array rather than an object/named parameter
// mostly used as arguments for functions like `query`
export type ArrayQuery<Roles extends RoleGroup, EachReturnType> = [
  Roles,
  (...roleData: RolesData<Roles>) => EachReturnType,
  ((...roleData: RolesData<Roles>) => boolean)?
];

// an object formulation of a query
export type ObjectQuery<Roles extends RoleGroup, EachReturnType> = {
  roles: Roles;
  forEach: (...roleData: RolesData<Roles>) => EachReturnType;
  filter?: (...roleData: RolesData<Roles>) => boolean;
};

export type Query<Roles extends RoleGroup, EachReturnType> =
  | ObjectQuery<Roles, EachReturnType>
  | ArrayQuery<Roles, EachReturnType>;

// The parameters to a function that runs a query
// (for making helpers like `useQuery` that call `query` and forwarding the semantics)
export type QueryParameters<Roles extends RoleGroup, EachReturnType> =
  | ArrayQuery<Roles, EachReturnType>
  | [Query<Roles, EachReturnType>];

function areParametersArray<Roles extends RoleGroup, EachReturnType>(
  parameters: QueryParameters<Roles, EachReturnType>
): parameters is ArrayQuery<Roles, EachReturnType> {
  return parameters.length > 0;
}

// Helper to treat any way a user might specify a query as an ObjectQuery
export function normalizeQueryParameters<
  Roles extends RoleGroup,
  EachReturnType
>(
  parameters: QueryParameters<Roles, EachReturnType>
): ObjectQuery<Roles, EachReturnType> {
  // ArrayQuery
  if (areParametersArray(parameters)) {
    return {
      roles: parameters[0],
      forEach: parameters[1],
      filter: parameters[2],
    };
  }

  const [firstParam] = parameters;

  if (firstParam instanceof Array) {
    return normalizeQueryParameters(firstParam);
  }

  return firstParam;
}
